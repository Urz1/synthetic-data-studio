"""Auth models: SQLModel schemas for users and API keys.

These are database schemas (SQLModel) that reflect the project's
Postgres-backed table layout. They live here so other parts of the
app can import `auth.models.User` or `auth.models.APIKey`.
"""

from typing import Optional, List
import uuid
import datetime

from sqlmodel import SQLModel, Field, Column
from app.database.database import JSONType


class User(SQLModel, table=True):
    __tablename__ = "users"

    id: Optional[uuid.UUID] = Field(default_factory=uuid.uuid4, primary_key=True)
    email: str = Field(index=True, unique=True)
    hashed_password: Optional[str] = None
    role: str = Field(default="user")
    is_active: bool = Field(default=True)
    created_at: datetime.datetime = Field(default_factory=datetime.datetime.utcnow)
    updated_at: datetime.datetime = Field(default_factory=datetime.datetime.utcnow)


class APIKey(SQLModel, table=True):
    __tablename__ = "api_keys"

    id: Optional[uuid.UUID] = Field(default_factory=uuid.uuid4, primary_key=True)
    user_id: uuid.UUID = Field(foreign_key="users.id")
    key_hash: str
    name: str
    scopes: Optional[List[str]] = Field(default_factory=list, sa_column=Column(JSONType))
    revoked_at: Optional[datetime.datetime] = None
    last_used_at: Optional[datetime.datetime] = None
    created_at: datetime.datetime = Field(default_factory=datetime.datetime.utcnow)


# Pydantic schemas for requests/responses
class UserCreate(SQLModel):
    email: str
    password: str
    
    @property
    def _validate_email(self):
        """Validate email format"""
        import re
        if not re.match(r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$', self.email):
            raise ValueError("Invalid email format")
        return True
    
    @property
    def _validate_password(self):
        """Validate password requirements"""
        if len(self.password) < 8:
            raise ValueError("Password must be at least 8 characters long")
        # Bcrypt has a 72-byte limit
        if len(self.password.encode('utf-8')) > 72:
            raise ValueError("Password cannot exceed 72 bytes due to bcrypt limitations")
        # Check for uppercase
        if not any(c.isupper() for c in self.password):
            raise ValueError("Password must contain at least one uppercase letter")
        # Check for numbers
        if not any(c.isdigit() for c in self.password):
            raise ValueError("Password must contain at least one number")
        return True
    
    def model_post_init(self, __context):
        """Run validation after model initialization"""
        self._validate_email
        self._validate_password


class UserResponse(SQLModel):
    id: uuid.UUID
    email: str
    role: str
    is_active: bool
    created_at: datetime.datetime


class UserLogin(SQLModel):
    email: str
    password: str


class Token(SQLModel):
    access_token: str
    token_type: str


class UserLogin(SQLModel):
    email: str
    password: str


class Token(SQLModel):
    access_token: str
    token_type: str



