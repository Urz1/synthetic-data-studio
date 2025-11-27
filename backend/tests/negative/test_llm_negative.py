"""
Negative and edge case tests for LLM endpoints.

Tests invalid inputs and error handling.
"""

import pytest
from fastapi.testclient import TestClient


class TestLLMNegative:
    """Negative tests for LLM endpoints"""
    
    def test_generate_features_empty_schema(self, authenticated_client: TestClient):
        """Test feature generation with empty schema"""
        response = authenticated_client.post("/llm/generate-features", json={
            "schema": {}
        })
        
        assert response.status_code in [400, 422]
    
    def test_generate_features_invalid_schema(self, authenticated_client: TestClient):
        """Test feature generation with invalid schema format"""
        response = authenticated_client.post("/llm/generate-features", json={
            "schema": "not-a-dict"
        })
        
        assert response.status_code == 422
    
    def test_generate_features_missing_schema(self, authenticated_client: TestClient):
        """Test feature generation without schema"""
        response = authenticated_client.post("/llm/generate-features", json={})
        
        assert response.status_code == 422
    
    def test_detect_pii_empty_data(self, authenticated_client: TestClient):
        """Test PII detection with empty data"""
        response = authenticated_client.post("/llm/detect-pii", json={
            "data": []
        })
        
        assert response.status_code in [400, 422]
    
    def test_detect_pii_invalid_format(self, authenticated_client: TestClient):
        """Test PII detection with invalid data format"""
        response = authenticated_client.post("/llm/detect-pii", json={
            "data": "not-a-list"
        })
        
        assert response.status_code == 422
    
    def test_privacy_report_missing_fields(self, authenticated_client: TestClient):
        """Test privacy report with missing required fields"""
        response = authenticated_client.post("/llm/privacy-report", json={})
        
        assert response.status_code == 422
    
    def test_model_card_missing_fields(self, authenticated_client: TestClient):
        """Test model card generation with missing fields"""
        response = authenticated_client.post("/llm/model-card", json={})
        
        assert response.status_code == 422
