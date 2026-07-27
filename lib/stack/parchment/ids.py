"""Record ID generation for the Cartographer storage engine."""
import uuid


def generateRecordId() -> str:
    """Generate a new unique record id (a uuid4 hex string)."""
    return uuid.uuid4().hex
