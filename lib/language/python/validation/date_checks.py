"""Generic date-string predicates. No knowledge of what's being validated or why."""
from datetime import date


def isIsoDateString(value: object) -> bool:
    """True if value is a str parseable as an ISO 8601 date (YYYY-MM-DD)."""
    if not isinstance(value, str):
        return False
    try:
        date.fromisoformat(value)
        return True
    except ValueError:
        return False
