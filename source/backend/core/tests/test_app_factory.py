# @manualReviewRequested: 2026-07-06
import pytest

from core.app_factory import create_app
from core.config.settings import (
    SETTING_ADMIN_PASSWORD_HASH,
    SETTING_FLASK_SECRET_KEY,
    MissingSettingError,
)
from core.storage.errors import LockTimeoutError, RecordNotFoundError, ValidationError


def _set_required_settings(monkeypatch):
    monkeypatch.setenv(SETTING_FLASK_SECRET_KEY, "test-secret")
    monkeypatch.setenv(SETTING_ADMIN_PASSWORD_HASH, "not-a-real-hash")


def test_create_app_raises_when_secret_key_is_missing(monkeypatch):
    monkeypatch.delenv(SETTING_FLASK_SECRET_KEY, raising=False)
    monkeypatch.setenv(SETTING_ADMIN_PASSWORD_HASH, "not-a-real-hash")
    with pytest.raises(MissingSettingError):
        create_app()


def test_create_app_raises_when_admin_password_hash_is_missing(monkeypatch):
    monkeypatch.setenv(SETTING_FLASK_SECRET_KEY, "test-secret")
    monkeypatch.delenv(SETTING_ADMIN_PASSWORD_HASH, raising=False)
    with pytest.raises(MissingSettingError):
        create_app()


def test_health_check_reports_ok(monkeypatch):
    _set_required_settings(monkeypatch)
    client = create_app().test_client()
    response = client.get("/api/health")
    assert response.status_code == 200
    assert response.get_json() == {"status": "ok"}


def test_record_not_found_error_maps_to_404(monkeypatch):
    _set_required_settings(monkeypatch)
    app = create_app()

    @app.get("/__test_not_found")
    def _raise_not_found():
        raise RecordNotFoundError("nope")

    response = app.test_client().get("/__test_not_found")
    assert response.status_code == 404


def test_validation_error_maps_to_400(monkeypatch):
    _set_required_settings(monkeypatch)
    app = create_app()

    @app.get("/__test_validation")
    def _raise_validation():
        raise ValidationError("bad")

    response = app.test_client().get("/__test_validation")
    assert response.status_code == 400


def test_lock_timeout_error_maps_to_503(monkeypatch):
    _set_required_settings(monkeypatch)
    app = create_app()

    @app.get("/__test_lock_timeout")
    def _raise_lock_timeout():
        raise LockTimeoutError("locked")

    response = app.test_client().get("/__test_lock_timeout")
    assert response.status_code == 503
