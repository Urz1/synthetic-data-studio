from typing import Optional
import uuid
import datetime

from sqlmodel import SQLModel, Field


class SyntheticDataset(SQLModel, table=True):
    __tablename__ = "datasets"

    # Note: synthetic datasets reuse the `datasets` table in the SQL schema
    # The table is shared; here we provide a typed model for synthetic datasets.
    id: Optional[uuid.UUID] = Field(default_factory=uuid.uuid4, primary_key=True)
    project_id: uuid.UUID = Field(foreign_key="projects.id")
    name: str
    original_filename: Optional[str] = None
    size_bytes: Optional[int] = None
    row_count: Optional[int] = None
    version: int = Field(default=1)
    uploaded_at: datetime.datetime = Field(default_factory=datetime.datetime.utcnow)
