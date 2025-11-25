"""Centralized API router that collects routers from submodules.

This module attempts to import APIRouter and submodule routers when
FastAPI is available; otherwise it provides a safe placeholder.
"""

import logging
import os

logger = logging.getLogger(__name__)

try:
    from fastapi import APIRouter

    router = APIRouter()

    # List module routers to include
    modules_to_load = [
        "app.auth.routes",
        "app.datasets.routes",
        "app.projects.routes",
        "app.generators.routes",
        "app.models.routes",
        # "app.synthetic_datasets.routes",  # Temporarily commented
        "app.compliance.routes",
        "app.jobs.routes",
        "app.evaluations.routes",
        "app.llm.routes",  # LLM chat and interactive features
    ]
    
    logger.info("="*60)
    logger.info("Loading API Routers...")
    logger.info("="*60)
    
    # DEBUG: Write to file to verify execution
    with open("router_debug.log", "w") as f:
        f.write("Starting router loading...\n")
    
    for modul in modules_to_load:
        try:
            logger.info(f"Attempting to load: {modul}")
            with open("router_debug.log", "a") as f:
                f.write(f"Attempting to load: {modul}\n")
                
            m = __import__(modul, fromlist=["router"])
            if hasattr(m, "router") and m.router is not None:
                router.include_router(m.router)
                # Count routes in this module
                route_count = len(m.router.routes) if hasattr(m.router, 'routes') else 0
                logger.info(f"[OK] Loaded router from {modul} ({route_count} routes)")
                with open("router_debug.log", "a") as f:
                    f.write(f"[OK] Loaded router from {modul} ({route_count} routes)\n")
            else:
                logger.warning(f"[WARN] Module {modul} has no router attribute")
                with open("router_debug.log", "a") as f:
                    f.write(f"[WARN] Module {modul} has no router attribute\n")
        except Exception as e:
            # Log router loading failures
            logger.error(f"[ERROR] CRITICAL: Failed to load router from {modul}: {e}", exc_info=True)
            with open("router_debug.log", "a") as f:
                f.write(f"[ERROR] CRITICAL: Failed to load router from {modul}: {e}\n")
            
            # In production, this should potentially fail hard
            if not os.getenv("DEBUG", "false").lower() == "true":
                logger.error(f"Continuing despite error (DEBUG mode)")
                # Don't raise in development to allow partial loading
                # raise RuntimeError(f"Failed to load required router: {modul}") from e
    
    logger.info("="*60)
    logger.info(f"[OK] Total routes loaded: {len(router.routes)}")
    logger.info("="*60)
    with open("router_debug.log", "a") as f:
        f.write(f"[OK] Total routes loaded: {len(router.routes)}\n")
    
except Exception as e:
    logger.error(f"[ERROR] Failed to initialize API router: {e}")
    with open("router_debug.log", "a") as f:
        f.write(f"[ERROR] Failed to initialize API router: {e}\n")
    router = None
