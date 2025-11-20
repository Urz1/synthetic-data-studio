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
    created_at: datetime.datetime = Field(default_factory=datetime.datetime.utcnow)
