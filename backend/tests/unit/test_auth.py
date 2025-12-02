"""
Unit tests for Authentication module.

Tests cover:
- User registration and login
- Token generation and validation
- Password hashing and verification
- Authentication middleware
- Security edge cases
"""

# ============================================================================
# IMPORTS
# ============================================================================

# Standard library
from datetime import timedelta

# Third-party
import pytest
from fastapi.testclient import TestClient
from sqlmodel import Session

# Local - Module
from app.auth.services import create_access_token, verify_token
from app.auth.repositories import get_user_by_email
from app.auth.models import User

# ============================================================================
# TESTS - REGISTRATION
# ============================================================================

class TestUserRegistration:
    """Tests for user registration."""
    
    def test_register_success(self, client: TestClient):
        """Test successful user registration."""
        user_data = {
            "email": "newuser@example.com",
            "password": "SecurePass123!",
            "username": "newuser"
        }
        response = client.post("/auth/register", json=user_data)
        
        assert response.status_code == 201
        data = response.json()
        assert data["email"] == user_data["email"]
        assert data["username"] == user_data["username"]
        assert "password" not in data  # Password should not be returned
        assert "id" in data
        assert "created_at" in data
    
    def test_register_duplicate_email(self, client: TestClient, test_user: User):
        """Test registration with an already registered email."""
        duplicate_data = {
            "email": test_user.email,
            "password": "AnotherPass123!",
            "username": "duplicate"
        }
        response = client.post("/auth/register", json=duplicate_data)
        
        assert response.status_code == 400
        assert "already registered" in response.json()["detail"].lower()
    
    def test_register_invalid_email_format(self, client: TestClient):
        """Test registration with invalid email format."""
        invalid_data = {
            "email": "not-an-email",
            "password": "ValidPass123!",
            "username": "testuser"
        }
        response = client.post("/auth/register", json=invalid_data)
        assert response.status_code == 422  # Validation error
    
    def test_register_weak_password(self, client: TestClient):
        """Test registration with weak password."""
        weak_password_data = {
            "email": "test@example.com",
            "password": "123",  # Too short
            "username": "testuser"
        }
        response = client.post("/auth/register", json=weak_password_data)
        assert response.status_code == 422  # Validation error
    
    def test_register_missing_required_fields(self, client: TestClient):
        """Test registration with missing required fields."""
        # Missing password
        response = client.post("/auth/register", json={"email": "test@example.com"})
        assert response.status_code == 422
        
        # Missing email
        response = client.post("/auth/register", json={"password": "Pass123!"})
        assert response.status_code == 422
    
    def test_register_empty_email(self, client: TestClient):
        """Test registration with empty email."""
        empty_data = {
            "email": "",
            "password": "ValidPass123!",
            "username": "testuser"
        }
        response = client.post("/auth/register", json=empty_data)
        assert response.status_code == 422


# ============================================================================
# TESTS - LOGIN
# ============================================================================

class TestUserLogin:
    """Tests for user login."""
    
    def test_login_success(self, client: TestClient, test_user: User):
        """Test successful login."""
        login_data = {
            "email": test_user.email,
            "password": "TestPassword123!"  # Password from fixture
        }
        response = client.post("/auth/login", json=login_data)
        
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert data["token_type"] == "bearer"
        assert len(data["access_token"]) > 0
    
    def test_login_wrong_password(self, client: TestClient, test_user: User):
        """Test login with incorrect password."""
        login_data = {
            "email": test_user.email,
            "password": "WrongPassword123!"
        }
        response = client.post("/auth/login", json=login_data)
        
        assert response.status_code == 400
        assert "incorrect" in response.json()["detail"].lower()
    
    def test_login_nonexistent_user(self, client: TestClient):
        """Test login with non-existent email."""
        login_data = {
            "email": "nonexistent@example.com",
            "password": "SomePassword123!"
        }
        response = client.post("/auth/login", json=login_data)
        
        assert response.status_code == 400
        assert "incorrect" in response.json()["detail"].lower()
    
    def test_login_missing_credentials(self, client: TestClient):
        """Test login with missing credentials."""
        # Missing password
        response = client.post("/auth/login", json={"email": "test@example.com"})
        assert response.status_code == 422
        
        # Missing email
        response = client.post("/auth/login", json={"password": "Pass123!"})
        assert response.status_code == 422
    
    def test_login_empty_credentials(self, client: TestClient):
        """Test login with empty credentials."""
        response = client.post("/auth/login", json={"email": "", "password": ""})
        assert response.status_code == 422


# ============================================================================
# TESTS - TOKEN OPERATIONS
# ============================================================================

class TestTokenOperations:
    """Tests for JWT token generation and validation."""
    
    def test_create_access_token(self):
        """Test JWT token creation."""
        data = {"sub": "test@example.com"}
        token = create_access_token(data)
        
        assert token is not None
        assert isinstance(token, str)
        assert len(token) > 0
    
    def test_create_token_with_custom_expiry(self):
        """Test token creation with custom expiration."""
        data = {"sub": "test@example.com"}
        expires_delta = timedelta(minutes=60)
        token = create_access_token(data, expires_delta=expires_delta)
        
        assert token is not None
        assert isinstance(token, str)
    
    def test_verify_valid_token(self):
        """Test verifying a valid token."""
        email = "test@example.com"
        data = {"sub": email}
        token = create_access_token(data)
        
        verified_email = verify_token(token)
        assert verified_email == email
    
    def test_verify_invalid_token(self):
        """Test verifying an invalid token."""
        invalid_token = "invalid.token.string"
        result = verify_token(invalid_token)
        assert result is None
    
    def test_verify_expired_token(self):
        """Test verifying an expired token."""
        data = {"sub": "test@example.com"}
        # Create token with very short expiration
        expires_delta = timedelta(seconds=-1)  # Already expired
        token = create_access_token(data, expires_delta=expires_delta)
        
        result = verify_token(token)
        assert result is None
    
    def test_verify_malformed_token(self):
        """Test verifying malformed tokens."""
        malformed_tokens = [
            "",  # Empty
            "abc",  # Too short
            "a.b",  # Missing part
            "a.b.c.d",  # Too many parts
        ]
        
        for token in malformed_tokens:
            result = verify_token(token)
            assert result is None, f"Failed for token: {token}"


# ============================================================================
# TESTS - AUTHENTICATION MIDDLEWARE
# ============================================================================

class TestAuthenticationMiddleware:
    """Tests for authentication requirements on protected endpoints."""
    
    def test_access_protected_endpoint_with_token(
        self,
        authenticated_client: TestClient
    ):
        """Test accessing protected endpoint with valid token."""
        response = authenticated_client.get("/auth/me")
        assert response.status_code == 200
        data = response.json()
        assert "email" in data
    
    def test_access_protected_endpoint_without_token(self, client: TestClient):
        """Test accessing protected endpoint without token."""
        response = client.get("/auth/me")
        assert response.status_code == 401
    
    def test_access_protected_endpoint_invalid_token(self, client: TestClient):
        """Test accessing protected endpoint with invalid token."""
        headers = {"Authorization": "Bearer invalid_token"}
        response = client.get("/auth/me", headers=headers)
        assert response.status_code == 401
    
    def test_access_protected_endpoint_malformed_header(self, client: TestClient):
        """Test accessing protected endpoint with malformed auth header."""
        # Missing "Bearer" prefix
        headers = {"Authorization": "some_token"}
        response = client.get("/auth/me", headers=headers)
        assert response.status_code == 401


# ============================================================================
# TESTS - USER PROFILE
# ============================================================================

class TestUserProfile:
    """Tests for user profile endpoints."""
    
    def test_get_current_user_info(
        self,
        authenticated_client: TestClient,
        test_user: User
    ):
        """Test retrieving current user information."""
        response = authenticated_client.get("/auth/me")
        
        assert response.status_code == 200
        data = response.json()
        assert data["email"] == test_user.email
        assert data["id"] == str(test_user.id)
        assert "password" not in data


# ============================================================================
# TESTS - PASSWORD SECURITY
# ============================================================================

class TestPasswordSecurity:
    """Tests for password hashing and security."""
    
    def test_password_is_hashed(self, session: Session, client: TestClient):
        """Test that passwords are hashed before storage."""
        plain_password = "TestPassword123!"
        user_data = {
            "email": "hashtest@example.com",
            "password": plain_password,
            "username": "hashtest"
        }
        
        response = client.post("/auth/register", json=user_data)
        assert response.status_code == 201
        
        # Retrieve user from database
        db_user = get_user_by_email(session, user_data["email"])
        assert db_user is not None
        
        # Verify password is hashed (not stored in plain text)
        assert db_user.hashed_password != plain_password
        assert len(db_user.hashed_password) > len(plain_password)
    
    def test_same_password_different_hashes(self, client: TestClient, session: Session):
        """Test that same password generates different hashes (salt verification)."""
        password = "SamePassword123!"
        
        # Create first user
        user1_data = {
            "email": "user1@example.com",
            "password": password,
            "username": "user1"
        }
        client.post("/auth/register", json=user1_data)
        
        # Create second user with same password
        user2_data = {
            "email": "user2@example.com",
            "password": password,
            "username": "user2"
        }
        client.post("/auth/register", json=user2_data)
        
        # Retrieve both users
        user1 = get_user_by_email(session, user1_data["email"])
        user2 = get_user_by_email(session, user2_data["email"])
        
        # Hashes should be different (due to salt)
        assert user1.hashed_password != user2.hashed_password


# ============================================================================
# TESTS - EDGE CASES
# ============================================================================

class TestAuthEdgeCases:
    """Tests for edge cases and boundary conditions."""
    
    def test_register_email_case_insensitive(
        self,
        client: TestClient,
        test_user: User
    ):
        """Test that email comparison is case-insensitive."""
        # Try to register with same email but different case
        uppercase_email = test_user.email.upper()
        user_data = {
            "email": uppercase_email,
            "password": "NewPassword123!",
            "username": "newuser"
        }
        response = client.post("/auth/register", json=user_data)
        
        # Should fail because email already exists
        assert response.status_code == 400
    
    def test_login_email_case_insensitive(
        self,
        client: TestClient,
        test_user: User
    ):
        """Test that login works regardless of email case."""
        uppercase_email = test_user.email.upper()
        login_data = {
            "email": uppercase_email,
            "password": "TestPassword123!"
        }
        response = client.post("/auth/login", json=login_data)
        
        # Should succeed
        assert response.status_code == 200
        assert "access_token" in response.json()
    
    def test_multiple_login_attempts(self, client: TestClient, test_user: User):
        """Test multiple successful login attempts."""
        login_data = {
            "email": test_user.email,
            "password": "TestPassword123!"
        }
        
        tokens = []
        for _ in range(3):
            response = client.post("/auth/login", json=login_data)
            assert response.status_code == 200
            tokens.append(response.json()["access_token"])
        
        # All tokens should be valid but different
        assert len(set(tokens)) == len(tokens)  # All unique
    
    def test_health_check_endpoint(self, client: TestClient):
        """Test the auth module health check endpoint."""
        response = client.get("/auth/ping")
        assert response.status_code == 200
        assert response.json()["msg"] == "auth ok"
