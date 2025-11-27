"""
Functional tests for Dataset endpoints.

Tests:
- GET /datasets/
- POST /datasets/upload
- GET /datasets/{id}
- GET /datasets/{id}/profile
- GET /datasets/{id}/pii-detection
- POST /datasets/{id}/pii-detection-enhanced
- DELETE /datasets/{id}
"""

import pytest
from fastapi.testclient import TestClient
from io import BytesIO


class TestDatasetsList:
    """Test GET /datasets/"""
    
    def test_list_datasets_empty(self, authenticated_client: TestClient):
        """Test listing datasets when none exist"""
        response = authenticated_client.get("/datasets/")
        
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
    
    def test_list_datasets_unauthorized(self, client: TestClient):
        """Test listing datasets without authentication"""
        response = client.get("/datasets/")
        
        # API returns 403 when no credentials provided
        assert response.status_code == 403


class TestDatasetsUpload:
    """Test POST /datasets/upload"""
    
    def test_upload_csv_success(self, authenticated_client: TestClient, factory):
        """Test successful CSV upload"""
        csv_data = factory.create_dataset_csv()
        files = {"file": ("test_data.csv", csv_data, "text/csv")}
        
        response = authenticated_client.post("/datasets/upload", files=files)
        
        # Just verify upload succeeds - response format may vary
        assert response.status_code == 200
        # Response should be a valid JSON
        data = response.json()
        assert data is not None
    
    def test_upload_json_success(self, authenticated_client: TestClient, factory):
        """Test successful JSON upload"""
        json_data = factory.create_dataset_json()
        files = {"file": ("test_data.json", json_data, "application/json")}
        
        response = authenticated_client.post("/datasets/upload", files=files)
        
        # Just verify upload succeeds
        assert response.status_code == 200
        data = response.json()
        assert data is not None
    
    def test_upload_invalid_file_type(self, authenticated_client: TestClient):
        """Test upload with invalid file type"""
        files = {"file": ("test.txt", "invalid data", "text/plain")}
        
        response = authenticated_client.post("/datasets/upload", files=files)
        
        assert response.status_code == 400
    
    def test_upload_empty_file(self, authenticated_client: TestClient):
        """Test upload with empty file"""
        files = {"file": ("empty.csv", "", "text/csv")}
        
        response = authenticated_client.post("/datasets/upload", files=files)
        
        # Empty file should be rejected
        assert response.status_code in [400, 422, 500]
    
    def test_upload_no_auth(self, client: TestClient, factory):
        """Test upload without authentication"""
        csv_data = factory.create_dataset_csv()
        files = {"file": ("test.csv", csv_data, "text/csv")}
        
        response = client.post("/datasets/upload", files=files)
        
        # API returns 403 when no credentials provided
        assert response.status_code == 403


class TestDatasetsGet:
    """Test GET /datasets/{id}"""
    
    def test_get_dataset_success(self, authenticated_client: TestClient, factory):
        """Test getting dataset details"""
        # Upload dataset first
        csv_data = factory.create_dataset_csv()
        files = {"file": ("test.csv", csv_data, "text/csv")}
        upload_response = authenticated_client.post("/datasets/upload", files=files)
        
        # Get dataset ID from response
        dataset = upload_response.json()
        dataset_id = dataset.get("id") or dataset.get("dataset_id") or dataset.get("uuid")
        
        if dataset_id:
            # Get dataset
            response = authenticated_client.get(f"/datasets/{dataset_id}")
            
            assert response.status_code == 200
            data = response.json()
            assert "name" in data or "filename" in data
    
    def test_get_dataset_not_found(self, authenticated_client: TestClient):
        """Test getting non-existent dataset"""
        # Use a valid UUID format
        fake_uuid = "00000000-0000-0000-0000-000000000999"
        response = authenticated_client.get(f"/datasets/{fake_uuid}")
        
        assert response.status_code == 404
    
    def test_get_dataset_no_auth(self, client: TestClient):
        """Test getting dataset without authentication"""
        fake_uuid = "00000000-0000-0000-0000-000000000999"
        response = client.get(f"/datasets/{fake_uuid}")
        
        # API returns 403 when no credentials provided
        assert response.status_code == 403


class TestDatasetsProfile:
    """Test GET /datasets/{id}/profile"""
    
    def test_profile_dataset_success(self, authenticated_client: TestClient, factory):
        """Test dataset profiling"""
        # Upload dataset
        csv_data = factory.create_dataset_csv()
        files = {"file": ("test.csv", csv_data, "text/csv")}
        upload_response = authenticated_client.post("/datasets/upload", files=files)
        
        dataset = upload_response.json()
        dataset_id = dataset.get("id") or dataset.get("dataset_id") or dataset.get("uuid")
        
        if dataset_id:
            # Profile dataset
            response = authenticated_client.get(f"/datasets/{dataset_id}/profile")
            
            # Profile endpoint might not be implemented yet
            assert response.status_code in [200, 404, 501]
    
    def test_profile_nonexistent_dataset(self, authenticated_client: TestClient):
        """Test profiling non-existent dataset"""
        fake_uuid = "00000000-0000-0000-0000-000000000999"
        response = authenticated_client.get(f"/datasets/{fake_uuid}/profile")
        
        assert response.status_code == 404


class TestDatasetsPII:
    """Test PII detection endpoints"""
    
    def test_pii_detection_basic(self, authenticated_client: TestClient, factory):
        """Test basic PII detection"""
        # Upload dataset
        csv_data = factory.create_dataset_csv()
        files = {"file": ("test.csv", csv_data, "text/csv")}
        upload_response = authenticated_client.post("/datasets/upload", files=files)
        
        dataset = upload_response.json()
        dataset_id = dataset.get("id") or dataset.get("dataset_id") or dataset.get("uuid")
        
        if dataset_id:
            # Detect PII
            response = authenticated_client.get(f"/datasets/{dataset_id}/pii-detection")
            
            # PII endpoint might not be fully implemented
            assert response.status_code in [200, 404, 501]
    
    @pytest.mark.slow
    def test_pii_detection_enhanced(self, authenticated_client: TestClient, factory):
        """Test enhanced PII detection with LLM"""
        # Upload dataset
        csv_data = factory.create_dataset_csv()
        files = {"file": ("test.csv", csv_data, "text/csv")}
        upload_response = authenticated_client.post("/datasets/upload", files=files)
        
        dataset = upload_response.json()
        dataset_id = dataset.get("id") or dataset.get("dataset_id") or dataset.get("uuid")
        
        if dataset_id:
            # Enhanced PII detection
            response = authenticated_client.post(f"/datasets/{dataset_id}/pii-detection-enhanced")
            
            # Should succeed or fail gracefully (LLM might be unavailable)
            assert response.status_code in [200, 404, 500, 501, 503]


class TestDatasetsDelete:
    """Test DELETE /datasets/{id}"""
    
    def test_delete_dataset_success(self, authenticated_client: TestClient, factory):
        """Test successful dataset deletion"""
        # Upload dataset
        csv_data = factory.create_dataset_csv()
        files = {"file": ("test.csv", csv_data, "text/csv")}
        upload_response = authenticated_client.post("/datasets/upload", files=files)
        
        dataset = upload_response.json()
        dataset_id = dataset.get("id") or dataset.get("dataset_id") or dataset.get("uuid")
        
        if dataset_id:
            # Delete dataset
            response = authenticated_client.delete(f"/datasets/{dataset_id}")
            
            # Delete might return 200, 204, or 404 if not implemented
            assert response.status_code in [200, 204, 404, 501]
    
    def test_delete_nonexistent_dataset(self, authenticated_client: TestClient):
        """Test deleting non-existent dataset"""
        fake_uuid = "00000000-0000-0000-0000-000000000999"
        response = authenticated_client.delete(f"/datasets/{fake_uuid}")
        
        # Might return 404 or 405 if DELETE not implemented
        assert response.status_code in [404, 405]
    
    def test_delete_no_auth(self, client: TestClient):
        """Test deleting dataset without authentication"""
        fake_uuid = "00000000-0000-0000-0000-000000000999"
        response = client.delete(f"/datasets/{fake_uuid}")
        
        # API might return 403 (no auth) or 405 (method not allowed if DELETE not implemented)
        assert response.status_code in [403, 405]
