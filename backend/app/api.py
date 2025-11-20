"""Centralized API router that collects routers from submodules.

This module attempts to import APIRouter and submodule routers when
FastAPI is available; otherwise it provides a safe placeholder.
"""

import logging

logger = logging.getLogger(__name__)

try:
    from fastapi import APIRouter

    router = APIRouter()

    # List module routers to include
    for modul in (
        "app.auth.routes",
        "app.datasets.routes",
        "app.projects.routes",
        "app.generators.routes",
        "app.models.routes",
        # "app.synthetic_datasets.routes",  # Temporarily commented
        "app.compliance.routes",
        "app.jobs.routes",
        "app.evaluations.routes",
    ):
        try:
            m = __import__(modul, fromlist=["router"])
            if hasattr(m, "router") and m.router is not None:
                router.include_router(m.router)
                logger.info(f"✅ Loaded router from {modul}")
            else:
                logger.warning(f"⚠️  Module {modul} has no router attribute")
        except Exception as e:
            # ignore missing routers during refactor
            logger.warning(f"⚠️  Failed to load {modul}: {e}")
            pass
except Exception as e:
    logger.error(f"❌ Failed to initialize API router: {e}")
    router = None
