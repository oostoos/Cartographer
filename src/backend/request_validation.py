"""Shared request-body validation for Cartographer's JSON API routes.

Every blueprint (tasks, groups, profile) needs to check that a request body
is a JSON object before doing anything else with it; this holds that check
once so it isn't redefined per functional area.
"""
from flask import request

from lib.language.python.validation.type_checks import isDict

REQUEST_BODY_MUST_BE_JSON_OBJECT_ERROR = "Request body must be a JSON object"


class InvalidPayloadError(ValueError):
    """Raised when a request payload is malformed or missing a required field."""


def requireJsonObjectBody() -> dict:
    """Parse the current request body as JSON, raising InvalidPayloadError if it isn't a JSON object.

    Malformed JSON itself surfaces as a 400 via Flask/app_factory's HTTPException handling.
    """
    payload = request.get_json()
    if not isDict(payload):
        raise InvalidPayloadError(REQUEST_BODY_MUST_BE_JSON_OBJECT_ERROR)
    return payload
