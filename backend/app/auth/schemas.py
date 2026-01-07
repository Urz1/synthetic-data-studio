"""Auth schemas for API responses."""

from typing import Optional
from pydantic import BaseModel


class UserResponse(BaseModel):
    """Minimal user info response."""
    id: str
    email: str
    name: Optional[str] = None


class GDPRExportResponse(BaseModel):
    """GDPR data export response."""
    user: dict
    projects: list
    datasets: list
    generators: list
    exports: list
    audit_logs: list
    exported_at: str
