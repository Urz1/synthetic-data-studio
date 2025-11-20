"""Pytest fixtures used across integration tests."""

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.main import app
from app.core.dependencies import get_db
from app.database.database import Base


# Create test database engine (in-memory SQLite)
TEST_DATABASE_URL = "sqlite:///:memory:"
engine = create_engine(
    TEST_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture(scope="function")
def db_session():
    """Create a fresh database session for each test."""
    Base.metadata.create_all(bind=engine)
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close()
        Base.metadata.drop_all(bind=engine)


@pytest.fixture(scope="function")
def client(db_session):
    """Create a test client with database dependency override."""
    def override_get_db():
        try:
            yield db_session
        finally:
            pass
    
    app.dependency_overrides[get_db] = override_get_db
    
    with TestClient(app) as test_client:
        yield test_client
    
    app.dependency_overrides.clear()


@pytest.fixture
def authenticated_client(client, db_session):
    """Create an authenticated test client with a test user."""
    from app.auth.crud import create_user
    from app.auth.models import UserCreate
    
    # Create test user
    test_user = UserCreate(
        username="testuser",
        email="test@example.com",
        password="testpassword123"
    )
    create_user(db_session, test_user)
    
    # Login and get token
    response = client.post(
        "/auth/token",
        data={"username": "testuser", "password": "testpassword123"}
    )
    token = response.json()["access_token"]
    
    # Add auth header to client
    client.headers["Authorization"] = f"Bearer {token}"
    
    return client
