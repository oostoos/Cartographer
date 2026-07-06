# @manualReviewRequested: 2026-07-06
from flask import Flask, jsonify

from core.auth.login_guard import SESSION_KEY_IS_LOGGED_IN, login_required


def _make_app():
    app = Flask(__name__)
    app.config["SECRET_KEY"] = "test-secret"

    @app.get("/protected")
    @login_required
    def protected():
        return jsonify(ok=True)

    return app


def test_login_required_blocks_an_anonymous_request():
    client = _make_app().test_client()
    response = client.get("/protected")
    assert response.status_code == 401


def test_login_required_allows_a_logged_in_request():
    app = _make_app()
    client = app.test_client()
    with client.session_transaction() as flask_session:
        flask_session[SESSION_KEY_IS_LOGGED_IN] = True
    response = client.get("/protected")
    assert response.status_code == 200
