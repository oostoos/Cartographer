# @manualReviewRequested: 2026-07-06
import pytest
from werkzeug.security import generate_password_hash

from core.app_factory import create_app
from core.config.settings import (
    SETTING_ADMIN_PASSWORD_DEV_OVERRIDE,
    SETTING_ADMIN_PASSWORD_HASH,
    SETTING_ADMIN_USERNAME,
    SETTING_FLASK_DEBUG,
    SETTING_FLASK_SECRET_KEY,
)

CORRECT_PASSWORD = "correct-horse-battery-staple"
DEV_OVERRIDE_PASSWORD = "dev-override-password"


@pytest.fixture
def client(monkeypatch):
    monkeypatch.setenv(SETTING_FLASK_SECRET_KEY, "test-secret")
    monkeypatch.setenv(SETTING_ADMIN_USERNAME, "admin")
    monkeypatch.setenv(SETTING_ADMIN_PASSWORD_HASH, generate_password_hash(CORRECT_PASSWORD))
    return create_app().test_client()


def test_status_reports_logged_out_before_any_login(client):
    response = client.get("/api/auth/status")
    assert response.get_json() == {"loggedIn": False}


def test_login_succeeds_with_the_right_credentials(client):
    response = client.post("/api/auth/login", json={"username": "admin", "password": CORRECT_PASSWORD})
    assert response.status_code == 200
    assert response.get_json() == {"loggedIn": True}


def test_login_fails_with_the_wrong_password(client):
    response = client.post("/api/auth/login", json={"username": "admin", "password": "wrong"})
    assert response.status_code == 401


def test_login_fails_with_the_wrong_username(client):
    response = client.post("/api/auth/login", json={"username": "someone-else", "password": CORRECT_PASSWORD})
    assert response.status_code == 401


def test_status_reports_logged_in_after_a_successful_login(client):
    client.post("/api/auth/login", json={"username": "admin", "password": CORRECT_PASSWORD})
    response = client.get("/api/auth/status")
    assert response.get_json() == {"loggedIn": True}


def test_logout_clears_the_session(client):
    client.post("/api/auth/login", json={"username": "admin", "password": CORRECT_PASSWORD})
    client.post("/api/auth/logout")
    response = client.get("/api/auth/status")
    assert response.get_json() == {"loggedIn": False}


def test_login_succeeds_with_dev_override_password_when_debug_is_on(client, monkeypatch):
    monkeypatch.setenv(SETTING_FLASK_DEBUG, "1")
    monkeypatch.setenv(SETTING_ADMIN_PASSWORD_DEV_OVERRIDE, DEV_OVERRIDE_PASSWORD)
    response = client.post("/api/auth/login", json={"username": "admin", "password": DEV_OVERRIDE_PASSWORD})
    assert response.status_code == 200
    assert response.get_json() == {"loggedIn": True}


def test_dev_override_password_is_rejected_when_debug_is_off(client, monkeypatch):
    monkeypatch.setenv(SETTING_FLASK_DEBUG, "0")
    monkeypatch.setenv(SETTING_ADMIN_PASSWORD_DEV_OVERRIDE, DEV_OVERRIDE_PASSWORD)
    response = client.post("/api/auth/login", json={"username": "admin", "password": DEV_OVERRIDE_PASSWORD})
    assert response.status_code == 401
