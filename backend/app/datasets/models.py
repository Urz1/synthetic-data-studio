"""Dataset models (SQLModel) matching the DB schema.

Includes `Dataset` and `DatasetFile` models.
"""

from typing import Optional, List
import uuid
import datetime

from sqlmodel import SQLModel, Field, Column
from app.database.database import JSONType


class Dataset(SQLModel, table=True):
    __tablename__ = "datasets"
    __table_args__ = {"extend_existing": True}

    id: Optional[uuid.UUID] = Field(default_factory=uuid.uuid4, primary_key=True)
    project_id: uuid.UUID = Field(foreign_key="projects.id")
    name: str
    original_filename: Optional[str] = None  # UUID-prefixed filename on disk
    file_path: Optional[str] = None  # Full path to file
    s3_key: Optional[str] = None  # S3 object key (if stored in S3)
    size_bytes: Optional[int] = None
    row_count: Optional[int] = None
    # Renamed from 'schema_json' to 'schema_data' to avoid SQLModel reserved word warning
    schema_data: dict = Field(default_factory=dict, sa_column=Column(JSONType))
    status: str = Field(default="uploaded")
    checksum: str
    # Store PII detection results (full dictionary with confidence, types, recommendations)
    pii_flags: Optional[dict] = Field(default=None, sa_column=Column(JSONType))
    # Store comprehensive profiling results (statistics, distributions, correlations)
    profiling_data: Optional[dict] = Field(default=None, sa_column=Column(JSONType))
    version: int = Field(default=1)
    uploader_id: uuid.UUID = Field(foreign_key="users.id")  # Track who uploaded the dataset
    uploaded_at: datetime.datetime = Field(default_factory=datetime.datetime.utcnow)
    deleted_at: Optional[datetime.datetime] = None


class DatasetFile(SQLModel, table=True):
    __tablename__ = "dataset_files"

    id: Optional[uuid.UUID] = Field(default_factory=uuid.uuid4, primary_key=True)
    dataset_id: uuid.UUID = Field(foreign_key="datasets.id")
    uploader_id: uuid.UUID = Field(foreign_key="users.id")
    file_path: str
    size_bytes: int
    checksum: str
    # Renamed from 'metadata' to 'meta' to avoid SQLAlchemy reserved word conflict
    meta: dict = Field(default_factory=dict, sa_column=Column(JSONType))
    uploaded_at: datetime.datetime = Field(default_factory=datetime.datetime.utcnow)

