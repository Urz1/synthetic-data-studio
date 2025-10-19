"""Auth pydantic schemas and example models."""

from pydantic import BaseModel
from typing import Optional


class User(BaseModel):
    id: Optional[int]
    username: str
    email: Optional[str]

