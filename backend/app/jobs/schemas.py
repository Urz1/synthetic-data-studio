"""
Jobs schemas: Pydantic models for API requests/responses.

Separated from database models to follow Clean Architecture.
"""

from typing import Optional
import uuid
import datetime
from pydantic import BaseModel, Field


class JobBase(BaseModel):
    """Base schema for job data."""
    project_id: uuid.UUID
    type: str = Field(..., min_length=1, max_length=50)
    dataset_id: Optional[uuid.UUID] = None
    generator_id: Optional[uuid.UUID] = None
    model_version_id: Optional[uuid.UUID] = None
    synthetic_dataset_id: Optional[uuid.UUID] = None
    params_hash: Optional[str] = None
    status: str = Field(default="queued")


class JobCreate(JobBase):
    """Schema for creating a new job."""
    pass


class JobUpdate(BaseModel):
    """Schema for updating a job."""
    status: Optional[str] = None
    deleted_at: Optional[datetime.datetime] = None


class JobResponse(JobBase):
    """Schema for job response."""
    id: uuid.UUID
    initiated_by: uuid.UUID
    created_at: datetime.datetime
    updated_at: datetime.datetime
    deleted_at: Optional[datetime.datetime] = None

    class Config:
        orm_mode = True
