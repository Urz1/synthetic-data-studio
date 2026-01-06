"""Database models for compliance reports."""

# Standard library
import datetime
import uuid
from typing import Optional

# Third-party
from sqlmodel import Field, SQLModel


class ComplianceReport(SQLModel, table=True):
    __tablename__ = "compliance_packs"

    id: Optional[uuid.UUID] = Field(default_factory=uuid.uuid4, primary_key=True)
    project_id: uuid.UUID = Field(foreign_key="projects.id")
    synthetic_dataset_id: uuid.UUID = Field(foreign_key="datasets.id")
    model_card_artifact_id: Optional[uuid.UUID] = Field(default=None)  # No FK - artifacts table doesn't exist yet
    evaluation_artifact_id: Optional[uuid.UUID] = Field(default=None)  # No FK - artifacts table doesn't exist yet
    dp_report_artifact_id: Optional[uuid.UUID] = Field(default=None)  # No FK - artifacts table doesn't exist yet
    created_at: datetime.datetime = Field(default_factory=datetime.datetime.utcnow)
