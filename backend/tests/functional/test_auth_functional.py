"""
Functional tests for Authentication endpoints.

Tests:
- POST /auth/register
- POST /auth/login
- GET /auth/me
"""

import pytest
pytest.skip(
    "Legacy backend auth endpoints replaced by Better Auth; functional auth tests skipped.",
    allow_module_level=True,
)

