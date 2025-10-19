from pydantic import BaseModel
from typing import Optional


class ComplianceReport(BaseModel):
    id: Optional[int]
    name: str
    status: Optional[str]
