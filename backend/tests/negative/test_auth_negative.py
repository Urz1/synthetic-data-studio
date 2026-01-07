import pytest

pytest.skip(
    "Legacy backend auth (JWT/login/register) removed; Better Auth handles these flows. Skipping legacy negative tests.",
    allow_module_level=True,
)
