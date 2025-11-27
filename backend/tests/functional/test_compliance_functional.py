"""
Functional tests for Compliance endpoints.

Tests:
- GET /compliance/
- POST /compliance/
"""

import pytest
from fastapi.testclient import TestClient
import uuid

class TestComplianceList:
    """Test GET /compliance/"""
    
    def test_list_reports_empty(self, authenticated_client: TestClient):
        """Test listing reports when none exist"""
        response = authenticated_client.get("/compliance/")
        
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
    
    def test_list_reports_unauthorized(self, client: TestClient):
        """Test listing reports without authentication"""
        response = client.get("/compliance/")
        
        assert response.status_code == 403


class TestComplianceCreate:
    """Test POST /compliance/"""
    
    def test_create_report_success(self, authenticated_client: TestClient):
        """Test successful report creation"""
        # Create a project first
        project_data = {"name": "Compliance Project"}
        project_response = authenticated_client.post("/projects/", json=project_data)
        assert project_response.status_code == 200
        project_id = project_response.json()["id"]
        
        # Create a dataset (we need to mock the file upload or just create the record if possible)
        # Since dataset creation via API involves file upload, it's complex.
        # But we can use the factory to create it in the DB directly if we had access to the session.
        # However, functional tests should use the API.
        # Let's try to upload a dataset.
        
        csv_content = "name,age\nAlice,30\nBob,25"
        files = {"file": ("test.csv", csv_content, "text/csv")}
        dataset_response = authenticated_client.post(
            "/datasets/upload",
            files=files,
            data={"project_id": project_id}
        )
        assert dataset_response.status_code == 200
        dataset_id = dataset_response.json()["id"]
        
        # Now create compliance report
        report_data = {
            "project_id": project_id,
            "synthetic_dataset_id": dataset_id
        }
        
        response = authenticated_client.post("/compliance/", json=report_data)
        
        assert response.status_code == 200
        data = response.json()
        assert "id" in data
        assert data["project_id"] == project_id

    def test_create_report_no_auth(self, client: TestClient):
        """Test creating report without authentication"""
        report_data = {
            "project_id": str(uuid.uuid4()),
            "synthetic_dataset_id": str(uuid.uuid4())
        }
        
        response = client.post("/compliance/", json=report_data)
        
        assert response.status_code == 403
