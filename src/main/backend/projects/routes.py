"""HTTP routes for the /api/projects resource."""
from dataclasses import asdict

from flask import Blueprint, request

from lib.python.validation.type_checks import isDict
from src.common.backend.responses import buildErrorResponse, buildSuccessResponse
from src.main.backend.database.project import (
    EmptyProjectNameError,
    createProject,
    deleteProject,
    getAllProjects,
)
from src.main.backend.projects.schemas import InvalidPayloadError, parseProjectCreatePayload

projects_blueprint = Blueprint("projects", __name__, url_prefix="/api/projects")

CREATED_STATUS_CODE = 201
NOT_FOUND_STATUS_CODE = 404


@projects_blueprint.get("")
def listProjects():
    """List every project."""
    projects = getAllProjects()
    return buildSuccessResponse([asdict(project) for project in projects])


@projects_blueprint.post("")
def createProjectRoute():
    """Create a new project."""
    try:
        payload = _requireJsonObjectBody()
        create_payload = parseProjectCreatePayload(payload)
        project = createProject(create_payload.name)
    except (InvalidPayloadError, EmptyProjectNameError) as error:
        return buildErrorResponse(str(error))
    return buildSuccessResponse(asdict(project), CREATED_STATUS_CODE)


@projects_blueprint.delete("/<project_id>")
def deleteProjectRoute(project_id: str):
    """Delete a project, unassigning every task in it."""
    deleted = deleteProject(project_id)
    if not deleted:
        return buildErrorResponse(f"No project with id '{project_id}'", NOT_FOUND_STATUS_CODE)
    return buildSuccessResponse({"id": project_id})


def _requireJsonObjectBody() -> dict:
    """Parse the request body as JSON, raising InvalidPayloadError if it isn't a JSON object.

    Malformed JSON itself surfaces as a 400 via Flask/app_factory's HTTPException handling.
    """
    payload = request.get_json()
    if not isDict(payload):
        raise InvalidPayloadError("Request body must be a JSON object")
    return payload
