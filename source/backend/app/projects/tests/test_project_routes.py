# @manualReviewRequested: 2026-07-06
def test_create_project_returns_the_created_project(client):
    response = client.post("/api/projects", json={"title": "Home renovation", "description": "Kitchen first"})
    assert response.status_code == 201
    body = response.get_json()
    assert body["title"] == "Home renovation"
    assert body["description"] == "Kitchen first"
    assert body["isArchived"] is False
    assert body["parentProjectId"] == ""


def test_create_project_can_set_a_parent_project_id(client):
    parent = client.post("/api/projects", json={"title": "Parent"}).get_json()
    child = client.post("/api/projects", json={"title": "Child", "parentProjectId": parent["id"]}).get_json()
    assert child["parentProjectId"] == parent["id"]


def test_list_projects_includes_every_created_project(client):
    client.post("/api/projects", json={"title": "One"})
    client.post("/api/projects", json={"title": "Two"})
    response = client.get("/api/projects")
    titles = {project["title"] for project in response.get_json()}
    assert titles == {"One", "Two"}


def test_get_project_returns_a_single_project(client):
    created = client.post("/api/projects", json={"title": "Findable"}).get_json()
    response = client.get(f"/api/projects/{created['id']}")
    assert response.get_json()["title"] == "Findable"


def test_get_project_returns_404_for_a_missing_project(client):
    response = client.get("/api/projects/does-not-exist")
    assert response.status_code == 404


def test_update_project_changes_only_given_fields(client):
    created = client.post("/api/projects", json={"title": "Original", "description": "Keep me"}).get_json()
    response = client.patch(f"/api/projects/{created['id']}", json={"title": "Updated"})
    body = response.get_json()
    assert body["title"] == "Updated"
    assert body["description"] == "Keep me"


def test_update_project_can_reparent_it(client):
    original_parent = client.post("/api/projects", json={"title": "Original parent"}).get_json()
    new_parent = client.post("/api/projects", json={"title": "New parent"}).get_json()
    child = client.post(
        "/api/projects", json={"title": "Child", "parentProjectId": original_parent["id"]}
    ).get_json()

    response = client.patch(f"/api/projects/{child['id']}", json={"parentProjectId": new_parent["id"]})
    assert response.get_json()["parentProjectId"] == new_parent["id"]


def test_delete_project_removes_it(client):
    created = client.post("/api/projects", json={"title": "Temporary"}).get_json()
    delete_response = client.delete(f"/api/projects/{created['id']}")
    assert delete_response.status_code == 204
    assert client.get(f"/api/projects/{created['id']}").status_code == 404


def test_delete_project_cascade_deletes_its_tasks_and_their_subtasks(client):
    created = client.post("/api/projects", json={"title": "Doomed project"}).get_json()
    owned_task = client.post(
        "/api/tasks", json={"title": "Owned task", "projectId": created["id"]}
    ).get_json()
    owned_subtask = client.post(
        "/api/subtasks", json={"taskId": owned_task["id"], "title": "Owned subtask"}
    ).get_json()

    delete_response = client.delete(f"/api/projects/{created['id']}")
    assert delete_response.status_code == 204
    assert client.get(f"/api/tasks/{owned_task['id']}").status_code == 404
    assert client.get(f"/api/subtasks/{owned_subtask['id']}").status_code == 404


def test_delete_project_can_move_its_tasks_to_another_project_instead(client):
    created = client.post("/api/projects", json={"title": "Doomed project"}).get_json()
    target = client.post("/api/projects", json={"title": "Target project"}).get_json()
    owned_task = client.post(
        "/api/tasks", json={"title": "Owned task", "projectId": created["id"]}
    ).get_json()

    delete_response = client.delete(
        f"/api/projects/{created['id']}", json={"moveChildrenToProjectId": target["id"]}
    )
    assert delete_response.status_code == 204
    moved_task = client.get(f"/api/tasks/{owned_task['id']}").get_json()
    assert moved_task["projectId"] == target["id"]


def _build_three_level_tree(client):
    """grandparent -> parent -> child, each with one task of its own."""
    grandparent = client.post("/api/projects", json={"title": "Grandparent"}).get_json()
    parent = client.post(
        "/api/projects", json={"title": "Parent", "parentProjectId": grandparent["id"]}
    ).get_json()
    child = client.post("/api/projects", json={"title": "Child", "parentProjectId": parent["id"]}).get_json()
    tasks = {
        level["title"]: client.post(
            "/api/tasks", json={"title": f"{level['title']} task", "projectId": level["id"]}
        ).get_json()
        for level in (grandparent, parent, child)
    }
    return grandparent, parent, child, tasks


def test_delete_project_cascade_deletes_every_subproject_and_their_tasks(client):
    grandparent, parent, child, tasks = _build_three_level_tree(client)

    delete_response = client.delete(f"/api/projects/{grandparent['id']}")
    assert delete_response.status_code == 204
    assert client.get(f"/api/projects/{parent['id']}").status_code == 404
    assert client.get(f"/api/projects/{child['id']}").status_code == 404
    for level_task in tasks.values():
        assert client.get(f"/api/tasks/{level_task['id']}").status_code == 404


def test_delete_project_move_only_reassigns_direct_children(client):
    grandparent, parent, child, tasks = _build_three_level_tree(client)
    target = client.post("/api/projects", json={"title": "Target"}).get_json()

    delete_response = client.delete(
        f"/api/projects/{grandparent['id']}", json={"moveChildrenToProjectId": target["id"]}
    )
    assert delete_response.status_code == 204

    moved_task = client.get(f"/api/tasks/{tasks['Grandparent']['id']}").get_json()
    assert moved_task["projectId"] == target["id"]

    reparented_child = client.get(f"/api/projects/{parent['id']}").get_json()
    assert reparented_child["parentProjectId"] == target["id"]

    # the grandchild "Child" project is untouched — it moves along with its own parent, "Parent"
    untouched_grandchild = client.get(f"/api/projects/{child['id']}").get_json()
    assert untouched_grandchild["parentProjectId"] == parent["id"]


def test_routes_require_a_logged_in_session(anonymous_client):
    response = anonymous_client.get("/api/projects")
    assert response.status_code == 401
