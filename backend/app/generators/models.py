"""Database models for generators."""

from typing import Optional, Dict, Any
import uuid
import datetime
import warnings

from sqlmodel import SQLModel, Field, Column
from app.database.database import JSONType

# Suppress the schema_json shadowing warning - we're aware of it but 
# renaming would require a database migration
warnings.filterwarnings(
    "ignore", 
    message='Field name "schema_json" in "Generator" shadows an attribute'
)


class Generator(SQLModel, table=True):
    """Generator database model."""
    __tablename__ = "generators"

    id: Optional[uuid.UUID] = Field(default_factory=uuid.uuid4, primary_key=True)
    dataset_id: Optional[uuid.UUID] = Field(default=None, foreign_key="datasets.id")
    model_version_id: Optional[uuid.UUID] = Field(default=None)  # No FK - model_versions table doesn't exist yet
    type: str  # 'ctgan', 'tvae', 'timegan', 'dp-ctgan', 'dp-tvae', 'random'
    parameters_json: dict = Field(default_factory=dict, sa_column=Column(JSONType))
    schema_json: Optional[dict] = Field(default=None, sa_column=Column(JSONType))
    name: str
    status: str = Field(default="pending")  # pending, training, generating, completed, failed
    output_dataset_id: Optional[uuid.UUID] = Field(default=None, foreign_key="datasets.id")
    model_path: Optional[str] = None
    s3_model_key: Optional[str] = None  # S3 key for the trained model
    training_metadata: Optional[dict] = Field(default=None, sa_column=Column(JSONType))
    privacy_config: Optional[dict] = Field(default=None, sa_column=Column(JSONType))
    privacy_spent: Optional[dict] = Field(default=None, sa_column=Column(JSONType))
    created_by: uuid.UUID = Field(foreign_key="users.id")
    created_at: datetime.datetime = Field(default_factory=datetime.datetime.utcnow)
    updated_at: datetime.datetime = Field(default_factory=datetime.datetime.utcnow)
