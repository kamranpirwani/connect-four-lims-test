import pytest
from fastapi.testclient import TestClient

from backend.main import create_app


@pytest.fixture
def client(tmp_path):
    app = create_app(f"sqlite:///{tmp_path / 'test.sqlite3'}")
    with TestClient(app) as client:
        yield client


@pytest.fixture
def user(client):
    response = client.post("/api/users", json={"name": "Ada"})
    assert response.status_code == 201
    return response.json()


@pytest.fixture
def game(client, user):
    response = client.post("/api/games", json={"user_id": user["id"]})
    assert response.status_code == 201
    return response.json()
