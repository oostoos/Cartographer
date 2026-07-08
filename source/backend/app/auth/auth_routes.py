# @manualReviewRequested: 2026-07-06
"""Login/logout/status endpoints for the single local user. The password hash lives in .env, so
login doesn't depend on the database layer being healthy.
"""

from flask import Blueprint, request, session
from werkzeug.security import check_password_hash

from core.auth.login_guard import SESSION_KEY_IS_LOGGED_IN
from core.http.json_response import json_error, json_response
from core.config.settings import (
    SETTING_ADMIN_PASSWORD_DEV_OVERRIDE,
    SETTING_ADMIN_PASSWORD_HASH,
    SETTING_ADMIN_USERNAME,
    SETTING_FLASK_DEBUG,
    get_setting,
    get_setting_bool,
)

auth_blueprint = Blueprint("auth", __name__, url_prefix="/api/auth")


def _password_is_correct(submitted_password: str) -> bool:
    """Checks a submitted password against the real hash, or against
    ADMIN_PASSWORD_DEV_OVERRIDE when FLASK_DEBUG is on and an override is set.
    """
    expected_password_hash = get_setting(SETTING_ADMIN_PASSWORD_HASH)
    if check_password_hash(expected_password_hash, submitted_password):
        return True

    dev_override_password = get_setting(SETTING_ADMIN_PASSWORD_DEV_OVERRIDE)
    return (
        get_setting_bool(SETTING_FLASK_DEBUG)
        and bool(dev_override_password)
        and submitted_password == dev_override_password
    )


@auth_blueprint.post("/login")
def login():
    """Logs the single local user in.

    Body: {"username": str, "password": str}.
    Returns: 200 with {"loggedIn": true} on success; 401 on a wrong username or password.
    """
    body = request.get_json(force=True, silent=True) or {}
    submitted_username = body.get("username", "")
    submitted_password = body.get("password", "")

    expected_username = get_setting(SETTING_ADMIN_USERNAME)

    if submitted_username != expected_username or not _password_is_correct(submitted_password):
        return json_error("Incorrect username or password.", 401)

    session.permanent = True
    session[SESSION_KEY_IS_LOGGED_IN] = True
    return json_response({"loggedIn": True})


@auth_blueprint.post("/logout")
def logout():
    """Logs the current user out."""
    session.pop(SESSION_KEY_IS_LOGGED_IN, None)
    return json_response({"loggedIn": False})


@auth_blueprint.get("/status")
def status():
    """Reports whether anyone is currently logged in."""
    return json_response({"loggedIn": session.get(SESSION_KEY_IS_LOGGED_IN, False)})
