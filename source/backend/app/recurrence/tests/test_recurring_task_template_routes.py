# @manualReviewRequested: 2026-07-06
def test_create_recurring_task_template_returns_the_created_template(client):
    response = client.post(
        "/api/recurring-task-templates",
        json={
            "title": "Water the plants",
            "frequency": "weekly",
            "startDate": "2026-01-05",
            "daysOfWeek": [0, 2],
            "subtaskTitles": ["Check soil"],
        },
    )
    assert response.status_code == 201
    body = response.get_json()
    assert body["title"] == "Water the plants"
    assert body["frequency"] == "weekly"
    assert body["startDate"] == "2026-01-05"
    assert body["daysOfWeek"] == [0, 2]
    assert body["subtaskTitles"] == ["Check soil"]
    assert body["interval"] == 1
    assert body["isActive"] is True


def test_create_recurring_task_template_rejects_an_unrecognized_frequency(client):
    response = client.post(
        "/api/recurring-task-templates",
        json={"title": "Nope", "frequency": "fortnightly", "startDate": "2026-01-05"},
    )
    assert response.status_code == 400


def test_update_recurring_task_template_can_deactivate_it(client):
    created = client.post(
        "/api/recurring-task-templates",
        json={"title": "Daily habit", "frequency": "daily", "startDate": "2026-01-01"},
    ).get_json()
    response = client.patch(f"/api/recurring-task-templates/{created['id']}", json={"isActive": False})
    assert response.get_json()["isActive"] is False


def test_update_recurring_task_template_can_change_the_title(client):
    created = client.post(
        "/api/recurring-task-templates",
        json={"title": "Original", "frequency": "daily", "startDate": "2026-01-01"},
    ).get_json()
    response = client.patch(f"/api/recurring-task-templates/{created['id']}", json={"title": "Renamed"})
    assert response.get_json()["title"] == "Renamed"


def test_update_recurring_task_template_can_set_an_end_date(client):
    created = client.post(
        "/api/recurring-task-templates",
        json={"title": "Daily habit", "frequency": "daily", "startDate": "2026-01-01"},
    ).get_json()
    response = client.patch(f"/api/recurring-task-templates/{created['id']}", json={"endDate": "2026-12-31"})
    assert response.get_json()["endDate"] == "2026-12-31"


def test_update_recurring_task_template_can_change_the_cadence(client):
    created = client.post(
        "/api/recurring-task-templates",
        json={"title": "Daily habit", "frequency": "daily", "startDate": "2026-01-01"},
    ).get_json()
    response = client.patch(
        f"/api/recurring-task-templates/{created['id']}",
        json={
            "frequency": "weekly",
            "interval": 2,
            "startDate": "2026-02-01",
            "daysOfWeek": [1, 3],
        },
    )
    body = response.get_json()
    assert body["frequency"] == "weekly"
    assert body["interval"] == 2
    assert body["startDate"] == "2026-02-01"
    assert body["daysOfWeek"] == [1, 3]


def test_update_recurring_task_template_rejects_an_unrecognized_frequency(client):
    created = client.post(
        "/api/recurring-task-templates",
        json={"title": "Daily habit", "frequency": "daily", "startDate": "2026-01-01"},
    ).get_json()
    response = client.patch(
        f"/api/recurring-task-templates/{created['id']}", json={"frequency": "fortnightly"}
    )
    assert response.status_code == 400


def test_update_recurring_task_template_can_set_day_of_month_and_month_of_year(client):
    created = client.post(
        "/api/recurring-task-templates",
        json={"title": "Yearly thing", "frequency": "yearly", "startDate": "2026-01-01"},
    ).get_json()
    response = client.patch(
        f"/api/recurring-task-templates/{created['id']}",
        json={"dayOfMonth": 15, "monthOfYear": 6},
    )
    body = response.get_json()
    assert body["dayOfMonth"] == 15
    assert body["monthOfYear"] == 6


def test_delete_recurring_task_template_removes_it(client):
    created = client.post(
        "/api/recurring-task-templates",
        json={"title": "Daily habit", "frequency": "daily", "startDate": "2026-01-01"},
    ).get_json()
    delete_response = client.delete(f"/api/recurring-task-templates/{created['id']}")
    assert delete_response.status_code == 204
    assert client.get(f"/api/recurring-task-templates/{created['id']}").status_code == 404


def test_routes_require_a_logged_in_session(anonymous_client):
    response = anonymous_client.get("/api/recurring-task-templates")
    assert response.status_code == 401
