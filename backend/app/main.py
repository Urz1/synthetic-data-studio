"""
Synthetic Data Studio - Main FastAPI Application

This is the main entry point for the FastAPI application.
It initializes the app, includes all routers, and sets up middleware.
"""

import logging
import sys
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings

# Explicitly import the api.py module to avoid conflict with api/ package
# We need to access app.api.router where api is the api.py file, not the api/ folder
import importlib.util
spec = importlib.util.spec_from_file_location("app_api_routes", Path(__file__).parent / "api.py")
api_module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(api_module)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Lifespan context manager for startup and shutdown events.
    """
    # Startup
    logger.info("=" * 60)
    logger.info("🚀 Starting Synthetic Data Studio Backend")
    logger.info("=" * 60)
    logger.info(f"Debug mode: {settings.debug}")
    logger.info(f"Database: {settings.database_url.split('@')[-1] if '@' in settings.database_url else settings.database_url}")
    
    yield
    
    # Shutdown
    logger.info("=" * 60)
    logger.info("👋 Shutting down Synthetic Data Studio Backend")
    logger.info("=" * 60)


# Initialize FastAPI application
app = FastAPI(
    title="Synthetic Data Studio API",
    description="Backend API for Synthetic Data Studio - Generate, manage, and evaluate synthetic datasets",
    version="0.1.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json"
)

# Configure CORS (environment-aware)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

if settings.debug:
    logger.warning("⚠️  CORS: Allowing all origins (DEBUG mode)")
else:
    logger.info(f"🔒 CORS: Allowing origins: {settings.allowed_origins}")


# Root endpoint
@app.get("/", tags=["Health"])
def read_root():
    """
    Root endpoint - returns basic API information.
    """
    return {
        "message": "Welcome to Synthetic Data Studio API",
        "version": "0.1.0",
        "status": "running",
        "docs": "/docs"
    }


# Health check endpoint
@app.get("/health", tags=["Health"])
def health_check():
    """
    Health check endpoint for monitoring and load balancers.
    """
    return {
        "status": "healthy",
        "service": "synthetic-data-studio-backend"
    }


# Include API router
if api_module.router is not None:
    app.include_router(api_module.router)
else:
    logger.warning("⚠️  API router is None - no module routers were loaded")

# Log registered routes on startup
@app.on_event("startup")
async def log_routes():
    """
    Log all registered routes for debugging.
    """
    logger.info("📋 Registered Routes:")
    for route in app.routes:
        if hasattr(route, "methods"):
            methods = ", ".join(route.methods)
            logger.info(f"  [{methods}] {route.path}")
