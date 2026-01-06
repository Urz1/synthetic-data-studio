"""Database models for synthetic datasets."""

# Standard library
import datetime
import uuid
from typing import Optional

# Third-party
from sqlmodel import Field, SQLModel


class SyntheticDataset(SQLModel, table=False):
    # Note: synthetic datasets reuse the `datasets` table in the SQL schema
    # This is a Pydantic model for typing, not a table definition.
    id: Optional[uuid.UUID] = Field(default_factory=uuid.uuid4, primary_key=True)
    project_id: uuid.UUID = Field(foreign_key="projects.id")
    name: str
    original_filename: Optional[str] = None
    size_bytes: Optional[int] = None
    row_count: Optional[int] = None
    version: int = Field(default=1)
    uploaded_at: datetime.datetime = Field(default_factory=datetime.datetime.utcnow)
