import os
import sys
import json
from datetime import datetime, timezone, timedelta
from typing import Dict, Any

# Ensure Backend_main is in path to import database and celery_app
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import text
from database import SessionLocal
from celery_app import REDIS_URL
import redis

def check_outbox(db) -> Dict[str, Any]:
    print("Checking Outbox Health...")
    
    # Check pending events and identify if any are stuck (older than 5 mins)
    stuck_threshold = datetime.now(timezone.utc) - timedelta(minutes=5)
    
    pending_count = db.execute(text("SELECT COUNT(*) FROM migration_outbox WHERE status = 'pending'")).scalar()
    
    stuck_count = db.execute(text(
        "SELECT COUNT(*) FROM migration_outbox WHERE status = 'pending' AND created_at < :thresh"
    ), {"thresh": stuck_threshold}).scalar()
    
    failed_count = db.execute(text("SELECT COUNT(*) FROM migration_outbox WHERE status = 'failed'")).scalar()
    
    stats = {
        "pending_events": pending_count,
        "stuck_events_over_5m": stuck_count,
        "failed_events": failed_count,
        "status": "warning" if stuck_count > 0 or failed_count > 0 else "healthy"
    }
    
    print(json.dumps(stats, indent=2))
    return stats

def check_reconciliation(db) -> Dict[str, Any]:
    print("\nChecking Reconciliation Health...")
    
    last_run = db.execute(text(
        "SELECT id, status, rows_compared, divergences_found, completed_at "
        "FROM migration_reconciliation_runs ORDER BY started_at DESC LIMIT 1"
    )).fetchone()
    
    active_divergences = db.execute(text(
        "SELECT new_table, field_name, COUNT(*) "
        "FROM migration_divergence WHERE is_resolved = FALSE "
        "GROUP BY new_table, field_name"
    )).fetchall()
    
    divergence_summary = [{"table": r[0], "field": r[1], "count": r[2]} for r in active_divergences]
    
    stats = {
        "last_run": {
            "id": str(last_run[0]) if last_run else None,
            "status": last_run[1] if last_run else "unknown",
            "divergences_found": last_run[3] if last_run else 0,
            "completed_at": str(last_run[4]) if last_run and last_run[4] else None
        },
        "active_divergences": divergence_summary,
        "status": "warning" if divergence_summary or (last_run and last_run[1] != 'success') else "healthy"
    }
    
    print(json.dumps(stats, indent=2))
    return stats

def check_db(db) -> Dict[str, Any]:
    print("\nChecking Database Health (Indexes & MVCC)...")
    
    # Check Dead Tuples (MVCC Bloat) for the materialization cache
    # n_dead_tup indicates the number of dead tuples
    # n_live_tup indicates live tuples
    bloat_stats = db.execute(text("""
        SELECT relname, n_live_tup, n_dead_tup,
               CASE WHEN n_live_tup > 0 
                    THEN (n_dead_tup::float / n_live_tup::float) * 100 
                    ELSE 0 END as bloat_ratio
        FROM pg_stat_user_tables 
        WHERE relname IN ('resource_availability_windows', 'migration_outbox')
    """)).fetchall()
    
    # Check index usage
    index_stats = db.execute(text("""
        SELECT relname, indexrelname, idx_scan 
        FROM pg_stat_user_indexes 
        WHERE relname = 'resource_availability_windows' 
        AND indexrelname = 'ix_raw_resource_range_gist'
    """)).fetchone()
    
    stats = {
        "mvcc_bloat": [
            {
                "table": r[0],
                "live_tuples": r[1],
                "dead_tuples": r[2],
                "bloat_ratio_pct": round(r[3], 2)
            } for r in bloat_stats
        ],
        "gist_index": {
            "index_name": index_stats[1] if index_stats else 'unknown',
            "scans": index_stats[2] if index_stats else 0
        }
    }
    
    print(json.dumps(stats, indent=2))
    return stats

def check_queues() -> Dict[str, Any]:
    print("\nChecking Celery Queues...")
    try:
        r = redis.from_url(REDIS_URL)
        queues = ["migration", "scheduling", "reconciliation"]
        queue_lengths = {}
        total_backlog = 0
        
        for q in queues:
            # Celery uses the queue name as the list key in Redis
            length = r.llen(q)
            queue_lengths[q] = length
            total_backlog += length
            
        stats = {
            "queues": queue_lengths,
            "status": "warning" if total_backlog > 100 else "healthy"
        }
    except Exception as e:
        stats = {"error": str(e), "status": "error"}
        
    print(json.dumps(stats, indent=2))
    return stats

def main():
    if not os.path.exists(os.path.dirname(os.path.abspath(__file__))):
        os.makedirs(os.path.dirname(os.path.abspath(__file__)))
        
    target = sys.argv[1] if len(sys.argv) > 1 else "all"
    
    db = SessionLocal()
    try:
        if target in ["outbox", "all"]:
            check_outbox(db)
        if target in ["reconciliation", "all"]:
            check_reconciliation(db)
        if target in ["db", "all"]:
            check_db(db)
        if target in ["queues", "all"]:
            check_queues()
    finally:
        db.close()

if __name__ == "__main__":
    main()
