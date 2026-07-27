from src.main.backend.app import app


def test_health_returns_ok_status():
    client = app.test_client()

    response = client.get("/api/health")

    assert response.status_code == 200
    assert response.get_json() == {"success": True, "data": {"status": "ok"}}
