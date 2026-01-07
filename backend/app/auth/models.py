"""Auth models: User and API key.

The User model is synced from better-auth via the proxy.
All authentication is handled by better-auth, but we keep this
table for FK compatibility with our UUID-based tables.
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
    """User model synced from better-auth.
    
    This table is automatically populated when users authenticate
    via better-auth and make their first API call through the proxy.
    """

    __tablename__ = "users"

    id: Optional[uuid.UUID] = Field(default_factory=uuid.uuid4, primary_key=True)
    email: str = Field(unique=True, index=True)
    name: Optional[str] = None
    hashed_password: Optional[str] = None  # May be null for OAuth users
    role: str = Field(default="user")
    is_active: bool = Field(default=True)
    is_email_verified: bool = Field(default=False)
    
    # Timestamps
    created_at: datetime.datetime = Field(default_factory=datetime.datetime.utcnow)
    updated_at: datetime.datetime = Field(default_factory=datetime.datetime.utcnow)
    
    # 2FA fields (handled by better-auth, but kept for compatibility)
    is_2fa_enabled: bool = Field(default=False)
    
    # OAuth fields
    oauth_provider: Optional[str] = None
    oauth_id: Optional[str] = None
    avatar_url: Optional[str] = None


class APIKey(SQLModel, table=True):
    """API key for programmatic access.
    
    Allows users to authenticate with the API without going through
    the web UI. Useful for automation and integrations.
    """

    __tablename__ = "api_keys"

    id: Optional[uuid.UUID] = Field(default_factory=uuid.uuid4, primary_key=True)
    user_id: uuid.UUID = Field(foreign_key="users.id")
    key_hash: str
    name: str
    scopes: Optional[List[str]] = Field(default_factory=list, sa_column=Column(JSONType))
    revoked_at: Optional[datetime.datetime] = None
    last_used_at: Optional[datetime.datetime] = None
    created_at: datetime.datetime = Field(default_factory=datetime.datetime.utcnow)
