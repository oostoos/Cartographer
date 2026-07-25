"""Bare Flask app factory: JSON error handling only, no business routes."""
from flask import Flask, jsonify
from werkzeug.exceptions import HTTPException

from src.common.backend.responses import buildErrorResponse


def createApp() -> Flask:
    """Build a bare Flask app with JSON error handlers registered."""
    app = Flask(__name__)
    _registerErrorHandlers(app)
    return app


def _registerErrorHandlers(app: Flask) -> None:
    """Make every error response (expected HTTP errors and unhandled exceptions) valid JSON."""

    @app.errorhandler(HTTPException)
    def _handleHttpException(error: HTTPException):
        response = buildErrorResponse(error.description or error.name)
        return jsonify(response), error.code or 500

    @app.errorhandler(Exception)
    def _handleUnexpectedException(error: Exception):
        response = buildErrorResponse(str(error))
        return jsonify(response), 500
