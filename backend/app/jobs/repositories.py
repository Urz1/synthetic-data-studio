"""Repositories for jobs module (data access layer)."""

# ============================================================================
# IMPORTS
# ============================================================================

# Standard library
import datetime
import uuid
import uuid as uuid_module
from typing import List, Optional
import logging

# Third-party
from sqlmodel import Session, select


# Local - Module
from .models import Job

logger = logging.getLogger(__name__)

# ============================================================================
# REPOSITORIES
# ============================================================================

def get_jobs(db: Session, user_id: Optional[uuid.UUID] = None, skip: int = 0, limit: int = 100) -> List[Job]:
    """Get jobs with optional user filter and pagination."""
    stmt = select(Job).where(Job.deleted_at.is_(None))
    
    if user_id:
        stmt = stmt.where(Job.initiated_by == user_id)
    
    return db.exec(stmt.offset(skip).limit(limit)).all()


def get_job_by_id(db: Session, job_id: str) -> Optional[Job]:
    """Get job by ID (excludes soft-deleted)."""    
    # Convert job_id to UUID if it's a string
    if isinstance(job_id, str):
        try:
            job_uuid = uuid_module.UUID(job_id)
        except ValueError:
            return None
    else:
        job_uuid = job_id
    
    stmt = select(Job).where(Job.id == job_uuid, Job.deleted_at.is_(None))
    return db.exec(stmt).first()


def create_job(db: Session, job: Job) -> Job:
    """Create a new job."""
    db.add(job)
    db.commit()
    db.refresh(job)
    return job


def update_job_status(
    db: Session,
    job_id: str,
    status: str,
    error_message: str = None,
    synthetic_dataset_id: uuid.UUID = None
) -> Optional[Job]:
    """
    Update job status and optionally set results or errors.
    
    Args:
        db: Database session
        job_id: Job ID
        status: New status (pending, running, completed, failed)
        error_message: Error message if status is failed (optional)
        synthetic_dataset_id: ID of generated dataset if completed (optional)
    """
    # Convert job_id to UUID if it's a string
    if isinstance(job_id, str):
        job_uuid = uuid_module.UUID(job_id)
    else:
        job_uuid = job_id
    
    job = db.get(Job, job_uuid)
    if job:
        job.status = status
        job.updated_at = datetime.datetime.utcnow()
        
        # Store result if completed
        if synthetic_dataset_id:
            job.synthetic_dataset_id = synthetic_dataset_id
        
        # Store error message in DB
        if error_message:
            job.error_message = error_message
            logger.error(f"Job {job_id} failed: {error_message}")
        
        db.commit()
        db.refresh(job)
    return job


def soft_delete_job(db: Session, job: Job, deleted_by: uuid.UUID = None) -> None:
    """Soft-delete a job for audit trail."""
    job.deleted_at = datetime.datetime.utcnow()
    db.add(job)
    db.commit()

