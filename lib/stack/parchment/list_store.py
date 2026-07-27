"""Reusable list primitive built on page_store: line 0 = element count, lines 1..n = elements.

Elements are plain strings, so an element can itself be another list's record id,
giving 2D/3D composition for free without any extra graph machinery. Not consumed
by any business object in this slice — built small and left available for reuse.
Uses the same (data_root, object_type, record_id) shape as page_store so callers
can namespace their own kinds of lists.
"""
from pathlib import Path

from lib.stack.parchment.page_store import deletePage, readPage, writePage


def createList(data_root: Path, object_type: str, list_id: str, elements: list[str]) -> None:
    """Create (or overwrite) a list record with the given elements, in order."""
    writePage(data_root, object_type, list_id, _encodeList(elements))


def readList(data_root: Path, object_type: str, list_id: str) -> list[str] | None:
    """Read a list's elements in order, or None if no list exists with that id."""
    fields = readPage(data_root, object_type, list_id)
    if fields is None:
        return None
    return _decodeList(fields)


def deleteList(data_root: Path, object_type: str, list_id: str) -> None:
    """Delete a list if it exists. A no-op if it doesn't."""
    deletePage(data_root, object_type, list_id)


def appendToList(data_root: Path, object_type: str, list_id: str, element: str) -> list[str]:
    """Append an element to the end of a list, creating it first if it doesn't exist yet."""
    elements = readList(data_root, object_type, list_id) or []
    elements.append(element)
    createList(data_root, object_type, list_id, elements)
    return elements


def _encodeList(elements: list[str]) -> list[str]:
    """Encode elements into the page_store field list: [count, *elements]."""
    return [str(len(elements)), *elements]


def _decodeList(fields: list[str]) -> list[str]:
    """Decode a page_store field list ([count, *elements]) back into the element list."""
    count = int(fields[0])
    return fields[1 : 1 + count]
