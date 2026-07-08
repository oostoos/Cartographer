# @manualReviewRequested: 2026-07-07
from datetime import date


def _set_today(monkeypatch, fake_today):
    monkeypatch.setattr("core.utils.clock.today", lambda: fake_today)


def _all_days_active(start_time="07:00", duration_minutes=30):
    return {
        "frequency": "weekly",
        "interval": 1,
        "isAdvanced": False,
        "instanceRows": [
            {"selector": str(weekday), "startTime": start_time, "durationMinutes": duration_minutes}
            for weekday in range(7)
        ],
    }


def test_get_todays_view_returns_empty_buckets_when_nothing_exists(client, monkeypatch):
    _set_today(monkeypatch, date(2026, 7, 4))
    response = client.get("/api/today")
    assert response.status_code == 200
    body = response.get_json()
    assert body["date"] == "2026-07-04"
    assert body["blocks"] == []
    assert body["dueTasks"] == []
    assert body["backburnerTasks"] == []


def test_get_todays_view_includes_a_block_generated_for_today(client, monkeypatch):
    _set_today(monkeypatch, date(2026, 7, 4))
    client.post(
        "/api/block-templates",
        json={
            "title": "Morning Routine",
            "shape": _all_days_active(),
            "taskTemplates": [{"title": "Brush teeth", "estimatedMinutes": 3}],
        },
    )
    response = client.get("/api/today")
    body = response.get_json()
    assert len(body["blocks"]) == 1
    assert body["blocks"][0]["title"] == "Morning Routine"
    assert body["blocks"][0]["startTime"] == "07:00"
    assert body["blocks"][0]["durationMinutes"] == 30
    assert body["blocks"][0]["scheduledMinutes"] == 3
    assert [t["title"] for t in body["blocks"][0]["tasks"]] == ["Brush teeth"]


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


def test_get_block_completion_calendar_reports_a_completed_task(client, monkeypatch):
    _set_today(monkeypatch, date(2026, 7, 4))
    client.post(
        "/api/block-templates",
        json={
            "title": "Morning Routine",
            "shape": _all_days_active(),
            "taskTemplates": [{"title": "Brush teeth"}],
        },
    )
    nested_task = client.get("/api/today").get_json()["blocks"][0]["tasks"][0]
    client.patch(f"/api/tasks/{nested_task['id']}", json={"isComplete": True})

    response = client.get(
        "/api/today/block-completion-calendar",
        query_string={"startDate": "2026-07-04", "endDate": "2026-07-04"},
    )
    assert response.status_code == 200
    assert response.get_json()["days"] == [{"date": "2026-07-04", "completed": 1, "total": 1}]


def test_get_block_completion_calendar_requires_both_date_params(client):
    response = client.get("/api/today/block-completion-calendar", query_string={"startDate": "2026-07-04"})
    assert response.status_code == 400


def test_get_block_completion_calendar_rejects_end_before_start(client):
    response = client.get(
        "/api/today/block-completion-calendar",
        query_string={"startDate": "2026-07-04", "endDate": "2026-07-01"},
    )
    assert response.status_code == 400
