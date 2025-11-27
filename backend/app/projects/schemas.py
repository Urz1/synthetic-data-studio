"""
Projects schemas: Pydantic models for API requests/responses.

Separated from database models to follow Clean Architecture.
"""

from typing import Optional
import uuid
import datetime
from pydantic import BaseModel, Field


class ProjectBase(BaseModel):
    """Base schema for project data."""
    name: str = Field(..., min_length=1, max_length=100)
    description: Optional[str] = None
    default_retention_days: int = Field(default=30, ge=1, le=365)


class ProjectCreate(ProjectBase):
    """Schema for creating a new project."""
    pass


class ProjectUpdate(BaseModel):
    """Schema for updating a project."""
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    description: Optional[str] = None
    default_retention_days: Optional[int] = Field(None, ge=1, le=365)


class ProjectResponse(ProjectBase):
    """Schema for project response."""
    id: uuid.UUID
    owner_id: uuid.UUID
    created_at: datetime.datetime
    updated_at: datetime.datetime

    class Config:
        from_attributes = True
