"""HTTP routes for the single local user's in-app preferences."""

from flask import Blueprint, jsonify, request

from core.auth.login_guard import login_required
from core.storage import record_store
from app.settings import user_preference

settings_blueprint = Blueprint("settings", __name__, url_prefix="/api/settings")


@settings_blueprint.get("")
@login_required
def get_settings():
    """Reads the user's preferences, creating them with defaults on first use."""
    return jsonify(_serialize(user_preference.get_or_create_singleton()))


@settings_blueprint.patch("")
@login_required
def update_settings():
    """Updates the user's preferences.

    Body: any of {"displayName": str}.
    """
    block = user_preference.get_or_create_singleton()
    body = request.get_json(force=True, silent=True) or {}
    if "displayName" in body:
        user_preference.set_display_name(body["displayName"], block=block)
    user_preference.save(block)
    return jsonify(_serialize(block))


@settings_blueprint.post("/purge-all-data")
@login_required
def purge_all_data():
    """Permanently deletes every record of every object type, for a full local reset."""
    record_store.purge_all_data()
    return "", 204


def _serialize(block) -> dict:
    """Turns a UserPreference record block into the JSON shape the frontend expects."""
    return {
        "id": user_preference.get_id(block=block),
        "displayName": user_preference.get_display_name(block=block),
        "createdAt": user_preference.get_created_at(block=block),
    }
