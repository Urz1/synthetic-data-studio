from pydantic import BaseModel
from typing import Optional


class SyntheticDataset(BaseModel):
    id: Optional[int]
    name: str
    generator_id: Optional[int]
