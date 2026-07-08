# @manualReviewRequested: 2026-07-06
"""The one place a Flask route builds its (jsonify(...), status_code) response tuple, so every
route file returns through the same two shapes instead of repeating that tuple by hand.
"""

from flask import jsonify


def json_response(payload, status_code: int = 200):
    """A success response: (jsonify(payload), status_code)."""
    return jsonify(payload), status_code


def json_error(message: str, status_code: int = 400):
    """An error response: (jsonify(error=message), status_code)."""
    return jsonify(error=message), status_code
