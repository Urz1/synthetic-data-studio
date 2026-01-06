"""Database models for jobs."""

# Standard library
import datetime
import uuid
from typing import Optional

# Third-party
from sqlmodel import Field, SQLModel


class Job(SQLModel, table=True):
    __tablename__ = "jobs"

    id: Optional[uuid.UUID] = Field(default_factory=uuid.uuid4, primary_key=True)
    project_id: uuid.UUID = Field(foreign_key="projects.id")
    initiated_by: uuid.UUID = Field(foreign_key="users.id")
    dataset_id: Optional[uuid.UUID] = Field(default=None, foreign_key="datasets.id")
    generator_id: Optional[uuid.UUID] = Field(default=None)
    model_version_id: Optional[uuid.UUID] = Field(default=None)
    synthetic_dataset_id: Optional[uuid.UUID] = Field(default=None)
    type: str
    params_hash: Optional[str] = Field(default=None)
    status: str = Field(default="queued")
    
    # Celery tracking
    celery_task_id: Optional[str] = Field(default=None)
    error_message: Optional[str] = Field(default=None)
    started_at: Optional[datetime.datetime] = Field(default=None)
    completed_at: Optional[datetime.datetime] = Field(default=None)
    
    created_at: datetime.datetime = Field(default_factory=datetime.datetime.utcnow)
    updated_at: datetime.datetime = Field(default_factory=datetime.datetime.utcnow)
    deleted_at: Optional[datetime.datetime] = Field(default=None)
