"""
Security tests covering OWASP API Top 10 vulnerabilities.
"""

# ============================================================================
# IMPORTS
# ============================================================================

# Standard library
import uuid

# Third-party
import pytest
from fastapi.testclient import TestClient

# Local - Services
from app.auth.services import create_access_token

# Local - Models
from app.datasets.models import Dataset

class TestBOLA:
    """Broken Object Level Authorization (BOLA) tests"""

    @pytest.fixture
    def user_a(self, session):
        from app.auth.repositories import create_user
        from app.auth.schemas import UserCreate
        user_data = UserCreate(email="user_a@example.com", password="Password123!", username="user_a")
        user = create_user(session, user_data)
        session.commit()
        session.refresh(user)
        return user

    @pytest.fixture
    def user_b(self, session):
        from app.auth.repositories import create_user
        from app.auth.schemas import UserCreate
        user_data = UserCreate(email="user_b@example.com", password="Password123!", username="user_b")
        user = create_user(session, user_data)
        session.commit()
        session.refresh(user)
        return user

    def test_bola_dataset_access(self, client, session, user_a, user_b):
        """Test User B accessing User A's dataset"""
        # User A creates dataset
        dataset = Dataset(
            name="User A Dataset",
            original_filename="test.csv",
            file_path="uploads/test.csv",
            row_count=100,
            project_id=uuid.uuid4(),
            checksum="abc123",
            uploader_id=user_a.id
        )
        session.add(dataset)
        session.commit()
        session.refresh(dataset)

        # User B tries to get it
        token_b = create_access_token(data={"sub": user_b.email})
        client.headers.update({"Authorization": f"Bearer {token_b}"})
        
        response = client.get(f"/datasets/{dataset.id}")
        
        # Should be 403 Forbidden or 404 Not Found (if filtered by user)
        # If 200, it means BOLA vulnerability exists
        if response.status_code == 200:
            pytest.fail(f"BOLA Vulnerability: User B can access User A's dataset {dataset.id}")
        
        assert response.status_code in [403, 404]

    def test_bola_dataset_delete(self, client, session, user_a, user_b):
        """Test User B deleting User A's dataset"""
        # User A creates dataset
        dataset = Dataset(
            name="User A Dataset Delete",
            original_filename="test.csv",
            file_path="uploads/test.csv",
            row_count=100,
            project_id=uuid.uuid4(),
            checksum="abc123",
            uploader_id=user_a.id
        )
        session.add(dataset)
        session.commit()
        session.refresh(dataset)

        # User B tries to delete it
        token_b = create_access_token(data={"sub": user_b.email})
        client.headers.update({"Authorization": f"Bearer {token_b}"})
        
        response = client.delete(f"/datasets/{dataset.id}")
        
        if response.status_code == 200:
             pytest.fail("BOLA Vulnerability: User B can delete User A's dataset")
             
        assert response.status_code in [403, 404]


class TestMassAssignment:
    """Mass Assignment tests"""
    
    def test_admin_privilege_escalation(self, client):
        """Test trying to register user with admin role"""
        response = client.post("/auth/register", json={
            "email": "hacker@example.com",
            "password": "Password123!",
            "username": "hacker",
            "role": "admin",
            "is_superuser": True,
            "is_admin": True
        })
        
        if response.status_code == 201:
            data = response.json()
            # Check if role was ignored
            # Assuming the response model might verify this
            # Ideally we check the DB
            assert data.get("role") != "admin", "Mass Assignment: role=admin was accepted"
            assert data.get("is_superuser") is not True, "Mass Assignment: is_superuser=True was accepted"
