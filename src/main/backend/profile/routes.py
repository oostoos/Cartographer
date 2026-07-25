"""HTTP routes for the /api/profile resource."""
from dataclasses import asdict

from flask import Blueprint, jsonify, request

from src.common.backend.responses import buildErrorResponse, buildSuccessResponse
from src.main.backend.database.profile import deleteAllData, getProfile, setDisplayName

profile_blueprint = Blueprint("profile", __name__, url_prefix="/api/profile")


@profile_blueprint.get("")
def getProfileRoute():
    """Fetch the profile."""
    return jsonify(buildSuccessResponse(asdict(getProfile())))


@profile_blueprint.put("")
def putProfileRoute():
    """Set the profile's display name."""
    payload = request.get_json()
    if not isinstance(payload, dict):
        return jsonify(buildErrorResponse("Request body must be a JSON object")), 400

    display_name = payload.get("display_name")
    if not isinstance(display_name, str):
        return jsonify(buildErrorResponse("'display_name' is required and must be a string")), 400

    profile = setDisplayName(display_name)
    return jsonify(buildSuccessResponse(asdict(profile)))


@profile_blueprint.post("/delete-all-data")
def deleteAllDataRoute():
    """Delete every task and profile record."""
    deleteAllData()
    return jsonify(buildSuccessResponse(None))
