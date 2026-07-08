# @manualReviewRequested: 2026-07-07
def test_create_workspace_returns_the_created_workspace(client):
    response = client.post(
        "/api/workspaces", json={"title": "School", "description": "Classes", "color": "1"}
    )
    assert response.status_code == 201
    body = response.get_json()
    assert body["title"] == "School"
    assert body["description"] == "Classes"
    assert body["color"] == "1"
    assert body["isArchived"] is False


def test_list_workspaces_includes_every_created_workspace(client):
    client.post("/api/workspaces", json={"title": "One"})
    client.post("/api/workspaces", json={"title": "Two"})
    response = client.get("/api/workspaces")
    titles = {workspace["title"] for workspace in response.get_json()}
    assert titles == {"One", "Two"}


def test_get_workspace_returns_a_single_workspace(client):
    created = client.post("/api/workspaces", json={"title": "Findable"}).get_json()
    response = client.get(f"/api/workspaces/{created['id']}")
    assert response.get_json()["title"] == "Findable"


def test_get_workspace_returns_404_for_a_missing_workspace(client):
    response = client.get("/api/workspaces/does-not-exist")
    assert response.status_code == 404


def test_update_workspace_changes_only_given_fields(client):
    created = client.post("/api/workspaces", json={"title": "Original", "description": "Keep me"}).get_json()
    response = client.patch(f"/api/workspaces/{created['id']}", json={"title": "Updated"})
    body = response.get_json()
    assert body["title"] == "Updated"
    assert body["description"] == "Keep me"


def test_update_workspace_can_archive_it(client):
    created = client.post("/api/workspaces", json={"title": "Archive me"}).get_json()
    response = client.patch(f"/api/workspaces/{created['id']}", json={"isArchived": True})
    assert response.get_json()["isArchived"] is True


def test_delete_workspace_removes_it(client):
    created = client.post("/api/workspaces", json={"title": "Temporary"}).get_json()
    delete_response = client.delete(f"/api/workspaces/{created['id']}")
    assert delete_response.status_code == 204
    assert client.get(f"/api/workspaces/{created['id']}").status_code == 404


def test_delete_workspace_unassigns_its_tasks_projects_notes_and_block_templates(client):
    workspace = client.post("/api/workspaces", json={"title": "Doomed workspace"}).get_json()
    workspace_id = workspace["id"]

    owned_task = client.post(
        "/api/tasks", json={"title": "Owned task", "workspaceId": workspace_id}
    ).get_json()
    owned_project = client.post(
        "/api/projects", json={"title": "Owned project", "workspaceId": workspace_id}
    ).get_json()
    owned_note = client.post(
        "/api/notes", json={"content": "Owned note", "workspaceId": workspace_id}
    ).get_json()
    owned_template = client.post(
        "/api/block-templates", json={"title": "Owned block", "workspaceId": workspace_id}
    ).get_json()

    delete_response = client.delete(f"/api/workspaces/{workspace_id}")
    assert delete_response.status_code == 204

    # Every item survives, just unassigned — a workspace is a lens, not an owning parent.
    assert client.get(f"/api/tasks/{owned_task['id']}").status_code == 200
    assert client.get(f"/api/tasks/{owned_task['id']}").get_json()["workspaceId"] == ""
    assert client.get(f"/api/projects/{owned_project['id']}").get_json()["workspaceId"] == ""
    assert client.get(f"/api/notes/{owned_note['id']}").get_json()["workspaceId"] == ""
    assert client.get(f"/api/block-templates/{owned_template['id']}").get_json()["workspaceId"] == ""


def test_routes_require_a_logged_in_session(anonymous_client):
    response = anonymous_client.get("/api/workspaces")
    assert response.status_code == 401
