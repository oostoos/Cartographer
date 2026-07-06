# @manualReviewRequested: 2026-07-06
"""Shared test setup for the whole backend test suite."""

import pytest
from werkzeug.security import generate_password_hash

from core.config.settings import SETTING_ADMIN_PASSWORD_HASH, SETTING_ADMIN_USERNAME, SETTING_FLASK_SECRET_KEY

# The password every route test logs in with — arbitrary, only ever compared against its own hash.
TEST_ADMIN_PASSWORD = "test-password"


@pytest.fixture(autouse=True)
def isolated_data_root(tmp_path, monkeypatch):
    """Points every test at its own throwaway data directory, so tests never read or write the
    developer's real ./data folder and never interfere with each other.
    """
    monkeypatch.setenv("DATA_ROOT", str(tmp_path))


@pytest.fixture
def client(monkeypatch):
    """A Flask test client, already logged in as the single local user, for route tests that
    need an authenticated session rather than testing auth itself.
    """
    monkeypatch.setenv(SETTING_FLASK_SECRET_KEY, "test-secret")
    monkeypatch.setenv(SETTING_ADMIN_USERNAME, "admin")
    monkeypatch.setenv(SETTING_ADMIN_PASSWORD_HASH, generate_password_hash(TEST_ADMIN_PASSWORD))

    from core.app_factory import create_app

    test_client = create_app().test_client()
    test_client.post("/api/auth/login", json={"username": "admin", "password": TEST_ADMIN_PASSWORD})
    return test_client


@pytest.fixture
def anonymous_client(monkeypatch):
    """A Flask test client with no logged-in session, for confirming a route is actually gated
    by @login_required.
    """
    monkeypatch.setenv(SETTING_FLASK_SECRET_KEY, "test-secret")
    monkeypatch.setenv(SETTING_ADMIN_PASSWORD_HASH, generate_password_hash(TEST_ADMIN_PASSWORD))

    from core.app_factory import create_app

    return create_app().test_client()
