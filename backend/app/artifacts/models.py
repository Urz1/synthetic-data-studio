"""Artifacts table model."""

from typing import Optional
import uuid
import datetime

from sqlmodel import SQLModel, Field, Column
from sqlalchemy.dialects.postgresql import JSONB


class Artifact(SQLModel, table=True):
    __tablename__ = "artifacts"

    id: Optional[uuid.UUID] = Field(default_factory=uuid.uuid4, primary_key=True)
    project_id: uuid.UUID = Field(foreign_key="projects.id")
    job_id: uuid.UUID = Field(foreign_key="jobs.id")
    artifact_type: str
    file_path: str
    size_bytes: int
    checksum: str
    metadata: dict = Field(default_factory=dict, sa_column=Column(JSONB))
    created_at: datetime.datetime = Field(default_factory=datetime.datetime.utcnow)
