"""Centralized API router that collects routers from submodules.

This module attempts to import APIRouter and submodule routers when
FastAPI is available; otherwise it provides a safe placeholder.
"""

# Standard library
import logging
import os

# Third-party
from fastapi import APIRouter, Depends

# Internal
from app.core.dependencies import get_current_user

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
    
    # Routers that must be protected by proxy-based auth for all endpoints
    protected_modules = {
        "app.dashboard.routes",
        "app.datasets.routes",
        "app.projects.routes",
        "app.generators.routes",
        "app.synthetic_datasets.routes",
        "app.compliance.routes",
        "app.jobs.routes",
        "app.evaluations.routes",
        "app.llm.routes",
        "app.audit.routes",
        "app.billing.routes",
        "app.exports.routes",
    }

    for module_name in modules_to_load:
        try:
            module = __import__(module_name, fromlist=["router"])
            if hasattr(module, "router") and module.router is not None:
                if module_name in protected_modules:
                    router.include_router(module.router, dependencies=[Depends(get_current_user)])
                else:
                    router.include_router(module.router)
                route_count = len(module.router.routes) if hasattr(module.router, 'routes') else 0
                logger.debug("Loaded %s (%d routes)", module_name, route_count)
            else:
                logger.warning("Module %s has no router attribute", module_name)
        except (ImportError, AttributeError, TypeError) as e:
            logger.error("Failed to load router from %s: %s", module_name, e, exc_info=True)
            # In production, fail hard on router loading errors
            if os.getenv("DEBUG", "false").lower() != "true":
                raise RuntimeError(f"Failed to load required router: {module_name}") from e
    
    logger.info("API router initialized with %d routes", len(router.routes))
    
except RuntimeError as e:
    logger.error("Failed to initialize API router: %s", e)
    router = None
