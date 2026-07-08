# @manualReviewRequested: 2026-07-07
"""A Block: the daily generated instance of a BlockTemplate (app/blocks/block_template.py) —
system-generated for every day up to and including today (see app/journals/today_engine.py's
ensure_todays_blocks_exist), plus on-demand for a future date the instant a user overrides that
one occurrence from the calendar (see PATCH /api/blocks/<id>, app/blocks/block_routes.py, and
today_engine.materialize_occurrence). Its title/description/tags/start_time/duration_minutes/order
are copied from the template (and whichever segment/instance row governs its date — see
app/blocks/block_template_segment.py) at generation time, the same denormalization pattern the old
RecurringTaskTemplate used for its generated Task instances.

is_template_synced tracks whether this instance should still pick up the template's later edits
(see today_engine.sync_future_blocks_with_template): True for an ordinarily-generated instance,
False the moment a user edits this one instance directly — an override "wins forever" over
whatever the template says afterward, until the instance itself is edited again.

A Block is never itself "completed" or archived — only the Tasks nested inside it (via
Task.block_id) are.
"""

import sys
from datetime import date

from core.storage import object_registry, record_store
from core.storage.control_chars import raise_if_contains_control_characters
from core.storage.field_types import decode_bool, encode_bool
from core.storage.record_block import RecordBlock, decode_list, encode_list

OBJECT_TYPE = "Block"

FIELD_TEMPLATE_ID = "template_id"
FIELD_DATE = "date"
FIELD_TITLE = "title"
FIELD_DESCRIPTION = "description"
FIELD_TAGS = "tags"
FIELD_START_TIME = "start_time"
FIELD_DURATION_MINUTES = "duration_minutes"
FIELD_ORDER = "order"
FIELD_IS_TEMPLATE_SYNCED = "is_template_synced"


# --- --- --- ---
# Standard functions


def create(
    template_id: str,
    for_date: date,
    title: str,
    start_time: str,
    duration_minutes: int,
    description: str = "",
    tags: list[str] | None = None,
    order: int = 0,
    is_template_synced: bool = True,
) -> RecordBlock:
    """Creates a new block instance and saves it immediately.

    Inputs: template_id, the BlockTemplate this was generated from; for_date, the calendar day
        this instance is for; title/start_time/duration_minutes, copied from the template's
        for_date-governing shape at generation time; description/tags/order, copied from the
        template itself; is_template_synced, whether this instance should still pick up the
        template's later edits (True for ordinary generation; a materialized-and-immediately-
        overridden instance is created with this False instead — see
        today_engine.materialize_occurrence).
    Raises: ValidationError if title or description or any tag contains a reserved control
        character.
    """
    tags = tags or []
    raise_if_contains_control_characters(title)
    raise_if_contains_control_characters(description)
    for tag in tags:
        raise_if_contains_control_characters(tag)

    initial_fields = {
        FIELD_TEMPLATE_ID: template_id,
        FIELD_DATE: for_date.isoformat(),
        FIELD_TITLE: title,
        FIELD_DESCRIPTION: description,
        FIELD_TAGS: encode_list(tags),
        FIELD_START_TIME: start_time,
        FIELD_DURATION_MINUTES: str(duration_minutes),
        FIELD_ORDER: str(order),
        FIELD_IS_TEMPLATE_SYNCED: encode_bool(is_template_synced),
    }
    return record_store.create_record(OBJECT_TYPE, initial_fields)


def load(block_id: str) -> RecordBlock:
    """Reads a block instance from disk.

    Raises: RecordNotFoundError if no matching block exists.
    """
    return record_store.load_block(OBJECT_TYPE, block_id)


def save(block: RecordBlock) -> None:
    """Writes a block instance's block to disk if it has unsaved changes."""
    record_store.save_block(block)


def delete(block_id: str) -> None:
    """Deletes a block instance. A no-op if it doesn't exist."""
    record_store.delete_record(OBJECT_TYPE, block_id)


def list_ids() -> list[str]:
    """Lists every block instance's id without reading any instance's contents."""
    return record_store.list_record_ids(OBJECT_TYPE)


def list_all() -> list[RecordBlock]:
    """Loads every block instance. Expensive relative to list_ids — prefer list_ids when ids
    suffice.
    """
    return record_store.list_all_blocks(OBJECT_TYPE)


def find(**raw_field_filters: str) -> list[RecordBlock]:
    """Loads every block instance whose raw field values match every given filter."""
    return record_store.find_blocks(OBJECT_TYPE, **raw_field_filters)


def find_one(**raw_field_filters: str) -> RecordBlock | None:
    """Loads the first block instance matching every given filter, or None if none do."""
    return record_store.find_one_block(OBJECT_TYPE, **raw_field_filters)


# --- --- --- ---
# Field getters and setters
#
# Every function below accepts exactly one of block_id= (one-shot) or block= (batched) — see
# core/storage/CLAUDE.md. template_id/date/order are immutable after creation (like
# Task.created_at) and have no setters.


def get_id(block_id: str | None = None, *, block: RecordBlock | None = None) -> str:
    """Reads a block instance's id."""
    return record_store.resolve_block(OBJECT_TYPE, block_id, block).record_id


def get_template_id(block_id: str | None = None, *, block: RecordBlock | None = None) -> str:
    """Reads the id of the BlockTemplate this instance was generated from."""
    return record_store.resolve_block(OBJECT_TYPE, block_id, block).fields[FIELD_TEMPLATE_ID]


def get_date(block_id: str | None = None, *, block: RecordBlock | None = None) -> date:
    """Reads the calendar day this instance is for."""
    raw = record_store.resolve_block(OBJECT_TYPE, block_id, block).fields[FIELD_DATE]
    return date.fromisoformat(raw)


def get_title(block_id: str | None = None, *, block: RecordBlock | None = None) -> str:
    """Reads this instance's title."""
    return record_store.resolve_block(OBJECT_TYPE, block_id, block).fields[FIELD_TITLE]


def set_title(value: str, block_id: str | None = None, *, block: RecordBlock | None = None) -> RecordBlock:
    """Sets this instance's title (mirrored from the template on today/future edits — see
    app/journals/today_engine.sync_future_blocks_with_template).

    Raises: ValidationError if value contains a reserved control character.
    """
    raise_if_contains_control_characters(value)
    return _set_field(FIELD_TITLE, value, block_id, block)


def get_description(block_id: str | None = None, *, block: RecordBlock | None = None) -> str:
    """Reads this instance's description."""
    return record_store.resolve_block(OBJECT_TYPE, block_id, block).fields[FIELD_DESCRIPTION]


def set_description(
    value: str, block_id: str | None = None, *, block: RecordBlock | None = None
) -> RecordBlock:
    """Sets this instance's description.

    Raises: ValidationError if value contains a reserved control character.
    """
    raise_if_contains_control_characters(value)
    return _set_field(FIELD_DESCRIPTION, value, block_id, block)


def get_tags(block_id: str | None = None, *, block: RecordBlock | None = None) -> list[str]:
    """Reads this instance's tags."""
    return decode_list(record_store.resolve_block(OBJECT_TYPE, block_id, block).fields[FIELD_TAGS])


def set_tags(
    value: list[str], block_id: str | None = None, *, block: RecordBlock | None = None
) -> RecordBlock:
    """Sets this instance's tags.

    Raises: ValidationError if any tag contains a reserved control character.
    """
    for tag in value:
        raise_if_contains_control_characters(tag)
    return _set_field(FIELD_TAGS, encode_list(value), block_id, block)


def get_start_time(block_id: str | None = None, *, block: RecordBlock | None = None) -> str:
    """Reads this instance's "HH:MM" start time (today-weekday's slot at generation time)."""
    return record_store.resolve_block(OBJECT_TYPE, block_id, block).fields[FIELD_START_TIME]


def set_start_time(
    value: str, block_id: str | None = None, *, block: RecordBlock | None = None
) -> RecordBlock:
    """Sets this instance's "HH:MM" start time."""
    return _set_field(FIELD_START_TIME, value, block_id, block)


def get_duration_minutes(block_id: str | None = None, *, block: RecordBlock | None = None) -> int:
    """Reads this instance's allotted duration, in minutes."""
    return int(record_store.resolve_block(OBJECT_TYPE, block_id, block).fields[FIELD_DURATION_MINUTES])


def set_duration_minutes(
    value: int, block_id: str | None = None, *, block: RecordBlock | None = None
) -> RecordBlock:
    """Sets this instance's allotted duration, in minutes."""
    return _set_field(FIELD_DURATION_MINUTES, str(value), block_id, block)


def get_order(block_id: str | None = None, *, block: RecordBlock | None = None) -> int:
    """Reads this instance's sort position, copied from its template — a same-time tiebreaker
    when multiple blocks start at the same time on the Today page.
    """
    return int(record_store.resolve_block(OBJECT_TYPE, block_id, block).fields[FIELD_ORDER])


def get_is_template_synced(block_id: str | None = None, *, block: RecordBlock | None = None) -> bool:
    """Reads whether this instance still picks up its template's later edits (see this module's
    own docstring).
    """
    return decode_bool(
        record_store.resolve_block(OBJECT_TYPE, block_id, block).fields[FIELD_IS_TEMPLATE_SYNCED]
    )


def set_is_template_synced(
    value: bool, block_id: str | None = None, *, block: RecordBlock | None = None
) -> RecordBlock:
    """Sets whether this instance still picks up its template's later edits — set to False as a
    side effect of directly editing one instance (see PATCH /api/blocks/<id>).
    """
    return _set_field(FIELD_IS_TEMPLATE_SYNCED, encode_bool(value), block_id, block)


# --- --- --- ---
# Internal helpers


def _set_field(
    field_name: str, raw_value: str, block_id: str | None, block: RecordBlock | None
) -> RecordBlock:
    """Applies one field change, saving immediately unless the caller is batching via block=."""
    target_block = record_store.resolve_block(OBJECT_TYPE, block_id, block)
    target_block.fields[field_name] = raw_value
    target_block.is_dirty = True
    if block is None:
        save(target_block)
    return target_block


object_registry.register(OBJECT_TYPE, sys.modules[__name__])
