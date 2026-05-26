import logging
import uuid
from datetime import datetime, timezone
from typing import Dict, Any

from celery import shared_task
from sqlalchemy import text
from sqlalchemy.orm import Session

from database import SessionLocal
from models.operational_models import (
    MigrationReconciliationRun, MigrationDivergence, Organization, Resource, Branch
)
from models.vet import Vet
from models.appointments import Appointment

logger = logging.getLogger("petneo.operational.reconciliation")


@shared_task(
    name="operational.reconciliation.reconcile_legacy_vets_task",
    queue="reconciliation",
    soft_time_limit=300,
    time_limit=330,
)
def reconcile_legacy_vets_task(sample_size: int = 1000) -> Dict[str, Any]:
    """
    Periodic job to detect synchronization divergences between legacy vets and 
    the new shadow operational tables (organizations, branches, resources).
    """
    db = SessionLocal()
    run_id = uuid.uuid4()
    
    run = MigrationReconciliationRun(
        id=run_id,
        legacy_table="vets",
        sample_size=sample_size,
        sample_window_hours=24,
        status="running"
    )
    db.add(run)
    db.commit()

    start_ts = datetime.now(timezone.utc)
    rows_compared = 0
    divergences_found = 0
    new_rows_missing = 0

    try:
        # Sample recent or active legacy vets
        legacy_vets = db.query(Vet).order_by(Vet.id.desc()).limit(sample_size).all()
        
        for vet in legacy_vets:
            rows_compared += 1
            
            # 1. Check Organization
            org = db.query(Organization).filter(Organization.legacy_vet_id == vet.id).first()
            if not org:
                _record_divergence(db, "vets", vet.id, "organizations", None, "organization", "exists", "missing", "error")
                new_rows_missing += 1
                divergences_found += 1
                continue
                
            # Check organization verification sync
            expected_status = "verified" if vet.is_vet_verified else "pending"
            if org.verification_status != expected_status:
                _record_divergence(db, "vets", vet.id, "organizations", org.id, "verification_status", str(vet.is_vet_verified), org.verification_status, "warning")
                divergences_found += 1

            # 2. Check Resource
            resource = db.query(Resource).filter(Resource.legacy_vet_id == vet.id).first()
            if not resource:
                _record_divergence(db, "vets", vet.id, "resources", None, "resource", "exists", "missing", "error")
                new_rows_missing += 1
                divergences_found += 1
                
            # 3. Check Branch
            branch = db.query(Branch).filter(Branch.legacy_vet_id == vet.id).first()
            if not branch:
                _record_divergence(db, "vets", vet.id, "branches", None, "branch", "exists", "missing", "error")
                new_rows_missing += 1
                divergences_found += 1

        db.commit()
        
        run.rows_compared = rows_compared
        run.divergences_found = divergences_found
        run.new_rows_missing = new_rows_missing
        run.completed_at = datetime.now(timezone.utc)
        run.duration_ms = int((run.completed_at - start_ts).total_seconds() * 1000)
        run.status = "success"
        db.commit()
        
        logger.info(f"Reconciliation run {run_id} completed: {divergences_found} divergences in {rows_compared} rows.")
        return {
            "run_id": str(run_id),
            "status": "success",
            "rows_compared": rows_compared,
            "divergences_found": divergences_found,
        }
        
    except Exception as exc:
        db.rollback()
        logger.error(f"Reconciliation run {run_id} failed: {exc}")
        run.status = "failed"
        run.completed_at = datetime.now(timezone.utc)
        db.commit()
        raise


def _record_divergence(
    db: Session,
    legacy_table: str,
    legacy_id: int,
    new_table: str,
    new_id: int | None,
    field_name: str,
    legacy_value: str,
    new_value: str,
    severity: str
):
    """Writes an active divergence to the tracking table."""
    # Check if a divergence already exists to avoid noise
    existing = db.query(MigrationDivergence).filter(
        MigrationDivergence.legacy_table == legacy_table,
        MigrationDivergence.legacy_id == legacy_id,
        MigrationDivergence.new_table == new_table,
        MigrationDivergence.field_name == field_name,
        MigrationDivergence.is_resolved == False
    ).first()
    
    if not existing:
        div = MigrationDivergence(
            legacy_table=legacy_table,
            legacy_id=legacy_id,
            new_table=new_table,
            new_id=new_id,
            field_name=field_name,
            legacy_value=legacy_value,
            new_value=new_value,
            severity=severity,
            is_resolved=False
        )
        db.add(div)
