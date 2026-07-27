"""Request payload shapes for the /api/projects routes, validated directly here.

Mirrored on the frontend by src/main/frontend/projects/projects-api.ts.
"""
from dataclasses import dataclass

from lib.python.validation.type_checks import isDict, isString


class InvalidPayloadError(ValueError):
    """Raised when a request payload is malformed or missing a required field."""


@dataclass
class ProjectCreatePayload:
    """Body shape for POST /api/projects."""

    name: str


def parseProjectCreatePayload(data: object) -> ProjectCreatePayload:
    """Parse and validate a project-create request body. Raises InvalidPayloadError if malformed."""
    if not isDict(data):
        raise InvalidPayloadError("Request body must be a JSON object")

    name = data.get("name")
    if not isString(name):
        raise InvalidPayloadError("'name' is required and must be a string")

    return ProjectCreatePayload(name=name)
