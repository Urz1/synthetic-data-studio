"""Health check endpoints for monitoring and load balancers."""

from datetime import datetime
from typing import Dict, Any

from fastapi import APIRouter, Depends
from sqlmodel import Session, text

from app.core.dependencies import get_db


router = APIRouter(tags=["health"])


@router.get("/health")
def health_check() -> Dict[str, Any]:
    """
    Basic health check endpoint.
    
    Returns 200 if the service is running.
    Used by load balancers and container orchestrators.
    """
    return {
        "status": "healthy",
        "service": "synthetic-data-studio",
        "timestamp": datetime.utcnow().isoformat()
    }


@router.get("/health/ready")
def readiness_check(db: Session = Depends(get_db)) -> Dict[str, Any]:
    """
    Readiness check - verifies all dependencies are available.
    
    Checks:
    - Database connectivity
    - Required services
    """
    checks = {
        "database": False,
        "timestamp": datetime.utcnow().isoformat()
    }
    
    # Check database
    try:
        db.exec(text("SELECT 1"))
        checks["database"] = True
    except Exception as e:
        checks["database_error"] = str(e)
    
    # Overall status
    all_healthy = all([
        checks["database"]
    ])
    
    checks["status"] = "ready" if all_healthy else "not_ready"
    
    return checks


@router.get("/health/live")
def liveness_check() -> Dict[str, Any]:
    """
    Liveness check - verifies the process is alive and not deadlocked.
    
    This is a lightweight check that always returns 200 if the process
    can respond to requests.
    """
    return {
        "status": "alive",
        "timestamp": datetime.utcnow().isoformat()
    }


@router.get("/metrics")
def prometheus_metrics():
    """
    Prometheus metrics endpoint.
    
    Exposes application metrics in Prometheus format.
    """
    from fastapi.responses import Response
    from .metrics import get_metrics, get_metrics_content_type
    
    return Response(
        content=get_metrics(),
        media_type=get_metrics_content_type()
    )


@router.get("/health/info")
def service_info() -> Dict[str, Any]:
    """
    Service information endpoint.
    
    Returns version, build info, and configuration details.
    """
    import os
    
    return {
        "service": "synthetic-data-studio",
        "version": "1.0.0",
        "environment": os.getenv("ENVIRONMENT", "development"),
        "debug": os.getenv("DEBUG", "false").lower() == "true",
        "python_version": __import__("sys").version,
        "timestamp": datetime.utcnow().isoformat(),
        "features": {
            "differential_privacy": True,
            "llm_integration": True,
            "evaluation_suite": True,
            "compliance_reporting": True
        }
    }
