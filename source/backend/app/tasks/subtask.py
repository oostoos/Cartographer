"""A Subtask: one checklist item belonging to a single Task. All of a task's subtasks must be
completed or skipped before that task itself can be marked complete — see
app/tasks/task_routes.update_task.

A recurring task's checklist is defined once on its RecurringTaskTemplate (as a flat list of
titles) and copied onto each freshly generated Task instance as that instance's own, independent
Subtasks — see app/journals/today_engine.py. Editing one instance's subtasks never affects the
template or any other instance.
"""

import sys
import threading
from datetime import datetime, timedelta

from core.storage import object_registry, record_store
from core.storage.control_chars import raise_if_contains_control_characters
from core.storage.field_types import decode_bool, encode_bool
from core.storage.record_block import RecordBlock

# This type's directory name under DATA_ROOT.
OBJECT_TYPE = "Subtask"

FIELD_TASK_ID = "task_id"
FIELD_TITLE = "title"
FIELD_IS_COMPLETE = "is_complete"
FIELD_IS_SKIPPED = "is_skipped"
FIELD_CREATED_AT = "created_at"

# Guards _next_created_at's nudge-forward so two subtasks created in the same clock tick (this
# platform's clock can resolve no finer than ~15ms) still get strictly increasing timestamps —
# subtask_routes.py sorts a task's checklist by created_at, so ties would show items out of order.
_created_at_lock = threading.Lock()
_last_created_at = ""


def _next_created_at() -> str:
    """Returns the current timestamp, nudged forward by a microsecond if it would otherwise tie
    (or precede) the last one handed out.
    """
    global _last_created_at
    with _created_at_lock:
        candidate = datetime.now().isoformat()
        if candidate <= _last_created_at:
            candidate = (datetime.fromisoformat(_last_created_at) + timedelta(microseconds=1)).isoformat()
        _last_created_at = candidate
        return candidate


# --- --- --- ---
# Standard functions


def create(task_id: str, title: str) -> RecordBlock:
    """Creates a new subtask and saves it immediately.

    Inputs: task_id, the owning Task's id, required; title, required.
    Raises: ValidationError if title contains a reserved control character.
    """
    raise_if_contains_control_characters(title)

    initial_fields = {
        FIELD_TASK_ID: task_id,
        FIELD_TITLE: title,
        FIELD_IS_COMPLETE: encode_bool(False),
        FIELD_IS_SKIPPED: encode_bool(False),
        FIELD_CREATED_AT: _next_created_at(),
    }
    return record_store.create_record(OBJECT_TYPE, initial_fields)


def load(subtask_id: str) -> RecordBlock:
    """Reads a subtask from disk.

    Inputs: subtask_id, the subtask to load.
    Raises: RecordNotFoundError if no matching subtask exists.
    """
    return record_store.load_block(OBJECT_TYPE, subtask_id)


def save(block: RecordBlock) -> None:
    """Writes a subtask's block to disk if it has unsaved changes.

    Inputs: block, the subtask to persist.
    """
    record_store.save_block(block)


def delete(subtask_id: str) -> None:
    """Deletes a subtask. A no-op if it doesn't exist.

    Inputs: subtask_id, the subtask to delete.
    """
    record_store.delete_record(OBJECT_TYPE, subtask_id)


def list_ids() -> list[str]:
    """Lists every subtask's id without reading any subtask's contents."""
    return record_store.list_record_ids(OBJECT_TYPE)


def list_all() -> list[RecordBlock]:
    """Loads every subtask. Expensive relative to list_ids — prefer list_ids when ids suffice."""
    return record_store.list_all_blocks(OBJECT_TYPE)


def find(**raw_field_filters: str) -> list[RecordBlock]:
    """Loads every subtask whose raw field values match every given filter.

    Inputs: raw_field_filters, e.g. task_id="...".
    """
    return record_store.find_blocks(OBJECT_TYPE, **raw_field_filters)


def find_one(**raw_field_filters: str) -> RecordBlock | None:
    """Loads the first subtask matching every given filter, or None if none do.

    Inputs: same as find.
    """
    return record_store.find_one_block(OBJECT_TYPE, **raw_field_filters)


def delete_all_for_task(task_id: str) -> None:
    """Deletes every subtask belonging to one task — used when the owning task is deleted.

    Inputs: task_id, the owning Task's id.
    """
    for block in find(task_id=task_id):
        delete(get_id(block=block))


# --- --- --- ---
# Field getters and setters
#
# Every function below accepts exactly one of subtask_id= (one-shot: loads and, for setters,
# saves immediately) or block= (batches multiple field accesses against an already-loaded
# subtask; the caller calls save() once when done). See core/storage/CLAUDE.md.


def get_id(subtask_id: str | None = None, *, block: RecordBlock | None = None) -> str:
    """Reads a subtask's id."""
    return record_store.resolve_block(OBJECT_TYPE, subtask_id, block).record_id


def get_task_id(subtask_id: str | None = None, *, block: RecordBlock | None = None) -> str:
    """Reads the id of the task this subtask belongs to. Immutable — there is no setter."""
    return record_store.resolve_block(OBJECT_TYPE, subtask_id, block).fields[FIELD_TASK_ID]


def get_title(subtask_id: str | None = None, *, block: RecordBlock | None = None) -> str:
    """Reads a subtask's title."""
    return record_store.resolve_block(OBJECT_TYPE, subtask_id, block).fields[FIELD_TITLE]


def set_title(value: str, subtask_id: str | None = None, *, block: RecordBlock | None = None) -> RecordBlock:
    """Sets a subtask's title.

    Raises: ValidationError if value contains a reserved control character.
    """
    raise_if_contains_control_characters(value)
    return _set_field(FIELD_TITLE, value, subtask_id, block)


def get_is_complete(subtask_id: str | None = None, *, block: RecordBlock | None = None) -> bool:
    """Reads whether a subtask is complete."""
    return decode_bool(record_store.resolve_block(OBJECT_TYPE, subtask_id, block).fields[FIELD_IS_COMPLETE])


def set_is_complete(
    value: bool, subtask_id: str | None = None, *, block: RecordBlock | None = None
) -> RecordBlock:
    """Sets whether a subtask is complete."""
    return _set_field(FIELD_IS_COMPLETE, encode_bool(value), subtask_id, block)


def get_is_skipped(subtask_id: str | None = None, *, block: RecordBlock | None = None) -> bool:
    """Reads whether a subtask is skipped."""
    return decode_bool(record_store.resolve_block(OBJECT_TYPE, subtask_id, block).fields[FIELD_IS_SKIPPED])


def set_is_skipped(
    value: bool, subtask_id: str | None = None, *, block: RecordBlock | None = None
) -> RecordBlock:
    """Sets whether a subtask is skipped."""
    return _set_field(FIELD_IS_SKIPPED, encode_bool(value), subtask_id, block)


def get_created_at(subtask_id: str | None = None, *, block: RecordBlock | None = None) -> str:
    """Reads the ISO-8601 timestamp a subtask was created at. Immutable — there is no setter."""
    return record_store.resolve_block(OBJECT_TYPE, subtask_id, block).fields[FIELD_CREATED_AT]


# --- --- --- ---
# Internal helpers


def _set_field(
    field_name: str, raw_value: str, subtask_id: str | None, block: RecordBlock | None
) -> RecordBlock:
    """Applies one field change, saving immediately unless the caller is batching via block=."""
    target_block = record_store.resolve_block(OBJECT_TYPE, subtask_id, block)
    target_block.fields[field_name] = raw_value
    target_block.is_dirty = True
    if block is None:
        save(target_block)
    return target_block


object_registry.register(OBJECT_TYPE, sys.modules[__name__])
