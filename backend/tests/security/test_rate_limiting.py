import pytest

pytest.skip(
    "Legacy rate-limiting tests for backend login/API throttling are not applicable post Better Auth migration.",
    allow_module_level=True,
)
