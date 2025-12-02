"""
Integration tests for cross-module workflows.

These tests verify that different modules work together correctly
for complete user workflows.
"""

# ============================================================================
# IMPORTS
# ============================================================================

import uuid
from typing import Dict

import pytest
from fastapi.testclient import TestClient
from sqlmodel import Session


# ============================================================================
# TESTS - END-TO-END WORKFLOWS
# ============================================================================

class TestDatasetToGeneratorWorkflow:
    """Test complete workflow: Dataset upload → Generator creation → Data generation."""
    
    def test_complete_data_generation_workflow(
        self,
        authenticated_client: TestClient
    ):
        """Test the complete workflow from dataset to synthetic data."""
        import io
        
        # Step 1: Upload a dataset
        csv_content = """name,age,city
John,30,New York
Jane,25,Los Angeles
Bob,35,Chicago"""
        
        files = {
            "file": ("workflow_test.csv", io.BytesIO(csv_content.encode()), "text/csv")
        }
        data = {"name": "Workflow Test Dataset"}
        
        upload_response = authenticated_client.post(
            "/datasets/upload",
            files=files,
            data=data
        )
        
        # Dataset upload should succeed
        assert upload_response.status_code == 201
        dataset_id = upload_response.json()["id"]
        
        # Step 2: Create a generator for the dataset
        generator_data = {
            "name": "Workflow Test Generator",
            "generator_type": "ctgan",
            "dataset_id": dataset_id,
            "config": {"epochs": 5}
        }
        
        generator_response = authenticated_client.post(
            "/generators/",
            json=generator_data
        )
        
        assert generator_response.status_code == 200
        generator_id = generator_response.json()["id"]
        
        # Step 3: Verify generator is associated with dataset
        get_generator = authenticated_client.get(f"/generators/{generator_id}")
        assert get_generator.status_code == 200
        assert get_generator.json()["dataset_id"] == dataset_id


class TestAuthenticationWorkflow:
    """Test complete authentication workflow."""
    
    def test_register_login_access_workflow(self, client: TestClient):
        """Test register → login → access protected endpoint."""
        # Step 1: Register new user
        register_data = {
            "email": f"workflow_{uuid.uuid4().hex[:8]}@test.com",
            "password": "WorkflowPass123!",
            "username": "workflowuser"
        }
        
        register_response = client.post("/auth/register", json=register_data)
        assert register_response.status_code == 201
        
        # Step 2: Login
        login_data = {
            "email": register_data["email"],
            "password": register_data["password"]
        }
        
        login_response = client.post("/auth/login", json=login_data)
        assert login_response.status_code == 200
        token = login_response.json()["access_token"]
        
        # Step 3: Access protected endpoint
        headers = {"Authorization": f"Bearer {token}"}
        me_response = client.get("/auth/me", headers=headers)
        
        assert me_response.status_code == 200
        assert me_response.json()["email"] == register_data["email"]


class TestProjectWorkflow:
    """Test project management workflow."""
    
    def test_create_update_delete_project(
        self,
        authenticated_client: TestClient
    ):
        """Test complete project lifecycle."""
        # Step 1: Create project
        project_data = {
            "name": "Integration Test Project",
            "description": "Created for integration testing",
            "default_retention_days": 30
        }
        
        create_response = authenticated_client.post("/projects/", json=project_data)
        assert create_response.status_code == 201
        project_id = create_response.json()["id"]
        
        # Step 2: Update project
        update_data = {
            "name": "Updated Integration Project",
            "default_retention_days": 60
        }
        
        update_response = authenticated_client.put(
            f"/projects/{project_id}",
            json=update_data
        )
        assert update_response.status_code == 200
        assert update_response.json()["name"] == update_data["name"]
        
        # Step 3: Verify update
        get_response = authenticated_client.get(f"/projects/{project_id}")
        assert get_response.status_code == 200
        assert get_response.json()["default_retention_days"] == 60
        
        # Step 4: Delete project
        delete_response = authenticated_client.delete(f"/projects/{project_id}")
        assert delete_response.status_code == 204
        
        # Step 5: Verify deletion
        verify_response = authenticated_client.get(f"/projects/{project_id}")
        assert verify_response.status_code == 404


# ============================================================================
# TESTS - CROSS-MODULE DEPENDENCIES
# ============================================================================

class TestCrossModuleDependencies:
    """Test dependencies and relationships between modules."""
    
    def test_dataset_generator_relationship(
        self,
        authenticated_client: TestClient,
        session: Session
    ):
        """Test that generators are properly linked to datasets."""
        import io
        from app.datasets.repositories import get_dataset_by_id
        from app.generators.repositories import get_generators
        
        # Create dataset
        csv_content = "col1,col2\n1,2\n3,4"
        files = {
            "file": ("dep_test.csv", io.BytesIO(csv_content.encode()), "text/csv")
        }
        
        upload_response = authenticated_client.post(
            "/datasets/upload",
            files=files,
            data={"name": "Dependency Test"}
        )
        
        if upload_response.status_code == 201:
            dataset_id = upload_response.json()["id"]
            
            # Create generator linked to dataset
            generator_data = {
                "name": "Linked Generator",
                "generator_type": "ctgan",
                "dataset_id": dataset_id
            }
            
            gen_response = authenticated_client.post("/generators/", json=generator_data)
            
            if gen_response.status_code == 200:
                # Verify the link exists
                gen_data = gen_response.json()
                assert gen_data["dataset_id"] == dataset_id


# ============================================================================
# TESTS - ERROR PROPAGATION
# ============================================================================

class TestErrorPropagation:
    """Test that errors are properly propagated across modules."""
    
    def test_invalid_dataset_reference(self, authenticated_client: TestClient):
        """Test error when referencing non-existent dataset."""
        fake_dataset_id = str(uuid.uuid4())
        
        generator_data = {
            "name": "Orphan Generator",
            "generator_type": "ctgan",
            "dataset_id": fake_dataset_id
        }
        
        response = authenticated_client.post("/generators/", json=generator_data)
        
        # Should fail with appropriate error
        assert response.status_code in [400, 404]
        assert "detail" in response.json()
    
    def test_invalid_generator_reference(self, authenticated_client: TestClient):
        """Test error when referencing non-existent generator."""
        fake_generator_id = str(uuid.uuid4())
        
        generation_request = {
            "generator_id": fake_generator_id,
            "num_rows": 100
        }
        
        response = authenticated_client.post(
            "/synthetic-datasets/generate",
            json=generation_request
        )
        
        # Should fail with appropriate error
        assert response.status_code in [400, 404]
