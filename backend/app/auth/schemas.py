"""
Auth schemas: Pydantic models for requests/responses.

Separated from database models to follow Clean Architecture.
"""

# Standard library
import datetime
import uuid
from typing import Optional

# Third-party
from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator


def validate_password_strength(password: str) -> str:
    if len(password.encode("utf-8")) > 72:
        raise ValueError("Password cannot exceed 72 bytes due to bcrypt limitations")
    if len(password) < 8:
        raise ValueError("Password must be at least 8 characters")
    if not any(c.isupper() for c in password):
        raise ValueError("Password must contain at least one uppercase letter")
    if not any(c.isdigit() for c in password):
        raise ValueError("Password must contain at least one number")
    if not any(c in "!@#$%^&*()_+-=[]{}|;:,.<>?" for c in password):
        raise ValueError("Password must contain at least one special character")
    return password


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
        return validate_password_strength(v)


class UserLogin(BaseModel):
    """Schema for user login."""
    email: EmailStr
    password: str
    otp: Optional[str] = None  # Required only if user enabled 2FA


class ProfileUpdate(BaseModel):
    """Schema for profile update."""
    full_name: Optional[str] = Field(None, max_length=100)
    bio: Optional[str] = Field(None, max_length=500)


class PasswordChange(BaseModel):
    """Schema for password change."""
    current_password: str
    new_password: str = Field(..., min_length=8)
    
    @field_validator('new_password')
    @classmethod
    def validate_new_password(cls, v: str) -> str:
        """Validate new password complexity."""
        return validate_password_strength(v)


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
    ok: bool = True


# ============================================================================
# TOKEN SCHEMAS
# ============================================================================

class Token(BaseModel):
    """Schema for JWT token response."""
    access_token: str
    token_type: str
    ok: bool = True
    token: Optional[str] = None


class TokenPair(BaseModel):
    """Schema for access + refresh token pair response."""
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int  # Access token expiry in seconds


class RefreshTokenRequest(BaseModel):
    """Schema for refresh token request."""
    refresh_token: str


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


class SessionCreate(BaseModel):
    """Schema for creating session cookies from tokens.
    
    Used by /auth/session endpoint to convert tokens (passed via hash fragment)
    into secure HTTP-only cookies.
    """
    access: str = Field(..., description="Access token (JWT)")
    refresh: str = Field(..., description="Refresh token")
    expires_in: int = Field(..., description="Access token expiry in seconds")


# ============================================================================
# VERIFICATION + PASSWORD RESET
# ============================================================================


class VerificationRequest(BaseModel):
    email: EmailStr


class PasswordResetRequest(BaseModel):
    email: EmailStr


class PasswordResetConfirm(BaseModel):
    token: str = Field(..., min_length=10)
    new_password: str = Field(..., min_length=8)

    @field_validator("new_password")
    @classmethod
    def _validate_new_password(cls, v: str) -> str:
        return validate_password_strength(v)


class TwoFactorSetupResponse(BaseModel):
    secret: str
    otpauth_url: str


class TwoFactorVerifyRequest(BaseModel):
    code: str = Field(..., min_length=6, max_length=12)
