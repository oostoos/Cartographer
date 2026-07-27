import pytest

from lib.stack.flask.app_factory import createApp
from src.backend.database import profile as profile_module
from src.backend.profile.routes import profile_blueprint
from src.backend.tasks.routes import tasks_blueprint


@pytest.fixture
def client():
    app = createApp()
    app.register_blueprint(profile_blueprint)
    app.register_blueprint(tasks_blueprint)
    return app.test_client()


def test_get_profile_returns_default(client):
    response = client.get("/api/profile")

    assert response.status_code == 200
    assert response.get_json()["data"]["display_name"] == profile_module.DEFAULT_DISPLAY_NAME


def test_put_profile_sets_display_name(client):
    response = client.put("/api/profile", json={"display_name": "Austin"})

    assert response.status_code == 200
    assert response.get_json()["data"]["display_name"] == "Austin"

    follow_up = client.get("/api/profile")
    assert follow_up.get_json()["data"]["display_name"] == "Austin"


def test_put_profile_missing_display_name_returns_400_envelope(client):
    response = client.put("/api/profile", json={})

    assert response.status_code == 400
    assert response.get_json()["success"] is False


def test_put_profile_non_string_display_name_returns_400_envelope(client):
    response = client.put("/api/profile", json={"display_name": 123})

    assert response.status_code == 400


def test_put_profile_malformed_json_body_returns_4xx_envelope(client):
    response = client.put("/api/profile", data="not json", content_type="application/json")

    assert response.status_code >= 400
    assert response.status_code < 500
    assert response.get_json()["success"] is False


def test_delete_all_data_resets_profile_and_returns_success(client):
    client.put("/api/profile", json={"display_name": "Austin"})

    response = client.post("/api/profile/delete-all-data")

    assert response.status_code == 200
    assert response.get_json()["success"] is True
    follow_up = client.get("/api/profile")
    assert follow_up.get_json()["data"]["display_name"] == profile_module.DEFAULT_DISPLAY_NAME


def test_delete_all_data_also_clears_tasks(client):
    client.post("/api/tasks", json={"title": "Buy milk"})

    client.post("/api/profile/delete-all-data")

    response = client.get("/api/tasks")
    assert response.get_json()["data"] == []
