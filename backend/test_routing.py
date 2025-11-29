
import sys
import os
from fastapi.testclient import TestClient

# Add project root to path
sys.path.append(os.getcwd())

# Import the app
from app.main import app

client = TestClient(app)

print("\n=== Testing Route Matching ===\n")

# Test 1: Check if /generators/schema/generate exists (should be 422 or 401, not 404)
response = client.post("/generators/schema/generate", json={})
print(f"1. /generators/schema/generate -> {response.status_code}")

# Test 2: Check if /generators/dataset/{id}/generate exists
# We expect 401 (Unauthorized) because of get_current_user dependency
# If it returns 404, then the route is missing.
dataset_id = "067da3a0-387a-4613-9eaa-88b21739b218"
response = client.post(f"/generators/dataset/{dataset_id}/generate")
print(f"2. /generators/dataset/{{id}}/generate -> {response.status_code}")

# Test 3: Check if /generators/{id}/generate exists
generator_id = "067da3a0-387a-4613-9eaa-88b21739b218"
response = client.post(f"/generators/{generator_id}/generate")
print(f"3. /generators/{{id}}/generate -> {response.status_code}")

print("\n=== End of Test ===\n")
