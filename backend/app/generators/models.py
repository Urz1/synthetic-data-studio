from typing import Optional, Dict, Any
import uuid
import datetime

from sqlmodel import SQLModel, Field, Column
from app.database.database import JSONType


# Pydantic models for requests
class SchemaInput(SQLModel):
    """Schema definition for manual data generation."""
    columns: Dict[str, Dict[str, Any]]  # column_name -> {type, constraints}


class MLGenerationConfig(SQLModel):
    """Configuration for ML-based synthesis."""
    model_type: str  # 'ctgan', 'tvae', 'timegan', 'dp-ctgan', 'dp-tvae'
    num_rows: int = 1000
    epochs: int = 300
    batch_size: int = 500
    column_types: Optional[Dict[str, str]] = None  # column -> 'categorical'|'numerical'|'datetime'|'boolean'
    conditions: Optional[Dict[str, Any]] = None  # Conditional sampling constraints
    # CTGAN specific
    generator_dim: Optional[tuple] = (256, 256)
    discriminator_dim: Optional[tuple] = (256, 256)
    generator_lr: Optional[float] = 2e-4
    discriminator_lr: Optional[float] = 2e-4
    # TVAE specific
    embedding_dim: Optional[int] = 128
    compress_dims: Optional[tuple] = (128, 128)
    decompress_dims: Optional[tuple] = (128, 128)
    learning_rate: Optional[float] = 1e-3
    # Differential Privacy parameters
    use_differential_privacy: bool = False
    target_epsilon: Optional[float] = 10.0
    target_delta: Optional[float] = None
    max_grad_norm: Optional[float] = 1.0
    noise_multiplier: Optional[float] = None


class Generator(SQLModel, table=True):
    __tablename__ = "generators"

    id: Optional[uuid.UUID] = Field(default_factory=uuid.uuid4, primary_key=True)
    dataset_id: Optional[uuid.UUID] = Field(default=None, foreign_key="datasets.id")  # Optional for schema-only generation
    model_version_id: Optional[uuid.UUID] = Field(default=None, foreign_key="model_versions.id")
    type: str  # 'ctgan', 'tvae', 'timegan', 'dp-ctgan', 'dp-tvae', 'random'
    parameters_json: dict = Field(default_factory=dict, sa_column=Column(JSONType))  # Hyperparameters
    schema_json: Optional[dict] = Field(default=None, sa_column=Column(JSONType))  # Manual schema for generation
    name: str
    status: str = Field(default="pending")  # pending, training, generating, completed, failed
    output_dataset_id: Optional[uuid.UUID] = Field(default=None, foreign_key="datasets.id")  # Generated dataset
    model_path: Optional[str] = None  # Path to saved model file
    training_metadata: Optional[dict] = Field(default=None, sa_column=Column(JSONType))  # Training stats, loss values
    privacy_config: Optional[dict] = Field(default=None, sa_column=Column(JSONType))  # DP parameters (epsilon, delta, etc.)
    privacy_spent: Optional[dict] = Field(default=None, sa_column=Column(JSONType))  # Actual privacy budget consumed
    created_by: uuid.UUID = Field(foreign_key="users.id")
    created_at: datetime.datetime = Field(default_factory=datetime.datetime.utcnow)
    updated_at: datetime.datetime = Field(default_factory=datetime.datetime.utcnow)
