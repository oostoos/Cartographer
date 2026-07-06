"""Loads and documents every value .env can hold — the single source of truth for backend
configuration. See .env.example for the file this reads, and CLAUDE.md in this directory for the
rule that every new .env-able setting must be registered here.
"""

import os
from dataclasses import dataclass

from dotenv import load_dotenv

load_dotenv()

SETTING_FLASK_SECRET_KEY = "FLASK_SECRET_KEY"
SETTING_ADMIN_USERNAME = "ADMIN_USERNAME"
SETTING_ADMIN_PASSWORD_HASH = "ADMIN_PASSWORD_HASH"
SETTING_ADMIN_PASSWORD_DEV_OVERRIDE = "ADMIN_PASSWORD_DEV_OVERRIDE"
SETTING_DATA_ROOT = "DATA_ROOT"
SETTING_FLASK_DEBUG = "FLASK_DEBUG"
SETTING_SESSION_LIFETIME_MINUTES = "SESSION_LIFETIME_MINUTES"
SETTING_BACKEND_PORT = "BACKEND_PORT"
SETTING_FRONTEND_ORIGIN = "FRONTEND_ORIGIN"

# The string values get_setting_bool treats as True; anything else (including unset) is False.
TRUTHY_RAW_VALUES = ("1", "true")


@dataclass
class Setting:
    """Describes one value that can be configured via .env.

    Fields: name, the exact .env key; description, what it controls; default, used when .env
        doesn't set it (None means there is no default); is_required, whether get_setting must
        resolve to a non-empty value.
    """

    name: str
    description: str
    default: str | None
    is_required: bool


SETTINGS_REGISTRY: dict[str, Setting] = {
    SETTING_FLASK_SECRET_KEY: Setting(
        SETTING_FLASK_SECRET_KEY, "Signs session cookies.", default=None, is_required=True
    ),
    SETTING_ADMIN_USERNAME: Setting(
        SETTING_ADMIN_USERNAME, "The single local user's login name.", default="admin", is_required=False
    ),
    SETTING_ADMIN_PASSWORD_HASH: Setting(
        SETTING_ADMIN_PASSWORD_HASH, "werkzeug password hash for login.", default=None, is_required=True
    ),
    SETTING_ADMIN_PASSWORD_DEV_OVERRIDE: Setting(
        SETTING_ADMIN_PASSWORD_DEV_OVERRIDE,
        "Plaintext admin password accepted as an alternate login, only while FLASK_DEBUG is on.",
        default=None,
        is_required=False,
    ),
    SETTING_DATA_ROOT: Setting(
        SETTING_DATA_ROOT, "Filesystem root for object-type directories.", default="./data", is_required=False
    ),
    SETTING_FLASK_DEBUG: Setting(
        SETTING_FLASK_DEBUG,
        "Enables Flask debug mode and the auto-reloader.",
        default="1",
        is_required=False,
    ),
    SETTING_SESSION_LIFETIME_MINUTES: Setting(
        SETTING_SESSION_LIFETIME_MINUTES,
        "How long a login session stays valid, in minutes.",
        default="43200",
        is_required=False,
    ),
    SETTING_BACKEND_PORT: Setting(
        SETTING_BACKEND_PORT, "Port the Flask dev server listens on.", default="5000", is_required=False
    ),
    SETTING_FRONTEND_ORIGIN: Setting(
        SETTING_FRONTEND_ORIGIN,
        "Origin allowed by CORS in development (the Vite dev server).",
        default="http://localhost:5173",
        is_required=False,
    ),
}


class MissingSettingError(Exception):
    """Raised when a required setting has no value in .env and no default."""


def get_setting(name: str) -> str | None:
    """Reads a setting's current value, falling back to its documented default if .env doesn't
    set it.

    Inputs: name, one of the SETTING_* constants.
    """
    setting = SETTINGS_REGISTRY[name]
    return os.environ.get(name, setting.default)


def get_setting_bool(name: str) -> bool:
    """Reads a setting as a boolean.

    Inputs: name, one of the SETTING_* constants.
    """
    raw = get_setting(name)
    return raw is not None and raw.lower() in TRUTHY_RAW_VALUES


def get_setting_int(name: str) -> int:
    """Reads a setting as an integer.

    Inputs: name, one of the SETTING_* constants.
    Raises: MissingSettingError if the setting has no value and no default.
    """
    return int(require_setting(name))


def require_setting(name: str) -> str:
    """Reads a setting's value, failing loudly (rather than at first use) if it's unset.

    Inputs: name, one of the SETTING_* constants.
    Raises: MissingSettingError if the setting has no value and no default.
    """
    value = get_setting(name)
    if not value:
        raise MissingSettingError(
            f"{name} is not set. {SETTINGS_REGISTRY[name].description} Set it in your .env file."
        )
    return value


def describe_settings() -> list[Setting]:
    """Returns every documented setting, in registration order."""
    return list(SETTINGS_REGISTRY.values())
