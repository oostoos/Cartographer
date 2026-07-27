"""Request payload shapes for the /api/tasks routes, validated directly here.

Mirrored on the frontend by src/main/frontend/tasks/tasks-api.ts.
"""
from dataclasses import dataclass

from lib.python.validation.type_checks import isDict, isList, isString


class InvalidPayloadError(ValueError):
    """Raised when a request payload is malformed or missing a required field."""


@dataclass
class TaskCreatePayload:
    """Body shape for POST /api/tasks."""

    title: str
    description: str
    project_id: str | None


@dataclass
class TaskUpdatePayload:
    """Body shape for PATCH /api/tasks/<id>. Omitted fields are left unchanged."""

    title: str | None
    description: str | None


def parseTaskCreatePayload(data: object) -> TaskCreatePayload:
    """Parse and validate a task-create request body. Raises InvalidPayloadError if malformed."""
    if not isDict(data):
        raise InvalidPayloadError("Request body must be a JSON object")

    title = data.get("title")
    if not isString(title):
        raise InvalidPayloadError("'title' is required and must be a string")

    description = data.get("description", "")
    if not isString(description):
        raise InvalidPayloadError("'description' must be a string")

    project_id = data.get("project_id")
    if project_id is not None and not isString(project_id):
        raise InvalidPayloadError("'project_id' must be a string or null")

    return TaskCreatePayload(title=title, description=description, project_id=project_id)


def parseTaskUpdatePayload(data: object) -> TaskUpdatePayload:
    """Parse and validate a task-update request body. Raises InvalidPayloadError if malformed."""
    if not isDict(data):
        raise InvalidPayloadError("Request body must be a JSON object")

    title = data.get("title")
    if title is not None and not isString(title):
        raise InvalidPayloadError("'title' must be a string")

    description = data.get("description")
    if description is not None and not isString(description):
        raise InvalidPayloadError("'description' must be a string")

    return TaskUpdatePayload(title=title, description=description)


@dataclass
class TaskReorderPayload:
    """Body shape for PATCH /api/tasks/reorder."""

    task_ids: list[str]


def parseTaskReorderPayload(data: object) -> TaskReorderPayload:
    """Parse and validate a task-reorder request body. Raises InvalidPayloadError if malformed."""
    if not isDict(data):
        raise InvalidPayloadError("Request body must be a JSON object")

    task_ids = data.get("task_ids")
    if not isList(task_ids) or not all(isString(task_id) for task_id in task_ids):
        raise InvalidPayloadError("'task_ids' is required and must be a list of strings")

    return TaskReorderPayload(task_ids=task_ids)
