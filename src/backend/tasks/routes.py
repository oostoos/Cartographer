"""HTTP routes for the /api/tasks resource."""
from dataclasses import asdict
from http import HTTPStatus

from flask import Blueprint

from lib.language.python.validation.type_checks import isString
from lib.stack.flask.responses import buildErrorResponse, buildSuccessResponse
from src.backend.database.group import getGroup
from src.backend.database.task import (
    EmptyTaskTitleError,
    createTask,
    deleteTask,
    getAllTasks,
    getTask,
    reorderTasks,
    setTaskCompleted,
    setTaskDueDate,
    setTaskEnergyRequirement,
    setTaskGroup,
    setTaskImpact,
    setTaskTimeEstimateMinutes,
    updateTask,
)
from src.backend.request_validation import InvalidPayloadError, requireJsonObjectBody
from src.backend.tasks.schemas import (
    parseTaskCreatePayload,
    parseTaskDueDatePayload,
    parseTaskEnergyRequirementPayload,
    parseTaskImpactPayload,
    parseTaskReorderPayload,
    parseTaskTimeEstimateMinutesPayload,
    parseTaskUpdatePayload,
)

tasks_blueprint = Blueprint("tasks", __name__, url_prefix="/api/tasks")


@tasks_blueprint.get("")
def listTasks():
    """List every task."""
    tasks = getAllTasks()
    return buildSuccessResponse([asdict(task) for task in tasks])


@tasks_blueprint.post("")
def createTaskRoute():
    """Create a new task."""
    try:
        payload = requireJsonObjectBody()
        create_payload = parseTaskCreatePayload(payload)
        if create_payload.group_id is not None and getGroup(create_payload.group_id) is None:
            raise InvalidPayloadError(f"No group with id '{create_payload.group_id}'")
        task = createTask(create_payload.title, create_payload.description, create_payload.group_id)
    except (InvalidPayloadError, EmptyTaskTitleError) as error:
        return buildErrorResponse(str(error))
    return buildSuccessResponse(asdict(task), HTTPStatus.CREATED)


@tasks_blueprint.patch("/reorder")
def reorderTasksRoute():
    """Reorder tasks to match the given id sequence."""
    try:
        payload = requireJsonObjectBody()
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
        return buildErrorResponse(f"No task with id '{task_id}'", HTTPStatus.NOT_FOUND)
    return buildSuccessResponse(asdict(task))


@tasks_blueprint.patch("/<task_id>")
def updateTaskRoute(task_id: str):
    """Edit a task's title and/or description."""
    try:
        payload = requireJsonObjectBody()
        update_payload = parseTaskUpdatePayload(payload)
        task = updateTask(task_id, title=update_payload.title, description=update_payload.description)
    except (InvalidPayloadError, EmptyTaskTitleError) as error:
        return buildErrorResponse(str(error))
    if task is None:
        return buildErrorResponse(f"No task with id '{task_id}'", HTTPStatus.NOT_FOUND)
    return buildSuccessResponse(asdict(task))


@tasks_blueprint.patch("/<task_id>/complete")
def completeTaskRoute(task_id: str):
    """Toggle a task's completed flag."""
    try:
        payload = requireJsonObjectBody()
        completed = payload.get("completed")
        if not isinstance(completed, bool):
            raise InvalidPayloadError("'completed' is required and must be a boolean")
    except InvalidPayloadError as error:
        return buildErrorResponse(str(error))

    task = setTaskCompleted(task_id, completed)
    if task is None:
        return buildErrorResponse(f"No task with id '{task_id}'", HTTPStatus.NOT_FOUND)
    return buildSuccessResponse(asdict(task))


@tasks_blueprint.delete("/<task_id>")
def deleteTaskRoute(task_id: str):
    """Delete a single task."""
    deleted = deleteTask(task_id)
    if not deleted:
        return buildErrorResponse(f"No task with id '{task_id}'", HTTPStatus.NOT_FOUND)
    return buildSuccessResponse({"id": task_id})


@tasks_blueprint.patch("/<task_id>/group")
def setTaskGroupRoute(task_id: str):
    """Assign a task to a group, or clear its group when group_id is null."""
    try:
        payload = requireJsonObjectBody()
        group_id = payload.get("group_id")
        if group_id is not None and not isString(group_id):
            raise InvalidPayloadError("'group_id' must be a string or null")
        if group_id is not None and getGroup(group_id) is None:
            raise InvalidPayloadError(f"No group with id '{group_id}'")
    except InvalidPayloadError as error:
        return buildErrorResponse(str(error))

    task = setTaskGroup(task_id, group_id)
    if task is None:
        return buildErrorResponse(f"No task with id '{task_id}'", HTTPStatus.NOT_FOUND)
    return buildSuccessResponse(asdict(task))


@tasks_blueprint.patch("/<task_id>/energy")
def setTaskEnergyRequirementRoute(task_id: str):
    """Set a task's energy requirement, or clear it when energy_requirement is null."""
    try:
        payload = requireJsonObjectBody()
        parsed = parseTaskEnergyRequirementPayload(payload)
    except InvalidPayloadError as error:
        return buildErrorResponse(str(error))

    task = setTaskEnergyRequirement(task_id, parsed.energy_requirement)
    if task is None:
        return buildErrorResponse(f"No task with id '{task_id}'", HTTPStatus.NOT_FOUND)
    return buildSuccessResponse(asdict(task))


@tasks_blueprint.patch("/<task_id>/impact")
def setTaskImpactRoute(task_id: str):
    """Set a task's impact, or clear it when impact is null."""
    try:
        payload = requireJsonObjectBody()
        parsed = parseTaskImpactPayload(payload)
    except InvalidPayloadError as error:
        return buildErrorResponse(str(error))

    task = setTaskImpact(task_id, parsed.impact)
    if task is None:
        return buildErrorResponse(f"No task with id '{task_id}'", HTTPStatus.NOT_FOUND)
    return buildSuccessResponse(asdict(task))


@tasks_blueprint.patch("/<task_id>/due-date")
def setTaskDueDateRoute(task_id: str):
    """Set a task's due date, or clear it when due_date is null."""
    try:
        payload = requireJsonObjectBody()
        parsed = parseTaskDueDatePayload(payload)
    except InvalidPayloadError as error:
        return buildErrorResponse(str(error))

    task = setTaskDueDate(task_id, parsed.due_date)
    if task is None:
        return buildErrorResponse(f"No task with id '{task_id}'", HTTPStatus.NOT_FOUND)
    return buildSuccessResponse(asdict(task))


@tasks_blueprint.patch("/<task_id>/time-estimate")
def setTaskTimeEstimateMinutesRoute(task_id: str):
    """Set a task's time estimate in minutes, or clear it when time_estimate_minutes is null."""
    try:
        payload = requireJsonObjectBody()
        parsed = parseTaskTimeEstimateMinutesPayload(payload)
    except InvalidPayloadError as error:
        return buildErrorResponse(str(error))

    task = setTaskTimeEstimateMinutes(task_id, parsed.time_estimate_minutes)
    if task is None:
        return buildErrorResponse(f"No task with id '{task_id}'", HTTPStatus.NOT_FOUND)
    return buildSuccessResponse(asdict(task))
