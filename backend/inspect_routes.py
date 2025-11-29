
import sys
import os
from fastapi import FastAPI
from fastapi.routing import APIRoute

# Add project root to path
sys.path.append(os.getcwd())

# Import the app
from app.main import app

print("\n=== Inspecting Routes for /generators ===\n")

generators_routes = []
for route in app.routes:
    if isinstance(route, APIRoute):
        if route.path.startswith("/generators"):
            generators_routes.append({
                "path": route.path,
                "name": route.name,
                "methods": route.methods
            })

# Print them in order
for i, r in enumerate(generators_routes):
    print(f"{i+1}. {r['path']} [{','.join(r['methods'])}] -> {r['name']}")

print("\n=== End of Routes ===\n")
