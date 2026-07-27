"""HTTP routes for the /api/profile resource."""
from dataclasses import asdict

from flask import Blueprint, request

from lib.python.validation.type_checks import isDict, isString
from src.common.backend.responses import buildErrorResponse, buildSuccessResponse
from src.main.backend.database.profile import deleteAllData, getProfile, setDisplayName

profile_blueprint = Blueprint("profile", __name__, url_prefix="/api/profile")


@profile_blueprint.get("")
def getProfileRoute():
    """Fetch the profile."""
    return buildSuccessResponse(asdict(getProfile()))


@profile_blueprint.put("")
def putProfileRoute():
    """Set the profile's display name."""
    payload = request.get_json()
    if not isDict(payload):
        return buildErrorResponse("Request body must be a JSON object")

    display_name = payload.get("display_name")
    if not isString(display_name):
        return buildErrorResponse("'display_name' is required and must be a string")

    profile = setDisplayName(display_name)
    return buildSuccessResponse(asdict(profile))


@profile_blueprint.post("/delete-all-data")
def deleteAllDataRoute():
    """Delete every task and profile record."""
    deleteAllData()
    return buildSuccessResponse(None)
