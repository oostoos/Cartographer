# @manualReviewRequested: 2026-07-06
"""A Task: something the user wants to get done — either created directly (one-off), stamped out
for a single calendar day for a task nested inside a Block (see app/blocks/block.py and
app/journals/today_engine.py, via Task.block_id), or a checklist item belonging to another Task
(a "subtask" — a Task whose parent_task_id points at its owning Task). Nesting is capped at a
single level: a task that already has a non-empty parent_task_id can't itself become a parent —
enforced in app/tasks/task_routes.py, not here. Every task, whatever its origin, uses this exact
same shape so it behaves identically wherever it's shown. This module is the reference shape
every other object module (and the new-db-object-type skill) copies exactly — see
core/storage/CLAUDE.md.
"""

import sys
from datetime import date, datetime
from enum import IntEnum

from core.storage import object_registry, record_store
from core.storage.control_chars import raise_if_contains_control_characters
from core.storage.field_types import (
    decode_bool,
    decode_optional_date,
    decode_optional_enum,
    decode_optional_int,
    encode_bool,
    encode_optional_date,
    encode_optional_enum,
    encode_optional_int,
)
from core.storage.record_block import RecordBlock, decode_list, encode_list

# This type's directory name under DATA_ROOT.
OBJECT_TYPE = "Task"

FIELD_TITLE = "title"
FIELD_DESCRIPTION = "description"
FIELD_PROJECT_ID = "project_id"
FIELD_WORKSPACE_ID = "workspace_id"
FIELD_BLOCK_ID = "block_id"
FIELD_PARENT_TASK_ID = "parent_task_id"
FIELD_IS_ARCHIVED = "is_archived"
FIELD_CREATED_AT = "created_at"
FIELD_TAGS = "tags"
FIELD_DUE_DATE = "due_date"
FIELD_SCHEDULED_AT = "scheduled_at"
FIELD_IS_COMPLETE = "is_complete"
FIELD_COMPLETED_AT = "completed_at"
FIELD_IS_SKIPPED = "is_skipped"
FIELD_IS_SKIPPABLE = "is_skippable"
FIELD_ORDER = "order"
FIELD_DURATION_BUCKET = "duration_bucket"
FIELD_ESTIMATED_MINUTES = "estimated_minutes"


class DurationBucket(IntEnum):
    """A rough time estimate for how long a task will take, stored on disk as this member's
    ordinal (see encode_optional_enum/decode_optional_enum) rather than a raw minute count.
    """

    UNDER_5_MIN = 0
    FIVE_TO_10_MIN = 1
    TEN_TO_30_MIN = 2
    THIRTY_TO_60_MIN = 3
    OVER_60_MIN = 4


# The one JSON <-> DurationBucket mapping task_routes.py reads/writes, kept alongside the enum
# itself rather than duplicated in the route module.
DURATION_BUCKET_BY_JSON_VALUE = {
    "under_5_min": DurationBucket.UNDER_5_MIN,
    "5_to_10_min": DurationBucket.FIVE_TO_10_MIN,
    "10_to_30_min": DurationBucket.TEN_TO_30_MIN,
    "30_to_60_min": DurationBucket.THIRTY_TO_60_MIN,
    "over_60_min": DurationBucket.OVER_60_MIN,
}
JSON_VALUE_BY_DURATION_BUCKET = {member: raw for raw, member in DURATION_BUCKET_BY_JSON_VALUE.items()}


def parse_duration_bucket(raw_value):
    """Parses a JSON durationBucket string (or None) into a DurationBucket member, or None.

    Raises: ValueError if raw_value is given and isn't one of DURATION_BUCKET_BY_JSON_VALUE's keys.
    """
    if raw_value is None:
        return None
    try:
        return DURATION_BUCKET_BY_JSON_VALUE[raw_value]
    except KeyError:
        raise ValueError(
            f"durationBucket must be one of {list(DURATION_BUCKET_BY_JSON_VALUE)} or null, "
            f"got {raw_value!r}."
        ) from None


# --- --- --- ---
# Standard functions


def create(
    title: str,
    description: str = "",
    project_id: str = "",
    workspace_id: str = "",
    block_id: str = "",
    parent_task_id: str = "",
    tags: list[str] | None = None,
    due_date: date | None = None,
    scheduled_at: str = "",
    is_skippable: bool | None = None,
    duration_bucket: DurationBucket | None = None,
    estimated_minutes: int = 0,
) -> RecordBlock:
    """Creates a new task and saves it immediately.

    Inputs: title, required; description/project_id, optional; block_id, optional — empty means
        this is a one-off task, non-empty means it's a task nested inside that Block (see
        app/blocks/block.py and app/journals/today_engine.py); parent_task_id, optional — empty
        means this is a top-level task, non-empty means it's a subtask belonging to that Task
        (single level of nesting only, enforced in task_routes.py); tags, optional list of
        labels; due_date, optional; scheduled_at, optional ISO-8601 timestamp string for when the
        task is planned to be worked on; is_skippable, optional — whether this task can be marked
        skipped instead of complete. Defaults to True for a block-nested task or a subtask, False
        for a plain ad-hoc top-level task, but is always user-configurable afterward except for
        subtasks (see app/tasks/CLAUDE.md); duration_bucket, optional rough time estimate (a
        DurationBucket member); estimated_minutes, optional precise time estimate in minutes —
        populated only for tasks generated from a block's BlockTaskTemplate (see
        app/blocks/block_task_template.py), 0 means unset.
    Raises: ValidationError if title, description, or any tag contains a reserved control
        character. ValueError if duration_bucket is given and isn't a DurationBucket member.
    """
    tags = tags or []
    raise_if_contains_control_characters(title)
    raise_if_contains_control_characters(description)
    for tag in tags:
        raise_if_contains_control_characters(tag)
    if duration_bucket is not None and not isinstance(duration_bucket, DurationBucket):
        raise ValueError(f"duration_bucket must be a DurationBucket member, got {duration_bucket!r}.")
    if is_skippable is None:
        is_skippable = block_id != "" or parent_task_id != ""

    is_ad_hoc_top_level = project_id == "" and block_id == "" and parent_task_id == ""
    if is_ad_hoc_top_level:
        order = _next_ad_hoc_order()
    elif parent_task_id != "":
        order = _next_subtask_order(parent_task_id)
    elif block_id != "":
        order = _next_block_task_order(block_id)
    else:
        order = 0

    initial_fields = {
        FIELD_TITLE: title,
        FIELD_DESCRIPTION: description,
        FIELD_PROJECT_ID: project_id,
        FIELD_WORKSPACE_ID: workspace_id,
        FIELD_BLOCK_ID: block_id,
        FIELD_PARENT_TASK_ID: parent_task_id,
        FIELD_IS_ARCHIVED: encode_bool(False),
        FIELD_CREATED_AT: datetime.now().isoformat(),
        FIELD_TAGS: encode_list(tags),
        FIELD_DUE_DATE: encode_optional_date(due_date),
        FIELD_SCHEDULED_AT: scheduled_at,
        FIELD_IS_COMPLETE: encode_bool(False),
        FIELD_COMPLETED_AT: "",
        FIELD_IS_SKIPPED: encode_bool(False),
        FIELD_IS_SKIPPABLE: encode_bool(is_skippable),
        FIELD_ORDER: encode_optional_int(order),
        FIELD_DURATION_BUCKET: encode_optional_enum(duration_bucket),
        FIELD_ESTIMATED_MINUTES: str(estimated_minutes),
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


def get_workspace_id(task_id: str | None = None, *, block: RecordBlock | None = None) -> str:
    """Reads the id of the workspace a task belongs to (empty string means unassigned)."""
    return record_store.resolve_block(OBJECT_TYPE, task_id, block).fields[FIELD_WORKSPACE_ID]


def set_workspace_id(
    value: str, task_id: str | None = None, *, block: RecordBlock | None = None
) -> RecordBlock:
    """Sets the workspace a task belongs to (empty string means unassigned)."""
    return _set_field(FIELD_WORKSPACE_ID, value, task_id, block)


def get_block_id(task_id: str | None = None, *, block: RecordBlock | None = None) -> str:
    """Reads the id of the Block this task is nested inside (empty string means this is a
    one-off task).
    """
    return record_store.resolve_block(OBJECT_TYPE, task_id, block).fields[FIELD_BLOCK_ID]


def set_block_id(value: str, task_id: str | None = None, *, block: RecordBlock | None = None) -> RecordBlock:
    """Sets the Block this task is nested inside (empty string means one-off)."""
    return _set_field(FIELD_BLOCK_ID, value, task_id, block)


def get_parent_task_id(task_id: str | None = None, *, block: RecordBlock | None = None) -> str:
    """Reads the id of the task this task is a subtask of (empty string means top-level)."""
    return record_store.resolve_block(OBJECT_TYPE, task_id, block).fields[FIELD_PARENT_TASK_ID]


def set_parent_task_id(
    value: str, task_id: str | None = None, *, block: RecordBlock | None = None
) -> RecordBlock:
    """Sets the task this task is a subtask of (empty string means top-level)."""
    return _set_field(FIELD_PARENT_TASK_ID, value, task_id, block)


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


def get_is_skipped(task_id: str | None = None, *, block: RecordBlock | None = None) -> bool:
    """Reads whether a task has been marked skipped instead of completed."""
    return decode_bool(record_store.resolve_block(OBJECT_TYPE, task_id, block).fields[FIELD_IS_SKIPPED])


def set_is_skipped(
    value: bool, task_id: str | None = None, *, block: RecordBlock | None = None
) -> RecordBlock:
    """Sets whether a task is skipped."""
    return _set_field(FIELD_IS_SKIPPED, encode_bool(value), task_id, block)


def get_is_skippable(task_id: str | None = None, *, block: RecordBlock | None = None) -> bool:
    """Reads whether a task is allowed to be marked skipped. Always True for a subtask; for a
    top-level task, defaults by origin (see create) but is user-configurable afterward.
    """
    return decode_bool(record_store.resolve_block(OBJECT_TYPE, task_id, block).fields[FIELD_IS_SKIPPABLE])


def set_is_skippable(
    value: bool, task_id: str | None = None, *, block: RecordBlock | None = None
) -> RecordBlock:
    """Sets whether a task is allowed to be marked skipped."""
    return _set_field(FIELD_IS_SKIPPABLE, encode_bool(value), task_id, block)


def get_order(task_id: str | None = None, *, block: RecordBlock | None = None) -> int:
    """Reads a task's manual sort position. Meaningful for an ad-hoc top-level task (no project,
    not recurring, not a subtask), scoped across every other ad-hoc top-level task, and for a
    subtask, scoped to its siblings sharing the same parent_task_id — every other origin (a
    project task, a recurring instance) defaults this to 0 and never sorts by it, since those
    lists are ordered some other way (project grouping, recurrence order).
    """
    return decode_optional_int(record_store.resolve_block(OBJECT_TYPE, task_id, block).fields[FIELD_ORDER])


def set_order(value: int, task_id: str | None = None, *, block: RecordBlock | None = None) -> RecordBlock:
    """Sets a task's manual sort position (see get_order)."""
    return _set_field(FIELD_ORDER, encode_optional_int(value), task_id, block)


def get_duration_bucket(
    task_id: str | None = None, *, block: RecordBlock | None = None
) -> DurationBucket | None:
    """Reads a task's rough time estimate, or None if unset."""
    return decode_optional_enum(
        record_store.resolve_block(OBJECT_TYPE, task_id, block).fields[FIELD_DURATION_BUCKET],
        DurationBucket,
    )


def set_duration_bucket(
    value: DurationBucket | None, task_id: str | None = None, *, block: RecordBlock | None = None
) -> RecordBlock:
    """Sets (or clears, with None) a task's rough time estimate.

    Raises: ValueError if value is given and isn't a DurationBucket member.
    """
    if value is not None and not isinstance(value, DurationBucket):
        raise ValueError(f"duration_bucket must be a DurationBucket member, got {value!r}.")
    return _set_field(FIELD_DURATION_BUCKET, encode_optional_enum(value), task_id, block)


def get_estimated_minutes(task_id: str | None = None, *, block: RecordBlock | None = None) -> int:
    """Reads a task's precise time estimate in minutes, or 0 if unset. Populated only for tasks
    generated from a block's BlockTaskTemplate (see app/blocks/block_task_template.py) — an
    independent concept from duration_bucket, which remains for ad-hoc rough-sizing.
    """
    return int(record_store.resolve_block(OBJECT_TYPE, task_id, block).fields[FIELD_ESTIMATED_MINUTES])


def set_estimated_minutes(
    value: int, task_id: str | None = None, *, block: RecordBlock | None = None
) -> RecordBlock:
    """Sets (or clears, with 0) a task's precise time estimate in minutes."""
    return _set_field(FIELD_ESTIMATED_MINUTES, str(value), task_id, block)


# --- --- --- ---
# Internal helpers


def _next_ad_hoc_order() -> int:
    """Computes the sort position for a newly created ad-hoc top-level task: one past the highest
    order among existing ad-hoc top-level tasks, so a new task always lands at the end of that
    list. Scoped to that same trio of empty fields so it never counts a subtask, a block-nested
    task, or a task that belongs to a project.
    """
    siblings = find(project_id="", block_id="", parent_task_id="")
    if not siblings:
        return 0
    return max(get_order(block=sibling) for sibling in siblings) + 1


def _next_subtask_order(parent_task_id: str) -> int:
    """Computes the sort position for a newly created subtask: one past the highest order among
    its existing sibling subtasks (scoped to the same parent_task_id), so a new subtask always
    lands at the end of its parent's checklist.
    """
    siblings = find(parent_task_id=parent_task_id)
    if not siblings:
        return 0
    return max(get_order(block=sibling) for sibling in siblings) + 1


def _next_block_task_order(block_id: str) -> int:
    """Computes the sort position for a newly created block-nested task: one past the highest
    order among its existing sibling tasks within the same Block (scoped to the same block_id),
    so a freshly generated task always lands at the end of that block's checklist.
    """
    siblings = find(block_id=block_id)
    if not siblings:
        return 0
    return max(get_order(block=sibling) for sibling in siblings) + 1


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
