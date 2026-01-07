import pytest

pytest.skip(
    "Legacy backend auth (JWT/login/register) has been replaced by Better Auth and proxy headers; skipping legacy tests.",
    allow_module_level=True,
)
