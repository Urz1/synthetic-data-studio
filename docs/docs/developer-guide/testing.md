---
id: developer-guide-testing
title: "Testing Guide"
sidebar_label: "Testing"
sidebar_position: 4
slug: /developer-guide/testing
tags: [developer, testing]
---

# Testing Guide

Comprehensive guide to testing Synthetic Data Studio, including unit tests, integration tests, end-to-end tests, and testing best practices.

## Testing Overview

Synthetic Data Studio uses a multi-layered testing approach to ensure code quality, functionality, and reliability:

### Testing Pyramid

```
+-------------+  Few (10-20%)
¦   E2E Tests  ¦  End-to-end user workflows
+-------------¦
¦Integration  ¦  Component interactions (20-30%)
¦   Tests     ¦  API endpoints, database operations
+-------------¦
¦ Unit Tests  ¦  Individual functions/classes (50-70%)
¦             ¦  Business logic, utilities
+-------------+
```

### Test Categories

- **Unit Tests**: Test individual functions and classes in isolation
- **Integration Tests**: Test component interactions and API endpoints
- **End-to-End Tests**: Test complete user workflows
- **Security Tests**: Test authentication, authorization, and privacy
- **Performance Tests**: Test scalability and resource usage

## Quick Start Testing

### Install Test Dependencies

```bash
# Install development dependencies
pip install -r requirements-dev.txt

# Or install testing tools individually
pip install pytest pytest-cov pytest-asyncio httpx factory-boy
```

### Run All Tests

```bash
# Run complete test suite
pytest

# Run with verbose output
pytest -v

# Run with coverage report
pytest --cov=app --cov-report=html

# Generate coverage badge
pytest --cov=app --cov-report=term-missing --cov-fail-under=80
```

### Run Specific Test Categories

```bash
# Unit tests only
pytest tests/unit/

# Integration tests only
pytest tests/integration/

# End-to-end tests only
pytest tests/e2e/

# Security tests only
pytest tests/security/
```

## Test Structure

### Directory Organization

```
tests/
+-- conftest.py              # Shared test fixtures and configuration
+-- unit/                    # Unit tests
¦   +-- test_auth.py         # Authentication logic tests
¦   +-- test_generators.py   # Generator service tests
¦   +-- test_evaluations.py  # Evaluation logic tests
¦   +-- test_utils.py        # Utility function tests
+-- integration/             # Integration tests
¦   +-- test_api.py          # API endpoint tests
¦   +-- test_database.py     # Database operation tests
¦   +-- test_services.py     # Service integration tests
+-- e2e/                     # End-to-end tests
¦   +-- test_workflows.py    # Complete user workflows
¦   +-- test_data_pipeline.py # Data processing pipelines
+-- security/                # Security-specific tests
    +-- test_auth_security.py # Authentication security
    +-- test_dp_security.py  # Differential privacy validation
    +-- test_api_security.py # API security tests
```

### Test Naming Conventions

```python
# Unit tests
def test_calculate_privacy_budget():
def test_validate_dp_config():
def test_generate_synthetic_data():

# Integration tests
def test_create_generator_endpoint():
def test_upload_dataset_workflow():
def test_evaluation_pipeline():

# E2E tests
def test_complete_synthesis_workflow():
def test_user_registration_to_generation():
```

## ? Testing Tools & Frameworks

### Core Testing Framework

```python
# pytest configuration in pytest.ini
[tool:pytest.ini_options]
testpaths = tests
python_files = test_*.py
python_classes = Test*
python_functions = test_*
addopts = -v --tb=short --strict-markers
markers =
    unit: Unit tests
    integration: Integration tests
    e2e: End-to-end tests
    security: Security tests
    slow: Slow running tests
asyncio_mode = auto
```

### Test Fixtures

#### Database Fixtures (`tests/conftest.py`)

```python
import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.database.database import Base
from app.core.config import settings

@pytest.fixture(scope="session")
def db_engine():
    """Create test database engine."""
    engine = create_engine(settings.database_url, echo=False)
    Base.metadata.create_all(bind=engine)
    yield engine
    Base.metadata.drop_all(bind=engine)

@pytest.fixture
def db_session(db_engine):
    """Create test database session."""
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=db_engine)
    session = SessionLocal()
    try:
        yield session
    finally:
        session.rollback()
        session.close()
```

#### API Test Client

```python
import pytest
from httpx import AsyncClient
from app.main import app

@pytest.fixture
async def client():
    """Create test API client."""
    async with AsyncClient(app=app, base_url="http://testserver") as client:
        yield client
```

#### Authentication Fixtures

```python
from app.auth.services import AuthService
from app.models import User

@pytest.fixture
async def test_user(db_session):
    """Create test user."""
    user = User(
        email="test@example.com",
        hashed_password=AuthService.hash_password("password123")
    )
    db_session.add(user)
    db_session.commit()
    return user

@pytest.fixture
async def auth_token(client, test_user):
    """Get authentication token for test user."""
    response = await client.post("/auth/login", json={
        "email": "test@example.com",
        "password": "password123"
    })
    return response.json()["access_token"]
```

## ? Writing Tests

### Unit Test Example

```python
import pytest
from app.services.privacy.dp_config_validator import DPConfigValidator

class TestDPConfigValidator:
    """Test differential privacy configuration validation."""

    def test_valid_config(self):
        """Test validation of valid DP configuration."""
        is_valid, errors, warnings = DPConfigValidator.validate_config(
            dataset_size=1000,
            epochs=50,
            batch_size=100,
            target_epsilon=10.0
        )

        assert is_valid is True
        assert len(errors) == 0
        assert len(warnings) >= 0

    def test_invalid_batch_size(self):
        """Test rejection of too-large batch size."""
        is_valid, errors, warnings = DPConfigValidator.validate_config(
            dataset_size=1000,
            epochs=50,
            batch_size=600,  # 60% of dataset - too large
            target_epsilon=10.0
        )

        assert is_valid is False
        assert len(errors) > 0
        assert "batch size" in str(errors[0]).lower()

    @pytest.mark.parametrize("epsilon,expected_valid", [
        (0.1, True),   # Very private
        (1.0, True),   # Strong privacy
        (10.0, True),  # Moderate privacy
        (100.0, True), # Weak privacy
        (0.01, False), # Too private (computationally expensive)
    ])
    def test_epsilon_ranges(self, epsilon, expected_valid):
        """Test various epsilon values."""
        is_valid, errors, warnings = DPConfigValidator.validate_config(
            dataset_size=10000,
            epochs=50,
            batch_size=500,
            target_epsilon=epsilon
        )

        assert is_valid == expected_valid
```

### Integration Test Example

```python
import pytest
from httpx import AsyncClient

@pytest.mark.integration
class TestGeneratorAPI:
    """Test generator API endpoints."""

    async def test_create_generator(self, client, auth_token):
        """Test generator creation endpoint."""
        response = await client.post(
            "/generators/",
            headers={"Authorization": f"Bearer {auth_token}"},
            json={
                "name": "Test Generator",
                "type": "ctgan",
                "parameters": {"epochs": 10}
            }
        )

        assert response.status_code == 200
        data = response.json()
        assert data["name"] == "Test Generator"
        assert data["type"] == "ctgan"
        assert "id" in data

    async def test_list_generators(self, client, auth_token):
        """Test generator listing endpoint."""
        # Create a generator first
        create_response = await client.post(
            "/generators/",
            headers={"Authorization": f"Bearer {auth_token}"},
            json={"name": "List Test", "type": "ctgan"}
        )
        assert create_response.status_code == 200

        # List generators
        list_response = await client.get(
            "/generators/",
            headers={"Authorization": f"Bearer {auth_token}"}
        )

        assert list_response.status_code == 200
        generators = list_response.json()
        assert isinstance(generators, list)
        assert len(generators) >= 1
```

### End-to-End Test Example

```python
import pytest

@pytest.mark.e2e
class TestSynthesisWorkflow:
    """Test complete synthesis workflow."""

    async def test_full_synthesis_pipeline(self, client):
        """Test end-to-end synthesis workflow."""
        # 1. Register user
        register_response = await client.post("/auth/register", json={
            "email": "test@example.com",
            "password": "password123"
        })
        assert register_response.status_code == 201

        # 2. Login
        login_response = await client.post("/auth/login", json={
            "email": "test@example.com",
            "password": "password123"
        })
        assert login_response.status_code == 200
        token = login_response.json()["access_token"]

        # 3. Upload dataset
        with open("sample_data.csv", "rb") as f:
            upload_response = await client.post(
                "/datasets/upload",
                headers={"Authorization": f"Bearer {token}"},
                files={"file": ("sample_data.csv", f, "text/csv")}
            )
        assert upload_response.status_code == 200
        dataset_id = upload_response.json()["id"]

        # 4. Create generator
        generator_response = await client.post(
            "/generators/",
            headers={"Authorization": f"Bearer {token}"},
            json={
                "name": "E2E Test Generator",
                "type": "ctgan",
                "dataset_id": dataset_id
            }
        )
        assert generator_response.status_code == 200
        generator_id = generator_response.json()["id"]

        # 5. Generate synthetic data
        generate_response = await client.post(
            f"/generators/dataset/{dataset_id}/generate",
            headers={"Authorization": f"Bearer {token}"},
            json={
                "generator_type": "ctgan",
                "num_rows": 100,
                "epochs": 5
            }
        )
        assert generate_response.status_code == 200

        # 6. Wait for completion (in real test, poll status)
        # status_response = await client.get(f"/generators/{generator_id}")
        # assert status_response.json()["status"] == "completed"

        # 7. Download results
        # download_response = await client.get(f"/datasets/{output_dataset_id}/download")
        # assert download_response.status_code == 200
```

## Security Testing

### Authentication Tests

```python
@pytest.mark.security
class TestAuthenticationSecurity:
    """Test authentication security."""

    async def test_brute_force_protection(self, client):
        """Test protection against brute force attacks."""
        # Attempt multiple failed logins
        for _ in range(10):
            response = await client.post("/auth/login", json={
                "email": "nonexistent@example.com",
                "password": "wrongpassword"
            })
            # Should eventually rate limit or require CAPTCHA

    async def test_jwt_token_expiry(self, client, test_user):
        """Test JWT token expiration."""
        # Login and get token
        login_response = await client.post("/auth/login", json={
            "email": test_user.email,
            "password": "password123"
        })
        token = login_response.json()["access_token"]

        # Use token immediately (should work)
        profile_response = await client.get(
            "/auth/me",
            headers={"Authorization": f"Bearer {token}"}
        )
        assert profile_response.status_code == 200

        # TODO: Test token expiry by mocking time
```

### Differential Privacy Tests

```python
@pytest.mark.security
class TestDifferentialPrivacy:
    """Test differential privacy guarantees."""

    def test_dp_noise_application(self):
        """Test that DP adds appropriate noise."""
        from app.services.privacy.dp_config_validator import DPConfigValidator

        # Test that noise multiplier is calculated correctly
        config = {
            "dataset_size": 1000,
            "epochs": 50,
            "batch_size": 100,
            "target_epsilon": 10.0
        }

        is_valid, errors, warnings = DPConfigValidator.validate_config(**config)
        assert is_valid

        # Verify noise multiplier calculation
        # (Implementation would check actual noise application)
```

## Test Coverage & Quality

### Coverage Requirements

```bash
# Run tests with coverage
pytest --cov=app --cov-report=html --cov-fail-under=80

# Generate detailed coverage report
coverage html
open htmlcov/index.html
```

### Coverage Goals by Module

| Module               | Target Coverage | Rationale               |
| -------------------- | --------------- | ----------------------- |
| Core (config, utils) | 90%             | Critical infrastructure |
| Services             | 85%             | Business logic          |
| Routes               | 80%             | API endpoints           |
| Models               | 75%             | Data structures         |
| Tests                | N/A             | Test code itself        |

### Code Quality Metrics

```bash
# Run quality checks
flake8 app/ tests/ --max-line-length=88 --extend-ignore=E203,W503
black --check --diff app/ tests/
isort --check-only --diff app/ tests/
mypy app/ --ignore-missing-imports
```

## ? Continuous Integration

### GitHub Actions Example

```yaml
# .github/workflows/test.yml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        python-version: [3.9, 3.10, 3.11]

    steps:
      - uses: actions/checkout@v3
      - name: Set up Python ${{ matrix.python-version }}
        uses: actions/setup-python@v4
        with:
          python-version: ${{ matrix.python-version }}

      - name: Install dependencies
        run: |
          python -m pip install --upgrade pip
          pip install -r requirements.txt
          pip install -r requirements-dev.txt

      - name: Run tests
        run: pytest --cov=app --cov-report=xml

      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          file: ./coverage.xml
```

### Pre-commit Hooks

```yaml
# .pre-commit-config.yaml
repos:
  - repo: https://github.com/pre-commit/pre-commit-hooks
    rev: v4.4.0
    hooks:
      - id: trailing-whitespace
      - id: end-of-file-fixer
      - id: check-yaml
      - id: check-added-large-files

  - repo: https://github.com/psf/black
    rev: 23.3.0
    hooks:
      - id: black
        language_version: python3

  - repo: https://github.com/pycqa/isort
    rev: 5.12.0
    hooks:
      - id: isort

  - repo: https://github.com/pycqa/flake8
    rev: 6.0.0
    hooks:
      - id: flake8
```

## Testing Best Practices

### Test Organization

1. **One Test Class Per Module**: Group related tests together
2. **Descriptive Test Names**: Use clear, descriptive names
3. **Arrange-Act-Assert Pattern**: Structure tests clearly
4. **Independent Tests**: Each test should run independently

### Mocking & Fixtures

```python
from unittest.mock import Mock, patch

def test_external_api_call():
    """Test external API integration with mocking."""
    with patch('httpx.post') as mock_post:
        mock_post.return_value.status_code = 200
        mock_post.return_value.json.return_value = {"result": "success"}

        # Test your function that calls the API
        result = call_external_api()
        assert result == "success"
        mock_post.assert_called_once()
```

### Async Testing

```python
import pytest_asyncio

@pytest.mark.asyncio
async def test_async_endpoint(client):
    """Test asynchronous API endpoint."""
    response = await client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "healthy"}
```

### Database Testing

```python
def test_database_operation(db_session):
    """Test database operations."""
    # Create test data
    user = User(email="test@example.com")
    db_session.add(user)
    db_session.commit()

    # Query and assert
    retrieved = db_session.query(User).filter_by(email="test@example.com").first()
    assert retrieved.email == "test@example.com"

    # Cleanup happens automatically with fixtures
```

## Debugging Tests

### Common Issues

**Test Isolation Problems**

```python
# Problem: Tests affect each other through shared state
# Solution: Use unique test data and proper cleanup

def test_create_user(db_session):
    user = User(email="test@example.com")
    db_session.add(user)
    db_session.commit()
    assert user.id is not None

def test_create_another_user(db_session):  # This might fail if previous test's data persists
    user = User(email="test@example.com")  # Same email!
    # Solution: Use unique emails or proper cleanup
```

**Async Test Issues**

```python
# Problem: Forgetting await
async def test_async_function():
    result = await my_async_function()  # Correct
    # result = my_async_function()      # Wrong - returns coroutine

# Problem: Not using asyncio marker
@pytest.mark.asyncio
async def test_async_endpoint(client):
    response = await client.get("/api/endpoint")
```

**Fixture Scoping Issues**

```python
# Problem: Using session-scoped fixtures for unit tests
@pytest.fixture(scope="session")  # Too broad scope
def db_session():
    # This fixture is shared across all tests in the session

# Solution: Use function scope for unit tests
@pytest.fixture(scope="function")
def db_session():
    # Fresh session for each test
```

## Performance Testing

### Load Testing

```python
import asyncio
import aiohttp

async def test_api_load():
    """Test API performance under load."""
    async with aiohttp.ClientSession() as session:
        tasks = []
        for i in range(100):  # 100 concurrent requests
            tasks.append(make_request(session, i))

        results = await asyncio.gather(*tasks)
        assert all(r.status == 200 for r in results)

async def make_request(session, request_id):
    async with session.get(f"http://localhost:8000/health") as response:
        return response
```

### Memory Testing

```python
import tracemalloc

def test_memory_usage():
    """Test memory usage of operations."""
    tracemalloc.start()

    # Perform operation
    result = perform_memory_intensive_operation()

    current, peak = tracemalloc.get_traced_memory()
    tracemalloc.stop()

    # Assert memory usage is reasonable
    assert peak < 100 * 1024 * 1024  # Less than 100MB
```

## Test Maintenance

### Regular Maintenance Tasks

- **Update Test Data**: Keep test datasets current
- **Fix Flaky Tests**: Address intermittent failures
- **Remove Dead Tests**: Delete tests for removed features
- **Update Dependencies**: Keep testing tools current
- **Review Coverage**: Ensure coverage goals are met

### Test Documentation

```python
def test_complex_business_logic():
    """
    Test complex business logic for synthetic data generation.

    This test verifies that:
    - Privacy parameters are correctly validated
    - Statistical distributions are preserved
    - ML utility scores meet minimum thresholds

    Edge cases tested:
    - Empty datasets
    - Single-column datasets
    - Highly correlated features
    - Outlier-heavy distributions
    """
    # Test implementation
    pass
```

## Success Metrics

### Test Quality Metrics

- **Coverage**: >80% overall, >90% for critical paths
- **Pass Rate**: >99% for unit tests, >95% for integration tests
- **Execution Time**: less than 5 minutes for full suite
- **Flakiness**: less than 1% intermittent failures

### Continuous Improvement

- **Add Tests for Bugs**: Every bug fix includes a regression test
- **Test New Features**: All features include comprehensive tests
- **Performance Benchmarks**: Track and improve test execution time
- **Code Review Integration**: Automated test checks in CI/CD

---

**Ready to contribute?** Check our [Contributing Guide](../../CONTRIBUTING.md) for testing guidelines and run `pytest` to ensure your changes don't break existing functionality.
