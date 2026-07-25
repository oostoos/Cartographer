"""Cartographer's flat-file storage engine: one .page file per record, line-per-field.

Knows this app's storage format (the .page extension, the escaping scheme, one file
per record) but nothing about what a record represents (Task, Profile, ...) — that
knowledge belongs to src/main/backend/database.
"""
from pathlib import Path

from lib.python.file_io.atomic_write import atomicWriteText
from lib.python.file_io.file_lock import acquireExclusiveLock, releaseExclusiveLock

PAGE_FILE_EXTENSION = ".page"
LOCK_TIMEOUT_SECONDS = 5.0
LOCK_RETRY_DELAY_SECONDS = 0.05

_ESCAPED_BACKSLASH = "\\\\"
_ESCAPED_NEWLINE = "\\n"


def buildRecordPath(data_root: Path, object_type: str, record_id: str) -> Path:
    """Build the on-disk path for a record of the given object type and id."""
    return Path(data_root) / object_type / f"{record_id}{PAGE_FILE_EXTENSION}"


def writeRecord(data_root: Path, object_type: str, record_id: str, fields: list[str]) -> None:
    """Write a record's fields (one per line) to disk, atomically and under an exclusive lock."""
    path = buildRecordPath(data_root, object_type, record_id)
    lock = acquireExclusiveLock(
        path, timeout_seconds=LOCK_TIMEOUT_SECONDS, retry_delay_seconds=LOCK_RETRY_DELAY_SECONDS
    )
    try:
        content = "\n".join(_escapeFieldValue(field) for field in fields)
        atomicWriteText(path, content)
    finally:
        releaseExclusiveLock(lock)


def readRecord(data_root: Path, object_type: str, record_id: str) -> list[str] | None:
    """Read a record's fields, or None if no record exists for that id."""
    path = buildRecordPath(data_root, object_type, record_id)
    if not path.exists():
        return None
    content = path.read_text(encoding="utf-8")
    return [_unescapeFieldValue(line) for line in content.split("\n")]


def deleteRecord(data_root: Path, object_type: str, record_id: str) -> None:
    """Delete a record if it exists. A no-op if it doesn't."""
    path = buildRecordPath(data_root, object_type, record_id)
    lock = acquireExclusiveLock(
        path, timeout_seconds=LOCK_TIMEOUT_SECONDS, retry_delay_seconds=LOCK_RETRY_DELAY_SECONDS
    )
    try:
        path.unlink(missing_ok=True)
    finally:
        releaseExclusiveLock(lock)


def listRecordIds(data_root: Path, object_type: str) -> list[str]:
    """List the ids of every record currently stored for the given object type."""
    directory = Path(data_root) / object_type
    if not directory.exists():
        return []
    return [entry.stem for entry in directory.glob(f"*{PAGE_FILE_EXTENSION}")]


def clearObjectType(data_root: Path, object_type: str) -> None:
    """Delete every record of the given object type."""
    for record_id in listRecordIds(data_root, object_type):
        deleteRecord(data_root, object_type, record_id)


def _escapeFieldValue(value: str) -> str:
    """Escape a field value so it can safely occupy a single line (embedded newlines/backslashes)."""
    return value.replace("\\", _ESCAPED_BACKSLASH).replace("\n", _ESCAPED_NEWLINE)


def _unescapeFieldValue(value: str) -> str:
    """Reverse _escapeFieldValue."""
    result: list[str] = []
    index = 0
    while index < len(value):
        char = value[index]
        if char == "\\" and index + 1 < len(value):
            next_char = value[index + 1]
            if next_char == "n":
                result.append("\n")
                index += 2
                continue
            if next_char == "\\":
                result.append("\\")
                index += 2
                continue
        result.append(char)
        index += 1
    return "".join(result)
