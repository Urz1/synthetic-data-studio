"""
Functional tests for Authentication endpoints.

Tests:
- POST /auth/register
- POST /auth/login
- GET /auth/me
"""

import pytest
from fastapi.testclient import TestClient


class TestAuthRegister:
    """Test POST /auth/register"""
    
    def test_register_success(self, client: TestClient):
        """Test successful user registration"""
        user_data = {
            "email": "test@example.com",
            "password": "TestPassword123!"
        }
        
        response = client.post("/auth/register", json=user_data)
        
        assert response.status_code == 201
        data = response.json()
        assert "id" in data
        assert data["email"] == user_data["email"]
        assert "password" not in data  # Password should not be exposed
        assert "hashed_password" not in data
    
    def test_register_duplicate_email(self, client: TestClient):
        """Test registration with duplicate email"""
        user_data = {
            "email": "duplicate@example.com",
            "password": "TestPassword123!"
        }
        
        # First registration
        client.post("/auth/register", json=user_data)
        
        # Second registration with same email
        response = client.post("/auth/register", json=user_data)
        
        assert response.status_code == 400
        assert "already registered" in response.json()["detail"].lower()
    
    def test_register_invalid_email(self, client: TestClient):
        """Test registration with invalid email"""
        response = client.post("/auth/register", json={
            "email": "invalid-email",
            "password": "TestPass123!"
        })
        
        assert response.status_code == 422  # Validation error
    
    def test_register_weak_password(self, client: TestClient):
        """Test registration with weak password"""
        response = client.post("/auth/register", json={
            "email": "weak@example.com",
            "password": "123"  # Too short
        })
        
        assert response.status_code == 422  # Validation error
    
    def test_register_missing_fields(self, client: TestClient):
        """Test registration with missing required fields"""
        response = client.post("/auth/register", json={
            "email": "test@example.com"
            # Missing password
        })
        
        assert response.status_code == 422


class TestAuthLogin:
    """Test POST /auth/login"""
    
    def test_login_success(self, client: TestClient):
        """Test successful login"""
        # Register user first
        user_data = {
            "email": "login@example.com",
            "password": "TestPassword123!"
        }
        client.post("/auth/register", json=user_data)
        
        # Login
        response = client.post("/auth/login", json={
            "email": user_data["email"],
            "password": user_data["password"]
        })
        
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert data["token_type"] == "bearer"
        assert len(data["access_token"]) > 0
    
    def test_login_wrong_password(self, client: TestClient):
        """Test login with incorrect password"""
        # Register user first
        user_data = {
            "email": "wrongpass@example.com",
            "password": "CorrectPassword123!"
        }
        client.post("/auth/register", json=user_data)
        
        # Try login with wrong password
        response = client.post("/auth/login", json={
            "email": user_data["email"],
            "password": "WrongPassword123!"
        })
        
        assert response.status_code == 400
        assert "incorrect" in response.json()["detail"].lower()
    
    def test_login_nonexistent_user(self, client: TestClient):
        """Test login with non-existent user"""
        response = client.post("/auth/login", json={
            "email": "nonexistent@example.com",
            "password": "TestPass123!"
        })
        
        assert response.status_code == 400
    
    def test_login_missing_credentials(self, client: TestClient):
        """Test login with missing credentials"""
        response = client.post("/auth/login", json={
            "email": "test@example.com"
            # Missing password
        })
        
        assert response.status_code == 422


class TestAuthMe:
    """Test GET /auth/me"""
    
    def test_get_current_user_success(self, client: TestClient):
        """Test getting current user with valid token"""
        # Register and login
        user_data = {
            "email": "currentuser@example.com",
            "password": "TestPassword123!"
        }
        client.post("/auth/register", json=user_data)
        login_response = client.post("/auth/login", json=user_data)
        token = login_response.json()["access_token"]
        
        # Get current user
        response = client.get("/auth/me", headers={
            "Authorization": f"Bearer {token}"
        })
        
        assert response.status_code == 200
        data = response.json()
        assert data["email"] == user_data["email"]
        assert "password" not in data
        assert "hashed_password" not in data
    
    def test_get_current_user_no_auth(self, client: TestClient):
        """Test getting current user without authentication"""
        response = client.get("/auth/me")
        
        assert response.status_code == 403  # No credentials provided
    
    def test_get_current_user_invalid_token(self, client: TestClient):
        """Test getting current user with invalid token"""
        response = client.get("/auth/me", headers={
            "Authorization": "Bearer invalid_token_here"
        })
        
        assert response.status_code == 401
