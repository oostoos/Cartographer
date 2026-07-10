# @manualReviewRequested: 2026-07-07
from datetime import date


def _weekly_shape(active_weekdays, start_time="07:00", duration_minutes=30, is_advanced=False):
    return {
        "frequency": "weekly",
        "interval": 1,
        "isAdvanced": is_advanced,
        "instanceRows": [
            {"selector": str(weekday), "startTime": start_time, "durationMinutes": duration_minutes}
            for weekday in active_weekdays
        ],
    }


def test_create_block_template_returns_the_full_shape_including_nested_task_templates(client):
    response = client.post(
        "/api/block-templates",
        json={
            "title": "Morning Routine",
            "description": "Wake up right",
            "tags": ["self-care"],
            "shape": _weekly_shape([0, 1, 2, 3, 4]),
            "taskTemplates": [
                {"title": "Brush teeth", "isSkippable": False, "estimatedMinutes": 3},
                {"title": "Shower", "estimatedMinutes": 10},
            ],
        },
    )
    assert response.status_code == 201
    body = response.get_json()
    assert body["title"] == "Morning Routine"
    assert body["isActive"] is True
    assert len(body["taskTemplates"]) == 2
    assert body["taskTemplates"][0]["title"] == "Brush teeth"
    assert body["taskTemplates"][0]["isSkippable"] is False
    assert body["taskTimeRange"] == {"minMinutes": 13, "maxMinutes": 13}
    assert body["shape"]["frequency"] == "weekly"
    assert {row["selector"] for row in body["shape"]["instanceRows"]} == {"0", "1", "2", "3", "4"}


def test_create_block_template_defaults_shape_to_none_when_not_given(client):
    response = client.post("/api/block-templates", json={"title": "Not configured yet"})
    assert response.status_code == 201
    body = response.get_json()
    assert body["shape"] is None
    assert body["taskTemplates"] == []


def test_create_block_template_rejects_an_instance_row_with_a_malformed_start_time(client):
    bad_shape = _weekly_shape([0])
    bad_shape["instanceRows"][0]["startTime"] = "not-a-time"
    response = client.post("/api/block-templates", json={"title": "Bad shape", "shape": bad_shape})
    assert response.status_code == 400


def test_create_block_template_rejects_a_task_template_with_a_frequency_but_no_start_date(client):
    response = client.post(
        "/api/block-templates",
        json={"title": "Bad task", "taskTemplates": [{"title": "Weekly thing", "frequency": "weekly"}]},
    )
    assert response.status_code == 400


def test_create_block_template_rejects_a_negative_estimated_minutes(client):
    response = client.post(
        "/api/block-templates",
        json={"title": "Bad estimate", "taskTemplates": [{"title": "X", "estimatedMinutes": -1}]},
    )
    assert response.status_code == 400


def test_create_block_template_accepts_a_zero_estimated_minutes(client):
    response = client.post(
        "/api/block-templates",
        json={"title": "Unset estimate", "taskTemplates": [{"title": "X", "estimatedMinutes": 0}]},
    )
    assert response.status_code == 201
    assert response.get_json()["taskTemplates"][0]["estimatedMinutes"] == 0


def test_create_block_template_generates_todays_instance_immediately(client, monkeypatch):
    monkeypatch.setattr("core.utils.clock.today", lambda: date(2026, 7, 6))  # Monday
    client.post(
        "/api/block-templates",
        json={
            "title": "Morning Routine",
            "shape": _weekly_shape([0, 1, 2, 3, 4]),
            "taskTemplates": [{"title": "Brush teeth"}],
        },
    )
    today_response = client.get("/api/today")
    body = today_response.get_json()
    assert len(body["blocks"]) == 1
    assert body["blocks"][0]["title"] == "Morning Routine"
    assert [t["title"] for t in body["blocks"][0]["tasks"]] == ["Brush teeth"]


def test_update_block_template_replaces_task_templates_wholesale(client):
    created = client.post(
        "/api/block-templates",
        json={"title": "Routine", "taskTemplates": [{"title": "A"}, {"title": "B"}]},
    ).get_json()

    updated = client.patch(
        f"/api/block-templates/{created['id']}",
        json={"taskTemplates": [{"title": "C"}]},
    ).get_json()
    assert [t["title"] for t in updated["taskTemplates"]] == ["C"]


def test_update_block_template_syncs_onto_todays_instance(client, monkeypatch):
    monkeypatch.setattr("core.utils.clock.today", lambda: date(2026, 7, 6))
    created = client.post(
        "/api/block-templates",
        json={
            "title": "Old title",
            "shape": _weekly_shape([0]),
            "taskTemplates": [{"title": "A"}],
        },
    ).get_json()

    client.patch(
        f"/api/block-templates/{created['id']}",
        json={"title": "New title", "taskTemplates": [{"title": "A"}, {"title": "B"}]},
    )

    today_body = client.get("/api/today").get_json()
    assert today_body["blocks"][0]["title"] == "New title"
    assert sorted(t["title"] for t in today_body["blocks"][0]["tasks"]) == ["A", "B"]


def test_update_block_template_shape_applies_from_today_onward_only(client, monkeypatch):
    monkeypatch.setattr("core.utils.clock.today", lambda: date(2026, 3, 1))
    created = client.post(
        "/api/block-templates",
        json={"title": "Reschedule me", "shape": _weekly_shape([0], start_time="07:00")},
    ).get_json()

    client.patch(
        f"/api/block-templates/{created['id']}",
        json={"shape": _weekly_shape([0], start_time="09:00")},
    )

    updated = client.get(f"/api/block-templates/{created['id']}").get_json()
    assert updated["shape"]["instanceRows"][0]["startTime"] == "09:00"


def test_delete_block_template_removes_its_task_templates_too(client):
    created = client.post(
        "/api/block-templates",
        json={"title": "Routine", "taskTemplates": [{"title": "A"}]},
    ).get_json()

    delete_response = client.delete(f"/api/block-templates/{created['id']}")
    assert delete_response.status_code == 204
    assert client.get(f"/api/block-templates/{created['id']}").status_code == 404


def test_generate_defaults_creates_three_adhd_preset_templates(client):
    response = client.post("/api/block-templates/generate-defaults")
    assert response.status_code == 201
    body = response.get_json()
    assert len(body) == 3
    titles = [template["title"] for template in body]
    assert "Wake Up & Reset" in titles
    assert "Daily Tidy Sweep" in titles
    assert "Wind Down" in titles
    for template in body:
        assert len(template["taskTemplates"]) > 0
        assert any(not t["isSkippable"] for t in template["taskTemplates"])


def test_anonymous_access_is_rejected(anonymous_client):
    response = anonymous_client.get("/api/block-templates")
    assert response.status_code == 401
