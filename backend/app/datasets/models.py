"""Dataset schemas and models (pydantic/sqlalchemy as needed)."""

from pydantic import BaseModel
from typing import Optional


class Dataset(BaseModel):
    id: Optional[int]
    name: str
    description: Optional[str] = None

