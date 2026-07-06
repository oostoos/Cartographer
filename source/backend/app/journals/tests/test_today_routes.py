# @manualReviewRequested: 2026-07-06
from datetime import date


def _set_today(monkeypatch, fake_today):
    monkeypatch.setattr("core.utils.clock.today", lambda: fake_today)


def test_get_todays_view_returns_empty_buckets_when_nothing_exists(client, monkeypatch):
    _set_today(monkeypatch, date(2026, 7, 4))
    response = client.get("/api/today")
    assert response.status_code == 200
    body = response.get_json()
    assert body["date"] == "2026-07-04"
    assert body["recurringTasks"] == []
    assert body["dueTasks"] == []
    assert body["backburnerTasks"] == []


def test_get_todays_view_includes_a_recurring_instance_generated_for_today(client, monkeypatch):
    _set_today(monkeypatch, date(2026, 7, 4))
    client.post(
        "/api/recurring-task-templates",
        json={"title": "Water the plants", "frequency": "daily", "startDate": "2026-07-01"},
    )
    response = client.get("/api/today")
    titles = {t["title"] for t in response.get_json()["recurringTasks"]}
    assert titles == {"Water the plants"}


def test_get_todays_view_includes_an_ad_hoc_task_due_today(client, monkeypatch):
    _set_today(monkeypatch, date(2026, 7, 4))
    client.post("/api/tasks", json={"title": "Pay rent", "dueDate": "2026-07-04"})
    response = client.get("/api/today")
    titles = {t["title"] for t in response.get_json()["dueTasks"]}
    assert titles == {"Pay rent"}


def test_get_todays_view_includes_a_task_with_no_due_date_in_backburner(client, monkeypatch):
    _set_today(monkeypatch, date(2026, 7, 4))
    client.post("/api/tasks", json={"title": "Someday"})
    response = client.get("/api/today")
    titles = {t["title"] for t in response.get_json()["backburnerTasks"]}
    assert titles == {"Someday"}


def test_marking_a_task_complete_removes_it_from_the_due_bucket(client, monkeypatch):
    _set_today(monkeypatch, date(2026, 7, 4))
    created = client.post("/api/tasks", json={"title": "Finish this", "dueDate": "2026-07-04"}).get_json()
    client.patch(f"/api/tasks/{created['id']}", json={"isComplete": True})
    response = client.get("/api/today")
    assert response.get_json()["dueTasks"] == []


def test_routes_require_a_logged_in_session(anonymous_client):
    response = anonymous_client.get("/api/today")
    assert response.status_code == 401
