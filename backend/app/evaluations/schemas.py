"""
API request/response schemas for evaluations.

These Pydantic models define the API contract.
"""

from typing import Optional, List, Dict, Any
from datetime import datetime
from pydantic import BaseModel, ConfigDict
import uuid


# ============================================================================
# REQUEST SCHEMAS
# ============================================================================

class EvaluationRequest(BaseModel):
    """Request model for evaluation."""
    generator_id: str
    dataset_id: str
    target_column: Optional[str] = None
    sensitive_columns: Optional[List[str]] = None
    include_statistical: bool = True
    include_ml_utility: bool = True
    include_privacy: bool = True
    statistical_columns: Optional[List[str]] = None


# ============================================================================
# RESPONSE SCHEMAS
# ============================================================================

class EvaluationResponse(BaseModel):
    """Response model for evaluation."""
    model_config = ConfigDict(from_attributes=True)
    
    id: str
    generator_id: str
    dataset_id: str
    status: str
    report: Dict[str, Any]
    created_at: Optional[datetime] = None


class EvaluationListResponse(BaseModel):
    """Response for list of evaluations."""
    evaluations: List[EvaluationResponse]
    total: int


class ComparisonRequest(BaseModel):
    """Request model for comparing evaluations."""
    evaluation_ids: List[str]
