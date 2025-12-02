"""
Auth schemas: Pydantic models for requests/responses.

Separated from database models to follow Clean Architecture.
"""

from typing import Optional
import uuid
import datetime
from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator


# ============================================================================
# USER SCHEMAS
# ============================================================================

class UserCreate(BaseModel):
    """Schema for user registration."""
    email: EmailStr
    password: str = Field(..., min_length=8)
    
    @field_validator('password')
    @classmethod
    def validate_password(cls, v: str) -> str:
        """Validate password complexity."""
        if len(v.encode('utf-8')) > 72:
            raise ValueError("Password cannot exceed 72 bytes due to bcrypt limitations")
        if not any(c.isupper() for c in v):
            raise ValueError("Password must contain at least one uppercase letter")
        if not any(c.isdigit() for c in v):
            raise ValueError("Password must contain at least one number")
        if not any(c in "!@#$%^&*()_+-=[]{}|;:,.<>?" for c in v):
            raise ValueError("Password must contain at least one special character")
        return v


class UserLogin(BaseModel):
    """Schema for user login."""
    email: EmailStr
    password: str


class UserResponse(BaseModel):
    """Schema for user response (public info)."""
    model_config = ConfigDict(from_attributes=True)
    
    id: uuid.UUID
    email: EmailStr
    role: str
    is_active: bool
    created_at: datetime.datetime
    name: Optional[str] = None
    avatar_url: Optional[str] = None
    oauth_provider: Optional[str] = None


# ============================================================================
# TOKEN SCHEMAS
# ============================================================================

class Token(BaseModel):
    """Schema for JWT token response."""
    access_token: str
    token_type: str


class TokenData(BaseModel):
    """Schema for token payload data."""
    email: Optional[str] = None


# ============================================================================
# OAUTH SCHEMAS
# ============================================================================

class OAuthProviderInfo(BaseModel):
    """Available OAuth provider information."""
    name: str
    enabled: bool
    auth_url: Optional[str] = None


class OAuthProvidersResponse(BaseModel):
    """List of available OAuth providers."""
    providers: list[OAuthProviderInfo]


class OAuthCallbackResponse(BaseModel):
    """OAuth callback response with token and user info."""
    access_token: str
    token_type: str = "bearer"
    user: "UserResponse"
    is_new_user: bool = False
