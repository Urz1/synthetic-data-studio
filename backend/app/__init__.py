"""Backend app package for Synthetic Data Studio.

This file exposes the FastAPI `app` and mounts routers from submodules when
available. The structure was refactored to separate modules such as
`datasets`, `projects`, `generators`, and worker utilities.

NOTE: All router registration is now centralized in app/api.py.
Do NOT register routers here to avoid duplicate route registration.
"""

__all__ = ["app"]

# Lazy import the FastAPI app from main so tooling can import the package
# without side-effects when FastAPI isn't installed.
try:
    from .main import app  # type: ignore
except Exception:
    # If main or FastAPI isn't available, provide a simple placeholder
    app = None

