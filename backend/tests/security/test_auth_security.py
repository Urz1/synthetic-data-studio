"""
Security tests for Authentication and Token Security.
"""

import pytest
from app.auth.services import create_access_token

class TestAuthSecurity:
    """Authentication security tests"""
    
    def test_expired_token(self, client):
        """Test accessing protected endpoint with expired token"""
        from datetime import timedelta
        
        # Create token expired 1 hour ago
        token = create_access_token(
            data={"sub": "test@example.com"},
            expires_delta=timedelta(hours=-1)
        )
        
        client.headers.update({"Authorization": f"Bearer {token}"})
        response = client.get("/datasets/")
        
        assert response.status_code == 401
        # Exact message depends on implementation, but should be 401

    def test_invalid_signature(self, client):
        """Test token with invalid signature"""
        # Create valid token
        token = create_access_token(data={"sub": "test@example.com"})
        
        # Tamper with the signature (last part of JWT)
        parts = token.split('.')
        # Just replace signature with garbage
        parts[2] = "invalid_signature_garbage_data"
        tampered_token = '.'.join(parts)
        
        client.headers.update({"Authorization": f"Bearer {tampered_token}"})
        response = client.get("/datasets/")
        
        assert response.status_code == 401

    def test_none_algorithm(self, client):
        """Test token with 'none' algorithm (critical vulnerability)"""
        # Manually create token with 'none' algorithm
        import base64
        import json
        
        header = base64.urlsafe_b64encode(json.dumps({"alg": "none", "typ": "JWT"}).encode()).decode().rstrip('=')
        payload = base64.urlsafe_b64encode(json.dumps({"sub": "test@example.com"}).encode()).decode().rstrip('=')
        token = f"{header}.{payload}."
        
        client.headers.update({"Authorization": f"Bearer {token}"})
        response = client.get("/datasets/")
        
        assert response.status_code == 401
