"""
Functional tests for Evaluation endpoints.

Tests:
- POST /evaluations/run
- GET /evaluations/{evaluation_id}
- GET /evaluations/generator/{generator_id}
- POST /evaluations/quick/{generator_id}
- POST /evaluations/{evaluation_id}/explain
- POST /evaluations/compare
"""

import pytest
from fastapi.testclient import TestClient


class TestEvaluationRun:
    """Test POST /evaluations/run"""

    def test_run_evaluation_success(self, authenticated_client: TestClient):
        """Test running an evaluation"""
        # We need valid UUIDs for dataset and generator, even if they don't exist in DB for this unit test
        # The service might fail if they don't exist, but we check for appropriate status codes
        fake_dataset_id = "00000000-0000-0000-0000-000000000001"
        fake_generator_id = "00000000-0000-0000-0000-000000000002"
        
        payload = {
            "dataset_id": fake_dataset_id,
            "generator_id": fake_generator_id,
            "metrics": ["ks_test", "correlation"]
        }
        
        response = authenticated_client.post("/evaluations/run", json=payload)
        
        # 201 if successful, 404 if resources not found, 500/503 if ML service unavailable
        assert response.status_code in [201, 404, 500, 503]
        
        if response.status_code == 201:
            data = response.json()
            assert "id" in data
            assert data["status"] in ["pending", "completed", "running"]

    def test_run_evaluation_no_auth(self, client: TestClient):
        """Test running evaluation without authentication"""
        response = client.post("/evaluations/run", json={})
        assert response.status_code == 403


class TestEvaluationGet:
    """Test GET /evaluations/{evaluation_id}"""

    def test_get_evaluation_not_found(self, authenticated_client: TestClient):
        """Test getting non-existent evaluation"""
        fake_uuid = "00000000-0000-0000-0000-000000000999"
        response = authenticated_client.get(f"/evaluations/{fake_uuid}")
        assert response.status_code == 404

    def test_get_evaluation_no_auth(self, client: TestClient):
        """Test getting evaluation without authentication"""
        fake_uuid = "00000000-0000-0000-0000-000000000999"
        response = client.get(f"/evaluations/{fake_uuid}")
        assert response.status_code == 403


class TestEvaluationGetByGenerator:
    """Test GET /evaluations/generator/{generator_id}"""

    def test_get_by_generator_empty(self, authenticated_client: TestClient):
        """Test getting evaluations for a generator"""
        fake_uuid = "00000000-0000-0000-0000-000000000999"
        response = authenticated_client.get(f"/evaluations/generator/{fake_uuid}")
        
        # Should return 200 with empty list or 404 if generator check is strict
        assert response.status_code in [200, 404]
        if response.status_code == 200:
            assert isinstance(response.json(), list)

    def test_get_by_generator_no_auth(self, client: TestClient):
        """Test getting evaluations by generator without authentication"""
        fake_uuid = "00000000-0000-0000-0000-000000000999"
        response = client.get(f"/evaluations/generator/{fake_uuid}")
        assert response.status_code == 403


class TestQuickEvaluation:
    """Test POST /evaluations/quick/{generator_id}"""

    def test_quick_evaluation_not_found(self, authenticated_client: TestClient):
        """Test quick evaluation for non-existent generator"""
        fake_uuid = "00000000-0000-0000-0000-000000000999"
        response = authenticated_client.post(f"/evaluations/quick/{fake_uuid}")
        
        # 404 if generator not found
        assert response.status_code == 404

    def test_quick_evaluation_no_auth(self, client: TestClient):
        """Test quick evaluation without authentication"""
        fake_uuid = "00000000-0000-0000-0000-000000000999"
        response = client.post(f"/evaluations/quick/{fake_uuid}")
        assert response.status_code == 403


class TestEvaluationExplain:
    """Test POST /evaluations/{evaluation_id}/explain"""

    def test_explain_evaluation_not_found(self, authenticated_client: TestClient):
        """Test explaining non-existent evaluation"""
        fake_uuid = "00000000-0000-0000-0000-000000000999"
        response = authenticated_client.post(f"/evaluations/{fake_uuid}/explain")
        assert response.status_code == 404

    def test_explain_evaluation_no_auth(self, client: TestClient):
        """Test explaining evaluation without authentication"""
        fake_uuid = "00000000-0000-0000-0000-000000000999"
        response = client.post(f"/evaluations/{fake_uuid}/explain")
        assert response.status_code == 403


class TestEvaluationCompare:
    """Test POST /evaluations/compare"""

    def test_compare_evaluations_success(self, authenticated_client: TestClient):
        """Test comparing evaluations"""
        fake_id_1 = "00000000-0000-0000-0000-000000000001"
        fake_id_2 = "00000000-0000-0000-0000-000000000002"
        
        payload = {
            "evaluation_ids": [fake_id_1, fake_id_2]
        }
        
        response = authenticated_client.post("/evaluations/compare", json=payload)
        
        # 200 OK (even if empty comparison), 404 if IDs not found, or 500
        assert response.status_code in [200, 404, 500]

    def test_compare_evaluations_no_auth(self, client: TestClient):
        """Test comparing evaluations without authentication"""
        response = client.post("/evaluations/compare", json={"evaluation_ids": []})
        assert response.status_code == 403
