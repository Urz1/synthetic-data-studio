"""Celery application configuration."""

from celery import Celery
from app.core.config import settings

# Initialize Celery app
celery_app = Celery(
    "synth_studio",
    broker=settings.redis_url,
    backend=settings.redis_url
)

# Configure Celery
celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    # Task routing disabled - using default queue for simplicity
    # task_routes={
    #     "app.tasks.generators.*": {"queue": "generators"},
    #     "app.tasks.evaluations.*": {"queue": "evaluations"},
    # },
    # Task execution settings
    task_track_started=True,
    task_time_limit=3600 * 4,  # 4 hours max per task
    worker_prefetch_multiplier=1,  # One task at a time per worker process (for heavy ML tasks)
    # task_always_eager=True, # DEV MODE: Run tasks synchronously
    # task_eager_propagates=True, # DEV MODE: Propagate exceptions
)

# Auto-discover tasks in these modules
celery_app.autodiscover_tasks([
    "app.tasks.generators",
    "app.tasks.evaluations"
])
