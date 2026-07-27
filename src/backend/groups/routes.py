"""HTTP routes for the /api/groups resource."""
from dataclasses import asdict

from flask import Blueprint, request

from lib.language.python.validation.type_checks import isDict
from lib.stack.flask.responses import buildErrorResponse, buildSuccessResponse
from src.backend.database.group import (
    EmptyGroupNameError,
    createGroup,
    deleteGroup,
    getAllGroups,
    reorderGroups,
    updateGroup,
)
from src.backend.groups.schemas import (
    InvalidPayloadError,
    parseGroupCreatePayload,
    parseGroupReorderPayload,
    parseGroupUpdatePayload,
)

groups_blueprint = Blueprint("groups", __name__, url_prefix="/api/groups")

CREATED_STATUS_CODE = 201
NOT_FOUND_STATUS_CODE = 404


@groups_blueprint.get("")
def listGroups():
    """List every group."""
    groups = getAllGroups()
    return buildSuccessResponse([asdict(group) for group in groups])


@groups_blueprint.post("")
def createGroupRoute():
    """Create a new group."""
    try:
        payload = _requireJsonObjectBody()
        create_payload = parseGroupCreatePayload(payload)
        group = createGroup(create_payload.name)
    except (InvalidPayloadError, EmptyGroupNameError) as error:
        return buildErrorResponse(str(error))
    return buildSuccessResponse(asdict(group), CREATED_STATUS_CODE)


@groups_blueprint.patch("/reorder")
def reorderGroupsRoute():
    """Reorder groups to match the given id sequence."""
    try:
        payload = _requireJsonObjectBody()
        reorder_payload = parseGroupReorderPayload(payload)
    except InvalidPayloadError as error:
        return buildErrorResponse(str(error))
    groups = reorderGroups(reorder_payload.group_ids)
    return buildSuccessResponse([asdict(group) for group in groups])


@groups_blueprint.patch("/<group_id>")
def updateGroupRoute(group_id: str):
    """Rename a group."""
    try:
        payload = _requireJsonObjectBody()
        update_payload = parseGroupUpdatePayload(payload)
        group = updateGroup(group_id, update_payload.name)
    except (InvalidPayloadError, EmptyGroupNameError) as error:
        return buildErrorResponse(str(error))
    if group is None:
        return buildErrorResponse(f"No group with id '{group_id}'", NOT_FOUND_STATUS_CODE)
    return buildSuccessResponse(asdict(group))


@groups_blueprint.delete("/<group_id>")
def deleteGroupRoute(group_id: str):
    """Delete a group, unassigning every task in it."""
    deleted = deleteGroup(group_id)
    if not deleted:
        return buildErrorResponse(f"No group with id '{group_id}'", NOT_FOUND_STATUS_CODE)
    return buildSuccessResponse({"id": group_id})


def _requireJsonObjectBody() -> dict:
    """Parse the request body as JSON, raising InvalidPayloadError if it isn't a JSON object.

    Malformed JSON itself surfaces as a 400 via Flask/app_factory's HTTPException handling.
    """
    payload = request.get_json()
    if not isDict(payload):
        raise InvalidPayloadError("Request body must be a JSON object")
    return payload
