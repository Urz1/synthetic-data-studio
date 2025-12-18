"""Evaluations model."""

from typing import Optional
import uuid
import datetime
import hashlib
import json

from sqlmodel import SQLModel, Field, Column
from app.database.database import JSONType


class Evaluation(SQLModel, table=True):
    __tablename__ = "evaluations"

    id: Optional[uuid.UUID] = Field(default_factory=uuid.uuid4, primary_key=True)
    generator_id: uuid.UUID = Field(foreign_key="generators.id")
    dataset_id: uuid.UUID = Field(foreign_key="datasets.id")
    report: dict = Field(default_factory=dict, sa_column=Column(JSONType))
    insights: Optional[dict] = Field(default=None, sa_column=Column(JSONType))  # LLM-generated insights
    risk_score: Optional[float] = Field(default=None)  # Overall risk score (0-100)
    risk_level: Optional[str] = Field(default=None)  # 'low', 'medium', 'high'
    risk_details: Optional[dict] = Field(default=None, sa_column=Column(JSONType))  # Detailed risk breakdown
    
    # AUDIT FIELDS (added for governance)
    created_by: Optional[uuid.UUID] = Field(default=None, foreign_key="users.id")  # Who ran the evaluation
    artifact_hash: Optional[str] = Field(default=None)  # SHA256 hash of report for integrity
    
    # SOFT DELETE (added for audit trail - evaluations are never truly deleted)
    deleted_at: Optional[datetime.datetime] = Field(default=None)  # Soft delete timestamp
    deleted_by: Optional[uuid.UUID] = Field(default=None)  # Who deleted
    
    created_at: datetime.datetime = Field(default_factory=datetime.datetime.utcnow)
    
    @staticmethod
    def compute_report_hash(report: dict) -> str:
        """Compute SHA256 hash of report for integrity verification."""
        report_json = json.dumps(report, sort_keys=True, default=str)
        return hashlib.sha256(report_json.encode()).hexdigest()
