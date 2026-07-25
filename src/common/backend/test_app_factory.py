from src.common.backend.app_factory import createApp


def test_create_app_returns_flask_app_with_no_business_routes():
    app = createApp()

    rules = {rule.rule for rule in app.url_map.iter_rules()}
    assert "/api/health" not in rules


def test_unhandled_exception_returns_json_error_envelope():
    app = createApp()

    @app.get("/boom")
    def _boom():
        raise ValueError("kaboom")

    client = app.test_client()
    response = client.get("/boom")

    assert response.status_code == 500
    assert response.get_json() == {"success": False, "error": "kaboom"}


def test_http_exception_returns_json_error_envelope():
    app = createApp()

    client = app.test_client()
    response = client.get("/does-not-exist")

    assert response.status_code == 404
    body = response.get_json()
    assert body["success"] is False
    assert "error" in body
