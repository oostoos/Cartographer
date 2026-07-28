"""Request payload shapes for the /api/groups routes, validated directly here.

Mirrored on the frontend by src/frontend/groups/groups-api.ts.
"""
from dataclasses import dataclass

from lib.language.python.validation.type_checks import isDict, isList, isString
from src.backend.groups.group_color_palette import GROUP_COLOR_PALETTE
from src.backend.request_validation import (
    REQUEST_BODY_MUST_BE_JSON_OBJECT_ERROR,
    InvalidPayloadError,
)

__all__ = [
    "GroupCreatePayload",
    "GroupReorderPayload",
    "GroupUpdatePayload",
    "InvalidPayloadError",
    "parseGroupCreatePayload",
    "parseGroupReorderPayload",
    "parseGroupUpdatePayload",
]

NAME_REQUIRED_STRING_ERROR = "'name' is required and must be a string"
NAME_MUST_BE_STRING_ERROR = "'name' must be a string"
COLOR_MUST_BE_IN_PALETTE_ERROR = "'color' must be one of the app's fixed group colors"


@dataclass
class GroupCreatePayload:
    """Body shape for POST /api/groups."""

    name: str


def parseGroupCreatePayload(data: object) -> GroupCreatePayload:
    """Parse and validate a group-create request body. Raises InvalidPayloadError if malformed."""
    if not isDict(data):
        raise InvalidPayloadError(REQUEST_BODY_MUST_BE_JSON_OBJECT_ERROR)

    name = data.get("name")
    if not isString(name):
        raise InvalidPayloadError(NAME_REQUIRED_STRING_ERROR)

    return GroupCreatePayload(name=name)


@dataclass
class GroupUpdatePayload:
    """Body shape for PATCH /api/groups/<id>. Omitted fields are left unchanged."""

    name: str | None
    color: str | None


def parseGroupUpdatePayload(data: object) -> GroupUpdatePayload:
    """Parse and validate a group-update request body. Raises InvalidPayloadError if malformed."""
    if not isDict(data):
        raise InvalidPayloadError(REQUEST_BODY_MUST_BE_JSON_OBJECT_ERROR)

    name = data.get("name")
    if name is not None and not isString(name):
        raise InvalidPayloadError(NAME_MUST_BE_STRING_ERROR)

    color = data.get("color")
    if color is not None and color not in GROUP_COLOR_PALETTE:
        raise InvalidPayloadError(COLOR_MUST_BE_IN_PALETTE_ERROR)

    return GroupUpdatePayload(name=name, color=color)


@dataclass
class GroupReorderPayload:
    """Body shape for PATCH /api/groups/reorder."""

    group_ids: list[str]


def parseGroupReorderPayload(data: object) -> GroupReorderPayload:
    """Parse and validate a group-reorder request body. Raises InvalidPayloadError if malformed."""
    if not isDict(data):
        raise InvalidPayloadError(REQUEST_BODY_MUST_BE_JSON_OBJECT_ERROR)

    group_ids = data.get("group_ids")
    if not isList(group_ids) or not all(isString(group_id) for group_id in group_ids):
        raise InvalidPayloadError("'group_ids' is required and must be a list of strings")

    return GroupReorderPayload(group_ids=group_ids)
