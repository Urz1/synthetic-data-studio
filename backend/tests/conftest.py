"""
Shared test fixtures and configuration for all tests.

Provides:
- Test database setup/teardown
- Test client with authentication
- Test data factories
- Common utilities
"""

# ============================================================================
# IMPORTS
# ============================================================================

# Standard library
import os
from collections.abc import Generator as GeneratorType  # Avoid conflict with Generator model
from typing import Dict

# Third-party
import pytest
from fastapi.testclient import TestClient
from sqlmodel import Session, create_engine, SQLModel
from sqlmodel.pool import StaticPool

# Local - Core
from app.core.dependencies import get_db
from app.main import app

# Local - Services
# No backend token issuance post-migration; tests use proxy headers instead

# Local - Models
from app.auth.models import User

# Test database URL (in-memory SQLite)
TEST_DATABASE_URL = "sqlite:///:memory:"


@pytest.fixture(name="engine")
def engine_fixture():
    """Create test database engine"""
    engine = create_engine(
        TEST_DATABASE_URL,
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    SQLModel.metadata.create_all(engine)
    yield engine
    SQLModel.metadata.drop_all(engine)


@pytest.fixture(name="session")
def session_fixture(engine) -> GeneratorType[Session, None, None]:
    """Create test database session"""
    with Session(engine) as session:
        yield session


@pytest.fixture(name="client")
def client_fixture(session: Session) -> GeneratorType[TestClient, None, None]:
    """Create test client with database session override"""
    def get_session_override():
        return session

    app.dependency_overrides[get_db] = get_session_override
    client = TestClient(app)
    yield client
    app.dependency_overrides.clear()


@pytest.fixture(name="test_user")
def test_user_fixture(session: Session) -> User:
    """Create a test user"""
    # Create a basic user directly (Better Auth is upstream; local DB mirrors user)
    user = User(
        email="test@example.com",
        name="testuser",
        is_email_verified=True,
        hashed_password=None,
    )
    session.add(user)
    session.commit()
    session.refresh(user)
    return user


@pytest.fixture(name="auth_headers")
def auth_headers_fixture(test_user: User) -> Dict[str, str]:
    """Create proxy authentication headers expected by backend"""
    proxy_secret = os.getenv("PROXY_SECRET", "internal-proxy")
    return {
        "X-Proxy-Secret": proxy_secret,
        "X-User-Id": str(test_user.id),
        "X-User-Email": test_user.email,
        "X-User-Name": test_user.name or "",
    }


@pytest.fixture(name="authenticated_client")
def authenticated_client_fixture(client: TestClient, auth_headers: Dict[str, str]) -> TestClient:
    """Create authenticated test client"""
    client.headers.update(auth_headers)
    return client


# Test Data Factories

class TestDataFactory:
    """Factory for creating test data"""
    
    @staticmethod
    def create_user_data(email: str = None, password: str = "TestPass123!") -> Dict:
        """Create user registration data"""
        import uuid
        email = email or f"user_{uuid.uuid4().hex[:8]}@example.com"
        return {
            "email": email,
            "password": password
        }
    
    @staticmethod
    def create_dataset_csv() -> str:
        """Create sample CSV data"""
        return """name,age,city,salary
John Doe,30,New York,75000
Jane Smith,25,Los Angeles,65000
Bob Johnson,35,Chicago,80000
Alice Williams,28,Houston,70000
Charlie Brown,32,Phoenix,72000"""
    
    @staticmethod
    def create_dataset_json() -> str:
        """Create sample JSON data"""
        import json
        data = [
            {"name": "John Doe", "age": 30, "city": "New York", "salary": 75000},
            {"name": "Jane Smith", "age": 25, "city": "Los Angeles", "salary": 65000},
            {"name": "Bob Johnson", "age": 35, "city": "Chicago", "salary": 80000},
        ]
        return json.dumps(data)
    
    @staticmethod
    def create_generator_config(generator_type: str = "ctgan") -> Dict:
        """Create generator configuration"""
        configs = {
            "ctgan": {"epochs": 10, "batch_size": 500},
            "tvae": {"epochs": 10, "batch_size": 500},
            "dp-ctgan": {"epochs": 10, "batch_size": 500, "epsilon": 10.0, "delta": 1e-5},
            "dp-tvae": {"epochs": 10, "batch_size": 500, "epsilon": 10.0, "delta": 1e-5},
        }
        return configs.get(generator_type, configs["ctgan"])


@pytest.fixture(name="factory")
def factory_fixture() -> TestDataFactory:
    """Provide test data factory"""
    return TestDataFactory()


# Utility Functions

def assert_valid_uuid(value: str) -> None:
    """Assert that value is a valid UUID"""
    import uuid
    try:
        uuid.UUID(value)
    except (ValueError, AttributeError):
        pytest.fail(f"'{value}' is not a valid UUID")


def assert_response_schema(response_data: Dict, required_fields: list) -> None:
    """Assert response contains required fields"""
    for field in required_fields:
        assert field in response_data, f"Missing required field: {field}"


def assert_error_response(response, status_code: int, detail_contains: str = None) -> None:
    """Assert error response format"""
    assert response.status_code == status_code
    data = response.json()
    assert "detail" in data
    if detail_contains:
        assert detail_contains.lower() in str(data["detail"]).lower()


# Pytest hooks

def pytest_configure(_config):
    """Configure pytest"""
    # Set environment variables for testing
    os.environ["TESTING"] = "1"
    os.environ["DATABASE_URL"] = TEST_DATABASE_URL
    # Ensure proxy secret set for tests
    os.environ["PROXY_SECRET"] = os.environ.get("PROXY_SECRET", "internal-proxy")


def pytest_collection_modifyitems(_config, items):
    """Modify test collection"""
    # Add markers based on test path
    for item in items:
        if "functional" in str(item.fspath):
            item.add_marker(pytest.mark.functional)
        elif "negative" in str(item.fspath):
            item.add_marker(pytest.mark.negative)
        elif "security" in str(item.fspath):
            item.add_marker(pytest.mark.security)
        elif "performance" in str(item.fspath):
            item.add_marker(pytest.mark.performance)
