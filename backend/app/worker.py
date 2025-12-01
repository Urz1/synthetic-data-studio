"""Celery worker entry point."""

from app.core.celery_app import celery_app

# Import tasks to ensure they are registered
# (These imports will be added as we create the task files)
# from app.tasks import generators, evaluations

if __name__ == "__main__":
    celery_app.start()
