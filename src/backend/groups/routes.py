"""HTTP routes for the /api/groups resource."""
from dataclasses import asdict
from http import HTTPStatus

from flask import Blueprint

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
    parseGroupCreatePayload,
    parseGroupReorderPayload,
    parseGroupUpdatePayload,
)
from src.backend.request_validation import InvalidPayloadError, requireJsonObjectBody

groups_blueprint = Blueprint("groups", __name__, url_prefix="/api/groups")


@groups_blueprint.get("")
def listGroups():
    """List every group."""
    groups = getAllGroups()
    return buildSuccessResponse([asdict(group) for group in groups])


@groups_blueprint.post("")
def createGroupRoute():
    """Create a new group."""
    try:
        payload = requireJsonObjectBody()
        create_payload = parseGroupCreatePayload(payload)
        group = createGroup(create_payload.name)
    except (InvalidPayloadError, EmptyGroupNameError) as error:
        return buildErrorResponse(str(error))
    return buildSuccessResponse(asdict(group), HTTPStatus.CREATED)


@groups_blueprint.patch("/reorder")
def reorderGroupsRoute():
    """Reorder groups to match the given id sequence."""
    try:
        payload = requireJsonObjectBody()
        reorder_payload = parseGroupReorderPayload(payload)
    except InvalidPayloadError as error:
        return buildErrorResponse(str(error))
    groups = reorderGroups(reorder_payload.group_ids)
    return buildSuccessResponse([asdict(group) for group in groups])


@groups_blueprint.patch("/<group_id>")
def updateGroupRoute(group_id: str):
    """Update a group's name and/or color."""
    try:
        payload = requireJsonObjectBody()
        update_payload = parseGroupUpdatePayload(payload)
        group = updateGroup(group_id, name=update_payload.name, color=update_payload.color)
    except (InvalidPayloadError, EmptyGroupNameError) as error:
        return buildErrorResponse(str(error))
    if group is None:
        return buildErrorResponse(f"No group with id '{group_id}'", HTTPStatus.NOT_FOUND)
    return buildSuccessResponse(asdict(group))


@groups_blueprint.delete("/<group_id>")
def deleteGroupRoute(group_id: str):
    """Delete a group, unassigning every task in it."""
    deleted = deleteGroup(group_id)
    if not deleted:
        return buildErrorResponse(f"No group with id '{group_id}'", HTTPStatus.NOT_FOUND)
    return buildSuccessResponse({"id": group_id})
