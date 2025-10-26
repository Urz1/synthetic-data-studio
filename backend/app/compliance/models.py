from typing import Optional
import uuid
import datetime

from sqlmodel import SQLModel, Field


class ComplianceReport(SQLModel, table=True):
    __tablename__ = "compliance_packs"

    id: Optional[uuid.UUID] = Field(default_factory=uuid.uuid4, primary_key=True)
    project_id: uuid.UUID = Field(foreign_key="projects.id")
    synthetic_dataset_id: uuid.UUID = Field(foreign_key="datasets.id")
    model_card_artifact_id: Optional[uuid.UUID] = Field(default=None, foreign_key="artifacts.id")
    evaluation_artifact_id: Optional[uuid.UUID] = Field(default=None, foreign_key="artifacts.id")
    dp_report_artifact_id: Optional[uuid.UUID] = Field(default=None, foreign_key="artifacts.id")
    created_at: datetime.datetime = Field(default_factory=datetime.datetime.utcnow)
