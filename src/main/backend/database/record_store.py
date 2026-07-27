"""Thin wrapper around page_store that binds Cartographer's DATA_ROOT.

DATA_ROOT is a constant every page_store call needs; callers (task.py,
profile.py) shouldn't have to pass it on every call, so it's bound here once.
"""
from src.common.backend.database import page_store
from src.main.backend.database.paths import DATA_ROOT


def readRecord(object_type: str, record_id: str) -> list[str] | None:
    """Read a record's fields, or None if no record exists for that id."""
    return page_store.readPage(DATA_ROOT, object_type, record_id)


def writeRecord(object_type: str, record_id: str, fields: list[str]) -> None:
    """Write a record's fields to disk, atomically and under an exclusive lock."""
    page_store.writePage(DATA_ROOT, object_type, record_id, fields)


def listRecordIds(object_type: str) -> list[str]:
    """List the ids of every record currently stored for the given object type."""
    return page_store.listPageIds(DATA_ROOT, object_type)


def clearObjectType(object_type: str) -> None:
    """Delete every record of the given object type."""
    page_store.clearPageKey(DATA_ROOT, object_type)


def deleteRecord(object_type: str, record_id: str) -> None:
    """Delete a single record if it exists. A no-op if it doesn't."""
    page_store.deletePage(DATA_ROOT, object_type, record_id)
