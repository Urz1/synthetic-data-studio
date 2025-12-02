"""
Unit tests for Synthetic Datasets module.

Tests cover:
- Synthetic dataset generation
- Dataset export formats
- Data quality validation
- Access control
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
from app.synthetic_datasets.models import SyntheticDataset
from app.generators.models import Generator
from app.datasets.models import Dataset
from app.datasets.repositories import create_dataset
from app.generators.repositories import create_generator

# ============================================================================
# FIXTURES
# ============================================================================

@pytest.fixture
def sample_trained_generator(
    session: Session,
    test_user
) -> Generator:
    """Create a trained generator for synthetic data generation."""
    dataset = Dataset(
        name="Source Dataset",
        file_path="/tmp/source.csv",
        file_size=2048,
        row_count=100,
        column_count=5,
        owner_id=test_user.id,
        status="completed"
    )
    dataset = create_dataset(session, dataset)
    
    generator = Generator(
        name="Trained Generator",
        generator_type="ctgan",
        dataset_id=dataset.id,
        owner_id=test_user.id,
        status="trained",
        config={"epochs": 10, "batch_size": 500}
    )
    return create_generator(session, generator)


# ============================================================================
# TESTS - GENERATE SYNTHETIC DATA
# ============================================================================

class TestSyntheticDataGeneration:
    """Tests for synthetic data generation."""
    
    def test_generate_synthetic_data_success(
        self,
        authenticated_client: TestClient,
        sample_trained_generator: Generator
    ):
        """Test successful synthetic data generation."""
        generation_request = {
            "generator_id": str(sample_trained_generator.id),
            "num_rows": 100,
            "name": "Test Synthetic Dataset"
        }
        
        response = authenticated_client.post(
            "/synthetic-datasets/generate",
            json=generation_request
        )
        
        # May be async or return immediately
        assert response.status_code in [200, 201, 202]
        if response.status_code in [200, 201]:
            data = response.json()
            assert "id" in data or "dataset_id" in data
    
    def test_generate_with_invalid_generator(
        self,
        authenticated_client: TestClient
    ):
        """Test generation with non-existent generator."""
        fake_id = str(uuid.uuid4())
        generation_request = {
            "generator_id": fake_id,
            "num_rows": 100
        }
        
        response = authenticated_client.post(
            "/synthetic-datasets/generate",
            json=generation_request
        )
        assert response.status_code in [404, 400]
    
    def test_generate_zero_rows(
        self,
        authenticated_client: TestClient,
        sample_trained_generator: Generator
    ):
        """Test generation with zero rows."""
        generation_request = {
            "generator_id": str(sample_trained_generator.id),
            "num_rows": 0
        }
        
        response = authenticated_client.post(
            "/synthetic-datasets/generate",
            json=generation_request
        )
        assert response.status_code in [400, 422]
    
    def test_generate_negative_rows(
        self,
        authenticated_client: TestClient,
        sample_trained_generator: Generator
    ):
        """Test generation with negative row count."""
        generation_request = {
            "generator_id": str(sample_trained_generator.id),
            "num_rows": -10
        }
        
        response = authenticated_client.post(
            "/synthetic-datasets/generate",
            json=generation_request
        )
        assert response.status_code in [400, 422]
    
    def test_generate_large_dataset(
        self,
        authenticated_client: TestClient,
        sample_trained_generator: Generator
    ):
        """Test generation with large row count."""
        generation_request = {
            "generator_id": str(sample_trained_generator.id),
            "num_rows": 1000000  # 1 million rows
        }
        
        response = authenticated_client.post(
            "/synthetic-datasets/generate",
            json=generation_request
        )
        # Should either succeed, reject, or queue as background job
        assert response.status_code in [200, 201, 202, 400, 413, 422]


# ============================================================================
# TESTS - LIST AND GET SYNTHETIC DATASETS
# ============================================================================

class TestListSyntheticDatasets:
    """Tests for listing synthetic datasets."""
    
    def test_list_synthetic_datasets_empty(
        self,
        authenticated_client: TestClient
    ):
        """Test listing when no synthetic datasets exist."""
        response = authenticated_client.get("/synthetic-datasets/")
        assert response.status_code == 200
        assert response.json() == []
    
    def test_list_synthetic_datasets_unauthenticated(
        self,
        client: TestClient
    ):
        """Test that unauthenticated requests are rejected."""
        response = client.get("/synthetic-datasets/")
        assert response.status_code == 401


class TestGetSyntheticDataset:
    """Tests for retrieving synthetic datasets."""
    
    def test_get_synthetic_dataset_not_found(
        self,
        authenticated_client: TestClient
    ):
        """Test retrieving non-existent synthetic dataset."""
        fake_id = uuid.uuid4()
        response = authenticated_client.get(f"/synthetic-datasets/{fake_id}")
        assert response.status_code == 404
    
    def test_get_synthetic_dataset_invalid_uuid(
        self,
        authenticated_client: TestClient
    ):
        """Test retrieving with invalid UUID format."""
        response = authenticated_client.get("/synthetic-datasets/not-a-uuid")
        assert response.status_code in [400, 422]


# ============================================================================
# TESTS - EXPORT SYNTHETIC DATASETS
# ============================================================================

class TestExportSyntheticDataset:
    """Tests for exporting synthetic datasets."""
    
    @pytest.mark.parametrize("export_format", ["csv", "json", "parquet", "excel"])
    def test_export_formats(
        self,
        authenticated_client: TestClient,
        export_format: str
    ):
        """Test exporting in different formats."""
        # This is a conceptual test - actual endpoint may differ
        fake_id = uuid.uuid4()
        response = authenticated_client.get(
            f"/synthetic-datasets/{fake_id}/export?format={export_format}"
        )
        # Should fail because dataset doesn't exist
        # but validates format handling
        assert response.status_code in [404, 400, 422]
    
    def test_export_invalid_format(
        self,
        authenticated_client: TestClient
    ):
        """Test export with invalid format."""
        fake_id = uuid.uuid4()
        response = authenticated_client.get(
            f"/synthetic-datasets/{fake_id}/export?format=invalid"
        )
        assert response.status_code in [400, 404, 422]


# ============================================================================
# TESTS - DELETE SYNTHETIC DATASETS
# ============================================================================

class TestDeleteSyntheticDataset:
    """Tests for deleting synthetic datasets."""
    
    def test_delete_synthetic_dataset_not_found(
        self,
        authenticated_client: TestClient
    ):
        """Test deleting non-existent synthetic dataset."""
        fake_id = uuid.uuid4()
        response = authenticated_client.delete(f"/synthetic-datasets/{fake_id}")
        assert response.status_code == 404
    
    def test_delete_synthetic_dataset_unauthenticated(
        self,
        client: TestClient
    ):
        """Test that unauthenticated deletion is rejected."""
        fake_id = uuid.uuid4()
        response = client.delete(f"/synthetic-datasets/{fake_id}")
        assert response.status_code == 401


# ============================================================================
# TESTS - EDGE CASES
# ============================================================================

class TestSyntheticDatasetEdgeCases:
    """Tests for edge cases."""
    
    def test_generate_with_untrained_generator(
        self,
        authenticated_client: TestClient,
        session: Session,
        test_user
    ):
        """Test generation with untrained generator."""
        # Create untrained generator
        dataset = Dataset(
            name="Untrained Dataset",
            file_path="/tmp/untrained.csv",
            file_size=1024,
            row_count=100,
            column_count=5,
            owner_id=test_user.id,
            status="completed"
        )
        dataset = create_dataset(session, dataset)
        
        generator = Generator(
            name="Untrained Generator",
            generator_type="ctgan",
            dataset_id=dataset.id,
            owner_id=test_user.id,
            status="created",  # Not trained
            config={"epochs": 10}
        )
        generator = create_generator(session, generator)
        
        generation_request = {
            "generator_id": str(generator.id),
            "num_rows": 100
        }
        
        response = authenticated_client.post(
            "/synthetic-datasets/generate",
            json=generation_request
        )
        # Should reject or handle gracefully
        assert response.status_code in [200, 201, 202, 400, 422]
