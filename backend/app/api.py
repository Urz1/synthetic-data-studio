"""Centralized API router that collects routers from submodules.

This module attempts to import APIRouter and submodule routers when
FastAPI is available; otherwise it provides a safe placeholder.
"""

try:
    from fastapi import APIRouter

    router = APIRouter()

    # List module routers to include
    for modul in (
        "app.auth.routes",
        "app.datasets.routes",
        "app.projects.routes",
        "app.generators.routes",
        "app.synthetic_datasets.routes",
        "app.compliance.routes",
        "app.jobs.routes",
    ):
        try:
            m = __import__(modul, fromlist=["router"])
            if hasattr(m, "router") and m.router is not None:
                router.include_router(m.router)
        except Exception:
            # ignore missing routers during refactor
            pass
except Exception:
    router = None
