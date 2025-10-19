from pydantic import BaseModel
from typing import Optional


class Job(BaseModel):
    id: Optional[int]
    type: str
    status: Optional[str]
