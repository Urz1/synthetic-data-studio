"""Evaluations model."""

from typing import Optional
import uuid
import datetime

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
    created_at: datetime.datetime = Field(default_factory=datetime.datetime.utcnow)
