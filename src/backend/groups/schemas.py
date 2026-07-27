"""Request payload shapes for the /api/groups routes, validated directly here.

Mirrored on the frontend by src/main/frontend/groups/groups-api.ts.
"""
from dataclasses import dataclass

from lib.python.validation.type_checks import isDict, isList, isString


class InvalidPayloadError(ValueError):
    """Raised when a request payload is malformed or missing a required field."""


@dataclass
class GroupCreatePayload:
    """Body shape for POST /api/groups."""

    name: str


def parseGroupCreatePayload(data: object) -> GroupCreatePayload:
    """Parse and validate a group-create request body. Raises InvalidPayloadError if malformed."""
    if not isDict(data):
        raise InvalidPayloadError("Request body must be a JSON object")

    name = data.get("name")
    if not isString(name):
        raise InvalidPayloadError("'name' is required and must be a string")

    return GroupCreatePayload(name=name)


@dataclass
class GroupUpdatePayload:
    """Body shape for PATCH /api/groups/<id>."""

    name: str


def parseGroupUpdatePayload(data: object) -> GroupUpdatePayload:
    """Parse and validate a group-rename request body. Raises InvalidPayloadError if malformed."""
    if not isDict(data):
        raise InvalidPayloadError("Request body must be a JSON object")

    name = data.get("name")
    if not isString(name):
        raise InvalidPayloadError("'name' is required and must be a string")

    return GroupUpdatePayload(name=name)


@dataclass
class GroupReorderPayload:
    """Body shape for PATCH /api/groups/reorder."""

    group_ids: list[str]


def parseGroupReorderPayload(data: object) -> GroupReorderPayload:
    """Parse and validate a group-reorder request body. Raises InvalidPayloadError if malformed."""
    if not isDict(data):
        raise InvalidPayloadError("Request body must be a JSON object")

    group_ids = data.get("group_ids")
    if not isList(group_ids) or not all(isString(group_id) for group_id in group_ids):
        raise InvalidPayloadError("'group_ids' is required and must be a list of strings")

    return GroupReorderPayload(group_ids=group_ids)
