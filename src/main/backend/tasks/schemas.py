"""Request payload shapes for the /api/tasks routes, validated directly here.

Mirrored on the frontend by src/main/frontend/tasks/tasks-api.ts.
"""
from dataclasses import dataclass


class InvalidPayloadError(ValueError):
    """Raised when a request payload is malformed or missing a required field."""


@dataclass
class TaskCreatePayload:
    """Body shape for POST /api/tasks."""

    title: str
    description: str


@dataclass
class TaskUpdatePayload:
    """Body shape for PATCH /api/tasks/<id>. Omitted fields are left unchanged."""

    title: str | None
    description: str | None


def parseTaskCreatePayload(data: object) -> TaskCreatePayload:
    """Parse and validate a task-create request body. Raises InvalidPayloadError if malformed."""
    if not isinstance(data, dict):
        raise InvalidPayloadError("Request body must be a JSON object")

    title = data.get("title")
    if not isinstance(title, str):
        raise InvalidPayloadError("'title' is required and must be a string")

    description = data.get("description", "")
    if not isinstance(description, str):
        raise InvalidPayloadError("'description' must be a string")

    return TaskCreatePayload(title=title, description=description)


def parseTaskUpdatePayload(data: object) -> TaskUpdatePayload:
    """Parse and validate a task-update request body. Raises InvalidPayloadError if malformed."""
    if not isinstance(data, dict):
        raise InvalidPayloadError("Request body must be a JSON object")

    title = data.get("title")
    if title is not None and not isinstance(title, str):
        raise InvalidPayloadError("'title' must be a string")

    description = data.get("description")
    if description is not None and not isinstance(description, str):
        raise InvalidPayloadError("'description' must be a string")

    return TaskUpdatePayload(title=title, description=description)
