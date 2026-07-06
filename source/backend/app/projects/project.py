"""A Project: a named grouping that tasks can optionally belong to, and that can itself belong to
another project as a subproject (arbitrary nesting depth, via the same plain-id reference pattern
`Task.project_id` uses). Same shape as app/tasks/task.py — see core/storage/CLAUDE.md for the
conventions this follows.
"""

import sys
from datetime import datetime

from core.storage import object_registry, record_store
from core.storage.control_chars import raise_if_contains_control_characters
from core.storage.field_types import decode_bool, encode_bool
from core.storage.record_block import RecordBlock

OBJECT_TYPE = "Project"

FIELD_TITLE = "title"
FIELD_DESCRIPTION = "description"
FIELD_PARENT_PROJECT_ID = "parent_project_id"
FIELD_IS_ARCHIVED = "is_archived"
FIELD_CREATED_AT = "created_at"


# --- --- --- ---
# Standard functions


def create(title: str, description: str = "", parent_project_id: str = "") -> RecordBlock:
    """Creates a new project and saves it immediately.

    Inputs: title, required; description, optional; parent_project_id, optional — empty means a
        top-level project, non-empty makes this a subproject of that project.
    Raises: ValidationError if title or description contains a reserved control character.
    """
    raise_if_contains_control_characters(title)
    raise_if_contains_control_characters(description)
    initial_fields = {
        FIELD_TITLE: title,
        FIELD_DESCRIPTION: description,
        FIELD_PARENT_PROJECT_ID: parent_project_id,
        FIELD_IS_ARCHIVED: encode_bool(False),
        FIELD_CREATED_AT: datetime.now().isoformat(),
    }
    return record_store.create_record(OBJECT_TYPE, initial_fields)


def load(project_id: str) -> RecordBlock:
    """Reads a project from disk.

    Raises: RecordNotFoundError if no matching project exists.
    """
    return record_store.load_block(OBJECT_TYPE, project_id)


def save(block: RecordBlock) -> None:
    """Writes a project's block to disk if it has unsaved changes."""
    record_store.save_block(block)


def delete(project_id: str) -> None:
    """Deletes a project. A no-op if it doesn't exist."""
    record_store.delete_record(OBJECT_TYPE, project_id)


def list_ids() -> list[str]:
    """Lists every project's id without reading any project's contents."""
    return record_store.list_record_ids(OBJECT_TYPE)


def list_all() -> list[RecordBlock]:
    """Loads every project. Expensive relative to list_ids — prefer list_ids when ids suffice."""
    return record_store.list_all_blocks(OBJECT_TYPE)


def find(**raw_field_filters: str) -> list[RecordBlock]:
    """Loads every project whose raw field values match every given filter."""
    return record_store.find_blocks(OBJECT_TYPE, **raw_field_filters)


def find_one(**raw_field_filters: str) -> RecordBlock | None:
    """Loads the first project matching every given filter, or None if none do."""
    return record_store.find_one_block(OBJECT_TYPE, **raw_field_filters)


# --- --- --- ---
# Field getters and setters
#
# Every function below accepts exactly one of project_id= (one-shot) or block= (batched) — see
# core/storage/CLAUDE.md.


def get_id(project_id: str | None = None, *, block: RecordBlock | None = None) -> str:
    """Reads a project's id."""
    return record_store.resolve_block(OBJECT_TYPE, project_id, block).record_id


def get_title(project_id: str | None = None, *, block: RecordBlock | None = None) -> str:
    """Reads a project's title."""
    return record_store.resolve_block(OBJECT_TYPE, project_id, block).fields[FIELD_TITLE]


def set_title(value: str, project_id: str | None = None, *, block: RecordBlock | None = None) -> RecordBlock:
    """Sets a project's title.

    Raises: ValidationError if value contains a reserved control character.
    """
    raise_if_contains_control_characters(value)
    return _set_field(FIELD_TITLE, value, project_id, block)


def get_description(project_id: str | None = None, *, block: RecordBlock | None = None) -> str:
    """Reads a project's description."""
    return record_store.resolve_block(OBJECT_TYPE, project_id, block).fields[FIELD_DESCRIPTION]


def set_description(
    value: str, project_id: str | None = None, *, block: RecordBlock | None = None
) -> RecordBlock:
    """Sets a project's description.

    Raises: ValidationError if value contains a reserved control character.
    """
    raise_if_contains_control_characters(value)
    return _set_field(FIELD_DESCRIPTION, value, project_id, block)


def get_parent_project_id(project_id: str | None = None, *, block: RecordBlock | None = None) -> str:
    """Reads the id of the project this one is a subproject of (empty string means top-level)."""
    return record_store.resolve_block(OBJECT_TYPE, project_id, block).fields[FIELD_PARENT_PROJECT_ID]


def set_parent_project_id(
    value: str, project_id: str | None = None, *, block: RecordBlock | None = None
) -> RecordBlock:
    """Sets the project this one is a subproject of (empty string means top-level)."""
    return _set_field(FIELD_PARENT_PROJECT_ID, value, project_id, block)


def get_is_archived(project_id: str | None = None, *, block: RecordBlock | None = None) -> bool:
    """Reads whether a project is archived (hidden from active lists)."""
    return decode_bool(record_store.resolve_block(OBJECT_TYPE, project_id, block).fields[FIELD_IS_ARCHIVED])


def set_is_archived(
    value: bool, project_id: str | None = None, *, block: RecordBlock | None = None
) -> RecordBlock:
    """Sets whether a project is archived."""
    return _set_field(FIELD_IS_ARCHIVED, encode_bool(value), project_id, block)


def get_created_at(project_id: str | None = None, *, block: RecordBlock | None = None) -> str:
    """Reads the ISO-8601 timestamp a project was created at. Immutable — there is no setter."""
    return record_store.resolve_block(OBJECT_TYPE, project_id, block).fields[FIELD_CREATED_AT]


# --- --- --- ---
# Internal helpers


def _set_field(
    field_name: str, raw_value: str, project_id: str | None, block: RecordBlock | None
) -> RecordBlock:
    """Applies one field change, saving immediately unless the caller is batching via block=."""
    target_block = record_store.resolve_block(OBJECT_TYPE, project_id, block)
    target_block.fields[field_name] = raw_value
    target_block.is_dirty = True
    if block is None:
        save(target_block)
    return target_block


object_registry.register(OBJECT_TYPE, sys.modules[__name__])
