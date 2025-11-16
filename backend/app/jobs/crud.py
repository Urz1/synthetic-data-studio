import datetime
from sqlmodel import Session, select
from .models import Job


def get_jobs(db: Session, skip: int = 0, limit: int = 100):
    return db.exec(select(Job).offset(skip).limit(limit)).all()


def get_job_by_id(db: Session, job_id: str):
    return db.get(Job, job_id)


def create_job(db: Session, job: Job):
    db.add(job)
    db.commit()
    db.refresh(job)
    return job


def update_job_status(db: Session, job_id: str, status: str):
    job = db.get(Job, job_id)
    if job:
        job.status = status
        job.updated_at = datetime.datetime.utcnow()
        db.commit()
        db.refresh(job)
    return job
