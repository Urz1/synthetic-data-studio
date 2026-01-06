"""Celery application configuration."""

# Standard library
import ssl

# Third-party
from celery import Celery

# Internal
from app.core.config import settings

# Determine if using SSL (rediss://)
redis_url = settings.redis_url
use_ssl = redis_url.startswith("rediss://") if redis_url else False

# SSL settings for Redis with rediss:// URLs
ssl_settings = {
    "ssl_cert_reqs": ssl.CERT_NONE  # For managed Redis services that don't require cert validation
} if use_ssl else None

# Initialize Celery app
celery_app = Celery(
    "synth_studio",
    broker=redis_url,
    backend=redis_url
)

# Configure Celery
celery_config = {
    "task_serializer": "json",
    "accept_content": ["json"],
    "result_serializer": "json",
    "timezone": "UTC",
    "enable_utc": True,
    # Task execution settings
    "task_track_started": True,
    "task_time_limit": 3600 * 4,  # 4 hours max per task
    "worker_prefetch_multiplier": 1,  # One task at a time per worker process (for heavy ML tasks)
}

# Add SSL settings for broker and backend if using rediss://
if ssl_settings:
    celery_config["broker_use_ssl"] = ssl_settings
    celery_config["redis_backend_use_ssl"] = ssl_settings

celery_app.conf.update(**celery_config)

# Auto-discover tasks in these modules
celery_app.autodiscover_tasks([
    "app.tasks.generators",
    "app.tasks.evaluations"
])
