"""Auth models: SQLModel schemas for users and API keys.

These are database schemas (SQLModel) that reflect the project's
Postgres-backed table layout. They live here so other parts of the
app can import `auth.models.User` or `auth.models.APIKey`.
"""

# Standard library
import datetime
import uuid
from typing import List, Optional

# Third-party
from sqlmodel import Column, Field, SQLModel

# Internal
from app.database.database import JSONType

class User(SQLModel, table=True):
    """User account model with authentication and profile fields."""

    __tablename__ = "users"

    id: Optional[uuid.UUID] = Field(default_factory=uuid.uuid4, primary_key=True)
    email: str = Field(index=True, unique=True)
    hashed_password: Optional[str] = None
    role: str = Field(default="user")
    is_active: bool = Field(default=True)
    created_at: datetime.datetime = Field(default_factory=datetime.datetime.utcnow)
    updated_at: datetime.datetime = Field(default_factory=datetime.datetime.utcnow)

    # Email verification
    is_email_verified: bool = Field(default=False, index=True)
    email_verified_at: Optional[datetime.datetime] = None

    # Brute-force protection (per-account)
    failed_login_attempts: int = Field(default=0)
    locked_until: Optional[datetime.datetime] = None

    # Optional TOTP-based 2FA
    is_2fa_enabled: bool = Field(default=False, index=True)
    totp_secret_encrypted: Optional[str] = None
    last_2fa_verified_at: Optional[datetime.datetime] = None

    # Phone verification (plumbing; provider integration can come next)
    phone_number: Optional[str] = Field(default=None, index=True)
    is_phone_verified: bool = Field(default=False, index=True)
    phone_verified_at: Optional[datetime.datetime] = None
    
    # OAuth fields
    oauth_provider: Optional[str] = Field(default=None, index=True)  # "google", "github", None
    oauth_id: Optional[str] = Field(default=None, index=True)  # Provider's user ID
    name: Optional[str] = Field(default=None)  # Display name from OAuth
    avatar_url: Optional[str] = Field(default=None)  # Profile picture URL

    # GDPR consent tracking
    tos_accepted_at: Optional[datetime.datetime] = Field(default=None)  # Terms of Service
    privacy_accepted_at: Optional[datetime.datetime] = Field(default=None)  # Privacy Policy

class EmailVerificationToken(SQLModel, table=True):
    """Token for email verification during registration."""

    __tablename__ = "email_verification_tokens"

    id: Optional[uuid.UUID] = Field(default_factory=uuid.uuid4, primary_key=True)
    user_id: uuid.UUID = Field(foreign_key="users.id", index=True)
    token_hash: str = Field(index=True, unique=True)
    expires_at: datetime.datetime
    consumed_at: Optional[datetime.datetime] = None
    created_at: datetime.datetime = Field(default_factory=datetime.datetime.utcnow)

class PasswordResetToken(SQLModel, table=True):
    """Token for password reset requests."""

    __tablename__ = "password_reset_tokens"

    id: Optional[uuid.UUID] = Field(default_factory=uuid.uuid4, primary_key=True)
    user_id: uuid.UUID = Field(foreign_key="users.id", index=True)
    token_hash: str = Field(index=True, unique=True)
    expires_at: datetime.datetime
    used_at: Optional[datetime.datetime] = None
    created_at: datetime.datetime = Field(default_factory=datetime.datetime.utcnow)
    request_ip: Optional[str] = None
    user_agent: Optional[str] = None


class RefreshToken(SQLModel, table=True):
    """
    Refresh tokens stored in database for secure token rotation.
    
    Unlike access tokens (stateless JWTs), refresh tokens are stored
    so they can be revoked and rotated on use.
    """
    __tablename__ = "refresh_tokens"

    id: Optional[uuid.UUID] = Field(default_factory=uuid.uuid4, primary_key=True)
    user_id: uuid.UUID = Field(foreign_key="users.id", index=True)
    token_hash: str = Field(index=True, unique=True)  # SHA-256 hash of the token
    expires_at: datetime.datetime
    created_at: datetime.datetime = Field(default_factory=datetime.datetime.utcnow)
    revoked_at: Optional[datetime.datetime] = None
    
    # Security context
    ip_address: Optional[str] = None
    user_agent: Optional[str] = None
    
    # Token rotation tracking
    replaced_by: Optional[uuid.UUID] = Field(default=None)  # ID of the new token if rotated

class APIKey(SQLModel, table=True):
    """API key for programmatic access."""

    __tablename__ = "api_keys"

    id: Optional[uuid.UUID] = Field(default_factory=uuid.uuid4, primary_key=True)
    user_id: uuid.UUID = Field(foreign_key="users.id")
    key_hash: str
    name: str
    scopes: Optional[List[str]] = Field(default_factory=list, sa_column=Column(JSONType))
    revoked_at: Optional[datetime.datetime] = None
    last_used_at: Optional[datetime.datetime] = None
    created_at: datetime.datetime = Field(default_factory=datetime.datetime.utcnow)
