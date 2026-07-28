"""HTTP routes for the /api/profile resource."""
from dataclasses import asdict

from flask import Blueprint

from lib.language.python.validation.type_checks import isString
from lib.stack.flask.responses import buildErrorResponse, buildSuccessResponse
from src.backend.database.profile import deleteAllData, getProfile, setDisplayName
from src.backend.request_validation import InvalidPayloadError, requireJsonObjectBody

profile_blueprint = Blueprint("profile", __name__, url_prefix="/api/profile")


@profile_blueprint.get("")
def getProfileRoute():
    """Fetch the profile."""
    return buildSuccessResponse(asdict(getProfile()))


@profile_blueprint.put("")
def putProfileRoute():
    """Set the profile's display name."""
    try:
        payload = requireJsonObjectBody()
        display_name = payload.get("display_name")
        if not isString(display_name):
            raise InvalidPayloadError("'display_name' is required and must be a string")
    except InvalidPayloadError as error:
        return buildErrorResponse(str(error))

    profile = setDisplayName(display_name)
    return buildSuccessResponse(asdict(profile))


@profile_blueprint.post("/delete-all-data")
def deleteAllDataRoute():
    """Delete every task and profile record."""
    deleteAllData()
    return buildSuccessResponse(None)
