"""Bare Flask app factory: JSON error handling only, no business routes."""
from flask import Flask
from werkzeug.exceptions import HTTPException

from lib.stack.flask.responses import buildErrorResponse

UNEXPECTED_EXCEPTION_STATUS_CODE = 500


def createApp() -> Flask:
    """Build a bare Flask app with JSON error handlers registered."""
    app = Flask(__name__)
    _registerErrorHandlers(app)
    return app


def _registerErrorHandlers(app: Flask) -> None:
    """Make every error response (expected HTTP errors and unhandled exceptions) valid JSON."""

    @app.errorhandler(HTTPException)
    def _handleHttpException(error: HTTPException):
        return buildErrorResponse(error.description or error.name, error.code or UNEXPECTED_EXCEPTION_STATUS_CODE)

    @app.errorhandler(Exception)
    def _handleUnexpectedException(error: Exception):
        return buildErrorResponse(str(error), UNEXPECTED_EXCEPTION_STATUS_CODE)
