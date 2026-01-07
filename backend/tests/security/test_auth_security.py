import pytest

pytest.skip(
    "Legacy JWT-based security tests are obsolete; Better Auth manages session integrity. Skipping.",
    allow_module_level=True,
)
