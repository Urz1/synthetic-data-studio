"""
Synthetic Datasets schemas: Pydantic models for API requests/responses.

Separated from database models to follow Clean Architecture.
"""

from typing import Optional
import uuid
import datetime
from pydantic import BaseModel, Field


class SyntheticDatasetBase(BaseModel):
    """Base schema for synthetic dataset."""
    project_id: uuid.UUID
    name: str = Field(..., min_length=1, max_length=100)
    original_filename: Optional[str] = None
    size_bytes: Optional[int] = None
    row_count: Optional[int] = None
    version: int = Field(default=1)


class SyntheticDatasetCreate(SyntheticDatasetBase):
    """Schema for creating a new synthetic dataset."""
    pass


class SyntheticDatasetResponse(SyntheticDatasetBase):
    """Schema for synthetic dataset response."""
    id: uuid.UUID
    uploaded_at: datetime.datetime

    class Config:
        orm_mode = True
