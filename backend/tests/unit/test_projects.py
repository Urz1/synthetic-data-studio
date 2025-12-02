"""
Unit tests for Projects module.

Tests cover:
- CRUD operations (Create, Read, Update, Delete)
- Authentication and authorization
- Input validation
- Error handling
- Edge cases
"""

# ============================================================================
# IMPORTS
# ============================================================================

# Standard library
import uuid
from typing import Dict

# Third-party
import pytest
from fastapi.testclient import TestClient
from sqlmodel import Session

# Local - Module
from app.projects.models import Project
from app.projects.schemas import ProjectCreate
from app.projects.repositories import create_project, get_project_by_id

# ============================================================================
# FIXTURES
# ============================================================================

@pytest.fixture
def sample_project_data() -> Dict:
    """Sample project data for testing."""
    return {
        "name": "Test Project",
        "description": "A test project for unit testing",
        "default_retention_days": 30
    }


@pytest.fixture
def created_project(session: Session, test_user, sample_project_data: Dict) -> Project:
    """Create a project in the database for testing."""
    project = Project(**sample_project_data, owner_id=test_user.id)
    return create_project(session, project)


# ============================================================================
# TESTS - CREATE PROJECT
# ============================================================================

class TestCreateProject:
    """Tests for creating projects."""
    
    def test_create_project_success(
        self,
        authenticated_client: TestClient,
        sample_project_data: Dict
    ):
        """Test successful project creation."""
        response = authenticated_client.post("/projects/", json=sample_project_data)
        
        assert response.status_code == 201
        data = response.json()
        assert data["name"] == sample_project_data["name"]
        assert data["description"] == sample_project_data["description"]
        assert data["default_retention_days"] == sample_project_data["default_retention_days"]
        assert "id" in data
        assert "owner_id" in data
        assert "created_at" in data
        assert "updated_at" in data
    
    def test_create_project_minimal_data(self, authenticated_client: TestClient):
        """Test creating project with minimal required data."""
        minimal_data = {"name": "Minimal Project"}
        response = authenticated_client.post("/projects/", json=minimal_data)
        
        assert response.status_code == 201
        data = response.json()
        assert data["name"] == "Minimal Project"
        assert data["description"] is None
        assert data["default_retention_days"] == 30  # Default value
    
    def test_create_project_unauthenticated(
        self,
        client: TestClient,
        sample_project_data: Dict
    ):
        """Test that unauthenticated requests are rejected."""
        response = client.post("/projects/", json=sample_project_data)
        assert response.status_code == 401
    
    def test_create_project_invalid_name_empty(self, authenticated_client: TestClient):
        """Test validation for empty project name."""
        invalid_data = {"name": ""}
        response = authenticated_client.post("/projects/", json=invalid_data)
        assert response.status_code == 422  # Validation error
    
    def test_create_project_invalid_retention_days(
        self,
        authenticated_client: TestClient
    ):
        """Test validation for invalid retention days."""
        # Test value too low
        invalid_data = {"name": "Test", "default_retention_days": 0}
        response = authenticated_client.post("/projects/", json=invalid_data)
        assert response.status_code == 422
        
        # Test value too high
        invalid_data = {"name": "Test", "default_retention_days": 400}
        response = authenticated_client.post("/projects/", json=invalid_data)
        assert response.status_code == 422


# ============================================================================
# TESTS - LIST PROJECTS
# ============================================================================

class TestListProjects:
    """Tests for listing projects."""
    
    def test_list_projects_empty(self, authenticated_client: TestClient):
        """Test listing projects when none exist."""
        response = authenticated_client.get("/projects/")
        assert response.status_code == 200
        assert response.json() == []
    
    def test_list_projects_with_data(
        self,
        authenticated_client: TestClient,
        created_project: Project
    ):
        """Test listing projects with existing data."""
        response = authenticated_client.get("/projects/")
        assert response.status_code == 200
        
        data = response.json()
        assert len(data) >= 1
        assert any(p["id"] == str(created_project.id) for p in data)
    
    def test_list_projects_unauthenticated(self, client: TestClient):
        """Test that unauthenticated requests are rejected."""
        response = client.get("/projects/")
        assert response.status_code == 401


# ============================================================================
# TESTS - GET PROJECT BY ID
# ============================================================================

class TestGetProject:
    """Tests for retrieving a single project."""
    
    def test_get_project_success(
        self,
        authenticated_client: TestClient,
        created_project: Project
    ):
        """Test successfully retrieving a project by ID."""
        response = authenticated_client.get(f"/projects/{created_project.id}")
        assert response.status_code == 200
        
        data = response.json()
        assert data["id"] == str(created_project.id)
        assert data["name"] == created_project.name
        assert data["description"] == created_project.description
    
    def test_get_project_not_found(self, authenticated_client: TestClient):
        """Test retrieving a non-existent project."""
        fake_id = uuid.uuid4()
        response = authenticated_client.get(f"/projects/{fake_id}")
        assert response.status_code == 404
        assert "not found" in response.json()["detail"].lower()
    
    def test_get_project_invalid_uuid(self, authenticated_client: TestClient):
        """Test retrieving project with invalid UUID format."""
        response = authenticated_client.get("/projects/not-a-uuid")
        assert response.status_code == 422  # Validation error
    
    def test_get_project_unauthenticated(
        self,
        client: TestClient,
        created_project: Project
    ):
        """Test that unauthenticated requests are rejected."""
        response = client.get(f"/projects/{created_project.id}")
        assert response.status_code == 401


# ============================================================================
# TESTS - UPDATE PROJECT
# ============================================================================

class TestUpdateProject:
    """Tests for updating projects."""
    
    def test_update_project_success(
        self,
        authenticated_client: TestClient,
        created_project: Project
    ):
        """Test successfully updating a project."""
        update_data = {
            "name": "Updated Project Name",
            "description": "Updated description",
            "default_retention_days": 60
        }
        response = authenticated_client.put(
            f"/projects/{created_project.id}",
            json=update_data
        )
        assert response.status_code == 200
        
        data = response.json()
        assert data["id"] == str(created_project.id)
        assert data["name"] == update_data["name"]
        assert data["description"] == update_data["description"]
        assert data["default_retention_days"] == update_data["default_retention_days"]
    
    def test_update_project_partial(
        self,
        authenticated_client: TestClient,
        created_project: Project
    ):
        """Test partial update (only updating some fields)."""
        original_description = created_project.description
        update_data = {"name": "New Name Only"}
        
        response = authenticated_client.put(
            f"/projects/{created_project.id}",
            json=update_data
        )
        assert response.status_code == 200
        
        data = response.json()
        assert data["name"] == "New Name Only"
        # Description should remain unchanged
        assert data["description"] == original_description
    
    def test_update_project_not_found(self, authenticated_client: TestClient):
        """Test updating a non-existent project."""
        fake_id = uuid.uuid4()
        update_data = {"name": "Updated"}
        response = authenticated_client.put(f"/projects/{fake_id}", json=update_data)
        assert response.status_code == 404
    
    def test_update_project_unauthenticated(
        self,
        client: TestClient,
        created_project: Project
    ):
        """Test that unauthenticated requests are rejected."""
        update_data = {"name": "Unauthorized Update"}
        response = client.put(f"/projects/{created_project.id}", json=update_data)
        assert response.status_code == 401
    
    def test_update_project_unauthorized_user(
        self,
        authenticated_client: TestClient,
        session: Session,
        sample_project_data: Dict
    ):
        """Test that users cannot update other users' projects."""
        # Create a project owned by a different user
        other_user_id = uuid.uuid4()
        other_project = Project(**sample_project_data, owner_id=other_user_id)
        other_project = create_project(session, other_project)
        
        update_data = {"name": "Hacked"}
        response = authenticated_client.put(
            f"/projects/{other_project.id}",
            json=update_data
        )
        assert response.status_code == 403  # Forbidden
        assert "not authorized" in response.json()["detail"].lower()
    
    def test_update_project_invalid_data(
        self,
        authenticated_client: TestClient,
        created_project: Project
    ):
        """Test updating with invalid data."""
        invalid_data = {"default_retention_days": 500}  # Exceeds maximum
        response = authenticated_client.put(
            f"/projects/{created_project.id}",
            json=invalid_data
        )
        assert response.status_code == 422


# ============================================================================
# TESTS - DELETE PROJECT
# ============================================================================

class TestDeleteProject:
    """Tests for deleting projects."""
    
    def test_delete_project_success(
        self,
        authenticated_client: TestClient,
        created_project: Project,
        session: Session
    ):
        """Test successfully deleting a project."""
        project_id = created_project.id
        response = authenticated_client.delete(f"/projects/{project_id}")
        assert response.status_code == 204
        
        # Verify project is deleted
        deleted_project = get_project_by_id(session, project_id)
        assert deleted_project is None
    
    def test_delete_project_not_found(self, authenticated_client: TestClient):
        """Test deleting a non-existent project."""
        fake_id = uuid.uuid4()
        response = authenticated_client.delete(f"/projects/{fake_id}")
        assert response.status_code == 404
    
    def test_delete_project_unauthenticated(
        self,
        client: TestClient,
        created_project: Project
    ):
        """Test that unauthenticated requests are rejected."""
        response = client.delete(f"/projects/{created_project.id}")
        assert response.status_code == 401
    
    def test_delete_project_unauthorized_user(
        self,
        authenticated_client: TestClient,
        session: Session,
        sample_project_data: Dict
    ):
        """Test that users cannot delete other users' projects."""
        # Create a project owned by a different user
        other_user_id = uuid.uuid4()
        other_project = Project(**sample_project_data, owner_id=other_user_id)
        other_project = create_project(session, other_project)
        
        response = authenticated_client.delete(f"/projects/{other_project.id}")
        assert response.status_code == 403  # Forbidden
        assert "not authorized" in response.json()["detail"].lower()
        
        # Verify project still exists
        project_still_exists = get_project_by_id(session, other_project.id)
        assert project_still_exists is not None


# ============================================================================
# TESTS - EDGE CASES
# ============================================================================

class TestProjectEdgeCases:
    """Tests for edge cases and boundary conditions."""
    
    def test_project_name_max_length(self, authenticated_client: TestClient):
        """Test project name at maximum allowed length."""
        long_name = "A" * 100  # Max length is 100
        data = {"name": long_name}
        response = authenticated_client.post("/projects/", json=data)
        assert response.status_code == 201
        assert response.json()["name"] == long_name
    
    def test_project_name_exceeds_max_length(self, authenticated_client: TestClient):
        """Test project name exceeding maximum length."""
        too_long_name = "A" * 101
        data = {"name": too_long_name}
        response = authenticated_client.post("/projects/", json=data)
        assert response.status_code == 422
    
    def test_project_retention_days_boundaries(
        self,
        authenticated_client: TestClient
    ):
        """Test retention days at boundary values."""
        # Minimum allowed (1 day)
        response = authenticated_client.post(
            "/projects/",
            json={"name": "Min Retention", "default_retention_days": 1}
        )
        assert response.status_code == 201
        
        # Maximum allowed (365 days)
        response = authenticated_client.post(
            "/projects/",
            json={"name": "Max Retention", "default_retention_days": 365}
        )
        assert response.status_code == 201
    
    def test_project_special_characters_in_name(
        self,
        authenticated_client: TestClient
    ):
        """Test project names with special characters."""
        special_names = [
            "Project #1",
            "Project @ Test",
            "Project-2024",
            "Project_Test",
            "Project (v2)",
        ]
        
        for name in special_names:
            response = authenticated_client.post(
                "/projects/",
                json={"name": name}
            )
            assert response.status_code == 201, f"Failed for name: {name}"
            assert response.json()["name"] == name
