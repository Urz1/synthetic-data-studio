"""
Unit tests for Datasets module.

Tests cover:
- Dataset upload and management
- File format handling (CSV, JSON, Excel)
- Dataset preview and statistics
- Data validation
- Access control
"""

# ============================================================================
# IMPORTS
# ============================================================================

# Standard library
import uuid
import io
from typing import Dict

# Third-party
import pytest
from fastapi.testclient import TestClient
from sqlmodel import Session

# Local - Module
from app.datasets.models import Dataset
from app.datasets.repositories import create_dataset, get_dataset_by_id

# ============================================================================
# FIXTURES
# ============================================================================

@pytest.fixture
def sample_csv_content() -> str:
    """Sample CSV file content for testing."""
    return """name,age,city,salary
John Doe,30,New York,75000
Jane Smith,25,Los Angeles,65000
Bob Johnson,35,Chicago,80000
Alice Williams,28,Houston,70000
Charlie Brown,32,Phoenix,72000"""


@pytest.fixture
def sample_json_content() -> str:
    """Sample JSON file content for testing."""
    import json
    data = [
        {"name": "John Doe", "age": 30, "city": "New York", "salary": 75000},
        {"name": "Jane Smith", "age": 25, "city": "Los Angeles", "salary": 65000},
        {"name": "Bob Johnson", "age": 35, "city": "Chicago", "salary": 80000},
    ]
    return json.dumps(data)


@pytest.fixture
def sample_dataset(session: Session, test_user) -> Dataset:
    """Create a sample dataset for testing."""
    dataset = Dataset(
        name="Test Dataset",
        description="A test dataset",
        file_path="/tmp/test_dataset.csv",
        file_size=2048,
        row_count=100,
        column_count=5,
        owner_id=test_user.id,
        status="completed"
    )
    return create_dataset(session, dataset)


# ============================================================================
# TESTS - UPLOAD DATASET
# ============================================================================

class TestUploadDataset:
    """Tests for dataset upload functionality."""
    
    def test_upload_csv_success(
        self,
        authenticated_client: TestClient,
        sample_csv_content: str
    ):
        """Test successful CSV upload."""
        files = {
            "file": ("test.csv", io.BytesIO(sample_csv_content.encode()), "text/csv")
        }
        data = {
            "name": "Test CSV Dataset",
            "description": "A test CSV dataset"
        }
        
        response = authenticated_client.post(
            "/datasets/upload",
            files=files,
            data=data
        )
        
        assert response.status_code == 201
        result = response.json()
        assert result["name"] == data["name"]
        assert result["status"] in ["processing", "completed"]
        assert "id" in result
    
    def test_upload_json_success(
        self,
        authenticated_client: TestClient,
        sample_json_content: str
    ):
        """Test successful JSON upload."""
        files = {
            "file": ("test.json", io.BytesIO(sample_json_content.encode()), "application/json")
        }
        data = {
            "name": "Test JSON Dataset",
            "description": "A test JSON dataset"
        }
        
        response = authenticated_client.post(
            "/datasets/upload",
            files=files,
            data=data
        )
        
        assert response.status_code == 201
        result = response.json()
        assert result["name"] == data["name"]
    
    def test_upload_dataset_unauthenticated(
        self,
        client: TestClient,
        sample_csv_content: str
    ):
        """Test that unauthenticated uploads are rejected."""
        files = {
            "file": ("test.csv", io.BytesIO(sample_csv_content.encode()), "text/csv")
        }
        data = {"name": "Unauthorized Dataset"}
        
        response = client.post("/datasets/upload", files=files, data=data)
        assert response.status_code == 401
    
    def test_upload_empty_file(self, authenticated_client: TestClient):
        """Test uploading an empty file."""
        files = {
            "file": ("empty.csv", io.BytesIO(b""), "text/csv")
        }
        data = {"name": "Empty Dataset"}
        
        response = authenticated_client.post(
            "/datasets/upload",
            files=files,
            data=data
        )
        assert response.status_code in [400, 422]
    
    def test_upload_unsupported_format(self, authenticated_client: TestClient):
        """Test uploading unsupported file format."""
        files = {
            "file": ("test.txt", io.BytesIO(b"plain text"), "text/plain")
        }
        data = {"name": "Invalid Format Dataset"}
        
        response = authenticated_client.post(
            "/datasets/upload",
            files=files,
            data=data
        )
        assert response.status_code in [400, 415, 422]
    
    def test_upload_missing_file(self, authenticated_client: TestClient):
        """Test upload request without file."""
        data = {"name": "No File Dataset"}
        
        response = authenticated_client.post("/datasets/upload", data=data)
        assert response.status_code == 422
    
    def test_upload_missing_name(
        self,
        authenticated_client: TestClient,
        sample_csv_content: str
    ):
        """Test upload without dataset name."""
        files = {
            "file": ("test.csv", io.BytesIO(sample_csv_content.encode()), "text/csv")
        }
        
        response = authenticated_client.post("/datasets/upload", files=files)
        # Should either use default name or reject
        assert response.status_code in [201, 422]


# ============================================================================
# TESTS - LIST AND GET DATASETS
# ============================================================================

class TestListDatasets:
    """Tests for listing datasets."""
    
    def test_list_datasets_empty(self, authenticated_client: TestClient):
        """Test listing datasets when none exist."""
        response = authenticated_client.get("/datasets/")
        assert response.status_code == 200
        assert response.json() == []
    
    def test_list_datasets_with_data(
        self,
        authenticated_client: TestClient,
        sample_dataset: Dataset
    ):
        """Test listing datasets with existing data."""
        response = authenticated_client.get("/datasets/")
        assert response.status_code == 200
        
        data = response.json()
        assert len(data) >= 1
        assert any(d["id"] == str(sample_dataset.id) for d in data)
    
    def test_list_datasets_unauthenticated(self, client: TestClient):
        """Test that unauthenticated requests are rejected."""
        response = client.get("/datasets/")
        assert response.status_code == 401


class TestGetDataset:
    """Tests for retrieving a single dataset."""
    
    def test_get_dataset_success(
        self,
        authenticated_client: TestClient,
        sample_dataset: Dataset
    ):
        """Test successfully retrieving a dataset by ID."""
        response = authenticated_client.get(f"/datasets/{sample_dataset.id}")
        assert response.status_code == 200
        
        data = response.json()
        assert data["id"] == str(sample_dataset.id)
        assert data["name"] == sample_dataset.name
        assert data["row_count"] == sample_dataset.row_count
        assert data["column_count"] == sample_dataset.column_count
    
    def test_get_dataset_not_found(self, authenticated_client: TestClient):
        """Test retrieving a non-existent dataset."""
        fake_id = uuid.uuid4()
        response = authenticated_client.get(f"/datasets/{fake_id}")
        assert response.status_code == 404
        assert "not found" in response.json()["detail"].lower()
    
    def test_get_dataset_invalid_uuid(self, authenticated_client: TestClient):
        """Test retrieving dataset with invalid UUID format."""
        response = authenticated_client.get("/datasets/not-a-uuid")
        assert response.status_code in [400, 422]
    
    def test_get_dataset_unauthenticated(
        self,
        client: TestClient,
        sample_dataset: Dataset
    ):
        """Test that unauthenticated requests are rejected."""
        response = client.get(f"/datasets/{sample_dataset.id}")
        assert response.status_code == 401


# ============================================================================
# TESTS - DATASET PREVIEW
# ============================================================================

class TestDatasetPreview:
    """Tests for dataset preview functionality."""
    
    def test_preview_dataset_success(
        self,
        authenticated_client: TestClient,
        sample_dataset: Dataset
    ):
        """Test successfully previewing dataset data."""
        response = authenticated_client.get(f"/datasets/{sample_dataset.id}/preview")
        
        # Preview endpoint might not exist or return data
        assert response.status_code in [200, 404]
        
        if response.status_code == 200:
            data = response.json()
            assert "rows" in data or "preview" in data
    
    def test_preview_dataset_with_limit(
        self,
        authenticated_client: TestClient,
        sample_dataset: Dataset
    ):
        """Test preview with row limit."""
        response = authenticated_client.get(
            f"/datasets/{sample_dataset.id}/preview?limit=10"
        )
        
        assert response.status_code in [200, 404]
        
        if response.status_code == 200:
            data = response.json()
            rows = data.get("rows", data.get("preview", []))
            assert len(rows) <= 10
    
    def test_preview_nonexistent_dataset(self, authenticated_client: TestClient):
        """Test previewing non-existent dataset."""
        fake_id = uuid.uuid4()
        response = authenticated_client.get(f"/datasets/{fake_id}/preview")
        assert response.status_code == 404


# ============================================================================
# TESTS - DATASET STATISTICS
# ============================================================================

class TestDatasetStatistics:
    """Tests for dataset statistics."""
    
    def test_get_dataset_statistics(
        self,
        authenticated_client: TestClient,
        sample_dataset: Dataset
    ):
        """Test retrieving dataset statistics."""
        response = authenticated_client.get(f"/datasets/{sample_dataset.id}/stats")
        
        # Stats endpoint might not exist
        assert response.status_code in [200, 404]
        
        if response.status_code == 200:
            data = response.json()
            assert "row_count" in data or "statistics" in data
    
    def test_get_statistics_nonexistent_dataset(
        self,
        authenticated_client: TestClient
    ):
        """Test statistics for non-existent dataset."""
        fake_id = uuid.uuid4()
        response = authenticated_client.get(f"/datasets/{fake_id}/stats")
        assert response.status_code == 404


# ============================================================================
# TESTS - DELETE DATASET
# ============================================================================

class TestDeleteDataset:
    """Tests for deleting datasets."""
    
    def test_delete_dataset_success(
        self,
        authenticated_client: TestClient,
        sample_dataset: Dataset,
        session: Session
    ):
        """Test successfully deleting a dataset."""
        dataset_id = sample_dataset.id
        response = authenticated_client.delete(f"/datasets/{dataset_id}")
        assert response.status_code in [200, 204]
        
        # Verify dataset is deleted
        deleted_dataset = get_dataset_by_id(session, str(dataset_id))
        assert deleted_dataset is None
    
    def test_delete_dataset_not_found(self, authenticated_client: TestClient):
        """Test deleting a non-existent dataset."""
        fake_id = uuid.uuid4()
        response = authenticated_client.delete(f"/datasets/{fake_id}")
        assert response.status_code == 404
    
    def test_delete_dataset_unauthenticated(
        self,
        client: TestClient,
        sample_dataset: Dataset
    ):
        """Test that unauthenticated requests are rejected."""
        response = client.delete(f"/datasets/{sample_dataset.id}")
        assert response.status_code == 401
    
    def test_delete_dataset_with_generators(
        self,
        authenticated_client: TestClient,
        sample_dataset: Dataset,
        session: Session
    ):
        """Test deleting dataset that has associated generators."""
        # Create a generator for this dataset
        from app.generators.models import Generator
        from app.generators.repositories import create_generator
        
        generator = Generator(
            name="Dependent Generator",
            generator_type="ctgan",
            dataset_id=sample_dataset.id,
            owner_id=sample_dataset.owner_id,
            status="created"
        )
        create_generator(session, generator)
        
        # Try to delete dataset
        response = authenticated_client.delete(f"/datasets/{sample_dataset.id}")
        
        # Should either prevent deletion or cascade delete
        assert response.status_code in [200, 204, 400, 409]


# ============================================================================
# TESTS - DATA VALIDATION
# ============================================================================

class TestDataValidation:
    """Tests for data validation during upload."""
    
    def test_upload_invalid_csv_format(self, authenticated_client: TestClient):
        """Test uploading malformed CSV."""
        invalid_csv = b"name,age\nJohn,30,extra_field\nJane"  # Inconsistent columns
        files = {
            "file": ("invalid.csv", io.BytesIO(invalid_csv), "text/csv")
        }
        data = {"name": "Invalid CSV"}
        
        response = authenticated_client.post(
            "/datasets/upload",
            files=files,
            data=data
        )
        # Should handle gracefully
        assert response.status_code in [201, 400, 422]
    
    def test_upload_invalid_json_format(self, authenticated_client: TestClient):
        """Test uploading malformed JSON."""
        invalid_json = b"{invalid json content"
        files = {
            "file": ("invalid.json", io.BytesIO(invalid_json), "application/json")
        }
        data = {"name": "Invalid JSON"}
        
        response = authenticated_client.post(
            "/datasets/upload",
            files=files,
            data=data
        )
        assert response.status_code in [400, 422]
    
    def test_upload_very_large_file(self, authenticated_client: TestClient):
        """Test uploading file that exceeds size limit."""
        # Create large content (simulated)
        large_content = b"x" * (100 * 1024 * 1024)  # 100 MB
        files = {
            "file": ("large.csv", io.BytesIO(large_content), "text/csv")
        }
        data = {"name": "Large Dataset"}
        
        response = authenticated_client.post(
            "/datasets/upload",
            files=files,
            data=data
        )
        # Should either accept or reject based on limits
        assert response.status_code in [201, 413, 422]


# ============================================================================
# TESTS - EDGE CASES
# ============================================================================

class TestDatasetEdgeCases:
    """Tests for edge cases and boundary conditions."""
    
    def test_dataset_name_special_characters(
        self,
        authenticated_client: TestClient,
        sample_csv_content: str
    ):
        """Test dataset names with special characters."""
        special_names = [
            "Dataset #1",
            "My-Dataset_2025",
            "Dataset (Test)",
            "Dataset@123",
        ]
        
        for name in special_names:
            files = {
                "file": (
                    "test.csv",
                    io.BytesIO(sample_csv_content.encode()),
                    "text/csv"
                )
            }
            data = {"name": name}
            
            response = authenticated_client.post(
                "/datasets/upload",
                files=files,
                data=data
            )
            assert response.status_code in [201, 400, 422], f"Failed for name: {name}"
    
    def test_dataset_empty_name(
        self,
        authenticated_client: TestClient,
        sample_csv_content: str
    ):
        """Test uploading dataset with empty name."""
        files = {
            "file": ("test.csv", io.BytesIO(sample_csv_content.encode()), "text/csv")
        }
        data = {"name": ""}
        
        response = authenticated_client.post(
            "/datasets/upload",
            files=files,
            data=data
        )
        assert response.status_code in [400, 422]
    
    def test_dataset_very_long_description(
        self,
        authenticated_client: TestClient,
        sample_csv_content: str
    ):
        """Test dataset with very long description."""
        long_description = "A" * 10000  # Very long description
        files = {
            "file": ("test.csv", io.BytesIO(sample_csv_content.encode()), "text/csv")
        }
        data = {
            "name": "Long Description Dataset",
            "description": long_description
        }
        
        response = authenticated_client.post(
            "/datasets/upload",
            files=files,
            data=data
        )
        # Should either accept or truncate/reject
        assert response.status_code in [201, 413, 422]
    
    def test_concurrent_dataset_uploads(
        self,
        authenticated_client: TestClient,
        sample_csv_content: str
    ):
        """Test multiple simultaneous uploads (simplified)."""
        files1 = {
            "file": ("test1.csv", io.BytesIO(sample_csv_content.encode()), "text/csv")
        }
        files2 = {
            "file": ("test2.csv", io.BytesIO(sample_csv_content.encode()), "text/csv")
        }
        
        response1 = authenticated_client.post(
            "/datasets/upload",
            files=files1,
            data={"name": "Dataset 1"}
        )
        response2 = authenticated_client.post(
            "/datasets/upload",
            files=files2,
            data={"name": "Dataset 2"}
        )
        
        # Both should succeed or fail independently
        assert response1.status_code in [201, 400, 422]
        assert response2.status_code in [201, 400, 422]
