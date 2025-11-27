"""Repositories for jobs module (data access layer)."""

# ============================================================================
# IMPORTS
# ============================================================================

# Standard library
import datetime
from typing import List, Optional

# Third-party
from sqlmodel import Session, select

# Local - Module
from .models import Job

# ============================================================================
# REPOSITORIES
# ============================================================================

def get_jobs(db: Session, skip: int = 0, limit: int = 100) -> List[Job]:
    """Get all jobs with pagination."""
    return db.exec(select(Job).offset(skip).limit(limit)).all()


def get_job_by_id(db: Session, job_id: str) -> Optional[Job]:
    """Get job by ID."""
    return db.get(Job, job_id)


def create_job(db: Session, job: Job) -> Job:
    """Create a new job."""
    db.add(job)
    db.commit()
    db.refresh(job)
    return job


def update_job_status(db: Session, job_id: str, status: str) -> Optional[Job]:
    """Update job status."""
    job = db.get(Job, job_id)
    if job:
        job.status = status
        job.updated_at = datetime.datetime.utcnow()
        db.commit()
        db.refresh(job)
    return job
