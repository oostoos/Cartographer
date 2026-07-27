"""HTTP routes for the /api/tasks resource."""
from dataclasses import asdict

from flask import Blueprint, request

from lib.python.validation.type_checks import isDict, isString
from src.common.backend.responses import buildErrorResponse, buildSuccessResponse
from src.main.backend.database.project import getProject
from src.main.backend.database.task import (
    EmptyTaskTitleError,
    createTask,
    deleteTask,
    getAllTasks,
    getTask,
    reorderTasks,
    setTaskCompleted,
    setTaskProject,
    updateTask,
)
from src.main.backend.tasks.schemas import (
    InvalidPayloadError,
    parseTaskCreatePayload,
    parseTaskReorderPayload,
    parseTaskUpdatePayload,
)

tasks_blueprint = Blueprint("tasks", __name__, url_prefix="/api/tasks")

CREATED_STATUS_CODE = 201
NOT_FOUND_STATUS_CODE = 404


@tasks_blueprint.get("")
def listTasks():
    """List every task."""
    tasks = getAllTasks()
    return buildSuccessResponse([asdict(task) for task in tasks])


@tasks_blueprint.post("")
def createTaskRoute():
    """Create a new task."""
    try:
        payload = _requireJsonObjectBody()
        create_payload = parseTaskCreatePayload(payload)
        if create_payload.project_id is not None and getProject(create_payload.project_id) is None:
            raise InvalidPayloadError(f"No project with id '{create_payload.project_id}'")
        task = createTask(create_payload.title, create_payload.description, create_payload.project_id)
    except (InvalidPayloadError, EmptyTaskTitleError) as error:
        return buildErrorResponse(str(error))
    return buildSuccessResponse(asdict(task), CREATED_STATUS_CODE)


@tasks_blueprint.patch("/reorder")
def reorderTasksRoute():
    """Reorder tasks to match the given id sequence."""
    try:
        payload = _requireJsonObjectBody()
        reorder_payload = parseTaskReorderPayload(payload)
    except InvalidPayloadError as error:
        return buildErrorResponse(str(error))
    tasks = reorderTasks(reorder_payload.task_ids)
    return buildSuccessResponse([asdict(task) for task in tasks])


@tasks_blueprint.get("/<task_id>")
def getTaskRoute(task_id: str):
    """Fetch a single task by id."""
    task = getTask(task_id)
    if task is None:
        return buildErrorResponse(f"No task with id '{task_id}'", NOT_FOUND_STATUS_CODE)
    return buildSuccessResponse(asdict(task))


@tasks_blueprint.patch("/<task_id>")
def updateTaskRoute(task_id: str):
    """Edit a task's title and/or description."""
    try:
        payload = _requireJsonObjectBody()
        update_payload = parseTaskUpdatePayload(payload)
        task = updateTask(task_id, title=update_payload.title, description=update_payload.description)
    except (InvalidPayloadError, EmptyTaskTitleError) as error:
        return buildErrorResponse(str(error))
    if task is None:
        return buildErrorResponse(f"No task with id '{task_id}'", NOT_FOUND_STATUS_CODE)
    return buildSuccessResponse(asdict(task))


@tasks_blueprint.patch("/<task_id>/complete")
def completeTaskRoute(task_id: str):
    """Toggle a task's completed flag."""
    try:
        payload = _requireJsonObjectBody()
        completed = payload.get("completed")
        if not isinstance(completed, bool):
            raise InvalidPayloadError("'completed' is required and must be a boolean")
    except InvalidPayloadError as error:
        return buildErrorResponse(str(error))

    task = setTaskCompleted(task_id, completed)
    if task is None:
        return buildErrorResponse(f"No task with id '{task_id}'", NOT_FOUND_STATUS_CODE)
    return buildSuccessResponse(asdict(task))


@tasks_blueprint.delete("/<task_id>")
def deleteTaskRoute(task_id: str):
    """Delete a single task."""
    deleted = deleteTask(task_id)
    if not deleted:
        return buildErrorResponse(f"No task with id '{task_id}'", NOT_FOUND_STATUS_CODE)
    return buildSuccessResponse({"id": task_id})


@tasks_blueprint.patch("/<task_id>/project")
def setTaskProjectRoute(task_id: str):
    """Assign a task to a project, or clear its project when project_id is null."""
    try:
        payload = _requireJsonObjectBody()
        project_id = payload.get("project_id")
        if project_id is not None and not isString(project_id):
            raise InvalidPayloadError("'project_id' must be a string or null")
        if project_id is not None and getProject(project_id) is None:
            raise InvalidPayloadError(f"No project with id '{project_id}'")
    except InvalidPayloadError as error:
        return buildErrorResponse(str(error))

    task = setTaskProject(task_id, project_id)
    if task is None:
        return buildErrorResponse(f"No task with id '{task_id}'", NOT_FOUND_STATUS_CODE)
    return buildSuccessResponse(asdict(task))


def _requireJsonObjectBody() -> dict:
    """Parse the request body as JSON, raising InvalidPayloadError if it isn't a JSON object.

    Malformed JSON itself surfaces as a 400 via Flask/app_factory's HTTPException handling.
    """
    payload = request.get_json()
    if not isDict(payload):
        raise InvalidPayloadError("Request body must be a JSON object")
    return payload
