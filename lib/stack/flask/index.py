"""Flask stack library barrel: generic, framework-aware building blocks.

Import from here rather than reaching into individual library modules directly.
"""

# app_factory — bare Flask app + JSON error handling
from lib.stack.flask.app_factory import createApp

# responses — JSON success/error envelope helpers
from lib.stack.flask.responses import buildErrorResponse, buildSuccessResponse

__all__ = [
    "createApp",
    "buildErrorResponse",
    "buildSuccessResponse",
]
