"""
API request/response schemas for LLM module.

These Pydantic models define the API contract for chat, compliance, and feature generation.
"""

# Standard library
from typing import Any, Dict, List, Optional

# Third-party
from pydantic import BaseModel, ConfigDict, Field


# ============================================================================
# CHAT SCHEMAS
# ============================================================================

class ChatRequest(BaseModel):
    """Chat request model."""
    message: str
    evaluation_id: Optional[str] = None
    generator_id: Optional[str] = None
    history: Optional[List[Dict[str, str]]] = None


class ChatResponse(BaseModel):
    """Chat response model."""
    response: str
    context_used: Dict[str, Any]


# ============================================================================
# FEATURE GENERATION SCHEMAS
# ============================================================================

class FeatureGenerationRequest(BaseModel):
    """Request for generating features from schema."""
    model_config = ConfigDict(populate_by_name=True)
    
    data_schema: Dict[str, Any] = Field(alias="schema")
    context: Optional[str] = None


# ============================================================================
# PII DETECTION SCHEMAS
# ============================================================================

class PIIDetectionRequest(BaseModel):
    """Request for PII detection."""
    data: List[Dict[str, Any]]


# ============================================================================
# COMPLIANCE SCHEMAS
# ============================================================================

class PrivacyReportRequest(BaseModel):
    """Request for privacy report generation."""
    dataset_id: str
    generator_id: Optional[str] = None


class ModelCardRequest(BaseModel):
    """Request for model card generation."""
    generator_id: str
    dataset_id: str
