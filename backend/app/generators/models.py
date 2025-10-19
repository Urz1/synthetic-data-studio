from pydantic import BaseModel
from typing import Optional


class Generator(BaseModel):
    id: Optional[int]
    name: str
    params: Optional[dict] = None
