"""Synthetic datasets package."""

from . import models, repositories, schemas, routes

__all__ = ["models", "repositories", "schemas", "routes", "router"]

# Export router directly for convenience
from .routes import router
