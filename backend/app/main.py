"""
Synthetic Data Studio - Main FastAPI Application

This is the main entry point for the FastAPI application.
It initializes the app, includes all routers, and sets up middleware.
"""

# Standard library
import importlib.util
import logging
import sys
from contextlib import asynccontextmanager
from pathlib import Path

# Third-party
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware

# Internal - Core
from app.core.audit_middleware import AuditMiddleware
from app.core.cache_middleware import CacheControlMiddleware, CookieOptimizationMiddleware, TrailingSlashMiddleware
from app.core.config import settings
from app.core.rate_limiter import RateLimitMiddleware
from app.core.security import RequestIDMiddleware, SecurityHeadersMiddleware

# Internal - Observability
from app.observability import health_router, MetricsMiddleware

# Import observability
try:
    OBSERVABILITY_AVAILABLE = True
except ImportError:
    OBSERVABILITY_AVAILABLE = False
    MetricsMiddleware = None
    health_router = None


# Explicitly import the api.py module to avoid conflict with api/ package
# We need to access app.api.router where api is the api.py file, not the api/ folder
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
    allow_headers=["Authorization", "Content-Type", "X-Request-ID", "x-synth-xhr"],
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
app.add_middleware(RateLimitMiddleware, enabled=True)

# Metrics
if OBSERVABILITY_AVAILABLE and MetricsMiddleware:
    app.add_middleware(MetricsMiddleware)

# Re-register CORS as the LAST middleware so it is the FIRST to handle incoming requests (including preflights)
# In FastAPI/Starlette, middleware added LATER wraps middleware added EARLIER.
# Note: We already added it at line 91, but re-adding it here ensures it wraps everything else (Audit, RateLimit, Metrics, etc.)
app.user_middleware.append(app.user_middleware.pop(0)) 

if settings.debug:
    logger.warning("CORS: Allowing localhost origins (DEBUG mode)")
else:
    logger.info(f"🔒 CORS: Allowing origins: {settings.allowed_origins}")

logger.info("✅ Middlewares stabilized (CORS is outermost)")



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
