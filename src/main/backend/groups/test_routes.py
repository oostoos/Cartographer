import pytest

from src.common.backend.app_factory import createApp
from src.main.backend.projects.routes import projects_blueprint
from src.main.backend.tasks.routes import tasks_blueprint


@pytest.fixture
def client():
    app = createApp()
    app.register_blueprint(projects_blueprint)
    app.register_blueprint(tasks_blueprint)
    return app.test_client()


def _create_project(client, name="Home renovation"):
    return client.post("/api/projects", json={"name": name}).get_json()["data"]


def _create_task(client, title="Buy milk", project_id=None):
    body = {"title": title}
    if project_id is not None:
        body["project_id"] = project_id
    return client.post("/api/tasks", json=body).get_json()["data"]


def test_list_projects_returns_empty_list_initially(client):
    response = client.get("/api/projects")

    assert response.status_code == 200
    assert response.get_json()["data"] == []


def test_list_projects_returns_created_projects(client):
    _create_project(client, name="Home renovation")
    _create_project(client, name="Side project")

    response = client.get("/api/projects")

    names = {project["name"] for project in response.get_json()["data"]}
    assert names == {"Home renovation", "Side project"}


def test_create_project_returns_201_and_project_body(client):
    response = client.post("/api/projects", json={"name": "Home renovation"})

    assert response.status_code == 201
    body = response.get_json()
    assert body["success"] is True
    assert body["data"]["name"] == "Home renovation"


def test_create_project_missing_name_returns_400_envelope(client):
    response = client.post("/api/projects", json={})

    assert response.status_code == 400
    assert response.get_json()["success"] is False


def test_create_project_empty_name_returns_400_envelope(client):
    response = client.post("/api/projects", json={"name": "   "})

    assert response.status_code == 400
    assert response.get_json()["success"] is False


def test_delete_project_returns_success_envelope(client):
    project = _create_project(client)

    response = client.delete(f"/api/projects/{project['id']}")

    assert response.status_code == 200
    assert response.get_json()["data"]["id"] == project["id"]


def test_delete_project_unknown_id_returns_404_envelope(client):
    response = client.delete("/api/projects/does-not-exist")

    assert response.status_code == 404
    assert response.get_json()["success"] is False


def test_delete_project_removes_it_from_subsequent_list(client):
    project = _create_project(client)

    client.delete(f"/api/projects/{project['id']}")
    response = client.get("/api/projects")

    assert response.get_json()["data"] == []


def test_delete_project_unassigns_its_tasks(client):
    project = _create_project(client)
    task = _create_task(client, project_id=project["id"])

    client.delete(f"/api/projects/{project['id']}")
    response = client.get("/api/tasks")

    tasks_by_id = {t["id"]: t for t in response.get_json()["data"]}
    assert tasks_by_id[task["id"]]["project_id"] is None
