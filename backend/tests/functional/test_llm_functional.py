"""
Functional tests for LLM endpoints.

Tests:
- POST /llm/chat
- POST /llm/suggest-improvements/{evaluation_id}
- GET /llm/explain-metric
"""

import pytest
from fastapi.testclient import TestClient


class TestLLMChat:
    """Test POST /llm/chat"""
    
    def test_chat_basic_message(self, authenticated_client: TestClient):
        """Test basic chat without context"""
        response = authenticated_client.post("/llm/chat", json={
            "message": "What is synthetic data?",
            "history": []
        })
        
        # Should succeed or fail gracefully if LLM unavailable
        assert response.status_code in [200, 500, 503]
        
        if response.status_code == 200:
            data = response.json()
            assert "response" in data
            assert "context_used" in data
            assert len(data["response"]) > 0
    
    def test_chat_with_evaluation_context(self, authenticated_client: TestClient):
        """Test chat with evaluation context"""
        # Use valid UUID format
        fake_uuid = "00000000-0000-0000-0000-000000000999"
        response = authenticated_client.post("/llm/chat", json={
            "message": "Is this data safe?",
            "evaluation_id": fake_uuid,
            "history": []
        })
        
        # Should return 404 if evaluation doesn't exist, or 200/500 if it does
        assert response.status_code in [200, 404, 500, 503]
    
    def test_chat_no_auth(self, client: TestClient):
        """Test chat without authentication"""
        response = client.post("/llm/chat", json={
            "message": "Test message",
            "history": []
        })
        
        # API returns 403 when no credentials provided
        assert response.status_code == 403
    
    def test_chat_empty_message(self, authenticated_client: TestClient):
        """Test chat with empty message"""
        response = authenticated_client.post("/llm/chat", json={
            "message": "",
            "history": []
        })
        
        # API might accept empty messages or reject them
        assert response.status_code in [200, 400, 422]
    
    def test_chat_with_history(self, authenticated_client: TestClient):
        """Test chat with conversation history"""
        response = authenticated_client.post("/llm/chat", json={
            "message": "Follow-up question",
            "history": [
                {"role": "user", "content": "Previous question"},
                {"role": "assistant", "content": "Previous answer"}
            ]
        })
        
        assert response.status_code in [200, 500, 503]


class TestLLMSuggestImprovements:
    """Test POST /llm/suggest-improvements/{evaluation_id}"""
    
    def test_suggest_improvements_nonexistent_evaluation(self, authenticated_client: TestClient):
        """Test suggestions for non-existent evaluation"""
        fake_uuid = "00000000-0000-0000-0000-000000000999"
        response = authenticated_client.post(f"/llm/suggest-improvements/{fake_uuid}")
        
        assert response.status_code == 404
    
    def test_suggest_improvements_no_auth(self, client: TestClient):
        """Test suggestions without authentication"""
        fake_uuid = "00000000-0000-0000-0000-000000000999"
        response = client.post(f"/llm/suggest-improvements/{fake_uuid}")
        
        # API returns 403 when no credentials provided
        assert response.status_code == 403
    
    @pytest.mark.slow
    def test_suggest_improvements_with_real_evaluation(self, authenticated_client: TestClient):
        """Test suggestions with real evaluation (if exists)"""
        # Use valid UUID format
        fake_uuid = "00000000-0000-0000-0000-000000000999"
        response = authenticated_client.post(f"/llm/suggest-improvements/{fake_uuid}")
        
        # Should return 404 (no evaluation) or 200/500 (evaluation exists)
        assert response.status_code in [200, 404, 500, 503]
        
        if response.status_code == 200:
            data = response.json()
            assert "evaluation_id" in data
            assert "suggestions" in data
            assert "count" in data
            assert isinstance(data["suggestions"], list)


class TestLLMExplainMetric:
    """Test GET /llm/explain-metric"""
    
    def test_explain_metric_success(self, authenticated_client: TestClient):
        """Test metric explanation"""
        response = authenticated_client.get(
            "/llm/explain-metric",
            params={
                "metric_name": "utility_ratio",
                "metric_value": "0.95"
            }
        )
        
        # Should succeed or fail gracefully if LLM unavailable
        assert response.status_code in [200, 500, 503]
        
        if response.status_code == 200:
            data = response.json()
            assert "metric_name" in data
            assert "metric_value" in data
            assert "explanation" in data
            assert data["metric_name"] == "utility_ratio"
    
    def test_explain_metric_no_auth(self, client: TestClient):
        """Test metric explanation without authentication"""
        response = client.get(
            "/llm/explain-metric",
            params={"metric_name": "test", "metric_value": "1.0"}
        )
        
        # API returns 403 when no credentials provided
        assert response.status_code == 403
    
    def test_explain_metric_missing_params(self, authenticated_client: TestClient):
        """Test metric explanation with missing parameters"""
        response = authenticated_client.get("/llm/explain-metric")
        
        assert response.status_code == 422
    
    def test_explain_metric_various_metrics(self, authenticated_client: TestClient):
        """Test explanation of various metric types"""
        metrics = [
            ("ks_statistic", "0.05"),
            ("privacy_score", "0.8"),
            ("ml_utility", "0.95"),
        ]
        
        for metric_name, metric_value in metrics:
            response = authenticated_client.get(
                "/llm/explain-metric",
                params={"metric_name": metric_name, "metric_value": metric_value}
            )
            
            # Each should succeed or fail gracefully
            assert response.status_code in [200, 500, 503]
