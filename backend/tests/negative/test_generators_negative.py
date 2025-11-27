"""
Negative and edge case tests for Generator endpoints.

Tests invalid inputs, boundary conditions, and error handling.
"""

import pytest
from fastapi.testclient import TestClient
import uuid


class TestGeneratorCreateNegative:
    """Negative tests for generator creation"""
    
    def test_create_invalid_type(self, authenticated_client: TestClient):
        """Test creating generator with invalid type"""
        dataset_id = str(uuid.uuid4())
        
        response = authenticated_client.post("/generators/", json={
            "dataset_id": dataset_id,
            "type": "invalid_type",
            "config": {}
        })
        
        assert response.status_code in [400, 422]
    
    def test_create_negative_epochs(self, authenticated_client: TestClient):
        """Test creating generator with negative epochs"""
        dataset_id = str(uuid.uuid4())
        
        response = authenticated_client.post("/generators/", json={
            "dataset_id": dataset_id,
            "type": "ctgan",
            "config": {"epochs": -10, "batch_size": 500}
        })
        
        assert response.status_code in [400, 422]
    
    def test_create_zero_epochs(self, authenticated_client: TestClient):
        """Test creating generator with zero epochs"""
        dataset_id = str(uuid.uuid4())
        
        response = authenticated_client.post("/generators/", json={
            "dataset_id": dataset_id,
            "type": "ctgan",
            "config": {"epochs": 0, "batch_size": 500}
        })
        
        assert response.status_code in [400, 422, 200]  # May or may not be allowed
    
    def test_create_invalid_dp_epsilon(self, authenticated_client: TestClient):
        """Test DP generator with invalid epsilon"""
        dataset_id = str(uuid.uuid4())
        
        response = authenticated_client.post("/generators/", json={
            "dataset_id": dataset_id,
            "type": "dp-ctgan",
            "config": {"epochs": 10, "batch_size": 500, "epsilon": -1.0, "delta": 1e-5}
        })
        
        assert response.status_code in [400, 422]
    
    def test_create_invalid_dp_delta(self, authenticated_client: TestClient):
        """Test DP generator with invalid delta"""
        dataset_id = str(uuid.uuid4())
        
        response = authenticated_client.post("/generators/", json={
            "dataset_id": dataset_id,
            "type": "dp-ctgan",
            "config": {"epochs": 10, "batch_size": 500, "epsilon": 10.0, "delta": 1.5}  # > 1
        })
        
        assert response.status_code in [400, 422]
    
    def test_create_nonexistent_dataset(self, authenticated_client: TestClient):
        """Test creating generator with non-existent dataset"""
        fake_dataset_id = str(uuid.uuid4())
        
        response = authenticated_client.post("/generators/", json={
            "dataset_id": fake_dataset_id,
            "type": "ctgan",
            "config": {"epochs": 10, "batch_size": 500}
        })
        
        assert response.status_code in [404, 400]


class TestGeneratorGetNegative:
    """Negative tests for generator GET operations"""
    
    def test_get_invalid_uuid(self, authenticated_client: TestClient):
        """Test get with invalid UUID"""
        response = authenticated_client.get("/generators/invalid-uuid")
        
        assert response.status_code in [400, 422]
    
    def test_get_nonexistent(self, authenticated_client: TestClient):
        """Test get with non-existent generator"""
        fake_id = str(uuid.uuid4())
        response = authenticated_client.get(f"/generators/{fake_id}")
        
        assert response.status_code == 404
    
    def test_get_no_auth(self, client: TestClient):
        """Test get without authentication"""
        fake_id = str(uuid.uuid4())
        response = client.get(f"/generators/{fake_id}")
        
        assert response.status_code == 403


class TestDPConfigNegative:
    """Negative tests for DP configuration validation"""
    
    def test_validate_negative_epsilon(self, authenticated_client: TestClient):
        """Test DP validation with negative epsilon"""
        response = authenticated_client.post("/generators/dp/validate-config", json={
            "epsilon": -1.0,
            "delta": 1e-5
        })
        
        assert response.status_code in [400, 422]
    
    def test_validate_invalid_delta(self, authenticated_client: TestClient):
        """Test DP validation with invalid delta"""
        response = authenticated_client.post("/generators/dp/validate-config", json={
            "epsilon": 10.0,
            "delta": 2.0  # > 1
        })
        
        assert response.status_code in [400, 422]
    
    def test_validate_missing_params(self, authenticated_client: TestClient):
        """Test DP validation with missing parameters"""
        response = authenticated_client.post("/generators/dp/validate-config", json={})
        
        assert response.status_code == 422
