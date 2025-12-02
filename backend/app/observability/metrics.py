"""Prometheus metrics for observability."""

import time
from typing import Callable

from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware

# Try to import prometheus_client, provide fallback if not installed
try:
    from prometheus_client import Counter, Histogram, Gauge, generate_latest, CONTENT_TYPE_LATEST
    PROMETHEUS_AVAILABLE = True
except ImportError:
    PROMETHEUS_AVAILABLE = False
    # Provide dummy implementations
    class DummyMetric:
        def labels(self, **kwargs): return self
        def inc(self, amount=1): pass
        def dec(self, amount=1): pass
        def observe(self, value): pass
        def set(self, value): pass
    
    Counter = Histogram = Gauge = lambda *args, **kwargs: DummyMetric()
    generate_latest = lambda: b""
    CONTENT_TYPE_LATEST = "text/plain"


# ============================================================================
# METRICS DEFINITIONS
# ============================================================================

# HTTP Request metrics
REQUEST_COUNT = Counter(
    "http_requests_total",
    "Total HTTP requests",
    ["method", "endpoint", "status_code"]
)

REQUEST_LATENCY = Histogram(
    "http_request_duration_seconds",
    "HTTP request latency in seconds",
    ["method", "endpoint"],
    buckets=[0.01, 0.05, 0.1, 0.25, 0.5, 1.0, 2.5, 5.0, 10.0]
)

ACTIVE_REQUESTS = Gauge(
    "http_requests_active",
    "Number of active HTTP requests",
    ["method", "endpoint"]
)

# Business metrics
GENERATION_COUNT = Counter(
    "synthetic_generations_total",
    "Total synthetic data generations",
    ["generator_type", "status"]
)

EVALUATION_COUNT = Counter(
    "evaluations_total",
    "Total evaluations run",
    ["evaluation_type", "status"]
)

ERROR_COUNT = Counter(
    "errors_total",
    "Total errors by type",
    ["error_type", "endpoint"]
)

# System metrics
DB_CONNECTIONS = Gauge(
    "database_connections_active",
    "Active database connections"
)

JOBS_PENDING = Gauge(
    "jobs_pending",
    "Number of pending background jobs"
)

JOBS_RUNNING = Gauge(
    "jobs_running", 
    "Number of running background jobs"
)


# ============================================================================
# HELPER FUNCTIONS
# ============================================================================

def track_generation(generator_type: str, status: str = "success"):
    """Track a synthetic data generation."""
    GENERATION_COUNT.labels(generator_type=generator_type, status=status).inc()


def track_evaluation(evaluation_type: str, status: str = "success"):
    """Track an evaluation run."""
    EVALUATION_COUNT.labels(evaluation_type=evaluation_type, status=status).inc()


def track_error(error_type: str, endpoint: str):
    """Track an error occurrence."""
    ERROR_COUNT.labels(error_type=error_type, endpoint=endpoint).inc()


# ============================================================================
# METRICS MIDDLEWARE
# ============================================================================

class MetricsMiddleware(BaseHTTPMiddleware):
    """Middleware to collect HTTP request metrics."""
    
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        if not PROMETHEUS_AVAILABLE:
            return await call_next(request)
        
        method = request.method
        # Normalize endpoint path (remove IDs for grouping)
        path = request.url.path
        endpoint = self._normalize_path(path)
        
        # Track active requests
        ACTIVE_REQUESTS.labels(method=method, endpoint=endpoint).inc()
        
        start_time = time.time()
        
        try:
            response = await call_next(request)
            status_code = response.status_code
        except Exception as e:
            status_code = 500
            track_error(type(e).__name__, endpoint)
            raise
        finally:
            # Record metrics
            duration = time.time() - start_time
            
            REQUEST_COUNT.labels(
                method=method,
                endpoint=endpoint,
                status_code=status_code
            ).inc()
            
            REQUEST_LATENCY.labels(
                method=method,
                endpoint=endpoint
            ).observe(duration)
            
            ACTIVE_REQUESTS.labels(method=method, endpoint=endpoint).dec()
        
        return response
    
    def _normalize_path(self, path: str) -> str:
        """Normalize path by replacing UUIDs and IDs with placeholders."""
        import re
        # Replace UUIDs
        path = re.sub(
            r'[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}',
            '{id}',
            path,
            flags=re.IGNORECASE
        )
        # Replace numeric IDs
        path = re.sub(r'/\d+', '/{id}', path)
        return path


# ============================================================================
# METRICS ENDPOINT
# ============================================================================

def get_metrics() -> bytes:
    """Get Prometheus metrics output."""
    if not PROMETHEUS_AVAILABLE:
        return b"# Prometheus client not installed\n"
    return generate_latest()


def get_metrics_content_type() -> str:
    """Get content type for metrics endpoint."""
    return CONTENT_TYPE_LATEST
