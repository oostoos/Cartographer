"""Cartographer's flat-file storage engine: one .page file per page, line-per-field.

Knows this app's storage format (the .page extension, the escaping scheme, one file
per page) but nothing about what a page represents (Task, Profile, ...) — that
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


def buildPagePath(data_root: Path, page_key: str, page_id: str) -> Path:
    """Build the on-disk path for a page with the given key and id."""
    return Path(data_root) / page_key / f"{page_id}{PAGE_FILE_EXTENSION}"


def writePage(data_root: Path, page_key: str, page_id: str, fields: list[str]) -> None:
    """Write a page's fields (one per line) to disk, atomically and under an exclusive lock."""
    path = buildPagePath(data_root, page_key, page_id)
    content = "\n".join(_escapeFieldValue(field) for field in fields)
    writePath(path, content)


def readPage(data_root: Path, page_key: str, page_id: str) -> list[str] | None:
    """Read a page's fields, or None if no page exists for that id."""
    path = buildPagePath(data_root, page_key, page_id)
    content = readPath(path)
    if content is None:
        return None
    return [_unescapeFieldValue(line) for line in content.split("\n")]


def writePath(path: Path, content: str) -> None:
    """Write raw content to path, atomically and under an exclusive lock.

    No knowledge of what the content represents or how it's structured — that's
    readPage/writePage's job. This is just the target path this content lands at.
    """
    lock = acquireExclusiveLock(
        path, timeout_seconds=LOCK_TIMEOUT_SECONDS, retry_delay_seconds=LOCK_RETRY_DELAY_SECONDS
    )
    try:
        atomicWriteText(path, content)
    finally:
        releaseExclusiveLock(lock)


def readPath(path: Path) -> str | None:
    """Read raw content from path, or None if it doesn't exist."""
    if not path.exists():
        return None
    return path.read_text(encoding="utf-8")


def deletePage(data_root: Path, page_key: str, page_id: str) -> None:
    """Delete a page if it exists. A no-op if it doesn't."""
    path = buildPagePath(data_root, page_key, page_id)
    lock = acquireExclusiveLock(
        path, timeout_seconds=LOCK_TIMEOUT_SECONDS, retry_delay_seconds=LOCK_RETRY_DELAY_SECONDS
    )
    try:
        path.unlink(missing_ok=True)
    finally:
        releaseExclusiveLock(lock)


def listPageIds(data_root: Path, page_key: str) -> list[str]:
    """List the ids of every page currently stored under the given key."""
    directory = Path(data_root) / page_key
    if not directory.exists():
        return []
    return [entry.stem for entry in directory.glob(f"*{PAGE_FILE_EXTENSION}")]


def clearPageKey(data_root: Path, page_key: str) -> None:
    """Delete every page stored under the given key."""
    for page_id in listPageIds(data_root, page_key):
        deletePage(data_root, page_key, page_id)


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
