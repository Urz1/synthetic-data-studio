from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session
from app.core.dependencies import get_db, get_current_user
from .models import Job
from .crud import get_jobs, create_job, get_job_by_id

router = APIRouter(prefix="/jobs", tags=["jobs"])


@router.get("/", response_model=list[Job])
def list_jobs(db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    return get_jobs(db)


@router.get("/{job_id}", response_model=Job)
def get_job(job_id: str, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    job = get_job_by_id(db, job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    return job


@router.post("/", response_model=Job)
def create_new_job(job: Job, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    job.initiated_by = current_user.id
    return create_job(db, job)
