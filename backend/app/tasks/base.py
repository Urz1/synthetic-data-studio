"""Base Celery task with database session management."""

from celery import Task
from app.database.database import SessionLocal

class DatabaseTask(Task):
    """Base task that provides a database session."""
    
    _db = None

    @property
    def db(self):
        """Get or create a database session."""
        if self._db is None:
            self._db = SessionLocal()
        return self._db

    def after_return(self, status, retval, task_id, args, kwargs, einfo):
        """Clean up database session after task execution."""
        if self._db is not None:
            self._db.close()
            self._db = None
