#!/usr/bin/env python3
"""
Synth Studio Python SDK Quickstart

This example demonstrates the complete workflow for synthetic data generation
using a class-based SDK wrapper around the REST API.

Usage:
    python sdk_quickstart.py

Requirements:
    pip install requests pandas
"""

import os
import time
from typing import Optional, Dict, Any, List
import requests
import pandas as pd


class SynthStudioClient:
    """Python SDK client for Synth Studio API."""
    
    def __init__(self, base_url: str = "http://localhost:8000", token: Optional[str] = None):
        """
        Initialize the Synth Studio client.
        
        Args:
            base_url: API base URL (default: http://localhost:8000)
            token: JWT access token (optional, can login later)
        """
        self.base_url = base_url.rstrip("/")
        self.token = token
        self.session = requests.Session()
        
    @property
    def headers(self) -> Dict[str, str]:
        """Get authorization headers."""
        headers = {"Content-Type": "application/json"}
        if self.token:
            headers["Authorization"] = f"Bearer {self.token}"
        return headers
    
    # ==================== Authentication ====================
    
    def login(self, email: str, password: str) -> Dict[str, Any]:
        """
        Authenticate and store the access token.
        
        Args:
            email: User email
            password: User password
            
        Returns:
            Token response with access_token and refresh_token
        """
        response = self.session.post(
            f"{self.base_url}/auth/login",
            data={"username": email, "password": password}
        )
        response.raise_for_status()
        data = response.json()
        self.token = data["access_token"]
        return data
    
    def register(self, email: str, password: str, name: str) -> Dict[str, Any]:
        """
        Register a new user account.
        
        Args:
            email: User email
            password: User password
            name: Display name
            
        Returns:
            Created user data
        """
        response = self.session.post(
            f"{self.base_url}/auth/register",
            json={"email": email, "password": password, "name": name}
        )
        response.raise_for_status()
        return response.json()
    
    # ==================== Dataset Management ====================
    
    def upload_dataset(self, file_path: str, name: Optional[str] = None) -> Dict[str, Any]:
        """
        Upload a CSV dataset.
        
        Args:
            file_path: Path to CSV file
            name: Optional dataset name (defaults to filename)
            
        Returns:
            Created dataset metadata
        """
        with open(file_path, "rb") as f:
            files = {"file": (os.path.basename(file_path), f, "text/csv")}
            data = {"name": name} if name else {}
            response = self.session.post(
                f"{self.base_url}/datasets/upload",
                files=files,
                data=data,
                headers={"Authorization": f"Bearer {self.token}"}
            )
        response.raise_for_status()
        return response.json()
    
    def list_datasets(self) -> List[Dict[str, Any]]:
        """Get all datasets for the current user."""
        response = self.session.get(
            f"{self.base_url}/datasets/",
            headers=self.headers
        )
        response.raise_for_status()
        return response.json()
    
    def get_dataset(self, dataset_id: int) -> Dict[str, Any]:
        """Get dataset details by ID."""
        response = self.session.get(
            f"{self.base_url}/datasets/{dataset_id}",
            headers=self.headers
        )
        response.raise_for_status()
        return response.json()
    
    def profile_dataset(self, dataset_id: int) -> Dict[str, Any]:
        """Run data profiling on a dataset."""
        response = self.session.post(
            f"{self.base_url}/datasets/{dataset_id}/profile",
            headers=self.headers
        )
        response.raise_for_status()
        return response.json()
    
    def detect_pii(self, dataset_id: int, use_ai: bool = False) -> Dict[str, Any]:
        """
        Detect PII/PHI in a dataset.
        
        Args:
            dataset_id: Dataset ID
            use_ai: Use AI-enhanced detection (requires LLM API key)
        """
        endpoint = "pii/detect-enhanced" if use_ai else "pii/detect"
        response = self.session.post(
            f"{self.base_url}/datasets/{dataset_id}/{endpoint}",
            headers=self.headers
        )
        response.raise_for_status()
        return response.json()
    
    # ==================== Synthetic Data Generation ====================
    
    def create_generator(
        self,
        name: str,
        dataset_id: int,
        method: str = "ctgan",
        epochs: int = 300,
        enable_dp: bool = False,
        epsilon: float = 1.0,
        delta: float = 1e-5
    ) -> Dict[str, Any]:
        """
        Create a synthetic data generator.
        
        Args:
            name: Generator name
            dataset_id: Source dataset ID
            method: Synthesis method (ctgan, tvae, gaussian_copula, dp_ctgan, dp_tvae)
            epochs: Training epochs
            enable_dp: Enable differential privacy
            epsilon: Privacy budget (lower = more private)
            delta: Privacy parameter
            
        Returns:
            Created generator metadata
        """
        payload = {
            "name": name,
            "source_dataset_id": dataset_id,
            "method": method,
            "epochs": epochs,
        }
        
        if enable_dp:
            payload["enable_dp"] = True
            payload["epsilon"] = epsilon
            payload["delta"] = delta
            
        response = self.session.post(
            f"{self.base_url}/generators/",
            json=payload,
            headers=self.headers
        )
        response.raise_for_status()
        return response.json()
    
    def generate(self, generator_id: int, num_rows: int = 1000) -> Dict[str, Any]:
        """
        Generate synthetic data.
        
        Args:
            generator_id: Generator ID
            num_rows: Number of rows to generate
            
        Returns:
            Job information with status
        """
        response = self.session.post(
            f"{self.base_url}/generators/{generator_id}/generate",
            json={"num_rows": num_rows},
            headers=self.headers
        )
        response.raise_for_status()
        return response.json()
    
    def get_generator(self, generator_id: int) -> Dict[str, Any]:
        """Get generator details and status."""
        response = self.session.get(
            f"{self.base_url}/generators/{generator_id}",
            headers=self.headers
        )
        response.raise_for_status()
        return response.json()
    
    def wait_for_generation(self, generator_id: int, timeout: int = 300) -> Dict[str, Any]:
        """
        Wait for generation to complete.
        
        Args:
            generator_id: Generator ID
            timeout: Maximum seconds to wait
            
        Returns:
            Final generator status
        """
        start = time.time()
        while time.time() - start < timeout:
            generator = self.get_generator(generator_id)
            status = generator.get("status", "")
            
            if status == "completed":
                return generator
            elif status == "failed":
                raise Exception(f"Generation failed: {generator.get('error_message')}")
            
            print(f"Status: {status}... waiting")
            time.sleep(5)
            
        raise TimeoutError(f"Generation did not complete within {timeout} seconds")
    
    # ==================== Quality Evaluation ====================
    
    def evaluate(
        self,
        generator_id: int,
        metrics: List[str] = None
    ) -> Dict[str, Any]:
        """
        Run quality evaluation on generated data.
        
        Args:
            generator_id: Generator ID
            metrics: List of metrics to compute (default: all)
            
        Returns:
            Evaluation job information
        """
        payload = {}
        if metrics:
            payload["metrics"] = metrics
            
        response = self.session.post(
            f"{self.base_url}/evaluations/",
            json={"generator_id": generator_id, **payload},
            headers=self.headers
        )
        response.raise_for_status()
        return response.json()
    
    def get_evaluation(self, evaluation_id: int) -> Dict[str, Any]:
        """Get evaluation results."""
        response = self.session.get(
            f"{self.base_url}/evaluations/{evaluation_id}",
            headers=self.headers
        )
        response.raise_for_status()
        return response.json()
    
    # ==================== AI Features ====================
    
    def chat(self, evaluation_id: int, question: str) -> Dict[str, Any]:
        """
        Chat with AI about evaluation results.
        
        Args:
            evaluation_id: Evaluation ID for context
            question: Natural language question
            
        Returns:
            AI response
        """
        response = self.session.post(
            f"{self.base_url}/llm/chat",
            json={"evaluation_id": evaluation_id, "question": question},
            headers=self.headers
        )
        response.raise_for_status()
        return response.json()
    
    def get_suggestions(self, evaluation_id: int) -> Dict[str, Any]:
        """Get AI-powered improvement suggestions."""
        response = self.session.get(
            f"{self.base_url}/llm/suggestions/{evaluation_id}",
            headers=self.headers
        )
        response.raise_for_status()
        return response.json()


# ==================== Example Usage ====================

def main():
    """Complete workflow example."""
    
    # Initialize client
    client = SynthStudioClient(base_url="http://localhost:8000")
    
    # 1. Authentication
    print("1. Logging in...")
    try:
        client.login("demo@example.com", "password123")
        print("   Logged in successfully!")
    except requests.exceptions.HTTPError:
        print("   Creating new account...")
        client.register("demo@example.com", "password123", "Demo User")
        client.login("demo@example.com", "password123")
    
    # 2. Upload Dataset
    print("\n2. Uploading dataset...")
    # Create sample data if needed
    sample_data = pd.DataFrame({
        "name": ["Alice", "Bob", "Charlie", "Diana"] * 25,
        "age": [25, 30, 35, 40] * 25,
        "salary": [50000, 60000, 70000, 80000] * 25,
        "department": ["Engineering", "Marketing", "Sales", "HR"] * 25
    })
    sample_file = "sample_data.csv"
    sample_data.to_csv(sample_file, index=False)
    
    dataset = client.upload_dataset(sample_file, name="Employee Data")
    dataset_id = dataset["id"]
    print(f"   Dataset uploaded: ID={dataset_id}")
    
    # 3. Profile Dataset
    print("\n3. Profiling dataset...")
    profile = client.profile_dataset(dataset_id)
    print(f"   Columns: {profile.get('num_columns', 'N/A')}")
    print(f"   Rows: {profile.get('num_rows', 'N/A')}")
    
    # 4. Create Generator
    print("\n4. Creating generator...")
    generator = client.create_generator(
        name="Employee Synthetic Generator",
        dataset_id=dataset_id,
        method="ctgan",
        epochs=100  # Use fewer epochs for demo
    )
    generator_id = generator["id"]
    print(f"   Generator created: ID={generator_id}")
    
    # 5. Generate Synthetic Data
    print("\n5. Generating synthetic data...")
    client.generate(generator_id, num_rows=500)
    
    print("   Waiting for completion...")
    result = client.wait_for_generation(generator_id, timeout=300)
    print(f"   Generation complete! Status: {result['status']}")
    
    # 6. Evaluate Quality
    print("\n6. Running quality evaluation...")
    evaluation = client.evaluate(generator_id)
    evaluation_id = evaluation["id"]
    
    # Wait a moment for evaluation to complete
    time.sleep(10)
    eval_result = client.get_evaluation(evaluation_id)
    print(f"   Quality Score: {eval_result.get('overall_score', 'N/A')}")
    
    # 7. Get AI Suggestions (if LLM configured)
    print("\n7. Getting AI suggestions...")
    try:
        suggestions = client.get_suggestions(evaluation_id)
        print(f"   Suggestions: {suggestions.get('suggestions', 'N/A')}")
    except requests.exceptions.HTTPError:
        print("   (LLM not configured - skipping)")
    
    # Cleanup
    os.remove(sample_file)
    
    print("\n" + "="*50)
    print("Workflow complete!")
    print("="*50)


if __name__ == "__main__":
    main()
