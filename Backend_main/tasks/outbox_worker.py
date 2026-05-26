"""
petneo/operational/workers/outbox_worker.py

Migration outbox worker.

Drains rows from migration_outbox into the new operational tables.
Idempotent. Retryable. Observable.

Lock protocol: uses SELECT ... FOR UPDATE SKIP LOCKED to allow multiple
worker replicas to process the outbox in parallel without colliding.

Retry policy: exponential backoff. After 5 failed attempts → permanently_failed.

IMPORTANT: legacy tables are NEVER modified by this worker.
This worker reads from migration_outbox and writes to new tables.
Legacy is the source of truth; new tables are shadow state.
"""

from __future__ import annotations

import logging
import os
import socket
import traceback
from datetime import datetime, timedelta, timezone
from typing import Optional

from celery import shared_task
from sqlalchemy import text
from sqlalchemy.orm import Session

from database import SessionLocal
from models.operational_models import (
    MigrationOutbox, OutboxStatus, OutboxEventType,
    Organization, OrganizationType, Branch, BranchType,
    Resource, ResourceType,
)

logger = logging.getLogger("petneo.operational.outbox")

# Configuration
BATCH_SIZE                = int(os.environ.get("OUTBOX_BATCH_SIZE", "50"))
MAX_ATTEMPTS              = int(os.environ.get("OUTBOX_MAX_ATTEMPTS", "5"))
RETRY_BACKOFF_BASE_SEC    = int(os.environ.get("OUTBOX_RETRY_BACKOFF_BASE", "30"))
STATEMENT_TIMEOUT_MS      = int(os.environ.get("OUTBOX_STATEMENT_TIMEOUT_MS", "5000"))

WORKER_ID = f"{socket.gethostname()}:{os.getpid()}"


# ─────────────────────────────────────────────────────────────
# CELERY TASK: drain a batch of pending outbox events
# Schedule: Celery Beat every 30 seconds
# ─────────────────────────────────────────────────────────────

@shared_task(
    name="operational.outbox.drain_batch",
    queue="migration",
    soft_time_limit=55,
    time_limit=60,
)
def drain_outbox_batch() -> dict:
    """
    Drain up to BATCH_SIZE pending events from migration_outbox.
    Returns a summary dict for observability.

    Safe to run multiple replicas concurrently — SKIP LOCKED handles isolation.
    """
    db = SessionLocal()
    summary = {
        "worker_id": WORKER_ID,
        "batch_size": BATCH_SIZE,
        "processed_ok": 0,
        "processed_failed": 0,
        "events_remaining": 0,
    }
    try:
        # Enforce statement timeout for the entire task
        db.execute(text(f"SET LOCAL statement_timeout = {STATEMENT_TIMEOUT_MS}"))

        # Lock and claim a batch with SKIP LOCKED.
        # Only events that are pending and (next_retry_at is null or in the past).
        now = datetime.now(timezone.utc)
        claim_sql = text("""
            WITH claimed AS (
                SELECT id FROM migration_outbox
                WHERE status = 'pending'
                  AND (next_retry_at IS NULL OR next_retry_at <= :now)
                ORDER BY created_at
                LIMIT :batch_size
                FOR UPDATE SKIP LOCKED
            )
            UPDATE migration_outbox m
            SET status = 'processing',
                processing_worker_id = :worker_id,
                processing_started_at = :now,
                attempt_count = attempt_count + 1
            FROM claimed
            WHERE m.id = claimed.id
            RETURNING m.id
        """)
        result = db.execute(claim_sql, {
            "now": now,
            "batch_size": BATCH_SIZE,
            "worker_id": WORKER_ID,
        })
        claimed_ids = [row[0] for row in result.fetchall()]
        db.commit()

        if not claimed_ids:
            # Nothing to do — return early
            summary["events_remaining"] = _count_pending(db)
            return summary

        # Process each claimed event in its own transaction.
        # If one fails, others still succeed.
        for outbox_id in claimed_ids:
            try:
                _process_event(db, outbox_id)
                summary["processed_ok"] += 1
            except Exception as exc:
                summary["processed_failed"] += 1
                _record_failure(db, outbox_id, exc)

        summary["events_remaining"] = _count_pending(db)
        return summary

    finally:
        db.close()


# ─────────────────────────────────────────────────────────────
# EVENT PROCESSING
# Per-event-type handlers. Each in its own transaction.
# ─────────────────────────────────────────────────────────────

def _process_event(db: Session, outbox_id: int) -> None:
    """Dispatch a single outbox event to the right handler."""
    event = db.query(MigrationOutbox).filter(MigrationOutbox.id == outbox_id).first()
    if not event:
        logger.warning(f"Outbox event {outbox_id} disappeared between claim and process")
        return

    handler = _HANDLERS.get(event.event_type)
    if not handler:
        # Unknown event type — mark skipped, not failed
        event.status = OutboxStatus.SKIPPED
        event.error_message = f"No handler for event_type={event.event_type.value}"
        event.processed_at = datetime.now(timezone.utc)
        db.commit()
        return

    changes = handler(db, event)
    event.status = OutboxStatus.PROCESSED
    event.processed_at = datetime.now(timezone.utc)
    event.new_table_changes = changes
    event.error_message = None
    db.commit()

    logger.info(
        "outbox.event.processed",
        extra={
            "outbox_id": event.id,
            "event_type": event.event_type.value,
            "legacy_table": event.legacy_table,
            "legacy_id": event.legacy_id,
            "changes": changes,
        }
    )


def _record_failure(db: Session, outbox_id: int, exc: Exception) -> None:
    """Mark an event as failed; schedule retry or escalate to permanent failure."""
    event = db.query(MigrationOutbox).filter(MigrationOutbox.id == outbox_id).first()
    if not event:
        return

    error_text = str(exc)[:2000]
    tb_text    = traceback.format_exc()[:8000]

    if event.attempt_count >= MAX_ATTEMPTS:
        event.status = OutboxStatus.PERMANENTLY_FAILED
        event.error_message = error_text
        event.error_traceback = tb_text
        logger.error(
            "outbox.event.permanently_failed",
            extra={
                "outbox_id": event.id,
                "event_type": event.event_type.value,
                "attempts": event.attempt_count,
                "error": error_text,
            }
        )
    else:
        # Exponential backoff: 30s, 120s, 480s, 1920s
        delay = RETRY_BACKOFF_BASE_SEC * (4 ** (event.attempt_count - 1))
        event.status = OutboxStatus.PENDING
        event.next_retry_at = datetime.now(timezone.utc) + timedelta(seconds=delay)
        event.last_attempt_at = datetime.now(timezone.utc)
        event.error_message = error_text
        logger.warning(
            "outbox.event.retry_scheduled",
            extra={
                "outbox_id": event.id,
                "event_type": event.event_type.value,
                "attempt": event.attempt_count,
                "next_retry_in_sec": delay,
                "error": error_text,
            }
        )
    db.commit()


def _count_pending(db: Session) -> int:
    return db.query(MigrationOutbox).filter(
        MigrationOutbox.status == OutboxStatus.PENDING
    ).count()


# ─────────────────────────────────────────────────────────────
# EVENT HANDLERS
# Each handler is idempotent: re-running on the same event must
# produce the same result (UPSERT-style writes, not blind inserts).
# ─────────────────────────────────────────────────────────────

def _handle_vet_created(db: Session, event: MigrationOutbox) -> dict:
    """
    Legacy 'vets' row created → create organization + branch + person-resource.

    Idempotent via UNIQUE INDEX on (legacy_vet_id) for each new table.
    """
    payload = event.payload   # the full row snapshot
    legacy_vet_id = int(event.legacy_id)

    changes = {}

    # 1. Organization (one per legacy vet — solo provider pattern)
    org = db.query(Organization).filter(Organization.legacy_vet_id == legacy_vet_id).first()
    if not org:
        first = payload.get("first_name") or ""
        last  = payload.get("last_name") or ""
        slug = _generate_org_slug(first, last, legacy_vet_id)
        org = Organization(
            slug=slug,
            legal_name=f"{first} {last}".strip() or f"Vet {legacy_vet_id}",
            display_name=f"Dr. {first} {last}".strip() or f"Vet {legacy_vet_id}",
            org_type=OrganizationType.INDEPENDENT,
            legacy_vet_id=legacy_vet_id,
            verification_status=payload.get("verification_status", "pending"),
        )
        db.add(org)
        db.flush()
    changes["organizations"] = org.id

    # 2. Branch
    branch = db.query(Branch).filter(Branch.legacy_vet_id == legacy_vet_id).first()
    if not branch:
        branch = Branch(
            organization_id=org.id,
            slug=f"{org.slug}-main",
            name=payload.get("clinic_name") or org.display_name,
            branch_type=BranchType.FIXED_LOCATION,
            address_line1=payload.get("location"),
            city=payload.get("city"),
            state=payload.get("state"),
            contact_phone=payload.get("mobile"),
            contact_email=payload.get("email"),
            is_emergency_capable=bool(payload.get("emergency", False)),
            legacy_vet_id=legacy_vet_id,
            legacy_clinic_name=payload.get("clinic_name"),
        )
        db.add(branch)
        db.flush()
    changes["branches"] = branch.id

    # 3. Person resource
    resource = db.query(Resource).filter(Resource.legacy_vet_id == legacy_vet_id).first()
    if not resource:
        resource = Resource(
            organization_id=org.id,
            home_branch_id=branch.id,
            resource_type=ResourceType.PERSON,
            name=f"{payload.get('first_name', '')} {payload.get('last_name', '')}".strip(),
            person_first_name=payload.get("first_name"),
            person_last_name=payload.get("last_name"),
            legacy_vet_id=legacy_vet_id,
        )
        db.add(resource)
        db.flush()
    changes["resources"] = resource.id

    return changes


def _handle_vet_updated(db: Session, event: MigrationOutbox) -> dict:
    """
    Legacy vet row updated → propagate changes to existing org/branch/resource.

    Only fields that are meaningful to the new model are propagated.
    Other fields stay in legacy only.
    """
    after = event.payload.get("after") or event.payload   # may be plain row or {before, after}
    legacy_vet_id = int(event.legacy_id)
    changes = {}

    # If new-table rows don't exist yet, treat as create
    org = db.query(Organization).filter(Organization.legacy_vet_id == legacy_vet_id).first()
    if not org:
        return _handle_vet_created(db, event)

    # Sync verification status (most common reason for update)
    new_verification_status = after.get("verification_status")
    if new_verification_status and org.verification_status != new_verification_status:
        org.verification_status = new_verification_status
        changes["organizations"] = org.id

    # Sync display fields
    first = after.get("first_name") or ""
    last  = after.get("last_name") or ""
    new_display = f"Dr. {first} {last}".strip()
    if new_display and org.display_name != new_display:
        org.display_name = new_display
        changes["organizations"] = org.id

    # Sync branch contact info
    branch = db.query(Branch).filter(Branch.legacy_vet_id == legacy_vet_id).first()
    if branch:
        if after.get("location") and branch.address_line1 != after["location"]:
            branch.address_line1 = after["location"]
            changes["branches"] = branch.id
        if after.get("mobile") and branch.contact_phone != after["mobile"]:
            branch.contact_phone = after["mobile"]
            changes["branches"] = branch.id
        if after.get("emergency") is not None and branch.is_emergency_capable != bool(after["emergency"]):
            branch.is_emergency_capable = bool(after["emergency"])
            changes["branches"] = branch.id

    # Sync resource name
    resource = db.query(Resource).filter(Resource.legacy_vet_id == legacy_vet_id).first()
    if resource:
        if first and resource.person_first_name != first:
            resource.person_first_name = first
            changes["resources"] = resource.id
        if last and resource.person_last_name != last:
            resource.person_last_name = last
            changes["resources"] = resource.id

    return changes


def _handle_appointment_created(db: Session, event: MigrationOutbox) -> dict:
    """
    Legacy appointment created — placeholder for Phase 10C.

    Phase 10B does NOT create booking rows. The bookings table is
    introduced in 10C. For now, we mark the event as processed but
    record no new-table changes. The outbox row remains as a record
    that this event was observed during 10B.

    When 10C lands, the bookings handler is registered here and
    historical outbox rows can be replayed.
    """
    return {"_deferred_to_10c": True}


def _handle_appointment_updated(db: Session, event: MigrationOutbox) -> dict:
    """Same as above — deferred to 10C."""
    return {"_deferred_to_10c": True}


def _handle_appointment_status_changed(db: Session, event: MigrationOutbox) -> dict:
    """Same as above — deferred to 10C."""
    return {"_deferred_to_10c": True}


# Dispatch table
_HANDLERS = {
    OutboxEventType.VET_CREATED:                  _handle_vet_created,
    OutboxEventType.VET_UPDATED:                  _handle_vet_updated,
    OutboxEventType.VET_VERIFICATION_STATUS_CHANGED: _handle_vet_updated,
    OutboxEventType.APPOINTMENT_CREATED:          _handle_appointment_created,
    OutboxEventType.APPOINTMENT_UPDATED:          _handle_appointment_updated,
    OutboxEventType.APPOINTMENT_STATUS_CHANGED:   _handle_appointment_status_changed,
}


# ─────────────────────────────────────────────────────────────
# HELPERS
# ─────────────────────────────────────────────────────────────

def _generate_org_slug(first: str, last: str, legacy_id: int) -> str:
    """Deterministic slug — same legacy_id → same slug across runs."""
    import re
    base = re.sub(r"[^a-z0-9]+", "-", f"{first}-{last}".lower()).strip("-")
    if not base:
        base = f"vet-{legacy_id}"
    return f"{base}-{legacy_id}"


# ─────────────────────────────────────────────────────────────
# BACKFILL ENTRY POINT
# Run once at the start of dual-write to populate the outbox
# with backfill_replay events for all existing legacy rows.
# ─────────────────────────────────────────────────────────────

@shared_task(
    name="operational.outbox.backfill_legacy_vets",
    queue="migration",
    soft_time_limit=550,
    time_limit=600,
)
def backfill_legacy_vets(batch_size: int = 500) -> dict:
    """
    One-shot operation: enqueue all existing legacy vets as backfill events.
    The drain worker then processes them at its normal cadence.

    Safe to run multiple times — duplicate vet IDs are caught by the
    UNIQUE INDEX on (legacy_vet_id) in the handler.
    """
    db = SessionLocal()
    enqueued = 0
    try:
        # Fetch all vet IDs that don't already have outbox events
        result = db.execute(text("""
            INSERT INTO migration_outbox (event_type, legacy_table, legacy_id, payload, status)
            SELECT
                'vet_created'::outbox_event_type_enum,
                'vets',
                v.id::BIGINT,
                to_jsonb(v),
                'pending'::outbox_status_enum
            FROM vets v
            WHERE NOT EXISTS (
                SELECT 1 FROM organizations o
                WHERE o.legacy_vet_id = v.id
            )
            LIMIT :batch_size
            RETURNING id
        """), {"batch_size": batch_size})
        enqueued = result.rowcount
        db.commit()

        return {
            "enqueued": enqueued,
            "more_remaining": enqueued >= batch_size,
        }
    finally:
        db.close()
