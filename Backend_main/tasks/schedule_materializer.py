"""
petneo/operational/workers/schedule_materializer.py

Schedule materialization worker.

Regenerates `resource_availability_windows` from the source-of-truth tables:
  - resource_default_schedules (recurring weekly pattern)
  - resource_schedule_exceptions (sparse date overrides)
  - branch_operating_hours (branch-level constraint)

Two entry points:
  1. Scheduled (Beat, every 6 hours) — rolling 90-day window for all resources
  2. On-demand invalidation — single resource when its schedule changes

IMPORTANT: Phase 10B does NOT subtract existing bookings from windows.
Bookings come from the legacy `appointments` table during this phase, and
the new tables are not yet authoritative. Window generation considers only
schedule rules + branch hours. Booking-aware regeneration is Phase 10C.

The materializer is idempotent: running twice for the same window produces
identical output. The strategy is delete-then-insert for the affected scope.
"""

from __future__ import annotations

import logging
import os
import uuid
import zoneinfo
from datetime import datetime, date, time, timedelta, timezone
from typing import Optional, Iterable

from celery import shared_task
from sqlalchemy import text
from sqlalchemy.orm import Session

from database import SessionLocal
from models.operational_models import (
    Resource, ResourceDefaultSchedule, ResourceScheduleException,
    BranchOperatingHours, ResourceAvailabilityWindow,
    ScheduleMaterializationRun, ScheduleExceptionType, Branch,
    ResourceReservation, ReservationStatus
)

logger = logging.getLogger("petneo.operational.schedule")

# Configuration
WINDOW_HORIZON_DAYS  = int(os.environ.get("SCHEDULE_HORIZON_DAYS", "90"))
BATCH_RESOURCE_LIMIT = int(os.environ.get("SCHEDULE_BATCH_RESOURCES", "100"))


# ─────────────────────────────────────────────────────────────
# SCHEDULED FULL MATERIALIZATION
# Runs every 6 hours via Celery Beat. Processes resources that
# had schedule changes recently OR whose windows are stale.
# ─────────────────────────────────────────────────────────────

@shared_task(
    name="operational.schedule.materialize_scheduled",
    queue="scheduling",
    soft_time_limit=540,
    time_limit=600,
)
def materialize_scheduled() -> dict:
    """
    Rolling materialization for resources whose schedules or windows
    are stale relative to current time.
    """
    db = SessionLocal()
    try:
        # Pick resources that need regeneration:
        # - schedule changed since last materialization, OR
        # - no windows exist for the next 7 days
        now = datetime.now(timezone.utc)
        stale_cutoff = now - timedelta(hours=6)

        candidate_resources = db.execute(text("""
            WITH stale_schedule AS (
                SELECT DISTINCT r.id AS resource_id
                FROM resources r
                LEFT JOIN resource_default_schedules rds ON rds.resource_id = r.id
                LEFT JOIN resource_schedule_exceptions rse ON rse.resource_id = r.id
                WHERE r.is_active = TRUE AND r.is_bookable = TRUE
                  AND (
                      rds.updated_at > :stale_cutoff
                      OR rse.updated_at > :stale_cutoff
                  )
            ),
            no_windows AS (
                SELECT r.id AS resource_id
                FROM resources r
                WHERE r.is_active = TRUE AND r.is_bookable = TRUE
                  AND NOT EXISTS (
                      SELECT 1 FROM resource_availability_windows raw
                      WHERE raw.resource_id = r.id
                        AND raw.window_range && tstzrange(:now, 'infinity', '[]')
                  )
            )
            SELECT resource_id FROM stale_schedule
            UNION
            SELECT resource_id FROM no_windows
            LIMIT :limit
        """), {
            "stale_cutoff": stale_cutoff,
            "now": now,
            "limit": BATCH_RESOURCE_LIMIT,
        }).fetchall()

        resource_ids = [row[0] for row in candidate_resources]
        if not resource_ids:
            return {"resources_processed": 0, "reason": "no_stale_resources"}

        summary = _materialize_resources(
            db,
            resource_ids=resource_ids,
            run_type="scheduled",
            window_start=date.today(),
            window_end=date.today() + timedelta(days=WINDOW_HORIZON_DAYS),
        )
        return summary
    finally:
        db.close()


# ─────────────────────────────────────────────────────────────
# ON-DEMAND INVALIDATION
# Called when a single resource's schedule changes.
# Triggered by service-layer code after editing default schedules
# or exceptions.
# ─────────────────────────────────────────────────────────────

@shared_task(
    name="operational.schedule.materialize_resource",
    queue="scheduling",
    soft_time_limit=60,
    time_limit=90,
)
def materialize_resource(resource_id: int, days_ahead: int = WINDOW_HORIZON_DAYS) -> dict:
    """Regenerate availability windows for a single resource."""
    db = SessionLocal()
    try:
        return _materialize_resources(
            db,
            resource_ids=[resource_id],
            run_type="on_demand",
            window_start=date.today(),
            window_end=date.today() + timedelta(days=days_ahead),
        )
    finally:
        db.close()


# ─────────────────────────────────────────────────────────────
# CORE MATERIALIZATION LOGIC
# ─────────────────────────────────────────────────────────────

def _materialize_resources(
    db: Session,
    resource_ids: list[int],
    run_type: str,
    window_start: date,
    window_end: date,
) -> dict:
    """
    Generate windows for the given resources over the date range.
    Strategy: delete existing windows in this range, regenerate.
    """
    run = ScheduleMaterializationRun(
        id=uuid.uuid4(),
        run_type=run_type,
        window_start=datetime.combine(window_start, time.min, tzinfo=timezone.utc),
        window_end=datetime.combine(window_end, time.min, tzinfo=timezone.utc),
        status="running",
    )
    db.add(run)
    db.commit()

    start_ts = datetime.now(timezone.utc)
    total_generated = 0
    total_deleted = 0
    errors = []

    for resource_id in resource_ids:
        try:
            deleted, generated = _materialize_one_resource(
                db,
                resource_id=resource_id,
                window_start=window_start,
                window_end=window_end,
                run_id=run.id,
            )
            total_generated += generated
            total_deleted += deleted
            db.commit()
        except Exception as exc:
            db.rollback()
            errors.append(f"resource_id={resource_id}: {exc}")
            logger.exception(f"Materialization failed for resource {resource_id}")

    duration_ms = int((datetime.now(timezone.utc) - start_ts).total_seconds() * 1000)
    run.completed_at = datetime.now(timezone.utc)
    run.duration_ms = duration_ms
    run.resources_processed = len(resource_ids)
    run.windows_generated = total_generated
    run.windows_deleted = total_deleted
    run.status = "success" if not errors else ("partial" if total_generated > 0 else "failed")
    if errors:
        run.error_message = "; ".join(errors[:5])
    db.commit()

    return {
        "run_id": str(run.id),
        "run_type": run_type,
        "resources_processed": len(resource_ids),
        "windows_generated": total_generated,
        "windows_deleted": total_deleted,
        "duration_ms": duration_ms,
        "status": run.status,
        "errors": len(errors),
    }


def _materialize_one_resource(
    db: Session,
    resource_id: int,
    window_start: date,
    window_end: date,
    run_id: uuid.UUID,
) -> tuple[int, int]:
    """
    Regenerate windows for one resource within [window_start, window_end).
    Returns (deleted_count, generated_count).
    """
    # 1. Delete existing windows for this resource in the affected range
    deleted = db.execute(text("""
        DELETE FROM resource_availability_windows
        WHERE resource_id = :rid
          AND lower(window_range) >= :start
          AND lower(window_range) <  :end
    """), {
        "rid": resource_id,
        "start": datetime.combine(window_start, time.min, tzinfo=timezone.utc),
        "end":   datetime.combine(window_end, time.min, tzinfo=timezone.utc),
    }).rowcount

    # 2. Fetch the resource and its default schedules
    resource = db.query(Resource).filter(Resource.id == resource_id).first()
    if not resource or not resource.is_active or not resource.is_bookable:
        return deleted, 0

    # 3. Pre-fetch active reservations for the whole window for this resource
    reservations_rows = db.execute(text("""
        SELECT lower(reservation_range), upper(reservation_range)
        FROM resource_reservations
        WHERE resource_id = :rid
          AND status IN ('pending', 'confirmed', 'in_progress')
          AND reservation_range && tstzrange(:start, :end, '[)')
    """), {
        "rid": resource_id,
        "start": datetime.combine(window_start, time.min, tzinfo=timezone.utc),
        "end":   datetime.combine(window_end, time.min, tzinfo=timezone.utc),
    }).fetchall()
    
    # Store as list of (start: datetime, end: datetime)
    active_reservations = [(r[0], r[1]) for r in reservations_rows]

    defaults = db.query(ResourceDefaultSchedule).filter(
        ResourceDefaultSchedule.resource_id == resource_id,
        ResourceDefaultSchedule.is_active == True,
    ).all()

    exceptions_by_date = _load_exceptions_map(db, resource_id, window_start, window_end)

    branch_ids = {d.branch_id for d in defaults}
    branch_ids.update(branch_id for _, branch_id in exceptions_by_date.keys() if branch_id)

    branch_tz_map = {}
    if branch_ids:
        branches = db.query(Branch.id, Branch.timezone).filter(Branch.id.in_(branch_ids)).all()
        branch_tz_map = {b.id: zoneinfo.ZoneInfo(b.timezone) for b in branches}

    branch_hours_cache: dict[int, list] = {}

    generated = 0
    current = window_start
    while current < window_end:
        dow = current.weekday()  # 0=Mon..6=Sun (matches our SmallInt convention)

        # For each default schedule rule that applies to this dow,
        # generate a window (subject to effective_from/until).
        for default in defaults:
            if default.day_of_week != dow:
                continue
            if default.effective_from and current < default.effective_from:
                continue
            if default.effective_until and current > default.effective_until:
                continue

            # Apply exceptions for this date
            exception = exceptions_by_date.get((current, default.branch_id))
            if not exception:
                exception = exceptions_by_date.get((current, None))   # branch-agnostic

            generated += _emit_windows(
                db=db,
                resource_id=resource_id,
                branch_id=default.branch_id,
                target_date=current,
                default_start=default.start_time,
                default_end=default.end_time,
                exception=exception,
                branch_hours_cache=branch_hours_cache,
                run_id=run_id,
                branch_tz_map=branch_tz_map,
                active_reservations=active_reservations,
            )

        current += timedelta(days=1)

    return deleted, generated


def _load_exceptions_map(
    db: Session, resource_id: int, start: date, end: date
) -> dict[tuple[date, Optional[int]], ResourceScheduleException]:
    """Index exceptions by (date, branch_id) for fast lookup."""
    exceptions = db.query(ResourceScheduleException).filter(
        ResourceScheduleException.resource_id == resource_id,
        ResourceScheduleException.exception_date >= start,
        ResourceScheduleException.exception_date <  end,
    ).all()
    return {(e.exception_date, e.branch_id): e for e in exceptions}


def _emit_windows(
    db: Session,
    resource_id: int,
    branch_id: int,
    target_date: date,
    default_start: time,
    default_end: time,
    exception: Optional[ResourceScheduleException],
    branch_hours_cache: dict,
    run_id: uuid.UUID,
    branch_tz_map: dict,
    active_reservations: list[tuple[datetime, datetime]]
) -> int:
    """
    Apply exception logic + branch operating hours, emit one or more windows.
    Returns count of windows emitted.

    Exception precedence:
      - 'unavailable' → emit nothing
      - 'replaced_hours' → use exception hours instead of default
      - 'extra_hours' → emit default AND exception hours
      - none → use default
    """
    if exception and exception.exception_type == ScheduleExceptionType.UNAVAILABLE:
        # Full-day unavailable
        if exception.start_time is None:
            return 0
        # Partial-day unavailable — emit default minus exception window
        return _emit_with_partial_unavailable(
            db, resource_id, branch_id, target_date,
            default_start, default_end,
            exception.start_time, exception.end_time,
            branch_hours_cache, run_id, branch_tz_map
        )

    if exception and exception.exception_type == ScheduleExceptionType.REPLACED_HOURS:
        # Replace default with exception window
        if exception.start_time and exception.end_time:
            return _emit_one(
                db, resource_id, branch_id, target_date,
                exception.start_time, exception.end_time,
                branch_hours_cache, run_id, has_exception=True, branch_tz_map=branch_tz_map,
                active_reservations=active_reservations
            )
        return 0

    if exception and exception.exception_type == ScheduleExceptionType.EXTRA_HOURS:
        # Emit default AND exception
        emitted = _emit_one(
            db, resource_id, branch_id, target_date,
            default_start, default_end,
            branch_hours_cache, run_id, has_exception=False, branch_tz_map=branch_tz_map,
            active_reservations=active_reservations
        )
        if exception.start_time and exception.end_time:
            emitted += _emit_one(
                db, resource_id, branch_id, target_date,
                exception.start_time, exception.end_time,
                branch_hours_cache, run_id, has_exception=True, branch_tz_map=branch_tz_map,
                active_reservations=active_reservations
            )
        return emitted

    # No exception — emit default
    return _emit_one(
        db, resource_id, branch_id, target_date,
        default_start, default_end,
        branch_hours_cache, run_id, has_exception=False, branch_tz_map=branch_tz_map,
        active_reservations=active_reservations
    )


def _emit_one(
    db: Session,
    resource_id: int,
    branch_id: int,
    target_date: date,
    start_t: time,
    end_t: time,
    branch_hours_cache: dict,
    run_id: uuid.UUID,
    has_exception: bool,
    branch_tz_map: dict,
    active_reservations: list[tuple[datetime, datetime]]
) -> int:
    """Emit a single window after intersecting with branch operating hours."""
    branch_hours = _get_branch_hours(db, branch_id, target_date, branch_hours_cache)
    if not branch_hours:
        # Branch closed that day — no windows
        return 0

    tz = branch_tz_map.get(branch_id, timezone.utc)

    # Intersect the resource window with each branch operating window
    emitted = 0
    for b_open, b_close in branch_hours:
        intersect_start = max(start_t, b_open)
        intersect_end   = min(end_t, b_close)
        if intersect_end <= intersect_start:
            continue

        window_start_ts = datetime.combine(target_date, intersect_start, tzinfo=tz)
        window_end_ts   = datetime.combine(target_date, intersect_end,   tzinfo=tz)

        # Apply booking-aware subtraction
        segments = _subtract_reservations((window_start_ts, window_end_ts), active_reservations)
        
        for seg_start, seg_end in segments:
            db.execute(text("""
                INSERT INTO resource_availability_windows (
                    resource_id, branch_id, window_range,
                    derived_from_default, has_exception_applied,
                    generation_run_id
                ) VALUES (
                    :rid, :bid,
                    tstzrange(:start, :end, '[)'),
                    TRUE, :has_exception,
                    :run_id
                )
            """), {
                "rid": resource_id,
                "bid": branch_id,
                "start": seg_start,
                "end": seg_end,
                "has_exception": has_exception,
                "run_id": run_id,
            })
            emitted += 1
            
    return emitted


def _subtract_reservations(window: tuple[datetime, datetime], reservations: list[tuple[datetime, datetime]]) -> list[tuple[datetime, datetime]]:
    """Recursively subtracts active reservations from an availability window."""
    result = [window]
    for r_start, r_end in reservations:
        new_result = []
        for w_start, w_end in result:
            # Check if there is an overlap
            if r_end <= w_start or r_start >= w_end:
                # No overlap, keep the window as is
                new_result.append((w_start, w_end))
            else:
                # Overlap exists. Split the window if necessary.
                if w_start < r_start:
                    new_result.append((w_start, r_start))
                if r_end < w_end:
                    new_result.append((r_end, w_end))
        result = new_result
    return result


def _emit_with_partial_unavailable(
    db: Session,
    resource_id: int,
    branch_id: int,
    target_date: date,
    default_start: time,
    default_end: time,
    unavail_start: time,
    unavail_end: time,
    branch_hours_cache: dict,
    run_id: uuid.UUID,
    branch_tz_map: dict,
    active_reservations: list[tuple[datetime, datetime]]
) -> int:
    """Emit default hours with the unavailable window subtracted."""
    emitted = 0
    # Emit pre-unavailable portion
    if unavail_start > default_start:
        emitted += _emit_one(
            db, resource_id, branch_id, target_date,
            default_start, unavail_start,
            branch_hours_cache, run_id, has_exception=True, branch_tz_map=branch_tz_map,
            active_reservations=active_reservations
        )
    # Emit post-unavailable portion
    if unavail_end < default_end:
        emitted += _emit_one(
            db, resource_id, branch_id, target_date,
            unavail_end, default_end,
            branch_hours_cache, run_id, has_exception=True, branch_tz_map=branch_tz_map,
            active_reservations=active_reservations
        )
    return emitted


def _get_branch_hours(
    db: Session, branch_id: int, target_date: date, cache: dict
) -> list[tuple[time, time]]:
    """Returns branch operating windows for the date as list of (open, close) tuples."""
    key = (branch_id, target_date.weekday())
    if key in cache:
        return cache[key]

    rows = db.query(BranchOperatingHours).filter(
        BranchOperatingHours.branch_id == branch_id,
        BranchOperatingHours.day_of_week == target_date.weekday(),
        BranchOperatingHours.is_active == True,
        (BranchOperatingHours.effective_until.is_(None)) |
        (BranchOperatingHours.effective_until >= target_date),
        BranchOperatingHours.effective_from <= target_date,
    ).all()

    result = [(r.open_time, r.close_time) for r in rows]
    cache[key] = result
    return result
