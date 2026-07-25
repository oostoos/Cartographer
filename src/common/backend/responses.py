"""JSON response envelope helpers shared by all backend routes."""
from typing import Any


def buildSuccessResponse(data: Any = None) -> dict:
    """Wrap successful response data in the standard {success, data} envelope."""
    return {"success": True, "data": data}


def buildErrorResponse(message: str) -> dict:
    """Wrap an error message in the standard {success, error} envelope."""
    return {"success": False, "error": message}
