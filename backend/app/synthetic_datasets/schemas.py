"""
Synthetic Datasets schemas: Pydantic models for API requests/responses.

Separated from database models to follow Clean Architecture.
"""

# Standard library
import datetime
import uuid
from typing import Optional

# Third-party
from pydantic import BaseModel, ConfigDict, Field


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
    model_config = ConfigDict(from_attributes=True)
    
    id: uuid.UUID
    uploaded_at: datetime.datetime
