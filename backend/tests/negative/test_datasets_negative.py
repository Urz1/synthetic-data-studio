"""
Negative and edge case tests for Dataset endpoints.

Tests invalid inputs, boundary conditions, and error handling for:
- POST /datasets/upload
- GET /datasets/{id}
- GET /datasets/{id}/download
- DELETE /datasets/{id}
- GET /datasets/{id}/info
"""

import pytest
from fastapi.testclient import TestClient
import io
import uuid


class TestDatasetUploadNegative:
    """Negative tests for POST /datasets/upload"""
    
    def test_upload_missing_file(self, authenticated_client: TestClient):
        """Test upload without file"""
        response = authenticated_client.post("/datasets/upload")
        
        assert response.status_code == 422  # Missing required field
    
    def test_upload_empty_csv(self, authenticated_client: TestClient):
        """Test upload with empty CSV file"""
        empty_file = io.BytesIO(b"")
        files = {"file": ("empty.csv", empty_file, "text/csv")}
        
        response = authenticated_client.post("/datasets/upload", files=files)
        
        # Should fail - no data to process
        assert response.status_code in [400, 422, 500]
    
    def test_upload_csv_headers_only(self, authenticated_client: TestClient):
        """Test upload with CSV containing only headers"""
        csv_content = "name,age,city"  # Just headers, no data
        files = {"file": ("headers_only.csv", csv_content, "text/csv")}
        
        response = authenticated_client.post("/datasets/upload", files=files)
        
        # Should fail or succeed with 0 rows
        assert response.status_code in [200, 400, 422]
    
    def test_upload_malformed_csv(self, authenticated_client: TestClient):
        """Test upload with malformed CSV (inconsistent columns)"""
        csv_content = """name,age,city
John,30,NYC
Jane,25
Bob,35,Chicago,Extra"""
        files = {"file": ("malformed.csv", csv_content, "text/csv")}
        
        response = authenticated_client.post("/datasets/upload", files=files)
        
        # pandas might handle this gracefully or fail
        assert response.status_code in [200, 400, 422, 500]
    
    def test_upload_csv_broken_quotes(self, authenticated_client: TestClient):
        """Test upload with broken quotes in CSV"""
        csv_content = """name,age,city
"John,30,NYC
Jane,25,LA"""
        files = {"file": ("broken.csv", csv_content, "text/csv")}
        
        response = authenticated_client.post("/datasets/upload", files=files)
        
        # Pandas might handle or fail
        assert response.status_code in [200, 400, 422, 500]
    
    def test_upload_non_csv_file(self, authenticated_client: TestClient):
        """Test upload with non-CSV file"""
        # Try uploading a fake PDF
        pdf_content = b"%PDF-1.4\n%fake pdf content"
        files = {"file": ("document.pdf", pdf_content, "application/pdf")}
        
        response = authenticated_client.post("/datasets/upload", files=files)
        
        # Should reject non-CSV files
        assert response.status_code in [400, 415, 422]
    
    def test_upload_image_as_csv(self, authenticated_client: TestClient):
        """Test upload with image file disguised as CSV"""
        # Upload PNG with .csv extension
        png_data = b"\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR"
        files = {"file": ("fake.csv", png_data, "text/csv")}
        
        response = authenticated_client.post("/datasets/upload", files=files)
        
        # Should fail when trying to parse
        assert response.status_code in [400, 422, 500]
    
    def test_upload_special_chars_filename(self, authenticated_client: TestClient):
        """Test upload with special characters in filename"""
        csv_content = "name,age\nJohn,30"
        special_names = [
            "file<script>.csv",
            "file;rm -rf.csv",
            "../../../etc/passwd.csv"
        ]
        
        for filename in special_names:
            files = {"file": (filename, csv_content, "text/csv")}
            response = authenticated_client.post("/datasets/upload", files=files)
            
            # Should sanitize filename or reject
            assert response.status_code in [200, 400, 422]
    
    def test_upload_very_long_filename(self, authenticated_client: TestClient):
        """Test upload with very long filename"""
        csv_content = "name,age\nJohn,30"
        long_name = "a" * 300 + ".csv"  # Exceeds typical filesystem limits
        files = {"file": (long_name, csv_content, "text/csv")}
        
        response = authenticated_client.post("/datasets/upload", files=files)
        
        # Should truncate or reject
        assert response.status_code in [200, 400, 422]


class TestDatasetGetNegative:
    """Negative tests for GET /datasets/{id}"""
    
    def test_get_invalid_uuid_format(self, authenticated_client: TestClient):
        """Test get with invalid UUID format"""
        invalid_ids = [
            "not-a-uuid",
            "12345",
            "abc-def-ghi",
            "00000000-0000-0000-0000-000000000"  # Too short
        ]
        
        for invalid_id in invalid_ids:
            response = authenticated_client.get(f"/datasets/{invalid_id}")
            assert response.status_code in [400, 422], f"Failed for ID: {invalid_id}"
    
    def test_get_nonexistent_uuid(self, authenticated_client: TestClient):
        """Test get with valid but non-existent UUID"""
        fake_uuid = str(uuid.uuid4())
        response = authenticated_client.get(f"/datasets/{fake_uuid}")
        
        assert response.status_code == 404
    
    def test_get_no_auth(self, client: TestClient):
        """Test get without authentication"""
        fake_uuid = str(uuid.uuid4())
        response = client.get(f"/datasets/{fake_uuid}")
        
        assert response.status_code == 403


class TestDatasetDownloadNegative:
    """Negative tests for GET /datasets/{id}/download"""
    
    def test_download_nonexistent_dataset(self, authenticated_client: TestClient):
        """Test download with non-existent dataset"""
        fake_uuid = str(uuid.uuid4())
        response = authenticated_client.get(f"/datasets/{fake_uuid}/download")
        
        assert response.status_code == 404
    
    def test_download_invalid_uuid(self, authenticated_client: TestClient):
        """Test download with invalid UUID"""
        response = authenticated_client.get("/datasets/invalid-id/download")
        
        assert response.status_code in [400, 422]
    
    def test_download_no_auth(self, client: TestClient):
        """Test download without authentication"""
        fake_uuid = str(uuid.uuid4())
        response = client.get(f"/datasets/{fake_uuid}/download")
        
        assert response.status_code == 403


class TestDatasetDeleteNegative:
    """Negative tests for DELETE /datasets/{id}"""
    
    def test_delete_nonexistent_dataset(self, authenticated_client: TestClient):
        """Test delete with non-existent dataset"""
        fake_uuid = str(uuid.uuid4())
        response = authenticated_client.delete(f"/datasets/{fake_uuid}")
        
        assert response.status_code == 404
    
    def test_delete_invalid_uuid(self, authenticated_client: TestClient):
        """Test delete with invalid UUID"""
        response = authenticated_client.delete("/datasets/invalid-id")
        
        assert response.status_code in [400, 422]
    
    def test_delete_no_auth(self, client: TestClient):
        """Test delete without authentication"""
        fake_uuid = str(uuid.uuid4())
        response = client.delete(f"/datasets/{fake_uuid}")
        
        assert response.status_code == 403
    
    def test_delete_already_deleted(self, authenticated_client: TestClient):
        """Test deleting an already deleted dataset"""
        # Upload a dataset
        csv_content = "name,age\nJohn,30"
        files = {"file": ("test.csv", csv_content, "text/csv")}
        upload_response = authenticated_client.post("/datasets/upload", files=files)
        
        if upload_response.status_code == 200:
            dataset_id = upload_response.json()["id"]
            
            # Delete once
            response1 = authenticated_client.delete(f"/datasets/{dataset_id}")
            assert response1.status_code == 200
            
            # Delete again - should fail
            response2 = authenticated_client.delete(f"/datasets/{dataset_id}")
            assert response2.status_code in [404, 410]  # Gone or Not Found


