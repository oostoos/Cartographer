# @manualReviewRequested: 2026-07-06
def _create_task(client, title="Parent task"):
    return client.post("/api/tasks", json={"title": title}).get_json()


def test_create_subtask_returns_the_created_subtask(client):
    task = _create_task(client)
    response = client.post("/api/subtasks", json={"taskId": task["id"], "title": "Pack the bag"})
    assert response.status_code == 201
    body = response.get_json()
    assert body["taskId"] == task["id"]
    assert body["title"] == "Pack the bag"
    assert body["isComplete"] is False
    assert body["isSkipped"] is False


def test_list_subtasks_requires_a_task_id(client):
    task = _create_task(client)
    client.post("/api/subtasks", json={"taskId": task["id"], "title": "Only one"})
    response = client.get("/api/subtasks")
    assert response.get_json() == []


def test_list_subtasks_filters_to_one_task_oldest_first(client):
    task = _create_task(client)
    other_task = _create_task(client, "Other task")
    client.post("/api/subtasks", json={"taskId": other_task["id"], "title": "Unrelated"})
    client.post("/api/subtasks", json={"taskId": task["id"], "title": "First"})
    client.post("/api/subtasks", json={"taskId": task["id"], "title": "Second"})

    response = client.get(f"/api/subtasks?taskId={task['id']}")
    titles = [s["title"] for s in response.get_json()]
    assert titles == ["First", "Second"]


def test_get_subtask_returns_404_for_a_missing_subtask(client):
    response = client.get("/api/subtasks/does-not-exist")
    assert response.status_code == 404


def test_update_subtask_setting_complete_clears_skipped(client):
    task = _create_task(client)
    created = client.post("/api/subtasks", json={"taskId": task["id"], "title": "Toggle me"}).get_json()
    client.patch(f"/api/subtasks/{created['id']}", json={"isSkipped": True})

    response = client.patch(f"/api/subtasks/{created['id']}", json={"isComplete": True})
    body = response.get_json()
    assert body["isComplete"] is True
    assert body["isSkipped"] is False


def test_update_subtask_setting_skipped_clears_complete(client):
    task = _create_task(client)
    created = client.post("/api/subtasks", json={"taskId": task["id"], "title": "Toggle me"}).get_json()
    client.patch(f"/api/subtasks/{created['id']}", json={"isComplete": True})

    response = client.patch(f"/api/subtasks/{created['id']}", json={"isSkipped": True})
    body = response.get_json()
    assert body["isSkipped"] is True
    assert body["isComplete"] is False


def test_delete_subtask_removes_it(client):
    task = _create_task(client)
    created = client.post("/api/subtasks", json={"taskId": task["id"], "title": "Temporary"}).get_json()
    delete_response = client.delete(f"/api/subtasks/{created['id']}")
    assert delete_response.status_code == 204
    assert client.get(f"/api/subtasks/{created['id']}").status_code == 404


def test_routes_require_a_logged_in_session(anonymous_client):
    response = anonymous_client.get("/api/subtasks")
    assert response.status_code == 401
