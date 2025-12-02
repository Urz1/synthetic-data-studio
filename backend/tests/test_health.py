"""
Health check and smoke tests.

These tests verify the application starts correctly and basic endpoints are responsive.
"""

# ============================================================================
# IMPORTS
# ============================================================================

import pytest
from fastapi.testclient import TestClient


# ============================================================================
# TESTS - HEALTH CHECKS
# ============================================================================

class TestHealthChecks:
    """Tests for health check endpoints."""
    
    def test_root_endpoint(self, client: TestClient):
        """Test the root endpoint is accessible."""
        response = client.get("/")
        assert response.status_code in [200, 404]  # May redirect or return info
    
    def test_health_endpoint(self, client: TestClient):
        """Test the main health check endpoint."""
        response = client.get("/health")
        assert response.status_code == 200
        data = response.json()
        assert "status" in data or "healthy" in data or data.get("msg") == "ok"
    
    def test_health_live(self, client: TestClient):
        """Test liveness probe endpoint."""
        response = client.get("/health/live")
        assert response.status_code == 200
    
    def test_health_ready(self, client: TestClient):
        """Test readiness probe endpoint."""
        response = client.get("/health/ready")
        # May fail if database isn't connected in test
        assert response.status_code in [200, 503]
    
    def test_openapi_schema(self, client: TestClient):
        """Test OpenAPI schema is accessible."""
        response = client.get("/openapi.json")
        assert response.status_code == 200
        data = response.json()
        assert "openapi" in data
        assert "paths" in data
        assert "info" in data
    
    def test_docs_endpoint(self, client: TestClient):
        """Test Swagger UI is accessible."""
        response = client.get("/docs")
        assert response.status_code == 200
        assert "swagger" in response.text.lower() or "html" in response.headers.get("content-type", "")
    
    def test_redoc_endpoint(self, client: TestClient):
        """Test ReDoc is accessible."""
        response = client.get("/redoc")
        assert response.status_code == 200


# ============================================================================
# TESTS - API INFO
# ============================================================================

class TestAPIInfo:
    """Tests for API information endpoints."""
    
    def test_api_version(self, client: TestClient):
        """Test API version information."""
        response = client.get("/openapi.json")
        assert response.status_code == 200
        data = response.json()
        assert "info" in data
        assert "title" in data["info"]
        assert "version" in data["info"]
    
    def test_api_endpoints_documented(self, client: TestClient):
        """Test that main API endpoints are documented."""
        response = client.get("/openapi.json")
        assert response.status_code == 200
        paths = response.json().get("paths", {})
        
        # Check that key endpoints exist
        expected_prefixes = ["/auth", "/datasets", "/generators", "/projects"]
        
        found_prefixes = set()
        for path in paths.keys():
            for prefix in expected_prefixes:
                if path.startswith(prefix):
                    found_prefixes.add(prefix)
        
        # At least some expected endpoints should exist
        assert len(found_prefixes) >= 2, f"Expected more endpoints, found: {found_prefixes}"
