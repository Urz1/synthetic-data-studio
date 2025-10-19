from pydantic import BaseModel
from typing import Optional


class Project(BaseModel):
    id: Optional[int]
    name: str
    description: Optional[str] = None
