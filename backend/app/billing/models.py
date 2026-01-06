"""Billing & usage models."""

# Standard library
import datetime
import uuid
from typing import Optional

# Third-party
from sqlmodel import Field, SQLModel


class UsageRecord(SQLModel, table=True):
    __tablename__ = "usage_records"

    id: Optional[uuid.UUID] = Field(default_factory=uuid.uuid4, primary_key=True)
    project_id: uuid.UUID = Field(foreign_key="projects.id")
    user_id: Optional[uuid.UUID] = Field(default=None, foreign_key="users.id")
    type: str
    quantity: int
    created_at: datetime.datetime = Field(default_factory=datetime.datetime.utcnow)


class Quota(SQLModel, table=True):
    __tablename__ = "quotas"

    id: Optional[uuid.UUID] = Field(default_factory=uuid.uuid4, primary_key=True)
    project_id: uuid.UUID = Field(foreign_key="projects.id")
    quota_type: str
    limit_val: int
    used: int = 0
    reset_at: datetime.datetime
    # Unique constraint (project_id, quota_type, reset_at) can be enforced in migration
