from typing import Optional, Dict, Any
import uuid
import datetime

from sqlmodel import SQLModel, Field, Column
from app.database.database import JSONType


# Pydantic models for requests
class SchemaInput(SQLModel):
    """Schema definition for manual data generation."""
    columns: Dict[str, Dict[str, Any]]  # column_name -> {type, constraints}


class Generator(SQLModel, table=True):
    __tablename__ = "generators"

    id: Optional[uuid.UUID] = Field(default_factory=uuid.uuid4, primary_key=True)
    dataset_id: Optional[uuid.UUID] = Field(default=None, foreign_key="datasets.id")  # Optional for schema-only generation
    model_version_id: Optional[uuid.UUID] = Field(default=None, foreign_key="model_versions.id")
    type: str  # 'ctgan', 'timegan', etc.
    parameters_json: dict = Field(default_factory=dict, sa_column=Column(JSONType))  # Hyperparameters
    schema_json: Optional[dict] = Field(default=None, sa_column=Column(JSONType))  # Manual schema for generation
    name: str
    status: str = Field(default="pending")  # pending, running, completed, failed
    output_dataset_id: Optional[uuid.UUID] = Field(default=None, foreign_key="datasets.id")  # Generated dataset
    created_by: uuid.UUID = Field(foreign_key="users.id")
    created_at: datetime.datetime = Field(default_factory=datetime.datetime.utcnow)
    updated_at: datetime.datetime = Field(default_factory=datetime.datetime.utcnow)
