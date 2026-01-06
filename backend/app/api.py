"""Centralized API router that collects routers from submodules.

This module attempts to import APIRouter and submodule routers when
FastAPI is available; otherwise it provides a safe placeholder.
"""

# Standard library
import logging
import os

# Third-party
from fastapi import APIRouter

logger = logging.getLogger(__name__)

try:

    router = APIRouter()

    # List module routers to include
    modules_to_load = [
        "app.auth.routes",
        "app.dashboard.routes",  # Aggregated dashboard statistics
        "app.datasets.routes",
        "app.projects.routes",
        "app.generators.routes",
        "app.synthetic_datasets.routes",
        "app.compliance.routes",
        "app.jobs.routes",
        "app.evaluations.routes",
        "app.llm.routes",
        "app.audit.routes",  # Enterprise audit logging
        "app.billing.routes",  # Usage tracking & quotas
        "app.exports.routes",  # Export storage & retrieval
    ]
    
    for module_name in modules_to_load:
        try:
            module = __import__(module_name, fromlist=["router"])
            if hasattr(module, "router") and module.router is not None:
                router.include_router(module.router)
                route_count = len(module.router.routes) if hasattr(module.router, 'routes') else 0
                logger.debug(f"Loaded {module_name} ({route_count} routes)")
            else:
                logger.warning(f"Module {module_name} has no router attribute")
        except Exception as e:
            logger.error(f"Failed to load router from {module_name}: {e}", exc_info=True)
            # In production, fail hard on router loading errors
            if os.getenv("DEBUG", "false").lower() != "true":
                raise RuntimeError(f"Failed to load required router: {module_name}") from e
    
    logger.info(f"API router initialized with {len(router.routes)} routes")
    
except Exception as e:
    logger.error(f"Failed to initialize API router: {e}")
    router = None
