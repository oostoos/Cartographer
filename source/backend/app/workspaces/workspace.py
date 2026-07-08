# @manualReviewRequested: 2026-07-07
"""A Workspace: a named, non-completable collection lens — not an owning parent the way a Project
is to a Task, just a way to view a related set of notes/tasks/projects/blocks together (e.g.
"School", "Work", "Training"). Project/Task/Note/BlockTemplate each carry an optional
workspace_id (empty string means unassigned) pointing back here, the same plain-id reference
pattern Task.project_id already uses — see core/storage/CLAUDE.md. Deleting a workspace unassigns
every item that pointed to it rather than deleting them (see workspace_routes.py's
_unassign_workspace) — a workspace is a lens, not ownership.
"""

import sys
from datetime import datetime

from core.storage import object_registry, record_store
from core.storage.control_chars import raise_if_contains_control_characters
from core.storage.field_types import decode_bool, encode_bool
from core.storage.record_block import RecordBlock

OBJECT_TYPE = "Workspace"

FIELD_TITLE = "title"
FIELD_DESCRIPTION = "description"
FIELD_COLOR = "color"
FIELD_IS_ARCHIVED = "is_archived"
FIELD_CREATED_AT = "created_at"


# --- --- --- ---
# Standard functions


def create(title: str, description: str = "", color: str = "") -> RecordBlock:
    """Creates a new workspace and saves it immediately.

    Inputs: title, required; description, optional; color, optional — a key into the design
        system's fixed block-color palette (tokens.css's --color-block-* pairs), empty means no
        color chosen yet.
    Raises: ValidationError if title or description contains a reserved control character.
    """
    raise_if_contains_control_characters(title)
    raise_if_contains_control_characters(description)
    initial_fields = {
        FIELD_TITLE: title,
        FIELD_DESCRIPTION: description,
        FIELD_COLOR: color,
        FIELD_IS_ARCHIVED: encode_bool(False),
        FIELD_CREATED_AT: datetime.now().isoformat(),
    }
    return record_store.create_record(OBJECT_TYPE, initial_fields)


def load(workspace_id: str) -> RecordBlock:
    """Reads a workspace from disk.

    Raises: RecordNotFoundError if no matching workspace exists.
    """
    return record_store.load_block(OBJECT_TYPE, workspace_id)


def save(block: RecordBlock) -> None:
    """Writes a workspace's block to disk if it has unsaved changes."""
    record_store.save_block(block)


def delete(workspace_id: str) -> None:
    """Deletes a workspace. A no-op if it doesn't exist."""
    record_store.delete_record(OBJECT_TYPE, workspace_id)


def list_ids() -> list[str]:
    """Lists every workspace's id without reading any workspace's contents."""
    return record_store.list_record_ids(OBJECT_TYPE)


def list_all() -> list[RecordBlock]:
    """Loads every workspace. Expensive relative to list_ids — prefer list_ids when ids suffice."""
    return record_store.list_all_blocks(OBJECT_TYPE)


def find(**raw_field_filters: str) -> list[RecordBlock]:
    """Loads every workspace whose raw field values match every given filter."""
    return record_store.find_blocks(OBJECT_TYPE, **raw_field_filters)


def find_one(**raw_field_filters: str) -> RecordBlock | None:
    """Loads the first workspace matching every given filter, or None if none do."""
    return record_store.find_one_block(OBJECT_TYPE, **raw_field_filters)


# --- --- --- ---
# Field getters and setters
#
# Every function below accepts exactly one of workspace_id= (one-shot) or block= (batched) — see
# core/storage/CLAUDE.md.


def get_id(workspace_id: str | None = None, *, block: RecordBlock | None = None) -> str:
    """Reads a workspace's id."""
    return record_store.resolve_block(OBJECT_TYPE, workspace_id, block).record_id


def get_title(workspace_id: str | None = None, *, block: RecordBlock | None = None) -> str:
    """Reads a workspace's title."""
    return record_store.resolve_block(OBJECT_TYPE, workspace_id, block).fields[FIELD_TITLE]


def set_title(
    value: str, workspace_id: str | None = None, *, block: RecordBlock | None = None
) -> RecordBlock:
    """Sets a workspace's title.

    Raises: ValidationError if value contains a reserved control character.
    """
    raise_if_contains_control_characters(value)
    return _set_field(FIELD_TITLE, value, workspace_id, block)


def get_description(workspace_id: str | None = None, *, block: RecordBlock | None = None) -> str:
    """Reads a workspace's description."""
    return record_store.resolve_block(OBJECT_TYPE, workspace_id, block).fields[FIELD_DESCRIPTION]


def set_description(
    value: str, workspace_id: str | None = None, *, block: RecordBlock | None = None
) -> RecordBlock:
    """Sets a workspace's description.

    Raises: ValidationError if value contains a reserved control character.
    """
    raise_if_contains_control_characters(value)
    return _set_field(FIELD_DESCRIPTION, value, workspace_id, block)


def get_color(workspace_id: str | None = None, *, block: RecordBlock | None = None) -> str:
    """Reads a workspace's color key (empty string means none chosen yet)."""
    return record_store.resolve_block(OBJECT_TYPE, workspace_id, block).fields[FIELD_COLOR]


def set_color(
    value: str, workspace_id: str | None = None, *, block: RecordBlock | None = None
) -> RecordBlock:
    """Sets (or clears, with an empty string) a workspace's color key."""
    return _set_field(FIELD_COLOR, value, workspace_id, block)


def get_is_archived(workspace_id: str | None = None, *, block: RecordBlock | None = None) -> bool:
    """Reads whether a workspace is archived (hidden from active lists, associations kept)."""
    return decode_bool(record_store.resolve_block(OBJECT_TYPE, workspace_id, block).fields[FIELD_IS_ARCHIVED])


def set_is_archived(
    value: bool, workspace_id: str | None = None, *, block: RecordBlock | None = None
) -> RecordBlock:
    """Sets whether a workspace is archived."""
    return _set_field(FIELD_IS_ARCHIVED, encode_bool(value), workspace_id, block)


def get_created_at(workspace_id: str | None = None, *, block: RecordBlock | None = None) -> str:
    """Reads the ISO-8601 timestamp a workspace was created at. Immutable — there is no setter."""
    return record_store.resolve_block(OBJECT_TYPE, workspace_id, block).fields[FIELD_CREATED_AT]


# --- --- --- ---
# Internal helpers


def _set_field(
    field_name: str, raw_value: str, workspace_id: str | None, block: RecordBlock | None
) -> RecordBlock:
    """Applies one field change, saving immediately unless the caller is batching via block=."""
    target_block = record_store.resolve_block(OBJECT_TYPE, workspace_id, block)
    target_block.fields[field_name] = raw_value
    target_block.is_dirty = True
    if block is None:
        save(target_block)
    return target_block


object_registry.register(OBJECT_TYPE, sys.modules[__name__])
