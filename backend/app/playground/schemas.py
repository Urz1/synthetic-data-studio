"""Pydantic schemas for playground endpoints."""

from typing import Dict, Any, Optional, List
from pydantic import BaseModel, Field


class PlaygroundColumn(BaseModel):
    """Single column definition for playground generation."""
    name: str = Field(..., description="Column name")
    type: str = Field(..., description="Data type (string, integer, float, email, etc.)")


class PlaygroundGenerateRequest(BaseModel):
    """Request schema for playground generation."""
    columns: List[PlaygroundColumn] = Field(..., description="Column definitions", max_length=10)
    num_rows: int = Field(default=1000, ge=10, le=5000, description="Number of rows (max 5000)")
    
    class Config:
        schema_extra = {
            "example": {
                "columns": [
                    {"name": "name", "type": "string"},
                    {"name": "age", "type": "integer"},
                    {"name": "email", "type": "email"},
                ],
                "num_rows": 100
            }
        }


class PlaygroundGenerateResponse(BaseModel):
    """Response schema for playground generation (metadata only, CSV is streamed)."""
    success: bool
    message: str
    row_count: int
    column_count: int
    remaining_generations: int = Field(..., description="Remaining generations for this visitor")
