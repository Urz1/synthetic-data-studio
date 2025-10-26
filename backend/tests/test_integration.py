try:
    from fastapi.testclient import TestClient
except Exception:
    TestClient = None

import importlib


def test_root_endpoint():
    # Import app.main; should provide a FastAPI app when fastapi is installed
    m = importlib.import_module('app.main')
    app = getattr(m, 'app', None)
    if TestClient is None or app is None:
        # Skip the test gracefully if dependencies are missing
        return

    client = TestClient(app)
    res = client.get('/')
    assert res.status_code == 200
    assert res.json().get('message')


def test_datasets_list():
    m = importlib.import_module('app.main')
    app = getattr(m, 'app', None)
    if TestClient is None or app is None:
        return

    client = TestClient(app)
    res = client.get('/datasets/')
    # dataset list is empty by default
    assert res.status_code == 200
    assert isinstance(res.json(), list)
