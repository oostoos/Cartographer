# @manualReviewRequested: 2026-07-06
"""A Note: a freeform bit of text, either a daily journal entry (anchored to a journal_date) or
an ad-hoc note attached to a task or project (anchored to a target_type/target_id pair). A note's
target_type and target_id are always both empty or both set together — never exactly one.
"""

import sys
from datetime import date, datetime

from core.storage import object_registry, record_store
from core.storage.control_chars import raise_if_contains_control_characters
from core.storage.errors import ValidationError
from core.storage.field_types import decode_optional_date, encode_optional_date
from core.storage.record_block import RecordBlock

OBJECT_TYPE = "Note"

FIELD_TITLE = "title"
FIELD_CONTENT = "content"
FIELD_JOURNAL_DATE = "journal_date"
FIELD_TARGET_TYPE = "target_type"
FIELD_TARGET_ID = "target_id"
FIELD_CREATED_AT = "created_at"

TARGET_TYPE_TASK = "Task"
TARGET_TYPE_PROJECT = "Project"
TARGET_TYPE_NONE = ""
VALID_TARGET_TYPES = (TARGET_TYPE_TASK, TARGET_TYPE_PROJECT, TARGET_TYPE_NONE)


# --- --- --- ---
# Standard functions


def create(
    title: str = "",
    content: str = "",
    journal_date: date | None = None,
    target_type: str = TARGET_TYPE_NONE,
    target_id: str = "",
) -> RecordBlock:
    """Creates a new note and saves it immediately.

    Inputs: title/content, optional free text; journal_date, optional — the calendar day a daily
        journal entry belongs to; target_type/target_id, optional — the task or project an
        ad-hoc note is attached to. Must be both empty or both set together.
    Raises: ValidationError if title or content contains a reserved control character, or if
        exactly one of target_type/target_id is given, or target_type isn't recognized.
    """
    raise_if_contains_control_characters(title)
    raise_if_contains_control_characters(content)
    _validate_target(target_type, target_id)

    initial_fields = {
        FIELD_TITLE: title,
        FIELD_CONTENT: content,
        FIELD_JOURNAL_DATE: encode_optional_date(journal_date),
        FIELD_TARGET_TYPE: target_type,
        FIELD_TARGET_ID: target_id,
        FIELD_CREATED_AT: datetime.now().isoformat(),
    }
    return record_store.create_record(OBJECT_TYPE, initial_fields)


def load(note_id: str) -> RecordBlock:
    """Reads a note from disk.

    Raises: RecordNotFoundError if no matching note exists.
    """
    return record_store.load_block(OBJECT_TYPE, note_id)


def save(block: RecordBlock) -> None:
    """Writes a note's block to disk if it has unsaved changes."""
    record_store.save_block(block)


def delete(note_id: str) -> None:
    """Deletes a note. A no-op if it doesn't exist."""
    record_store.delete_record(OBJECT_TYPE, note_id)


def list_ids() -> list[str]:
    """Lists every note's id without reading any note's contents."""
    return record_store.list_record_ids(OBJECT_TYPE)


def list_all() -> list[RecordBlock]:
    """Loads every note. Expensive relative to list_ids — prefer list_ids when ids suffice."""
    return record_store.list_all_blocks(OBJECT_TYPE)


def find(**raw_field_filters: str) -> list[RecordBlock]:
    """Loads every note whose raw field values match every given filter."""
    return record_store.find_blocks(OBJECT_TYPE, **raw_field_filters)


def find_one(**raw_field_filters: str) -> RecordBlock | None:
    """Loads the first note matching every given filter, or None if none do."""
    return record_store.find_one_block(OBJECT_TYPE, **raw_field_filters)


# --- --- --- ---
# Field getters and setters
#
# Every function below accepts exactly one of note_id= (one-shot) or block= (batched) — see
# core/storage/CLAUDE.md.


def get_id(note_id: str | None = None, *, block: RecordBlock | None = None) -> str:
    """Reads a note's id."""
    return record_store.resolve_block(OBJECT_TYPE, note_id, block).record_id


def get_title(note_id: str | None = None, *, block: RecordBlock | None = None) -> str:
    """Reads a note's title."""
    return record_store.resolve_block(OBJECT_TYPE, note_id, block).fields[FIELD_TITLE]


def set_title(value: str, note_id: str | None = None, *, block: RecordBlock | None = None) -> RecordBlock:
    """Sets a note's title.

    Raises: ValidationError if value contains a reserved control character.
    """
    raise_if_contains_control_characters(value)
    return _set_field(FIELD_TITLE, value, note_id, block)


def get_content(note_id: str | None = None, *, block: RecordBlock | None = None) -> str:
    """Reads a note's text."""
    return record_store.resolve_block(OBJECT_TYPE, note_id, block).fields[FIELD_CONTENT]


def set_content(value: str, note_id: str | None = None, *, block: RecordBlock | None = None) -> RecordBlock:
    """Sets a note's text.

    Raises: ValidationError if value contains a reserved control character.
    """
    raise_if_contains_control_characters(value)
    return _set_field(FIELD_CONTENT, value, note_id, block)


def get_journal_date(note_id: str | None = None, *, block: RecordBlock | None = None) -> date | None:
    """Reads the calendar day a daily journal entry belongs to, or None if unset (e.g. for a
    task/project-attached note).
    """
    raw = record_store.resolve_block(OBJECT_TYPE, note_id, block).fields[FIELD_JOURNAL_DATE]
    return decode_optional_date(raw)


def set_journal_date(
    value: date | None, note_id: str | None = None, *, block: RecordBlock | None = None
) -> RecordBlock:
    """Sets (or clears, with None) the calendar day a note belongs to."""
    return _set_field(FIELD_JOURNAL_DATE, encode_optional_date(value), note_id, block)


def get_target_type(note_id: str | None = None, *, block: RecordBlock | None = None) -> str:
    """Reads what kind of object this note is attached to ("" means none — a plain journal
    entry). Change via set_target, never independently of target_id.
    """
    return record_store.resolve_block(OBJECT_TYPE, note_id, block).fields[FIELD_TARGET_TYPE]


def get_target_id(note_id: str | None = None, *, block: RecordBlock | None = None) -> str:
    """Reads the id of the object this note is attached to ("" means none). Change via
    set_target, never independently of target_type.
    """
    return record_store.resolve_block(OBJECT_TYPE, note_id, block).fields[FIELD_TARGET_ID]


def set_target(
    target_type: str, target_id: str, note_id: str | None = None, *, block: RecordBlock | None = None
) -> RecordBlock:
    """Sets (or clears, by passing "" for both) the task or project this note is attached to.
    The only way to change target_type/target_id — always together, so they can never disagree.

    Raises: ValidationError if exactly one of target_type/target_id is given, or target_type
        isn't one of VALID_TARGET_TYPES.
    """
    _validate_target(target_type, target_id)
    target_block = record_store.resolve_block(OBJECT_TYPE, note_id, block)
    target_block.fields[FIELD_TARGET_TYPE] = target_type
    target_block.fields[FIELD_TARGET_ID] = target_id
    target_block.is_dirty = True
    if block is None:
        save(target_block)
    return target_block


def get_created_at(note_id: str | None = None, *, block: RecordBlock | None = None) -> str:
    """Reads the ISO-8601 timestamp a note was created at. Immutable — there is no setter."""
    return record_store.resolve_block(OBJECT_TYPE, note_id, block).fields[FIELD_CREATED_AT]


# --- --- --- ---
# Internal helpers


def _validate_target(target_type: str, target_id: str) -> None:
    """Enforces that target_type/target_id are both empty or both set, and that target_type is
    one of VALID_TARGET_TYPES.

    Raises: ValidationError if either rule is violated.
    """
    if target_type not in VALID_TARGET_TYPES:
        raise ValidationError(f"target_type must be one of {VALID_TARGET_TYPES}, got {target_type!r}.")
    if bool(target_type) != bool(target_id):
        raise ValidationError("target_type and target_id must be both empty or both set.")


def _set_field(
    field_name: str, raw_value: str, note_id: str | None, block: RecordBlock | None
) -> RecordBlock:
    """Applies one field change, saving immediately unless the caller is batching via block=."""
    target_block = record_store.resolve_block(OBJECT_TYPE, note_id, block)
    target_block.fields[field_name] = raw_value
    target_block.is_dirty = True
    if block is None:
        save(target_block)
    return target_block


object_registry.register(OBJECT_TYPE, sys.modules[__name__])
