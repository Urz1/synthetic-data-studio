"""Observability module for metrics, health checks, and monitoring."""

from .metrics import (
    MetricsMiddleware,
    REQUEST_COUNT,
    REQUEST_LATENCY,
    ACTIVE_REQUESTS,
    GENERATION_COUNT,
    EVALUATION_COUNT,
    ERROR_COUNT,
    track_generation,
    track_evaluation,
    track_error
)
from .health import router as health_router

__all__ = [
    "MetricsMiddleware",
    "REQUEST_COUNT",
    "REQUEST_LATENCY", 
    "ACTIVE_REQUESTS",
    "GENERATION_COUNT",
    "EVALUATION_COUNT",
    "ERROR_COUNT",
    "track_generation",
    "track_evaluation",
    "track_error",
    "health_router"
]
