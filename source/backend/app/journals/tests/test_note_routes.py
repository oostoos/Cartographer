# @manualReviewRequested: 2026-07-06
def test_create_note_returns_the_created_note(client):
    response = client.post(
        "/api/notes", json={"title": "Reflection", "content": "Good day", "journalDate": "2026-07-04"}
    )
    assert response.status_code == 201
    body = response.get_json()
    assert body["title"] == "Reflection"
    assert body["content"] == "Good day"
    assert body["journalDate"] == "2026-07-04"
    assert body["effectiveDate"] == "2026-07-04"
    assert body["targetType"] == ""
    assert body["targetId"] == ""


def test_create_note_can_attach_to_a_task(client):
    created_task = client.post("/api/tasks", json={"title": "Some task"}).get_json()
    response = client.post(
        "/api/notes",
        json={"content": "A note about this task", "targetType": "Task", "targetId": created_task["id"]},
    )
    body = response.get_json()
    assert body["targetType"] == "Task"
    assert body["targetId"] == created_task["id"]
    assert body["journalDate"] is None
    assert body["effectiveDate"] == body["createdAt"][:10]


def test_create_note_rejects_a_mismatched_target(client):
    response = client.post("/api/notes", json={"content": "Broken", "targetType": "Task"})
    assert response.status_code == 400


def test_list_notes_with_no_params_returns_every_note(client):
    client.post("/api/notes", json={"content": "Journal entry", "journalDate": "2026-07-04"})
    created_task = client.post("/api/tasks", json={"title": "Some task"}).get_json()
    client.post(
        "/api/notes", json={"content": "Task note", "targetType": "Task", "targetId": created_task["id"]}
    )
    response = client.get("/api/notes")
    contents = {n["content"] for n in response.get_json()}
    assert contents == {"Journal entry", "Task note"}


def test_list_notes_journal_only_excludes_targeted_notes(client):
    client.post("/api/notes", json={"content": "Journal entry", "journalDate": "2026-07-04"})
    created_task = client.post("/api/tasks", json={"title": "Some task"}).get_json()
    client.post(
        "/api/notes", json={"content": "Task note", "targetType": "Task", "targetId": created_task["id"]}
    )
    response = client.get("/api/notes?journalOnly=true")
    contents = {n["content"] for n in response.get_json()}
    assert contents == {"Journal entry"}


def test_list_notes_can_filter_by_target(client):
    created_task = client.post("/api/tasks", json={"title": "Some task"}).get_json()
    other_task = client.post("/api/tasks", json={"title": "Other task"}).get_json()
    client.post("/api/notes", json={"content": "Mine", "targetType": "Task", "targetId": created_task["id"]})
    client.post(
        "/api/notes", json={"content": "Not mine", "targetType": "Task", "targetId": other_task["id"]}
    )
    response = client.get(f"/api/notes?targetType=Task&targetId={created_task['id']}")
    contents = {n["content"] for n in response.get_json()}
    assert contents == {"Mine"}


def test_get_note_returns_404_for_a_missing_note(client):
    response = client.get("/api/notes/does-not-exist")
    assert response.status_code == 404


def test_update_note_changes_only_given_fields(client):
    created = client.post(
        "/api/notes", json={"title": "Original", "content": "Keep me", "journalDate": "2026-07-04"}
    ).get_json()
    response = client.patch(f"/api/notes/{created['id']}", json={"title": "Updated"})
    body = response.get_json()
    assert body["title"] == "Updated"
    assert body["content"] == "Keep me"


def test_update_note_can_set_a_target(client):
    created = client.post("/api/notes", json={"content": "Adopt me"}).get_json()
    created_task = client.post("/api/tasks", json={"title": "Some task"}).get_json()
    response = client.patch(
        f"/api/notes/{created['id']}", json={"targetType": "Task", "targetId": created_task["id"]}
    )
    body = response.get_json()
    assert body["targetType"] == "Task"
    assert body["targetId"] == created_task["id"]


def test_delete_note_removes_it(client):
    created = client.post("/api/notes", json={"content": "Temporary"}).get_json()
    delete_response = client.delete(f"/api/notes/{created['id']}")
    assert delete_response.status_code == 204
    assert client.get(f"/api/notes/{created['id']}").status_code == 404


def test_routes_require_a_logged_in_session(anonymous_client):
    response = anonymous_client.get("/api/notes")
    assert response.status_code == 401
