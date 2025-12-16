"""Jobs API Routes."""

# ============================================================================
# IMPORTS
# ============================================================================

# Standard library
from typing import List

# Third-party
from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session

# Local - Core
from app.core.dependencies import get_db, get_current_user

# Local - Module
from .schemas import JobCreate, JobResponse
from .repositories import get_jobs, create_job, get_job_by_id, soft_delete_job
from .models import Job

# ============================================================================
# SETUP
# ============================================================================

router = APIRouter(prefix="/jobs", tags=["jobs"])

# ============================================================================
# ENDPOINTS
# ============================================================================

@router.get("", response_model=List[JobResponse])
@router.get("/", response_model=List[JobResponse])
def list_jobs(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """List jobs for current user (all if admin)."""
    # If admin, return all jobs
    if hasattr(current_user, "role") and current_user.role == "admin":
        return get_jobs(db)
    # Otherwise, filter by initiated_by
    return get_jobs(db, user_id=current_user.id)


@router.get("/{job_id}", response_model=JobResponse)
def get_job(
    job_id: str,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Get job by ID."""
    job = get_job_by_id(db, job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    
    # SECURITY: Verify ownership (admin can view any job)
    is_admin = hasattr(current_user, "role") and current_user.role == "admin"
    if job.initiated_by != current_user.id and not is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to view this job"
        )
    
    return job


@router.post("/", response_model=JobResponse, status_code=status.HTTP_201_CREATED)
def create_new_job(
    job: JobCreate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Create a new job."""
    # Convert schema to model
    # Note: We use **job.dict() because from_orm fails when required fields (initiated_by) are missing in the source
    db_job = Job(**job.dict())
    db_job.initiated_by = current_user.id
    
    return create_job(db, db_job)


@router.delete("/{job_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_job(
    job_id: str,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Soft-delete a job."""    
    job = get_job_by_id(db, job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    
    # SECURITY: Verify ownership (admin can delete any job)
    is_admin = hasattr(current_user, "role") and current_user.role == "admin"
    if job.initiated_by != current_user.id and not is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to delete this job"
        )
    
    soft_delete_job(db, job)
    return None
