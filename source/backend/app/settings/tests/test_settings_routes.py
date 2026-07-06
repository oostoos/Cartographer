# @manualReviewRequested: 2026-07-06
def test_get_settings_creates_defaults_on_first_use(client):
    response = client.get("/api/settings")
    assert response.status_code == 200
    assert response.get_json()["displayName"] == ""


def test_update_settings_changes_the_display_name(client):
    response = client.patch("/api/settings", json={"displayName": "Austin"})
    assert response.get_json()["displayName"] == "Austin"

    second_read = client.get("/api/settings")
    assert second_read.get_json()["displayName"] == "Austin"


def test_purge_all_data_deletes_every_project_and_task(client):
    project = client.post("/api/projects", json={"title": "Doomed"}).get_json()
    task = client.post("/api/tasks", json={"title": "Doomed too"}).get_json()

    response = client.post("/api/settings/purge-all-data")
    assert response.status_code == 204

    assert client.get(f"/api/projects/{project['id']}").status_code == 404
    assert client.get(f"/api/tasks/{task['id']}").status_code == 404


def test_routes_require_a_logged_in_session(anonymous_client):
    response = anonymous_client.get("/api/settings")
    assert response.status_code == 401
