"""Core model definitions: models + model_versions."""

from typing import Optional
import uuid
import datetime

from sqlmodel import SQLModel, Field, Column
from sqlalchemy.dialects.postgresql import JSONB


class Model(SQLModel, table=True):
    __tablename__ = "models"

    id: Optional[uuid.UUID] = Field(default_factory=uuid.uuid4, primary_key=True)


class ModelVersion(SQLModel, table=True):
    __tablename__ = "model_versions"

    id: Optional[uuid.UUID] = Field(default_factory=uuid.uuid4, primary_key=True)
    model_id: uuid.UUID = Field(foreign_key="models.id")
    version_number: int
    created_by: uuid.UUID = Field(foreign_key="users.id")
    metadata: dict = Field(default_factory=dict, sa_column=Column(JSONB))
    created_at: datetime.datetime = Field(default_factory=datetime.datetime.utcnow)
