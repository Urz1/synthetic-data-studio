"""
Functional tests for Jobs endpoints.

Tests:
- GET /jobs/
- GET /jobs/{id}
- POST /jobs/
"""

import pytest
from fastapi.testclient import TestClient
import uuid

class TestJobsList:
    """Test GET /jobs/"""
    
    def test_list_jobs_empty(self, authenticated_client: TestClient):
        """Test listing jobs when none exist"""
        response = authenticated_client.get("/jobs/")
        
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
    
    def test_list_jobs_unauthorized(self, client: TestClient):
        """Test listing jobs without authentication"""
        response = client.get("/jobs/")
        
        assert response.status_code == 403


class TestJobsCreate:
    """Test POST /jobs/"""
    
    def test_create_job_success(self, authenticated_client: TestClient):
        """Test successful job creation"""
        # Create a project first
        project_data = {"name": "Job Project"}
        project_response = authenticated_client.post("/projects/", json=project_data)
        assert project_response.status_code == 200
        project_id = project_response.json()["id"]
        
        job_data = {
            "project_id": project_id,
            "type": "generation",
            "status": "queued"
        }
        
        response = authenticated_client.post("/jobs/", json=job_data)
        
        assert response.status_code == 200
        data = response.json()
        assert "id" in data
        assert data["project_id"] == project_id
        assert data["type"] == "generation"
        assert "initiated_by" in data

    def test_create_job_no_auth(self, client: TestClient):
        """Test creating job without authentication"""
        job_data = {
            "project_id": str(uuid.uuid4()),
            "type": "generation"
        }
        
        response = client.post("/jobs/", json=job_data)
        
        assert response.status_code == 403


class TestJobsGet:
    """Test GET /jobs/{id}"""
    
    def test_get_job_success(self, authenticated_client: TestClient):
        """Test getting a job by ID"""
        # Create a project first
        project_data = {"name": "Job Project 2"}
        project_response = authenticated_client.post("/projects/", json=project_data)
        project_id = project_response.json()["id"]
        
        # Create a job
        job_data = {
            "project_id": project_id,
            "type": "evaluation"
        }
        create_response = authenticated_client.post("/jobs/", json=job_data)
        job_id = create_response.json()["id"]
        
        # Get the job
        response = authenticated_client.get(f"/jobs/{job_id}")
        
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == job_id
        assert data["type"] == "evaluation"

    def test_get_job_not_found(self, authenticated_client: TestClient):
        """Test getting non-existent job"""
        fake_uuid = str(uuid.uuid4())
        response = authenticated_client.get(f"/jobs/{fake_uuid}")
        
        assert response.status_code == 404

    def test_get_job_no_auth(self, client: TestClient):
        """Test getting job without authentication"""
        fake_uuid = str(uuid.uuid4())
        response = client.get(f"/jobs/{fake_uuid}")
        
        assert response.status_code == 403
