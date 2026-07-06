def test_create_task_returns_the_created_task(client):
    response = client.post("/api/tasks", json={"title": "Buy milk", "tags": ["errands"]})
    assert response.status_code == 201
    body = response.get_json()
    assert body["title"] == "Buy milk"
    assert body["tags"] == ["errands"]
    assert body["isArchived"] is False
    assert body["isComplete"] is False
    assert body["dueDate"] is None


def test_create_task_can_set_a_due_date(client):
    response = client.post("/api/tasks", json={"title": "Pay rent", "dueDate": "2026-07-10"})
    assert response.get_json()["dueDate"] == "2026-07-10"


def test_list_tasks_includes_every_created_task(client):
    client.post("/api/tasks", json={"title": "One"})
    client.post("/api/tasks", json={"title": "Two"})
    response = client.get("/api/tasks")
    titles = {t["title"] for t in response.get_json()}
    assert titles == {"One", "Two"}


def test_list_tasks_can_filter_by_project_id(client):
    project = client.post("/api/projects", json={"title": "A project"}).get_json()
    client.post("/api/tasks", json={"title": "Unrelated"})
    client.post("/api/tasks", json={"title": "In project", "projectId": project["id"]})

    response = client.get(f"/api/tasks?projectId={project['id']}")
    titles = {t["title"] for t in response.get_json()}
    assert titles == {"In project"}


def test_get_task_returns_404_for_a_missing_task(client):
    response = client.get("/api/tasks/does-not-exist")
    assert response.status_code == 404


def test_update_task_changes_only_given_fields(client):
    created = client.post("/api/tasks", json={"title": "Original", "description": "Keep me"}).get_json()
    response = client.patch(f"/api/tasks/{created['id']}", json={"title": "Updated"})
    body = response.get_json()
    assert body["title"] == "Updated"
    assert body["description"] == "Keep me"


def test_update_task_can_set_and_clear_a_due_date(client):
    created = client.post("/api/tasks", json={"title": "Task"}).get_json()
    response = client.patch(f"/api/tasks/{created['id']}", json={"dueDate": "2026-07-10"})
    assert response.get_json()["dueDate"] == "2026-07-10"
    cleared = client.patch(f"/api/tasks/{created['id']}", json={"dueDate": None})
    assert cleared.get_json()["dueDate"] is None


def test_update_task_marks_it_complete(client):
    created = client.post("/api/tasks", json={"title": "Finish this"}).get_json()
    response = client.patch(f"/api/tasks/{created['id']}", json={"isComplete": True})
    body = response.get_json()
    assert body["isComplete"] is True
    assert body["completedAt"] != ""


def test_update_task_blocks_completion_while_a_subtask_is_unresolved(client):
    created = client.post("/api/tasks", json={"title": "Has subtasks"}).get_json()
    client.post("/api/subtasks", json={"taskId": created["id"], "title": "Step one"})

    response = client.patch(f"/api/tasks/{created['id']}", json={"isComplete": True})
    assert response.status_code == 400
    assert "error" in response.get_json()


def test_update_task_allows_completion_once_every_subtask_is_resolved(client):
    created = client.post("/api/tasks", json={"title": "Has subtasks"}).get_json()
    step = client.post("/api/subtasks", json={"taskId": created["id"], "title": "Step one"}).get_json()
    client.patch(f"/api/subtasks/{step['id']}", json={"isComplete": True})

    response = client.patch(f"/api/tasks/{created['id']}", json={"isComplete": True})
    assert response.status_code == 200
    assert response.get_json()["isComplete"] is True


def test_update_task_allows_completion_when_a_subtask_is_skipped(client):
    created = client.post("/api/tasks", json={"title": "Has subtasks"}).get_json()
    step = client.post("/api/subtasks", json={"taskId": created["id"], "title": "Step one"}).get_json()
    client.patch(f"/api/subtasks/{step['id']}", json={"isSkipped": True})

    response = client.patch(f"/api/tasks/{created['id']}", json={"isComplete": True})
    assert response.status_code == 200


def test_delete_task_removes_it(client):
    created = client.post("/api/tasks", json={"title": "Temporary"}).get_json()
    delete_response = client.delete(f"/api/tasks/{created['id']}")
    assert delete_response.status_code == 204
    assert client.get(f"/api/tasks/{created['id']}").status_code == 404


def test_delete_task_cascade_deletes_its_subtasks(client):
    created = client.post("/api/tasks", json={"title": "Has subtasks"}).get_json()
    created_subtask = client.post(
        "/api/subtasks", json={"taskId": created["id"], "title": "A step"}
    ).get_json()

    delete_response = client.delete(f"/api/tasks/{created['id']}")
    assert delete_response.status_code == 204
    assert client.get(f"/api/subtasks/{created_subtask['id']}").status_code == 404


def test_routes_require_a_logged_in_session(anonymous_client):
    response = anonymous_client.get("/api/tasks")
    assert response.status_code == 401
