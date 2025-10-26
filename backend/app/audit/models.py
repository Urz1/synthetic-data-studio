"""Audit log model."""

from typing import Optional
import uuid
import datetime

from sqlmodel import SQLModel, Field


class AuditLog(SQLModel, table=True):
    __tablename__ = "audit_logs"

    id: Optional[uuid.UUID] = Field(default_factory=uuid.uuid4, primary_key=True)
    project_id: uuid.UUID = Field(foreign_key="projects.id")
    actor_id: Optional[uuid.UUID] = Field(default=None, foreign_key="users.id")
    actor_type: str
    action: str
    details_json: dict = Field(default_factory=dict)
    created_at: datetime.datetime = Field(default_factory=datetime.datetime.utcnow)
