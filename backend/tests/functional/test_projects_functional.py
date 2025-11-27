"""
Functional tests for Project endpoints.

Tests:
- GET /projects/
- POST /projects/
"""

import pytest
from fastapi.testclient import TestClient


class TestProjectsList:
    """Test GET /projects/"""
    
    def test_list_projects_empty(self, authenticated_client: TestClient):
        """Test listing projects when none exist"""
        response = authenticated_client.get("/projects/")
        
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
    
    def test_list_projects_unauthorized(self, client: TestClient):
        """Test listing projects without authentication"""
        response = client.get("/projects/")
        
        assert response.status_code == 403


class TestProjectsCreate:
    """Test POST /projects/"""
    
    def test_create_project_success(self, authenticated_client: TestClient):
        """Test successful project creation"""
        project_data = {
            "name": "Test Project",
            "description": "A test project description",
            "default_retention_days": 60
        }
        
        response = authenticated_client.post("/projects/", json=project_data)
        
        assert response.status_code == 200
        data = response.json()
        assert "id" in data
        assert data["name"] == "Test Project"
        assert data["description"] == "A test project description"
        assert data["default_retention_days"] == 60
        assert "owner_id" in data
    
    def test_create_project_minimal(self, authenticated_client: TestClient):
        """Test creating project with minimal required fields"""
        project_data = {
            "name": "Minimal Project"
        }
        
        response = authenticated_client.post("/projects/", json=project_data)
        
        assert response.status_code == 200
        data = response.json()
        assert data["name"] == "Minimal Project"
        assert data["default_retention_days"] == 30  # Default value
    
    def test_create_project_no_auth(self, client: TestClient):
        """Test creating project without authentication"""
        project_data = {
            "name": "Test Project"
        }
        
        response = client.post("/projects/", json=project_data)
        
        assert response.status_code == 403
