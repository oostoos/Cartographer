# @manualReviewRequested: 2026-07-06
def test_create_task_returns_the_created_task(client):
    response = client.post("/api/tasks", json={"title": "Buy milk", "tags": ["errands"]})
    assert response.status_code == 201
    body = response.get_json()
    assert body["title"] == "Buy milk"
    assert body["tags"] == ["errands"]
    assert body["isArchived"] is False
    assert body["isComplete"] is False
    assert body["isSkipped"] is False
    assert body["isSkippable"] is False
    assert body["parentTaskId"] == ""
    assert body["dueDate"] is None


def test_create_task_can_set_a_due_date(client):
    response = client.post("/api/tasks", json={"title": "Pay rent", "dueDate": "2026-07-10"})
    assert response.get_json()["dueDate"] == "2026-07-10"


def test_create_task_defaults_is_skippable_true_when_block_nested(client):
    response = client.post("/api/tasks", json={"title": "Block-nested one", "blockId": "block-1"})
    assert response.get_json()["isSkippable"] is True


def test_create_task_can_set_estimated_minutes(client):
    response = client.post("/api/tasks", json={"title": "Precise task", "estimatedMinutes": 15})
    assert response.get_json()["estimatedMinutes"] == 15


def test_create_task_can_be_given_a_parent_task_id(client):
    parent = client.post("/api/tasks", json={"title": "Parent"}).get_json()
    response = client.post("/api/tasks", json={"title": "Subtask", "parentTaskId": parent["id"]})
    body = response.get_json()
    assert body["parentTaskId"] == parent["id"]
    assert body["isSkippable"] is True  # subtasks always default to skippable


def test_create_task_rejects_nesting_a_subtask_under_a_subtask(client):
    parent = client.post("/api/tasks", json={"title": "Parent"}).get_json()
    child = client.post("/api/tasks", json={"title": "Child", "parentTaskId": parent["id"]}).get_json()

    response = client.post("/api/tasks", json={"title": "Grandchild", "parentTaskId": child["id"]})
    assert response.status_code == 400
    assert "error" in response.get_json()


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


def test_list_tasks_can_filter_by_parent_task_id(client):
    parent = client.post("/api/tasks", json={"title": "Parent"}).get_json()
    client.post("/api/tasks", json={"title": "Unrelated"})
    client.post("/api/tasks", json={"title": "Subtask", "parentTaskId": parent["id"]})

    response = client.get(f"/api/tasks?parentTaskId={parent['id']}")
    titles = {t["title"] for t in response.get_json()}
    assert titles == {"Subtask"}


def test_list_tasks_can_filter_by_block_id(client):
    client.post("/api/tasks", json={"title": "Unrelated"})
    client.post("/api/tasks", json={"title": "Nested", "blockId": "block-1"})

    response = client.get("/api/tasks?blockId=block-1")
    titles = {t["title"] for t in response.get_json()}
    assert titles == {"Nested"}


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


def test_update_task_rejects_setting_both_complete_and_skipped(client):
    created = client.post("/api/tasks", json={"title": "Task"}).get_json()
    response = client.patch(f"/api/tasks/{created['id']}", json={"isComplete": True, "isSkipped": True})
    assert response.status_code == 400
    assert "error" in response.get_json()


def test_update_task_setting_skipped_clears_complete(client):
    created = client.post("/api/tasks", json={"title": "Task"}).get_json()
    client.patch(f"/api/tasks/{created['id']}", json={"isComplete": True})
    response = client.patch(f"/api/tasks/{created['id']}", json={"isSkipped": True})
    body = response.get_json()
    assert body["isSkipped"] is True
    assert body["isComplete"] is False


def test_update_task_setting_complete_clears_skipped(client):
    created = client.post("/api/tasks", json={"title": "Task"}).get_json()
    client.patch(f"/api/tasks/{created['id']}", json={"isSkipped": True})
    response = client.patch(f"/api/tasks/{created['id']}", json={"isComplete": True})
    body = response.get_json()
    assert body["isComplete"] is True
    assert body["isSkipped"] is False


def test_update_task_rejects_nesting_a_subtask_under_a_subtask(client):
    parent = client.post("/api/tasks", json={"title": "Parent"}).get_json()
    child = client.post("/api/tasks", json={"title": "Child", "parentTaskId": parent["id"]}).get_json()
    other = client.post("/api/tasks", json={"title": "Other"}).get_json()

    response = client.patch(f"/api/tasks/{other['id']}", json={"parentTaskId": child["id"]})
    assert response.status_code == 400
    assert "error" in response.get_json()


def test_update_task_blocks_completion_while_a_subtask_is_unresolved(client):
    created = client.post("/api/tasks", json={"title": "Has subtasks"}).get_json()
    client.post("/api/tasks", json={"title": "Step one", "parentTaskId": created["id"]})

    response = client.patch(f"/api/tasks/{created['id']}", json={"isComplete": True})
    assert response.status_code == 400
    assert "error" in response.get_json()


def test_update_task_allows_completion_once_every_subtask_is_resolved(client):
    created = client.post("/api/tasks", json={"title": "Has subtasks"}).get_json()
    step = client.post("/api/tasks", json={"title": "Step one", "parentTaskId": created["id"]}).get_json()
    client.patch(f"/api/tasks/{step['id']}", json={"isComplete": True})

    response = client.patch(f"/api/tasks/{created['id']}", json={"isComplete": True})
    assert response.status_code == 200
    assert response.get_json()["isComplete"] is True


def test_update_task_allows_completion_when_a_subtask_is_skipped(client):
    created = client.post("/api/tasks", json={"title": "Has subtasks"}).get_json()
    step = client.post("/api/tasks", json={"title": "Step one", "parentTaskId": created["id"]}).get_json()
    client.patch(f"/api/tasks/{step['id']}", json={"isSkipped": True})

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
        "/api/tasks", json={"title": "A step", "parentTaskId": created["id"]}
    ).get_json()

    delete_response = client.delete(f"/api/tasks/{created['id']}")
    assert delete_response.status_code == 204
    assert client.get(f"/api/tasks/{created_subtask['id']}").status_code == 404


def test_routes_require_a_logged_in_session(anonymous_client):
    response = anonymous_client.get("/api/tasks")
    assert response.status_code == 401


def test_create_task_appends_ad_hoc_tasks_to_the_end_of_their_own_order(client):
    first = client.post("/api/tasks", json={"title": "First"}).get_json()
    second = client.post("/api/tasks", json={"title": "Second"}).get_json()
    assert first["order"] == 0
    assert second["order"] == 1


def test_create_task_appends_subtasks_to_the_end_of_their_own_order(client):
    parent = client.post("/api/tasks", json={"title": "Parent"}).get_json()
    other_ad_hoc = client.post("/api/tasks", json={"title": "Unrelated ad-hoc"}).get_json()
    first_subtask = client.post(
        "/api/tasks", json={"title": "First subtask", "parentTaskId": parent["id"]}
    ).get_json()
    second_subtask = client.post(
        "/api/tasks", json={"title": "Second subtask", "parentTaskId": parent["id"]}
    ).get_json()
    assert other_ad_hoc["order"] == 1  # after "Parent" (order 0) — unaffected by subtask ordering
    assert first_subtask["order"] == 0
    assert second_subtask["order"] == 1


def test_update_task_can_set_order(client):
    created = client.post("/api/tasks", json={"title": "Task"}).get_json()
    response = client.patch(f"/api/tasks/{created['id']}", json={"order": 7})
    assert response.get_json()["order"] == 7


def test_create_task_can_set_duration_bucket(client):
    response = client.post("/api/tasks", json={"title": "Quick task", "durationBucket": "5_to_10_min"})
    assert response.get_json()["durationBucket"] == "5_to_10_min"


def test_create_task_defaults_duration_bucket_to_none(client):
    response = client.post("/api/tasks", json={"title": "No estimate"})
    assert response.get_json()["durationBucket"] is None


def test_update_task_can_set_and_clear_duration_bucket(client):
    created = client.post("/api/tasks", json={"title": "Task"}).get_json()
    response = client.patch(f"/api/tasks/{created['id']}", json={"durationBucket": "30_to_60_min"})
    assert response.get_json()["durationBucket"] == "30_to_60_min"
    cleared = client.patch(f"/api/tasks/{created['id']}", json={"durationBucket": None})
    assert cleared.get_json()["durationBucket"] is None


def test_create_task_rejects_an_unrecognized_duration_bucket(client):
    response = client.post("/api/tasks", json={"title": "Bad", "durationBucket": "not-a-bucket"})
    assert response.status_code == 400
