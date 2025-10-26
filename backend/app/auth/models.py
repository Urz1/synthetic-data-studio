"""Auth models: SQLModel schemas for users and API keys.

These are database schemas (SQLModel) that reflect the project's
Postgres-backed table layout. They live here so other parts of the
app can import `auth.models.User` or `auth.models.APIKey`.
"""

from typing import Optional, List
import uuid
import datetime

from sqlmodel import SQLModel, Field, Column
from sqlalchemy.dialects.postgresql import JSONB


class User(SQLModel, table=True):
    __tablename__ = "users"

    id: Optional[uuid.UUID] = Field(default_factory=uuid.uuid4, primary_key=True)
    email: str = Field(index=True)
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
    scopes: Optional[List[str]] = Field(default_factory=list, sa_column=Column(JSONB))
    revoked_at: Optional[datetime.datetime] = None
    last_used_at: Optional[datetime.datetime] = None
    created_at: datetime.datetime = Field(default_factory=datetime.datetime.utcnow)


