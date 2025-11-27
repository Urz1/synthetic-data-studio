"""
API request/response schemas for generators.

These Pydantic models define the API contract and are separate from
database models (models.py) following clean architecture principles.
"""

from typing import Optional, Dict, Any
from datetime import datetime
from pydantic import BaseModel, Field
import uuid


# ============================================================================
# REQUEST SCHEMAS
# ============================================================================

class SchemaInput(BaseModel):
    """Schema definition for manual data generation."""
    columns: Dict[str, Dict[str, Any]]  # column_name -> {type, constraints}


class MLGenerationConfig(BaseModel):
    """Configuration for ML-based synthesis."""
    model_type: str = Field(..., description="'ctgan', 'tvae', 'timegan', 'dp-ctgan', 'dp-tvae'")
    num_rows: int = Field(default=1000, ge=1)
    epochs: int = Field(default=300, ge=1)
    batch_size: int = Field(default=500, ge=1)
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


class GeneratorCreateRequest(BaseModel):
    """Request to create a new generator."""
    dataset_id: Optional[uuid.UUID] = None
    model_version_id: Optional[uuid.UUID] = None
    type: str = Field(..., description="Generator type")
    parameters_json: Dict[str, Any] = Field(default_factory=dict)
    generator_schema: Optional[Dict[str, Any]] = Field(None, alias="schema_json")
    name: str = Field(..., min_length=1, max_length=255)
    
    class Config:
        populate_by_name = True  # Allow both field name and alias


# ============================================================================
# RESPONSE SCHEMAS
# ============================================================================

class GeneratorResponse(BaseModel):
    """Response model for generator information."""
    id: uuid.UUID
    dataset_id: Optional[uuid.UUID] = None
    model_version_id: Optional[uuid.UUID] = None
    type: str
    parameters_json: Dict[str, Any]
    generator_schema: Optional[Dict[str, Any]] = Field(None, alias="schema_json")
    name: str
    status: str
    output_dataset_id: Optional[uuid.UUID] = None
    model_path: Optional[str] = None
    training_metadata: Optional[Dict[str, Any]] = None
    privacy_config: Optional[Dict[str, Any]] = None
    privacy_spent: Optional[Dict[str, Any]] = None
    created_by: uuid.UUID
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True
        populate_by_name = True


class GeneratorDeleteResponse(BaseModel):
    """Response after deleting a generator."""
    message: str
    id: str


class GenerationStartResponse(BaseModel):
    """Response when starting generation."""
    message: str
    generator_id: str
