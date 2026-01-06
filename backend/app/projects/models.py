"""Database models for projects."""

# Standard library
import datetime
import uuid
from typing import Optional

# Third-party
from sqlmodel import Field, SQLModel


class Project(SQLModel, table=True):
    __tablename__ = "projects"

    id: Optional[uuid.UUID] = Field(default_factory=uuid.uuid4, primary_key=True)
    owner_id: uuid.UUID = Field(foreign_key="users.id")
    name: str
    description: Optional[str] = None
    default_retention_days: int = Field(default=30)
    created_at: datetime.datetime = Field(default_factory=datetime.datetime.utcnow)
    updated_at: datetime.datetime = Field(default_factory=datetime.datetime.utcnow)
    
    # Audit trail fields
    created_by: Optional[uuid.UUID] = Field(default=None, foreign_key="users.id")
    deleted_at: Optional[datetime.datetime] = Field(default=None)
    deleted_by: Optional[uuid.UUID] = Field(default=None)

