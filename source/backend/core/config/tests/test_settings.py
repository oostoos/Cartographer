# @manualReviewRequested: 2026-07-06
import pytest

from core.config.settings import (
    SETTING_ADMIN_USERNAME,
    SETTING_BACKEND_PORT,
    SETTING_FLASK_DEBUG,
    SETTING_FLASK_SECRET_KEY,
    MissingSettingError,
    describe_settings,
    get_setting,
    get_setting_bool,
    get_setting_int,
    require_setting,
)


def test_get_setting_falls_back_to_its_documented_default(monkeypatch):
    monkeypatch.delenv(SETTING_ADMIN_USERNAME, raising=False)
    assert get_setting(SETTING_ADMIN_USERNAME) == "admin"


def test_get_setting_prefers_the_environment_value(monkeypatch):
    monkeypatch.setenv(SETTING_ADMIN_USERNAME, "someone-else")
    assert get_setting(SETTING_ADMIN_USERNAME) == "someone-else"


def test_get_setting_returns_none_when_unset_and_no_default(monkeypatch):
    monkeypatch.delenv(SETTING_FLASK_SECRET_KEY, raising=False)
    assert get_setting(SETTING_FLASK_SECRET_KEY) is None


def test_get_setting_bool_is_true_for_documented_truthy_values(monkeypatch):
    monkeypatch.setenv(SETTING_FLASK_DEBUG, "1")
    assert get_setting_bool(SETTING_FLASK_DEBUG) is True
    monkeypatch.setenv(SETTING_FLASK_DEBUG, "true")
    assert get_setting_bool(SETTING_FLASK_DEBUG) is True


def test_get_setting_bool_is_false_for_anything_else(monkeypatch):
    monkeypatch.setenv(SETTING_FLASK_DEBUG, "0")
    assert get_setting_bool(SETTING_FLASK_DEBUG) is False


def test_get_setting_int_reads_an_integer(monkeypatch):
    monkeypatch.setenv(SETTING_BACKEND_PORT, "6000")
    assert get_setting_int(SETTING_BACKEND_PORT) == 6000


def test_require_setting_raises_when_unset_and_no_default(monkeypatch):
    monkeypatch.delenv(SETTING_FLASK_SECRET_KEY, raising=False)
    with pytest.raises(MissingSettingError):
        require_setting(SETTING_FLASK_SECRET_KEY)


def test_require_setting_returns_the_value_when_set(monkeypatch):
    monkeypatch.setenv(SETTING_FLASK_SECRET_KEY, "a-real-secret")
    assert require_setting(SETTING_FLASK_SECRET_KEY) == "a-real-secret"


def test_describe_settings_includes_every_registered_setting():
    names = {setting.name for setting in describe_settings()}
    assert SETTING_FLASK_SECRET_KEY in names
    assert SETTING_ADMIN_USERNAME in names
