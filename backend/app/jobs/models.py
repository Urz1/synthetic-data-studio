from typing import Optional
import uuid
import datetime

from sqlmodel import SQLModel, Field


class Job(SQLModel, table=True):
    __tablename__ = "jobs"

    id: Optional[uuid.UUID] = Field(default_factory=uuid.uuid4, primary_key=True)
    project_id: uuid.UUID = Field(foreign_key="projects.id")
    initiated_by: uuid.UUID = Field(foreign_key="users.id")
    dataset_id: Optional[uuid.UUID] = Field(default=None, foreign_key="datasets.id")
    generator_id: Optional[uuid.UUID] = None
    model_version_id: Optional[uuid.UUID] = None
    synthetic_dataset_id: Optional[uuid.UUID] = None
    type: str
    params_hash: Optional[str] = None
    status: str = Field(default="queued")
    created_at: datetime.datetime = Field(default_factory=datetime.datetime.utcnow)
    updated_at: datetime.datetime = Field(default_factory=datetime.datetime.utcnow)
    deleted_at: Optional[datetime.datetime] = None
