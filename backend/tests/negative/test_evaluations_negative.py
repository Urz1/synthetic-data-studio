"""
Negative and edge case tests for Evaluation endpoints.

Tests invalid inputs and error handling.
"""

import pytest
from fastapi.testclient import TestClient
import uuid


class TestEvaluationRunNegative:
    """Negative tests for POST /evaluations/run"""
    
    def test_run_nonexistent_generator(self, authenticated_client: TestClient):
        """Test evaluation with non-existent generator"""
        fake_gen_id = str(uuid.uuid4())
        fake_dataset_id = str(uuid.uuid4())
        
        response = authenticated_client.post("/evaluations/run", json={
            "generator_id": fake_gen_id,
            "dataset_id": fake_dataset_id
        })
        
        assert response.status_code in [404, 400]
    
    def test_run_nonexistent_dataset(self, authenticated_client: TestClient):
        """Test evaluation with non-existent dataset"""
        fake_gen_id = str(uuid.uuid4())
        fake_dataset_id = str(uuid.uuid4())
        
        response = authenticated_client.post("/evaluations/run", json={
            "generator_id": fake_gen_id,
            "dataset_id": fake_dataset_id
        })
        
        assert response.status_code in [404, 400]
    
    def test_run_invalid_uuid_format(self, authenticated_client: TestClient):
        """Test evaluation with invalid UUID format"""
        response = authenticated_client.post("/evaluations/run", json={
            "generator_id": "invalid-uuid",
            "dataset_id": "also-invalid"
        })
        
        assert response.status_code == 422
    
    def test_run_missing_required_fields(self, authenticated_client: TestClient):
        """Test evaluation with missing required fields"""
        response = authenticated_client.post("/evaluations/run", json={})
        
        assert response.status_code == 422


class TestEvaluationGetNegative:
    """Negative tests for evaluation GET operations"""
    
    def test_get_nonexistent(self, authenticated_client: TestClient):
        """Test get with non-existent evaluation"""
        fake_id = str(uuid.uuid4())
        response = authenticated_client.get(f"/evaluations/{fake_id}")
        
        assert response.status_code == 404
    
    def test_get_invalid_uuid(self, authenticated_client: TestClient):
        """Test get with invalid UUID"""
        response = authenticated_client.get("/evaluations/invalid-uuid")
        
        assert response.status_code in [400, 422]


class TestEvaluationCompareNegative:
    """Negative tests for POST /evaluations/compare"""
    
    def test_compare_empty_list(self, authenticated_client: TestClient):
        """Test compare with empty evaluation list"""
        response = authenticated_client.post("/evaluations/compare", json={
            "evaluation_ids": []
        })
        
        assert response.status_code in [400, 422]
    
    def test_compare_single_evaluation(self, authenticated_client: TestClient):
        """Test compare with only one evaluation"""
        fake_id = str(uuid.uuid4())
        response = authenticated_client.post("/evaluations/compare", json={
            "evaluation_ids": [fake_id]
        })
        
        assert response.status_code in [400, 422]
    
    def test_compare_too_many(self, authenticated_client: TestClient):
        """Test compare with too many evaluations (>5)"""
        fake_ids = [str(uuid.uuid4()) for _ in range(10)]
        response = authenticated_client.post("/evaluations/compare", json={
            "evaluation_ids": fake_ids
        })
        
        assert response.status_code in [400, 422]
    
    def test_compare_nonexistent(self, authenticated_client: TestClient):
        """Test compare with non-existent evaluations"""
        fake_ids = [str(uuid.uuid4()) for _ in range(2)]
        response = authenticated_client.post("/evaluations/compare", json={
            "evaluation_ids": fake_ids
        })
        
        assert response.status_code in [404, 400]
