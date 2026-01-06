"""
Compliance schemas: Pydantic models for API requests/responses.

Separated from database models to follow Clean Architecture.
"""

# Standard library
import datetime
import uuid
from typing import Optional

# Third-party
from pydantic import BaseModel, ConfigDict


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
    model_config = ConfigDict(from_attributes=True)
    
    id: uuid.UUID
    created_at: datetime.datetime
