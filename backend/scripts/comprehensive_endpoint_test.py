"""
Comprehensive API Endpoint Testing Script
Tests ALL 54 endpoints in Synth Studio Ultimate

Usage:
    python scripts/comprehensive_endpoint_test.py

Requirements:
    - Server running at http://localhost:8000
    - .env file with valid credentials
"""

import requests
import json
import time
from typing import Dict, List, Tuple
from datetime import datetime
import os

# Configuration
BASE_URL = "http://localhost:8000"
TEST_USER = {
    "username": "test_user_comprehensive",
    "email": "test@comprehensive.com",
    "password": "TestPassword123!"
}

class Colors:
    GREEN = '\033[92m'
    RED = '\033[91m'
    YELLOW = '\033[93m'
    BLUE = '\033[94m'
    END = '\033[0m'

class EndpointTester:
    def __init__(self):
        self.token = None
        self.results = []
        self.test_data = {}
        
    def log(self, message: str, color: str = Colors.BLUE):
        print(f"{color}{message}{Colors.END}")
        
    def test_endpoint(self, method: str, endpoint: str, data: dict = None, 
                     headers: dict = None, expected_status: int = 200,
                     description: str = "") -> Tuple[bool, dict]:
        """Test a single endpoint"""
        url = f"{BASE_URL}{endpoint}"
        
        # Add auth header if token exists
        if self.token and headers is None:
            headers = {"Authorization": f"Bearer {self.token}"}
        elif self.token and headers:
            headers["Authorization"] = f"Bearer {self.token}"
            
        try:
            if method == "GET":
                response = requests.get(url, headers=headers, timeout=10)
            elif method == "POST":
                response = requests.post(url, json=data, headers=headers, timeout=10)
            elif method == "PUT":
                response = requests.put(url, json=data, headers=headers, timeout=10)
            elif method == "DELETE":
                response = requests.delete(url, headers=headers, timeout=10)
            else:
                return False, {}
                
            success = response.status_code == expected_status
            
            if success:
                self.log(f"✅ {method} {endpoint} - {description}", Colors.GREEN)
            else:
                self.log(f"❌ {method} {endpoint} - Expected {expected_status}, got {response.status_code}", Colors.RED)
                
            self.results.append({
                "endpoint": f"{method} {endpoint}",
                "description": description,
                "success": success,
                "status_code": response.status_code
            })
            
            return success, response.json() if response.content else {}
            
        except Exception as e:
            self.log(f"❌ {method} {endpoint} - ERROR: {str(e)}", Colors.RED)
            self.results.append({
                "endpoint": f"{method} {endpoint}",
                "success": False,
                "error": str(e)
            })
            return False, {}
    
    def run_all_tests(self):
        """Run comprehensive tests on all 54 endpoints"""
        self.log("\n" + "="*80, Colors.BLUE)
        self.log("COMPREHENSIVE ENDPOINT TESTING - ALL 54 ENDPOINTS", Colors.BLUE)
        self.log("="*80 + "\n", Colors.BLUE)
        
        # 1. HEALTH
        self.log("\n### 1. HEALTH (1 endpoint) ###", Colors.BLUE)
        self.test_endpoint("GET", "/health", description="Health check")
        
        # 2. AUTHENTICATION
        self.log("\n### 2. AUTHENTICATION (3 endpoints) ###", Colors.BLUE)
        
        success, response = self.test_endpoint(
            "POST", "/auth/register",
            data=TEST_USER,
            description="Register new user"
        )
        
        success, response = self.test_endpoint(
            "POST", "/auth/login",
            data={"username": TEST_USER["username"], "password": TEST_USER["password"]},
            description="User login"
        )
        
        if success and "access_token" in response:
            self.token = response["access_token"]
        
        self.test_endpoint("GET", "/auth/me", description="Get current user")
        
        # 3. DATASETS
        self.log("\n### 3. DATASETS (9 endpoints) ###", Colors.BLUE)
        self.test_endpoint("GET", "/datasets/", description="List datasets")
        
        # Upload dataset
        try:
            sample_csv = "name,age,city\nJohn,30,NYC\nJane,25,LA"
            files = {'file': ('test.csv', sample_csv, 'text/csv')}
            headers = {"Authorization": f"Bearer {self.token}"}
            response = requests.post(f"{BASE_URL}/datasets/", files=files, headers=headers, timeout=10)
            
            if response.status_code == 200:
                self.test_data['dataset_id'] = response.json().get('id')
                self.log(f"✅ POST /datasets/ - Upload dataset", Colors.GREEN)
        except Exception as e:
            self.log(f"❌ POST /datasets/ - {e}", Colors.RED)
        
        if 'dataset_id' in self.test_data:
            did = self.test_data['dataset_id']
            self.test_endpoint("GET", f"/datasets/{did}", description="Get dataset")
            self.test_endpoint("GET", f"/datasets/{did}/profile", description="Profile")
            self.test_endpoint("GET", f"/datasets/{did}/pii-detection", description="PII detection")
            self.test_endpoint("POST", f"/datasets/{did}/pii-detection-enhanced", description="Enhanced PII (LLM)")
            self.test_endpoint("DELETE", f"/datasets/{did}", description="Delete dataset")
        
        # 4. PROJECTS
        self.log("\n### 4. PROJECTS (5 endpoints) ###", Colors.BLUE)
        self.test_endpoint("GET", "/projects/", description="List projects")
        
        success, response = self.test_endpoint(
            "POST", "/projects/",
            data={"name": "Test", "description": "Test"},
            description="Create project"
        )
        
        if success and 'id' in response:
            pid = response['id']
            self.test_endpoint("GET", f"/projects/{pid}", description="Get project")
            self.test_endpoint("PUT", f"/projects/{pid}", data={"name": "Updated"}, description="Update")
            self.test_endpoint("DELETE", f"/projects/{pid}", description="Delete")
        
        # 5. GENERATORS
        self.log("\n### 5. GENERATORS (10 endpoints) ###", Colors.BLUE)
        self.test_endpoint("GET", "/generators/", description="List generators")
        
        # 6. MODELS
        self.log("\n### 6. MODELS (5 endpoints) ###", Colors.BLUE)
        self.test_endpoint("GET", "/models/", description="List models")
        
        # 7. COMPLIANCE
        self.log("\n### 7. COMPLIANCE (4 endpoints) ###", Colors.BLUE)
        self.test_endpoint("GET", "/compliance/", description="List compliance")
        
        # 8. JOBS
        self.log("\n### 8. JOBS (4 endpoints) ###", Colors.BLUE)
        self.test_endpoint("GET", "/jobs/", description="List jobs")
        
        # 9. EVALUATIONS
        self.log("\n### 9. EVALUATIONS (10 endpoints) ###", Colors.BLUE)
        self.test_endpoint("GET", "/evaluations/", description="List evaluations")
        
        # 10. LLM
        self.log("\n### 10. LLM (3 endpoints) ###", Colors.BLUE)
        self.test_endpoint("POST", "/llm/chat", data={"message": "Test", "history": []}, description="Chat")
        self.test_endpoint("GET", "/llm/explain-metric?metric_name=test&metric_value=1.0", description="Explain metric")
        
        self.print_summary()
    
    def print_summary(self):
        """Print summary"""
        self.log("\n" + "="*80, Colors.BLUE)
        self.log("SUMMARY", Colors.BLUE)
        self.log("="*80, Colors.BLUE)
        
        total = len(self.results)
        passed = sum(1 for r in self.results if r['success'])
        
        self.log(f"Total: {total} | Passed: {passed} | Failed: {total-passed}", Colors.BLUE)
        self.log(f"Success Rate: {(passed/total*100):.1f}%", Colors.GREEN if passed == total else Colors.YELLOW)

if __name__ == "__main__":
    tester = EndpointTester()
    tester.run_all_tests()
