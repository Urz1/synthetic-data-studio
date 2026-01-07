"""Auth module with better-auth integration.

All authentication is handled by better-auth on the frontend.
This module provides:
- API key management for programmatic access
- GDPR compliance endpoints
"""

from .routes import router

__all__ = ["router"]
