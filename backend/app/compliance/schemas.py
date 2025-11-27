"""
Compliance schemas: Pydantic models for API requests/responses.

Separated from database models to follow Clean Architecture.
"""

from typing import Optional
import uuid
import datetime
from pydantic import BaseModel


class ComplianceReportBase(BaseModel):
    """Base schema for compliance report data."""
    project_id: uuid.UUID
    synthetic_dataset_id: uuid.UUID
    model_card_artifact_id: Optional[uuid.UUID] = None
    evaluation_artifact_id: Optional[uuid.UUID] = None
    dp_report_artifact_id: Optional[uuid.UUID] = None


class ComplianceReportCreate(ComplianceReportBase):
    """Schema for creating a new compliance report."""
    pass


class ComplianceReportResponse(ComplianceReportBase):
    """Schema for compliance report response."""
    id: uuid.UUID
    created_at: datetime.datetime

    class Config:
        orm_mode = True
