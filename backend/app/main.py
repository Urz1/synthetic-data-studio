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
from fastapi.middleware.gzip import GZipMiddleware

from app.core.config import settings
from app.core.audit_middleware import AuditMiddleware
from app.core.rate_limiter import RateLimitMiddleware
from app.core.security import SecurityHeadersMiddleware, RequestIDMiddleware
from app.core.cache_middleware import CacheControlMiddleware, TrailingSlashMiddleware, CookieOptimizationMiddleware

# Import observability
try:
    from app.observability import MetricsMiddleware, health_router
    OBSERVABILITY_AVAILABLE = True
except ImportError:
    OBSERVABILITY_AVAILABLE = False
    MetricsMiddleware = None
    health_router = None


# Explicitly import the api.py module to avoid conflict with api/ package
# We need to access app.api.router where api is the api.py file, not the api/ folder
import importlib.util
spec = importlib.util.spec_from_file_location("app_api_routes", Path(__file__).parent / "api.py")
api_module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(api_module)

# Configure logging
logging.basicConfig(
    level=logging.DEBUG if settings.debug else logging.INFO,
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
    # Mask credentials in database URL for logging
    db_display = settings.database_url.split('@')[-1] if '@' in settings.database_url else settings.database_url
    logger.info(f"Database: {db_display}")
    
    # Log registered routes
    logger.info("📋 Registered Routes:")
    for route in app.routes:
        if hasattr(route, "methods"):
            methods = ", ".join(route.methods)
            logger.info(f"  [{methods}] {route.path}")
    
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
    openapi_url="/openapi.json",
    # Disable automatic trailing slash redirects (307)
    redirect_slashes=False
)

# Configure CORS (environment-aware)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type", "X-Request-ID"],
    expose_headers=["ETag", "Cache-Control"],
    max_age=3600,  # Cache preflight responses for 1 hour
)

# Add GZip compression for responses > 1KB
app.add_middleware(GZipMiddleware, minimum_size=1000)

# Add caching middleware (must be early in chain)
app.add_middleware(CacheControlMiddleware)
app.add_middleware(TrailingSlashMiddleware)
app.add_middleware(CookieOptimizationMiddleware)

# Add request ID middleware for tracing
app.add_middleware(RequestIDMiddleware)

# Add security headers middleware (disable HSTS in debug mode)
app.add_middleware(SecurityHeadersMiddleware, enable_hsts=not settings.debug)

# Add audit logging middleware for enterprise compliance
app.add_middleware(AuditMiddleware)

# Add rate limiting middleware - ALWAYS enabled (higher limits in debug mode for easier testing)
# Security: Even if DEBUG=true leaks to production, rate limiting still works
app.add_middleware(RateLimitMiddleware, enabled=True)
if settings.debug:
    logger.info("✅ Rate limiting middleware enabled (debug mode - higher limits)")
else:
    logger.info("✅ Rate limiting middleware enabled")

# Add metrics middleware for observability
if OBSERVABILITY_AVAILABLE and MetricsMiddleware:
    app.add_middleware(MetricsMiddleware)
    logger.info("✅ Prometheus metrics middleware enabled")

if settings.debug:
    logger.warning("CORS: Allowing all origins (DEBUG mode)")
else:
    logger.info(f"🔒 CORS: Allowing origins: {settings.allowed_origins}")

logger.info("✅ HTTP caching middleware enabled (ETag/304)")
logger.info("✅ Trailing slash middleware enabled (no 307s)")
logger.info("✅ Cookie optimization middleware enabled")
logger.info("✅ Security headers middleware enabled")
logger.info("✅ Request ID tracing enabled")
logger.info("✅ GZip compression enabled")
logger.info("✅ Audit logging middleware enabled")



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
    logger.warning("API router is None - no module routers were loaded")

# Include observability routes (health checks, metrics)
if OBSERVABILITY_AVAILABLE and health_router:
    app.include_router(health_router)
    logger.info("✅ Observability endpoints enabled (/health/*, /metrics)")

# Routes are logged during lifespan startup
