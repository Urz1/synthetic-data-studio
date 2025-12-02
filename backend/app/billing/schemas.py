"""Billing & usage Pydantic schemas."""

from typing import Optional, List
from datetime import datetime
import uuid

from pydantic import BaseModel, ConfigDict, Field


# ============================================================================
# USAGE RECORD SCHEMAS
# ============================================================================

class UsageRecordCreate(BaseModel):
    """Schema for creating a usage record."""
    project_id: uuid.UUID
    type: str = Field(..., description="Type of usage: 'generation', 'evaluation', 'storage', 'api_call'")
    quantity: int = Field(..., ge=0, description="Quantity of usage")


class UsageRecordResponse(BaseModel):
    """Schema for usage record response."""
    model_config = ConfigDict(from_attributes=True)
    
    id: uuid.UUID
    project_id: uuid.UUID
    user_id: Optional[uuid.UUID]
    type: str
    quantity: int
    created_at: datetime


class UsageSummary(BaseModel):
    """Aggregated usage summary."""
    total_generations: int = 0
    total_evaluations: int = 0
    total_api_calls: int = 0
    storage_used_mb: float = 0.0
    period_start: Optional[datetime] = None
    period_end: Optional[datetime] = None


# ============================================================================
# QUOTA SCHEMAS
# ============================================================================

class QuotaCreate(BaseModel):
    """Schema for creating a quota."""
    project_id: uuid.UUID
    quota_type: str = Field(..., description="Type: 'generations', 'evaluations', 'storage_mb', 'api_calls'")
    limit_val: int = Field(..., ge=0, description="Maximum allowed value")
    reset_at: datetime = Field(..., description="When the quota resets")


class QuotaUpdate(BaseModel):
    """Schema for updating a quota."""
    limit_val: Optional[int] = Field(None, ge=0)
    used: Optional[int] = Field(None, ge=0)
    reset_at: Optional[datetime] = None


class QuotaResponse(BaseModel):
    """Schema for quota response."""
    model_config = ConfigDict(from_attributes=True)
    
    id: uuid.UUID
    project_id: uuid.UUID
    quota_type: str
    limit_val: int
    used: int
    reset_at: datetime
    remaining: int = 0  # Computed field


class QuotaStatus(BaseModel):
    """Current quota status for a project."""
    project_id: uuid.UUID
    quotas: List[QuotaResponse]
    is_over_limit: bool = False
    warnings: List[str] = []


# ============================================================================
# BILLING REPORT SCHEMAS
# ============================================================================

class BillingReport(BaseModel):
    """Monthly billing report."""
    project_id: uuid.UUID
    period_start: datetime
    period_end: datetime
    usage_summary: UsageSummary
    quota_status: List[QuotaResponse]
    total_cost_estimate: float = 0.0  # Future: actual billing
