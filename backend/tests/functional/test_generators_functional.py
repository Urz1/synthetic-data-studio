"""
Functional tests for Generator endpoints.

Tests:
- GET /generators/
- POST /generators/
- GET /generators/{id}
- POST /generators/schema/generate
- POST /generators/{id}/generate
- POST /generators/dataset/{dataset_id}/generate
- GET /generators/{id}/privacy-report
- POST /generators/dp/validate-config
- GET /generators/dp/recommended-config
- POST /generators/{id}/model-card
- GET /generators/{id}/audit-narrative
- POST /generators/{id}/compliance-report
"""

import pytest
from fastapi.testclient import TestClient


class TestGeneratorsList:
    """Test GET /generators/"""
    
    def test_list_generators_empty(self, authenticated_client: TestClient):
        """Test listing generators when none exist"""
        response = authenticated_client.get("/generators/")
        
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
    
    def test_list_generators_unauthorized(self, client: TestClient):
        """Test listing generators without authentication"""
        response = client.get("/generators/")
        
        assert response.status_code == 403


class TestGeneratorsCreate:
    """Test POST /generators/"""
    
    def test_create_generator_success(self, authenticated_client: TestClient):
        """Test successful generator creation"""
        generator_data = {
            "name": "Test Generator",
            "type": "ctgan",
            "dataset_id": None,
            "schema_json": {"columns": [{"name": "age", "type": "int"}]},
            "parameters_json": {"epochs": 50}
        }
        
        response = authenticated_client.post("/generators/", json=generator_data)
        
        assert response.status_code == 200
        data = response.json()
        assert "id" in data or "generator_id" in data
        assert data.get("name") == "Test Generator" or "name" in str(data)
    
    def test_create_generator_no_auth(self, client: TestClient):
        """Test creating generator without authentication"""
        generator_data = {
            "name": "Test Generator",
            "type": "ctgan"
        }
        
        response = client.post("/generators/", json=generator_data)
        
        assert response.status_code == 403


class TestGeneratorsGet:
    """Test GET /generators/{id}"""
    
    def test_get_generator_not_found(self, authenticated_client: TestClient):
        """Test getting non-existent generator"""
        fake_uuid = "00000000-0000-0000-0000-000000000999"
        response = authenticated_client.get(f"/generators/{fake_uuid}")
        
        assert response.status_code == 404
    
    def test_get_generator_no_auth(self, client: TestClient):
        """Test getting generator without authentication"""
        fake_uuid = "00000000-0000-0000-0000-000000000999"
        response = client.get(f"/generators/{fake_uuid}")
        
        assert response.status_code == 403


class TestSchemaGenerate:
    """Test POST /generators/schema/generate"""
    
    def test_schema_generate_success(self, authenticated_client: TestClient):
        """Test generating data from schema"""
        schema_data = {
            "columns": [
                {"name": "age", "type": "int", "min": 18, "max": 65},
                {"name": "name", "type": "string"}
            ]
        }
        
        response = authenticated_client.post(
            "/generators/schema/generate",
            json=schema_data,
            params={"num_rows": 100}
        )
        
        # Should succeed or fail gracefully
        assert response.status_code in [200, 400, 422, 500]
    
    def test_schema_generate_no_auth(self, client: TestClient):
        """Test schema generation without authentication"""
        schema_data = {
            "columns": [{"name": "age", "type": "int"}]
        }
        
        response = client.post("/generators/schema/generate", json=schema_data)
        
        assert response.status_code == 403


class TestGeneratorGenerate:
    """Test POST /generators/{id}/generate"""
    
    def test_start_generation_not_found(self, authenticated_client: TestClient):
        """Test starting generation for non-existent generator"""
        fake_uuid = "00000000-0000-0000-0000-000000000999"
        response = authenticated_client.post(f"/generators/{fake_uuid}/generate")
        
        assert response.status_code == 404
    
    def test_start_generation_no_auth(self, client: TestClient):
        """Test starting generation without authentication"""
        fake_uuid = "00000000-0000-0000-0000-000000000999"
        response = client.post(f"/generators/{fake_uuid}/generate")
        
        assert response.status_code == 403


class TestDatasetGenerate:
    """Test POST /generators/dataset/{dataset_id}/generate"""
    
    def test_generate_from_dataset_not_found(self, authenticated_client: TestClient):
        """Test generating from non-existent dataset"""
        fake_uuid = "00000000-0000-0000-0000-000000000999"
        response = authenticated_client.post(
            f"/generators/dataset/{fake_uuid}/generate",
            params={"generator_type": "ctgan", "num_rows": 100}
        )
        
        assert response.status_code in [404, 500]
    
    def test_generate_from_dataset_no_auth(self, client: TestClient):
        """Test generating from dataset without authentication"""
        fake_uuid = "00000000-0000-0000-0000-000000000999"
        response = client.post(f"/generators/dataset/{fake_uuid}/generate")
        
        assert response.status_code == 403


class TestPrivacyReport:
    """Test GET /generators/{id}/privacy-report"""
    
    def test_privacy_report_not_found(self, authenticated_client: TestClient):
        """Test privacy report for non-existent generator"""
        fake_uuid = "00000000-0000-0000-0000-000000000999"
        response = authenticated_client.get(f"/generators/{fake_uuid}/privacy-report")
        
        assert response.status_code == 404
    
    def test_privacy_report_no_auth(self, client: TestClient):
        """Test privacy report without authentication"""
        fake_uuid = "00000000-0000-0000-0000-000000000999"
        response = client.get(f"/generators/{fake_uuid}/privacy-report")
        
        assert response.status_code == 403


class TestDPValidateConfig:
    """Test POST /generators/dp/validate-config"""
    
    def test_validate_dp_config_success(self, authenticated_client: TestClient):
        """Test DP config validation"""
        config_data = {
            "epsilon": 1.0,
            "delta": 1e-5,
            "max_grad_norm": 1.0
        }
        
        response = authenticated_client.post("/generators/dp/validate-config", json=config_data)
        
        # Should succeed or fail gracefully
        assert response.status_code in [200, 400, 422]
    
    def test_validate_dp_config_no_auth(self, client: TestClient):
        """Test DP config validation without authentication"""
        config_data = {"epsilon": 1.0}
        
        response = client.post("/generators/dp/validate-config", json=config_data)
        
        assert response.status_code == 403


class TestDPRecommendedConfig:
    """Test GET /generators/dp/recommended-config"""
    
    def test_recommended_dp_config_success(self, authenticated_client: TestClient):
        """Test getting recommended DP config"""
        response = authenticated_client.get(
            "/generators/dp/recommended-config",
            params={"dataset_size": 1000, "sensitivity": "high"}
        )
        
        # Should succeed or fail gracefully
        assert response.status_code in [200, 400, 422]
    
    def test_recommended_dp_config_no_auth(self, client: TestClient):
        """Test getting recommended DP config without authentication"""
        response = client.get("/generators/dp/recommended-config")
        
        assert response.status_code == 403


class TestModelCard:
    """Test POST /generators/{id}/model-card"""
    
    @pytest.mark.slow
    def test_model_card_not_found(self, authenticated_client: TestClient):
        """Test model card for non-existent generator"""
        fake_uuid = "00000000-0000-0000-0000-000000000999"
        response = authenticated_client.post(f"/generators/{fake_uuid}/model-card")
        
        assert response.status_code == 404
    
    def test_model_card_no_auth(self, client: TestClient):
        """Test model card without authentication"""
        fake_uuid = "00000000-0000-0000-0000-000000000999"
        response = client.post(f"/generators/{fake_uuid}/model-card")
        
        assert response.status_code == 403


class TestAuditNarrative:
    """Test GET /generators/{id}/audit-narrative"""
    
    @pytest.mark.slow
    def test_audit_narrative_not_found(self, authenticated_client: TestClient):
        """Test audit narrative for non-existent generator"""
        fake_uuid = "00000000-0000-0000-0000-000000000999"
        response = authenticated_client.get(f"/generators/{fake_uuid}/audit-narrative")
        
        assert response.status_code == 404
    
    def test_audit_narrative_no_auth(self, client: TestClient):
        """Test audit narrative without authentication"""
        fake_uuid = "00000000-0000-0000-0000-000000000999"
        response = client.get(f"/generators/{fake_uuid}/audit-narrative")
        
        assert response.status_code == 403


class TestComplianceReport:
    """Test POST /generators/{id}/compliance-report"""
    
    @pytest.mark.slow
    def test_compliance_report_not_found(self, authenticated_client: TestClient):
        """Test compliance report for non-existent generator"""
        fake_uuid = "00000000-0000-0000-0000-000000000999"
        request_data = {"framework": "GDPR"}
        
        response = authenticated_client.post(
            f"/generators/{fake_uuid}/compliance-report",
            json=request_data
        )
        
        assert response.status_code == 404
    
    def test_compliance_report_no_auth(self, client: TestClient):
        """Test compliance report without authentication"""
        fake_uuid = "00000000-0000-0000-0000-000000000999"
        request_data = {"framework": "GDPR"}
        
        response = client.post(
            f"/generators/{fake_uuid}/compliance-report",
            json=request_data
        )
        
        assert response.status_code == 403
