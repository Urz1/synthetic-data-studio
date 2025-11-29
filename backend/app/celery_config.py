"""Celery configuration."""

from app.core.config import settings

# Celery settings
task_serializer = "json"
result_serializer = "json"
accept_content = ["json"]
timezone = "UTC"
enable_utc = True

# Task routing
task_routes = {
    "app.worker.train_generator_task": "training",
    "app.worker.generate_data_task": "generation",
    "app.worker.run_evaluation_task": "evaluation",
}
