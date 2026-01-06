"""Artifacts table model."""

# Standard library
import datetime
import uuid
from typing import Optional

# Third-party
from sqlmodel import Column, Field, SQLModel

# Internal
from app.database.database import JSONType


class Artifact(SQLModel, table=True):
    __tablename__ = "artifacts"

    id: Optional[uuid.UUID] = Field(default_factory=uuid.uuid4, primary_key=True)
    project_id: uuid.UUID = Field(foreign_key="projects.id")
    job_id: uuid.UUID = Field(foreign_key="jobs.id")
    artifact_type: str
    file_path: str
    size_bytes: int
    checksum: str
    # Renamed from 'metadata' to 'meta' to avoid SQLAlchemy reserved word conflict
    meta: dict = Field(default_factory=dict, sa_column=Column(JSONType))
    created_at: datetime.datetime = Field(default_factory=datetime.datetime.utcnow)
