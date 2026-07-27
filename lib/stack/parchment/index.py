"""Parchment stack library barrel: a bespoke flat-file record-storage engine.

Import from here rather than reaching into individual library modules directly.
"""

# ids — record id generation
from lib.stack.parchment.ids import generateRecordId

# page_store — the flat-file page storage engine
from lib.stack.parchment.page_store import (
    buildPagePath,
    clearPageKey,
    deletePage,
    listPageIds,
    readPage,
    readPath,
    writePage,
    writePath,
)

# list_store — a list primitive built on page_store
from lib.stack.parchment.list_store import appendToList, createList, deleteList, readList

__all__ = [
    "generateRecordId",
    "buildPagePath",
    "clearPageKey",
    "deletePage",
    "listPageIds",
    "readPage",
    "readPath",
    "writePage",
    "writePath",
    "appendToList",
    "createList",
    "deleteList",
    "readList",
]
