import pytest

from lib.stack.flask.app_factory import createApp
from src.backend.groups.group_color_palette import GROUP_COLOR_PALETTE
from src.backend.groups.routes import groups_blueprint
from src.backend.tasks.routes import tasks_blueprint


@pytest.fixture
def client():
    app = createApp()
    app.register_blueprint(groups_blueprint)
    app.register_blueprint(tasks_blueprint)
    return app.test_client()


def _create_group(client, name="Home renovation"):
    return client.post("/api/groups", json={"name": name}).get_json()["data"]


def _create_task(client, title="Buy milk", group_id=None):
    body = {"title": title}
    if group_id is not None:
        body["group_id"] = group_id
    return client.post("/api/tasks", json=body).get_json()["data"]


def test_list_groups_returns_empty_list_initially(client):
    response = client.get("/api/groups")

    assert response.status_code == 200
    assert response.get_json()["data"] == []


def test_list_groups_returns_created_groups(client):
    _create_group(client, name="Home renovation")
    _create_group(client, name="Side group")

    response = client.get("/api/groups")

    names = {group["name"] for group in response.get_json()["data"]}
    assert names == {"Home renovation", "Side group"}


def test_create_group_returns_201_and_group_body(client):
    response = client.post("/api/groups", json={"name": "Home renovation"})

    assert response.status_code == 201
    body = response.get_json()
    assert body["success"] is True
    assert body["data"]["name"] == "Home renovation"
    assert body["data"]["color"] in GROUP_COLOR_PALETTE


def test_create_group_missing_name_returns_400_envelope(client):
    response = client.post("/api/groups", json={})

    assert response.status_code == 400
    assert response.get_json()["success"] is False


def test_create_group_empty_name_returns_400_envelope(client):
    response = client.post("/api/groups", json={"name": "   "})

    assert response.status_code == 400
    assert response.get_json()["success"] is False


def test_delete_group_returns_success_envelope(client):
    group = _create_group(client)

    response = client.delete(f"/api/groups/{group['id']}")

    assert response.status_code == 200
    assert response.get_json()["data"]["id"] == group["id"]


def test_delete_group_unknown_id_returns_404_envelope(client):
    response = client.delete("/api/groups/does-not-exist")

    assert response.status_code == 404
    assert response.get_json()["success"] is False


def test_delete_group_removes_it_from_subsequent_list(client):
    group = _create_group(client)

    client.delete(f"/api/groups/{group['id']}")
    response = client.get("/api/groups")

    assert response.get_json()["data"] == []


def test_delete_group_unassigns_its_tasks(client):
    group = _create_group(client)
    task = _create_task(client, group_id=group["id"])

    client.delete(f"/api/groups/{group['id']}")
    response = client.get("/api/tasks")

    tasks_by_id = {t["id"]: t for t in response.get_json()["data"]}
    assert tasks_by_id[task["id"]]["group_id"] is None


def test_patch_group_renames_it(client):
    group = _create_group(client)

    response = client.patch(f"/api/groups/{group['id']}", json={"name": "Home projects"})

    assert response.status_code == 200
    assert response.get_json()["data"]["name"] == "Home projects"


def test_patch_group_empty_name_returns_400_envelope(client):
    group = _create_group(client)

    response = client.patch(f"/api/groups/{group['id']}", json={"name": ""})

    assert response.status_code == 400


def test_patch_group_unknown_id_returns_404_envelope(client):
    response = client.patch("/api/groups/does-not-exist", json={"name": "x"})

    assert response.status_code == 404
    assert response.get_json()["success"] is False


def test_patch_group_sets_color(client):
    group = _create_group(client)
    new_color = GROUP_COLOR_PALETTE[1] if group["color"] != GROUP_COLOR_PALETTE[1] else GROUP_COLOR_PALETTE[2]

    response = client.patch(f"/api/groups/{group['id']}", json={"color": new_color})

    assert response.status_code == 200
    assert response.get_json()["data"]["color"] == new_color


def test_patch_group_color_outside_palette_returns_400_envelope(client):
    group = _create_group(client)

    response = client.patch(f"/api/groups/{group['id']}", json={"color": "#000000"})

    assert response.status_code == 400
    assert response.get_json()["success"] is False


def test_patch_group_with_no_fields_is_a_no_op(client):
    group = _create_group(client)

    response = client.patch(f"/api/groups/{group['id']}", json={})

    assert response.status_code == 200
    assert response.get_json()["data"]["name"] == group["name"]
    assert response.get_json()["data"]["color"] == group["color"]


def test_patch_groups_reorder_reassigns_order(client):
    first = _create_group(client, name="Group one")
    second = _create_group(client, name="Group two")

    response = client.patch("/api/groups/reorder", json={"group_ids": [second["id"], first["id"]]})

    assert response.status_code == 200
    body = response.get_json()["data"]
    assert [group["id"] for group in body] == [second["id"], first["id"]]


def test_patch_groups_reorder_persists_across_subsequent_list(client):
    first = _create_group(client, name="Group one")
    second = _create_group(client, name="Group two")

    client.patch("/api/groups/reorder", json={"group_ids": [second["id"], first["id"]]})
    response = client.get("/api/groups")

    assert [group["id"] for group in response.get_json()["data"]] == [second["id"], first["id"]]


def test_patch_groups_reorder_missing_group_ids_returns_400_envelope(client):
    response = client.patch("/api/groups/reorder", json={})

    assert response.status_code == 400
    assert response.get_json()["success"] is False
