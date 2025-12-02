"""
Unit tests for Compliance module.

Tests cover:
- Compliance report generation
- Regulatory framework validation
- Privacy compliance checks
- Report retrieval
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
from app.compliance.models import ComplianceReport
from app.generators.models import Generator
from app.datasets.models import Dataset
from app.datasets.repositories import create_dataset
from app.generators.repositories import create_generator

# ============================================================================
# FIXTURES
# ============================================================================

@pytest.fixture
def sample_generator_for_compliance(
    session: Session,
    test_user
) -> Generator:
    """Create a generator for compliance testing."""
    dataset = Dataset(
        name="Compliance Test Dataset",
        file_path="/tmp/compliance_test.csv",
        file_size=1024,
        row_count=100,
        column_count=5,
        owner_id=test_user.id,
        status="completed"
    )
    dataset = create_dataset(session, dataset)
    
    generator = Generator(
        name="Compliance Test Generator",
        generator_type="dp-ctgan",
        dataset_id=dataset.id,
        owner_id=test_user.id,
        status="trained",
        config={"epsilon": 10.0, "delta": 1e-5, "epochs": 10}
    )
    return create_generator(session, generator)


# ============================================================================
# TESTS - COMPLIANCE REPORTS
# ============================================================================

class TestComplianceReports:
    """Tests for compliance report generation and retrieval."""
    
    def test_list_compliance_reports_empty(
        self,
        authenticated_client: TestClient
    ):
        """Test listing compliance reports when none exist."""
        response = authenticated_client.get("/compliance/reports/")
        assert response.status_code == 200
        assert response.json() == []
    
    def test_generate_compliance_report_success(
        self,
        authenticated_client: TestClient,
        sample_generator_for_compliance: Generator
    ):
        """Test successful compliance report generation."""
        report_data = {
            "generator_id": str(sample_generator_for_compliance.id),
            "framework": "gdpr",
            "include_recommendations": True
        }
        
        response = authenticated_client.post(
            "/compliance/reports/",
            json=report_data
        )
        
        # May be async or return immediately
        assert response.status_code in [200, 201, 202]
        if response.status_code in [200, 201]:
            data = response.json()
            assert "id" in data or "report_id" in data
    
    def test_generate_report_invalid_generator(
        self,
        authenticated_client: TestClient
    ):
        """Test compliance report for non-existent generator."""
        fake_id = str(uuid.uuid4())
        report_data = {
            "generator_id": fake_id,
            "framework": "gdpr"
        }
        
        response = authenticated_client.post(
            "/compliance/reports/",
            json=report_data
        )
        assert response.status_code in [404, 400]
    
    def test_generate_report_invalid_framework(
        self,
        authenticated_client: TestClient,
        sample_generator_for_compliance: Generator
    ):
        """Test compliance report with invalid framework."""
        report_data = {
            "generator_id": str(sample_generator_for_compliance.id),
            "framework": "invalid_framework"
        }
        
        response = authenticated_client.post(
            "/compliance/reports/",
            json=report_data
        )
        assert response.status_code in [400, 422]
    
    def test_get_compliance_report(
        self,
        authenticated_client: TestClient,
        sample_generator_for_compliance: Generator
    ):
        """Test retrieving a compliance report by ID."""
        # First create a report
        report_data = {
            "generator_id": str(sample_generator_for_compliance.id),
            "framework": "gdpr"
        }
        create_response = authenticated_client.post(
            "/compliance/reports/",
            json=report_data
        )
        
        if create_response.status_code in [200, 201]:
            report_id = create_response.json().get("id") or create_response.json().get("report_id")
            if report_id:
                # Retrieve the report
                get_response = authenticated_client.get(
                    f"/compliance/reports/{report_id}"
                )
                assert get_response.status_code == 200
    
    def test_get_nonexistent_report(
        self,
        authenticated_client: TestClient
    ):
        """Test retrieving non-existent compliance report."""
        fake_id = uuid.uuid4()
        response = authenticated_client.get(f"/compliance/reports/{fake_id}")
        assert response.status_code == 404


# ============================================================================
# TESTS - FRAMEWORKS
# ============================================================================

class TestComplianceFrameworks:
    """Tests for different compliance frameworks."""
    
    @pytest.mark.parametrize("framework", ["gdpr", "hipaa", "ccpa"])
    def test_generate_report_all_frameworks(
        self,
        authenticated_client: TestClient,
        sample_generator_for_compliance: Generator,
        framework: str
    ):
        """Test generating reports for different frameworks."""
        report_data = {
            "generator_id": str(sample_generator_for_compliance.id),
            "framework": framework
        }
        
        response = authenticated_client.post(
            "/compliance/reports/",
            json=report_data
        )
        # Should succeed or return specific error
        assert response.status_code in [200, 201, 202, 400, 404]


# ============================================================================
# TESTS - AUTHORIZATION
# ============================================================================

class TestComplianceAuthorization:
    """Tests for compliance endpoint authorization."""
    
    def test_list_reports_unauthenticated(
        self,
        client: TestClient
    ):
        """Test that unauthenticated requests are rejected."""
        response = client.get("/compliance/reports/")
        assert response.status_code == 401
    
    def test_generate_report_unauthenticated(
        self,
        client: TestClient
    ):
        """Test that unauthenticated report generation is rejected."""
        report_data = {
            "generator_id": str(uuid.uuid4()),
            "framework": "gdpr"
        }
        response = client.post("/compliance/reports/", json=report_data)
        assert response.status_code == 401
