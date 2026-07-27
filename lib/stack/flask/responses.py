"""JSON response envelope helpers shared by all backend routes.

Every route returns (jsonified envelope, status code), so that tupling is built in
here rather than repeated at each call site.
"""
from typing import Any

from flask import Response, jsonify

DEFAULT_SUCCESS_STATUS_CODE = 200
DEFAULT_ERROR_STATUS_CODE = 400


def _buildEnvelope(success: bool, data: Any, error: str | None) -> dict[str, Any]:
    """Build the {success, data} or {success, error} envelope shape shared by both response types."""
    return {"success": success, "data": data, "error": error}


def _buildEnvelopeResponse(envelope: dict[str, Any], status_code: int) -> tuple[Response, int]:
    """Build a (jsonified envelope, status code) tuple — the shared scaffold both response shapes use."""
    return jsonify(envelope), status_code


def buildSuccessResponse(data: Any = None, status_code: int = DEFAULT_SUCCESS_STATUS_CODE) -> tuple[Response, int]:
    """Build a (jsonified {success, data} envelope, status code) tuple for a successful response."""
    return _buildEnvelopeResponse(_buildEnvelope(True, data, None), status_code)


def buildErrorResponse(message: str, status_code: int = DEFAULT_ERROR_STATUS_CODE) -> tuple[Response, int]:
    """Build a (jsonified {success, error} envelope, status code) tuple for an error response."""
    return _buildEnvelopeResponse(_buildEnvelope(False, None, message), status_code)
