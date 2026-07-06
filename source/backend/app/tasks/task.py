"""A Task: something the user wants to get done — either created directly (one-off) or stamped
out for a single calendar day by a RecurringTaskTemplate (see app/recurrence/recurring_task_template.py
and app/journals/today_engine.py). Every task, recurring-generated or not, uses this exact same
shape so it behaves identically wherever it's shown. This module is the reference shape every
other object module (and the new-db-object-type skill) copies exactly — see
core/storage/CLAUDE.md.
"""

import sys
from datetime import date, datetime

from core.storage import object_registry, record_store
from core.storage.control_chars import raise_if_contains_control_characters
from core.storage.field_types import (
    decode_bool,
    decode_optional_date,
    encode_bool,
    encode_optional_date,
)
from core.storage.record_block import RecordBlock, decode_list, encode_list

# This type's directory name under DATA_ROOT.
OBJECT_TYPE = "Task"

FIELD_TITLE = "title"
FIELD_DESCRIPTION = "description"
FIELD_PROJECT_ID = "project_id"
FIELD_RECURRING_TEMPLATE_ID = "recurring_template_id"
FIELD_IS_ARCHIVED = "is_archived"
FIELD_CREATED_AT = "created_at"
FIELD_TAGS = "tags"
FIELD_DUE_DATE = "due_date"
FIELD_SCHEDULED_AT = "scheduled_at"
FIELD_IS_COMPLETE = "is_complete"
FIELD_COMPLETED_AT = "completed_at"


# --- --- --- ---
# Standard functions


def create(
    title: str,
    description: str = "",
    project_id: str = "",
    recurring_template_id: str = "",
    tags: list[str] | None = None,
    due_date: date | None = None,
    scheduled_at: str = "",
) -> RecordBlock:
    """Creates a new task and saves it immediately.

    Inputs: title, required; description/project_id, optional; recurring_template_id, optional —
        empty means this is a one-off task, non-empty means it's an instance generated from that
        RecurringTaskTemplate; tags, optional list of labels; due_date, optional; scheduled_at,
        optional ISO-8601 timestamp string for when the task is planned to be worked on.
    Raises: ValidationError if title, description, or any tag contains a reserved control
        character.
    """
    tags = tags or []
    raise_if_contains_control_characters(title)
    raise_if_contains_control_characters(description)
    for tag in tags:
        raise_if_contains_control_characters(tag)

    initial_fields = {
        FIELD_TITLE: title,
        FIELD_DESCRIPTION: description,
        FIELD_PROJECT_ID: project_id,
        FIELD_RECURRING_TEMPLATE_ID: recurring_template_id,
        FIELD_IS_ARCHIVED: encode_bool(False),
        FIELD_CREATED_AT: datetime.now().isoformat(),
        FIELD_TAGS: encode_list(tags),
        FIELD_DUE_DATE: encode_optional_date(due_date),
        FIELD_SCHEDULED_AT: scheduled_at,
        FIELD_IS_COMPLETE: encode_bool(False),
        FIELD_COMPLETED_AT: "",
    }
    return record_store.create_record(OBJECT_TYPE, initial_fields)


def load(task_id: str) -> RecordBlock:
    """Reads a task from disk.

    Inputs: task_id, the task to load.
    Raises: RecordNotFoundError if no matching task exists.
    """
    return record_store.load_block(OBJECT_TYPE, task_id)


def save(block: RecordBlock) -> None:
    """Writes a task's block to disk if it has unsaved changes.

    Inputs: block, the task to persist.
    """
    record_store.save_block(block)


def delete(task_id: str) -> None:
    """Deletes a task. A no-op if it doesn't exist.

    Inputs: task_id, the task to delete.
    """
    record_store.delete_record(OBJECT_TYPE, task_id)


def list_ids() -> list[str]:
    """Lists every task's id without reading any task's contents."""
    return record_store.list_record_ids(OBJECT_TYPE)


def list_all() -> list[RecordBlock]:
    """Loads every task. Expensive relative to list_ids — prefer list_ids when ids suffice."""
    return record_store.list_all_blocks(OBJECT_TYPE)


def find(**raw_field_filters: str) -> list[RecordBlock]:
    """Loads every task whose raw field values match every given filter.

    Inputs: raw_field_filters, e.g. project_id="...", is_archived=encode_bool(False).
    """
    return record_store.find_blocks(OBJECT_TYPE, **raw_field_filters)


def find_one(**raw_field_filters: str) -> RecordBlock | None:
    """Loads the first task matching every given filter, or None if none do.

    Inputs: same as find.
    """
    return record_store.find_one_block(OBJECT_TYPE, **raw_field_filters)


# --- --- --- ---
# Field getters and setters
#
# Every function below accepts exactly one of task_id= (one-shot: loads and, for setters, saves
# immediately) or block= (batches multiple field accesses against an already-loaded task; the
# caller calls save() once when done). See core/storage/CLAUDE.md.


def get_id(task_id: str | None = None, *, block: RecordBlock | None = None) -> str:
    """Reads a task's id."""
    return record_store.resolve_block(OBJECT_TYPE, task_id, block).record_id


def get_title(task_id: str | None = None, *, block: RecordBlock | None = None) -> str:
    """Reads a task's title."""
    return record_store.resolve_block(OBJECT_TYPE, task_id, block).fields[FIELD_TITLE]


def set_title(value: str, task_id: str | None = None, *, block: RecordBlock | None = None) -> RecordBlock:
    """Sets a task's title.

    Raises: ValidationError if value contains a reserved control character.
    """
    raise_if_contains_control_characters(value)
    return _set_field(FIELD_TITLE, value, task_id, block)


def get_description(task_id: str | None = None, *, block: RecordBlock | None = None) -> str:
    """Reads a task's description."""
    return record_store.resolve_block(OBJECT_TYPE, task_id, block).fields[FIELD_DESCRIPTION]


def set_description(
    value: str, task_id: str | None = None, *, block: RecordBlock | None = None
) -> RecordBlock:
    """Sets a task's description.

    Raises: ValidationError if value contains a reserved control character.
    """
    raise_if_contains_control_characters(value)
    return _set_field(FIELD_DESCRIPTION, value, task_id, block)


def get_project_id(task_id: str | None = None, *, block: RecordBlock | None = None) -> str:
    """Reads the id of the project a task belongs to (empty string means no project)."""
    return record_store.resolve_block(OBJECT_TYPE, task_id, block).fields[FIELD_PROJECT_ID]


def set_project_id(
    value: str, task_id: str | None = None, *, block: RecordBlock | None = None
) -> RecordBlock:
    """Sets the project a task belongs to (empty string means no project)."""
    return _set_field(FIELD_PROJECT_ID, value, task_id, block)


def get_recurring_template_id(task_id: str | None = None, *, block: RecordBlock | None = None) -> str:
    """Reads the id of the RecurringTaskTemplate this task is an instance of (empty string means
    this is a one-off task).
    """
    return record_store.resolve_block(OBJECT_TYPE, task_id, block).fields[FIELD_RECURRING_TEMPLATE_ID]


def set_recurring_template_id(
    value: str, task_id: str | None = None, *, block: RecordBlock | None = None
) -> RecordBlock:
    """Sets the RecurringTaskTemplate this task is an instance of (empty string means one-off)."""
    return _set_field(FIELD_RECURRING_TEMPLATE_ID, value, task_id, block)


def get_is_archived(task_id: str | None = None, *, block: RecordBlock | None = None) -> bool:
    """Reads whether a task is archived (hidden from active lists)."""
    return decode_bool(record_store.resolve_block(OBJECT_TYPE, task_id, block).fields[FIELD_IS_ARCHIVED])


def set_is_archived(
    value: bool, task_id: str | None = None, *, block: RecordBlock | None = None
) -> RecordBlock:
    """Sets whether a task is archived."""
    return _set_field(FIELD_IS_ARCHIVED, encode_bool(value), task_id, block)


def get_created_at(task_id: str | None = None, *, block: RecordBlock | None = None) -> str:
    """Reads the ISO-8601 timestamp a task was created at. Immutable — there is no setter."""
    return record_store.resolve_block(OBJECT_TYPE, task_id, block).fields[FIELD_CREATED_AT]


def get_tags(task_id: str | None = None, *, block: RecordBlock | None = None) -> list[str]:
    """Reads a task's labels.

    Raises: ValidationError if the stored list's declared length doesn't match its item count.
    """
    return decode_list(record_store.resolve_block(OBJECT_TYPE, task_id, block).fields[FIELD_TAGS])


def set_tags(
    value: list[str], task_id: str | None = None, *, block: RecordBlock | None = None
) -> RecordBlock:
    """Sets a task's labels.

    Raises: ValidationError if any tag contains a reserved control character.
    """
    for tag in value:
        raise_if_contains_control_characters(tag)
    return _set_field(FIELD_TAGS, encode_list(value), task_id, block)


def get_due_date(task_id: str | None = None, *, block: RecordBlock | None = None) -> date | None:
    """Reads a task's due date, or None if unset — an ad-hoc task with no due date belongs in the
    Today page's backburner section (see app/journals/today_engine.py).
    """
    return decode_optional_date(
        record_store.resolve_block(OBJECT_TYPE, task_id, block).fields[FIELD_DUE_DATE]
    )


def set_due_date(
    value: date | None, task_id: str | None = None, *, block: RecordBlock | None = None
) -> RecordBlock:
    """Sets (or clears, with None) a task's due date."""
    return _set_field(FIELD_DUE_DATE, encode_optional_date(value), task_id, block)


def get_scheduled_at(task_id: str | None = None, *, block: RecordBlock | None = None) -> str:
    """Reads the ISO-8601 timestamp a task is scheduled to be worked on, or "" if unset."""
    return record_store.resolve_block(OBJECT_TYPE, task_id, block).fields[FIELD_SCHEDULED_AT]


def set_scheduled_at(
    value: str, task_id: str | None = None, *, block: RecordBlock | None = None
) -> RecordBlock:
    """Sets (or clears, with "") when a task is scheduled to be worked on."""
    return _set_field(FIELD_SCHEDULED_AT, value, task_id, block)


def get_is_complete(task_id: str | None = None, *, block: RecordBlock | None = None) -> bool:
    """Reads whether a task has been marked done."""
    return decode_bool(record_store.resolve_block(OBJECT_TYPE, task_id, block).fields[FIELD_IS_COMPLETE])


def set_is_complete(
    value: bool, task_id: str | None = None, *, block: RecordBlock | None = None
) -> RecordBlock:
    """Marks a task done or not-done, updating completed_at to match."""
    target_block = record_store.resolve_block(OBJECT_TYPE, task_id, block)
    target_block.fields[FIELD_IS_COMPLETE] = encode_bool(value)
    target_block.fields[FIELD_COMPLETED_AT] = datetime.now().isoformat() if value else ""
    target_block.is_dirty = True
    if block is None:
        save(target_block)
    return target_block


def get_completed_at(task_id: str | None = None, *, block: RecordBlock | None = None) -> str:
    """Reads the ISO-8601 timestamp a task was completed at, or "" if still incomplete. Only
    changes as a side effect of set_is_complete — there is no independent setter.
    """
    return record_store.resolve_block(OBJECT_TYPE, task_id, block).fields[FIELD_COMPLETED_AT]


# --- --- --- ---
# Internal helpers


def _set_field(
    field_name: str, raw_value: str, task_id: str | None, block: RecordBlock | None
) -> RecordBlock:
    """Applies one field change, saving immediately unless the caller is batching via block=."""
    target_block = record_store.resolve_block(OBJECT_TYPE, task_id, block)
    target_block.fields[field_name] = raw_value
    target_block.is_dirty = True
    if block is None:
        save(target_block)
    return target_block


object_registry.register(OBJECT_TYPE, sys.modules[__name__])
