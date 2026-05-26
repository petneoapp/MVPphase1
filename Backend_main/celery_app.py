import os
from celery import Celery

# Use the same environment variable as the backend or default to local redis
REDIS_URL = os.environ.get("REDIS_URL", "redis://localhost:6379/0")

# Initialize Celery
celery_app = Celery(
    "petneo_tasks",
    broker=REDIS_URL,
    backend=REDIS_URL,
    include=[
        "tasks.notifications", 
        "tasks.appointments",
        "tasks.outbox_worker",
        "tasks.schedule_materializer",
        "tasks.reconciliation",
        "petneo_ai.tasks.care_tips",
        "petneo_ai.tasks.appointment_summary",
        "petneo_ai.tasks.reminder_recommendations"
    ]
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    # Route tasks to specific queues
    task_routes={
        "tasks.notifications.*": {"queue": "notifications"},
        "tasks.appointments.*": {"queue": "high_priority"},
        "operational.outbox.*": {"queue": "migration"},
        "operational.schedule.*": {"queue": "scheduling"},
        "operational.reconciliation.*": {"queue": "reconciliation"},
        "petneo_ai.tasks.*": {"queue": "ai_tasks"},
    },
    # Ensure tasks are acknowledged only after execution (prevents loss on crash)
    task_acks_late=True,
    # Prevent a single task from blocking a worker forever
    task_soft_time_limit=30,  # 30 seconds soft timeout
    task_time_limit=60,       # 60 seconds hard timeout
)

# Configure Celery Beat schedule
celery_app.conf.beat_schedule = {
    "sync-appointment-statuses-every-5-minutes": {
        "task": "tasks.appointments.scheduled_lifecycle_sync_task",
        "schedule": 300.0,  # 5 minutes in seconds
        "options": {"queue": "high_priority"}
    },
    "drain-outbox-batch-every-30-seconds": {
        "task": "operational.outbox.drain_batch",
        "schedule": 30.0,
        "options": {"queue": "migration"}
    },
    "materialize-schedules-every-6-hours": {
        "task": "operational.schedule.materialize_scheduled",
        "schedule": 21600.0,  # 6 hours in seconds
        "options": {"queue": "scheduling"}
    },
    "reconcile-legacy-vets-nightly": {
        "task": "operational.reconciliation.reconcile_legacy_vets_task",
        "schedule": 86400.0,  # Daily in seconds
        "options": {"queue": "reconciliation"}
    }
}

# Import celery signals to register the operational observability hooks
import utils.celery_signals
