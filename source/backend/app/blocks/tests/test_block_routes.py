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


def test_get_occurrences_requires_both_date_params(client):
    response = client.get("/api/blocks/occurrences", query_string={"startDate": "2026-07-06"})
    assert response.status_code == 400


def test_get_occurrences_rejects_end_before_start(client):
    response = client.get(
        "/api/blocks/occurrences",
        query_string={"startDate": "2026-07-10", "endDate": "2026-07-01"},
    )
    assert response.status_code == 400


def test_get_occurrences_returns_a_real_instance_generated_for_today(client, monkeypatch):
    _set_today(monkeypatch, date(2026, 7, 6))
    client.post(
        "/api/block-templates",
        json={"title": "Morning Routine", "shape": _all_days_active()},
    )
    response = client.get(
        "/api/blocks/occurrences",
        query_string={"startDate": "2026-07-06", "endDate": "2026-07-06"},
    )
    assert response.status_code == 200
    occurrences = response.get_json()["occurrences"]
    assert len(occurrences) == 1
    assert occurrences[0]["title"] == "Morning Routine"
    assert occurrences[0]["isProjected"] is False


def test_get_occurrences_returns_a_projected_future_occurrence(client, monkeypatch):
    _set_today(monkeypatch, date(2026, 7, 6))
    client.post(
        "/api/block-templates",
        json={"title": "Morning Routine", "shape": _all_days_active()},
    )
    response = client.get(
        "/api/blocks/occurrences",
        query_string={"startDate": "2026-07-10", "endDate": "2026-07-10"},
    )
    occurrences = response.get_json()["occurrences"]
    assert len(occurrences) == 1
    assert occurrences[0]["isProjected"] is True


def test_routes_require_a_logged_in_session(anonymous_client):
    response = anonymous_client.get(
        "/api/blocks/occurrences", query_string={"startDate": "2026-07-06", "endDate": "2026-07-06"}
    )
    assert response.status_code == 401


def test_patch_materializes_a_projected_occurrence_and_edits_it(client, monkeypatch):
    _set_today(monkeypatch, date(2026, 7, 6))
    client.post("/api/block-templates", json={"title": "Morning Routine", "shape": _all_days_active()})
    occurrences = client.get(
        "/api/blocks/occurrences", query_string={"startDate": "2026-07-10", "endDate": "2026-07-10"}
    ).get_json()["occurrences"]
    projected_id = occurrences[0]["id"]
    assert projected_id.startswith("projected:")

    response = client.patch(f"/api/blocks/{projected_id}", json={"title": "Special Friday routine"})
    assert response.status_code == 200
    body = response.get_json()
    assert body["title"] == "Special Friday routine"
    assert body["isProjected"] is False
    assert not body["id"].startswith("projected:")


def test_patch_override_survives_a_later_template_edit(client, monkeypatch):
    _set_today(monkeypatch, date(2026, 7, 6))
    created = client.post(
        "/api/block-templates", json={"title": "Morning Routine", "shape": _all_days_active()}
    ).get_json()
    occurrences = client.get(
        "/api/blocks/occurrences", query_string={"startDate": "2026-07-10", "endDate": "2026-07-10"}
    ).get_json()["occurrences"]
    projected_id = occurrences[0]["id"]
    client.patch(f"/api/blocks/{projected_id}", json={"title": "Overridden title"})

    client.patch(f"/api/block-templates/{created['id']}", json={"title": "Renamed template"})

    refreshed = client.get(
        "/api/blocks/occurrences", query_string={"startDate": "2026-07-10", "endDate": "2026-07-10"}
    ).get_json()["occurrences"]
    assert refreshed[0]["title"] == "Overridden title"


def test_patch_a_real_block_id_directly_edits_it(client, monkeypatch):
    _set_today(monkeypatch, date(2026, 7, 6))
    client.post("/api/block-templates", json={"title": "Morning Routine", "shape": _all_days_active()})
    today_occurrence = client.get(
        "/api/blocks/occurrences", query_string={"startDate": "2026-07-06", "endDate": "2026-07-06"}
    ).get_json()["occurrences"][0]

    response = client.patch(
        f"/api/blocks/{today_occurrence['id']}",
        json={"description": "Ran extra long today", "durationMinutes": 45},
    )
    assert response.status_code == 200
    body = response.get_json()
    assert body["description"] == "Ran extra long today"
    assert body["durationMinutes"] == 45


def test_patch_rejects_a_negative_duration(client, monkeypatch):
    _set_today(monkeypatch, date(2026, 7, 6))
    client.post("/api/block-templates", json={"title": "Morning Routine", "shape": _all_days_active()})
    today_occurrence = client.get(
        "/api/blocks/occurrences", query_string={"startDate": "2026-07-06", "endDate": "2026-07-06"}
    ).get_json()["occurrences"][0]

    response = client.patch(f"/api/blocks/{today_occurrence['id']}", json={"durationMinutes": -5})
    assert response.status_code == 400


def test_patch_accepts_a_zero_duration(client, monkeypatch):
    _set_today(monkeypatch, date(2026, 7, 6))
    client.post("/api/block-templates", json={"title": "Morning Routine", "shape": _all_days_active()})
    today_occurrence = client.get(
        "/api/blocks/occurrences", query_string={"startDate": "2026-07-06", "endDate": "2026-07-06"}
    ).get_json()["occurrences"][0]

    response = client.patch(f"/api/blocks/{today_occurrence['id']}", json={"durationMinutes": 0})
    assert response.status_code == 200
    assert response.get_json()["durationMinutes"] == 0


def test_patch_returns_404_for_a_missing_real_block(client):
    response = client.patch("/api/blocks/does-not-exist", json={"title": "Nope"})
    assert response.status_code == 404


def test_patch_returns_404_for_a_projected_occurrence_of_a_missing_template(client):
    response = client.patch("/api/blocks/projected:does-not-exist:2026-07-10", json={"title": "Nope"})
    assert response.status_code == 404
