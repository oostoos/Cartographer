import pytest

from lib.stack.flask.app_factory import createApp
from src.backend.groups.routes import groups_blueprint
from src.backend.tasks.routes import tasks_blueprint


@pytest.fixture
def client():
    app = createApp()
    app.register_blueprint(tasks_blueprint)
    app.register_blueprint(groups_blueprint)
    return app.test_client()


def _create_group(client, name="Group one"):
    return client.post("/api/groups", json={"name": name}).get_json()["data"]


def _create(client, title="Buy milk", description=""):
    return client.post("/api/tasks", json={"title": title, "description": description}).get_json()["data"]


def test_list_tasks_returns_empty_list_initially(client):
    response = client.get("/api/tasks")

    assert response.status_code == 200
    assert response.get_json()["data"] == []


def test_list_tasks_returns_created_tasks(client):
    _create(client, title="Buy milk")
    _create(client, title="Walk dog")

    response = client.get("/api/tasks")

    titles = {task["title"] for task in response.get_json()["data"]}
    assert titles == {"Buy milk", "Walk dog"}


def test_create_task_returns_201_and_task_body(client):
    response = client.post("/api/tasks", json={"title": "Buy milk", "description": "2%"})

    assert response.status_code == 201
    body = response.get_json()
    assert body["success"] is True
    assert body["data"]["title"] == "Buy milk"
    assert body["data"]["description"] == "2%"
    assert body["data"]["completed"] is False


def test_create_task_missing_title_returns_400_envelope(client):
    response = client.post("/api/tasks", json={})

    assert response.status_code == 400
    body = response.get_json()
    assert body["success"] is False
    assert "error" in body


def test_create_task_empty_title_returns_400_envelope(client):
    response = client.post("/api/tasks", json={"title": "   "})

    assert response.status_code == 400
    assert response.get_json()["success"] is False


def test_create_task_malformed_json_body_returns_4xx_envelope(client):
    response = client.post("/api/tasks", data="not json", content_type="application/json")

    assert response.status_code >= 400
    assert response.status_code < 500
    body = response.get_json()
    assert body["success"] is False


def test_get_task_returns_the_task(client):
    created = _create(client)

    response = client.get(f"/api/tasks/{created['id']}")

    assert response.status_code == 200
    assert response.get_json()["data"]["id"] == created["id"]


def test_get_task_unknown_id_returns_404_envelope(client):
    response = client.get("/api/tasks/does-not-exist")

    assert response.status_code == 404
    assert response.get_json()["success"] is False


def test_patch_task_updates_title_and_description(client):
    created = _create(client, title="Buy milk", description="2%")

    response = client.patch(
        f"/api/tasks/{created['id']}", json={"title": "Buy oat milk", "description": "unsweetened"}
    )

    assert response.status_code == 200
    body = response.get_json()["data"]
    assert body["title"] == "Buy oat milk"
    assert body["description"] == "unsweetened"


def test_patch_task_empty_title_returns_400_envelope(client):
    created = _create(client)

    response = client.patch(f"/api/tasks/{created['id']}", json={"title": ""})

    assert response.status_code == 400


def test_patch_task_unknown_id_returns_404_envelope(client):
    response = client.patch("/api/tasks/does-not-exist", json={"title": "x"})

    assert response.status_code == 404
    assert response.get_json()["success"] is False


def test_patch_task_complete_toggles_flag(client):
    created = _create(client)

    response = client.patch(f"/api/tasks/{created['id']}/complete", json={"completed": True})

    assert response.status_code == 200
    assert response.get_json()["data"]["completed"] is True


def test_patch_task_complete_sets_completed_at(client):
    created = _create(client)
    assert created["completed_at"] is None

    response = client.patch(f"/api/tasks/{created['id']}/complete", json={"completed": True})

    assert response.get_json()["data"]["completed_at"] is not None


def test_patch_task_complete_false_clears_completed_at(client):
    created = _create(client)
    client.patch(f"/api/tasks/{created['id']}/complete", json={"completed": True})

    response = client.patch(f"/api/tasks/{created['id']}/complete", json={"completed": False})

    assert response.get_json()["data"]["completed_at"] is None


def test_patch_task_complete_missing_field_returns_400_envelope(client):
    created = _create(client)

    response = client.patch(f"/api/tasks/{created['id']}/complete", json={})

    assert response.status_code == 400


def test_patch_task_complete_unknown_id_returns_404_envelope(client):
    response = client.patch("/api/tasks/does-not-exist/complete", json={"completed": True})

    assert response.status_code == 404
    assert response.get_json()["success"] is False


def test_patch_tasks_reorder_reassigns_order(client):
    first = _create(client, title="Task one")
    second = _create(client, title="Task two")

    response = client.patch("/api/tasks/reorder", json={"task_ids": [second["id"], first["id"]]})

    assert response.status_code == 200
    body = response.get_json()["data"]
    assert [task["id"] for task in body] == [second["id"], first["id"]]


def test_patch_tasks_reorder_persists_across_subsequent_list(client):
    first = _create(client, title="Task one")
    second = _create(client, title="Task two")

    client.patch("/api/tasks/reorder", json={"task_ids": [second["id"], first["id"]]})
    response = client.get("/api/tasks")

    assert [task["id"] for task in response.get_json()["data"]] == [second["id"], first["id"]]


def test_patch_tasks_reorder_missing_task_ids_returns_400_envelope(client):
    response = client.patch("/api/tasks/reorder", json={})

    assert response.status_code == 400
    assert response.get_json()["success"] is False


def test_patch_tasks_reorder_non_list_task_ids_returns_400_envelope(client):
    response = client.patch("/api/tasks/reorder", json={"task_ids": "not-a-list"})

    assert response.status_code == 400
    assert response.get_json()["success"] is False


def test_create_task_with_valid_group_id_assigns_it(client):
    group = _create_group(client)

    response = client.post("/api/tasks", json={"title": "Buy milk", "group_id": group["id"]})

    assert response.status_code == 201
    assert response.get_json()["data"]["group_id"] == group["id"]


def test_create_task_with_unknown_group_id_returns_400_envelope(client):
    response = client.post("/api/tasks", json={"title": "Buy milk", "group_id": "does-not-exist"})

    assert response.status_code == 400
    assert response.get_json()["success"] is False


def test_patch_task_group_assigns_group(client):
    created = _create(client)
    group = _create_group(client)

    response = client.patch(f"/api/tasks/{created['id']}/group", json={"group_id": group["id"]})

    assert response.status_code == 200
    assert response.get_json()["data"]["group_id"] == group["id"]


def test_patch_task_group_clears_group_with_null(client):
    created = _create(client)
    group = _create_group(client)
    client.patch(f"/api/tasks/{created['id']}/group", json={"group_id": group["id"]})

    response = client.patch(f"/api/tasks/{created['id']}/group", json={"group_id": None})

    assert response.status_code == 200
    assert response.get_json()["data"]["group_id"] is None


def test_patch_task_group_unknown_task_returns_404_envelope(client):
    group = _create_group(client)

    response = client.patch("/api/tasks/does-not-exist/group", json={"group_id": group["id"]})

    assert response.status_code == 404
    assert response.get_json()["success"] is False


def test_patch_task_group_unknown_group_returns_400_envelope(client):
    created = _create(client)

    response = client.patch(f"/api/tasks/{created['id']}/group", json={"group_id": "does-not-exist"})

    assert response.status_code == 400
    assert response.get_json()["success"] is False


def test_patch_task_group_non_string_group_id_returns_400_envelope(client):
    created = _create(client)

    response = client.patch(f"/api/tasks/{created['id']}/group", json={"group_id": 123})

    assert response.status_code == 400
    assert response.get_json()["success"] is False


def test_delete_task_returns_success_envelope(client):
    created = _create(client)

    response = client.delete(f"/api/tasks/{created['id']}")

    assert response.status_code == 200
    assert response.get_json()["data"]["id"] == created["id"]


def test_delete_task_unknown_id_returns_404_envelope(client):
    response = client.delete("/api/tasks/does-not-exist")

    assert response.status_code == 404
    assert response.get_json()["success"] is False


def test_delete_task_removes_it_from_subsequent_list(client):
    created = _create(client)

    client.delete(f"/api/tasks/{created['id']}")
    response = client.get("/api/tasks")

    assert response.get_json()["data"] == []
