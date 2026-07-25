"""Generic current-time formatting. No knowledge of what the timestamp is used for."""
from datetime import datetime, timezone


def currentUtcIsoTimestamp() -> str:
    """Current UTC time as an ISO 8601 string."""
    return datetime.now(timezone.utc).isoformat()
