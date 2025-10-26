from typing import Optional
import uuid
import datetime

from sqlmodel import SQLModel, Field, Column
from sqlalchemy.dialects.postgresql import JSONB


class Generator(SQLModel, table=True):
    __tablename__ = "generators"

    id: Optional[uuid.UUID] = Field(default_factory=uuid.uuid4, primary_key=True)
    dataset_id: uuid.UUID = Field(foreign_key="datasets.id")
    model_version_id: Optional[uuid.UUID] = Field(default=None, foreign_key="model_versions.id")
    type: str
    parameters_json: dict = Field(default_factory=dict, sa_column=Column(JSONB))
    name: str
    created_by: uuid.UUID = Field(foreign_key="users.id")
    created_at: datetime.datetime = Field(default_factory=datetime.datetime.utcnow)
