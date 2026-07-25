"""JSON response envelope helpers shared by all backend routes.

Every route returns (jsonified envelope, status code), so that tupling is built in
here rather than repeated at each call site.
"""
from typing import Any

from flask import Response, jsonify

DEFAULT_SUCCESS_STATUS_CODE = 200
DEFAULT_ERROR_STATUS_CODE = 400


def buildSuccessResponse(data: Any = None, status_code: int = DEFAULT_SUCCESS_STATUS_CODE) -> tuple[Response, int]:
    """Build a (jsonified {success, data} envelope, status code) tuple for a successful response."""
    return jsonify({"success": True, "data": data}), status_code


def buildErrorResponse(message: str, status_code: int = DEFAULT_ERROR_STATUS_CODE) -> tuple[Response, int]:
    """Build a (jsonified {success, error} envelope, status code) tuple for an error response."""
    return jsonify({"success": False, "error": message}), status_code
