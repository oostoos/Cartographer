"""Request payload shapes for the /api/tasks routes, validated directly here.

Mirrored on the frontend by src/frontend/tasks/tasks-api.ts.
"""
from dataclasses import dataclass

from lib.language.python.validation.type_checks import isDict, isList, isString
from src.backend.request_validation import (
    REQUEST_BODY_MUST_BE_JSON_OBJECT_ERROR,
    InvalidPayloadError,
)

__all__ = [
    "InvalidPayloadError",
    "TaskCreatePayload",
    "TaskReorderPayload",
    "TaskUpdatePayload",
    "parseTaskCreatePayload",
    "parseTaskReorderPayload",
    "parseTaskUpdatePayload",
]

DESCRIPTION_MUST_BE_STRING_ERROR = "'description' must be a string"


@dataclass
class TaskCreatePayload:
    """Body shape for POST /api/tasks."""

    title: str
    description: str
    group_id: str | None


@dataclass
class TaskUpdatePayload:
    """Body shape for PATCH /api/tasks/<id>. Omitted fields are left unchanged."""

    title: str | None
    description: str | None


def parseTaskCreatePayload(data: object) -> TaskCreatePayload:
    """Parse and validate a task-create request body. Raises InvalidPayloadError if malformed."""
    if not isDict(data):
        raise InvalidPayloadError(REQUEST_BODY_MUST_BE_JSON_OBJECT_ERROR)

    title = data.get("title")
    if not isString(title):
        raise InvalidPayloadError("'title' is required and must be a string")

    description = data.get("description", "")
    if not isString(description):
        raise InvalidPayloadError(DESCRIPTION_MUST_BE_STRING_ERROR)

    group_id = data.get("group_id")
    if group_id is not None and not isString(group_id):
        raise InvalidPayloadError("'group_id' must be a string or null")

    return TaskCreatePayload(title=title, description=description, group_id=group_id)


def parseTaskUpdatePayload(data: object) -> TaskUpdatePayload:
    """Parse and validate a task-update request body. Raises InvalidPayloadError if malformed."""
    if not isDict(data):
        raise InvalidPayloadError(REQUEST_BODY_MUST_BE_JSON_OBJECT_ERROR)

    title = data.get("title")
    if title is not None and not isString(title):
        raise InvalidPayloadError("'title' must be a string")

    description = data.get("description")
    if description is not None and not isString(description):
        raise InvalidPayloadError(DESCRIPTION_MUST_BE_STRING_ERROR)

    return TaskUpdatePayload(title=title, description=description)


@dataclass
class TaskReorderPayload:
    """Body shape for PATCH /api/tasks/reorder."""

    task_ids: list[str]


def parseTaskReorderPayload(data: object) -> TaskReorderPayload:
    """Parse and validate a task-reorder request body. Raises InvalidPayloadError if malformed."""
    if not isDict(data):
        raise InvalidPayloadError(REQUEST_BODY_MUST_BE_JSON_OBJECT_ERROR)

    task_ids = data.get("task_ids")
    if not isList(task_ids) or not all(isString(task_id) for task_id in task_ids):
        raise InvalidPayloadError("'task_ids' is required and must be a list of strings")

    return TaskReorderPayload(task_ids=task_ids)
