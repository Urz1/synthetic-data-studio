import pytest

pytest.skip(
    "OWASP tests relying on backend-issued JWT are skipped; Better Auth/session now in use.",
    allow_module_level=True,
)
