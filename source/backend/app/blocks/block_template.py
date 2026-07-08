# @manualReviewRequested: 2026-07-07
"""A BlockTemplate: a recurring block of time (e.g. "Morning Training," "Get Ready for the Day")
that a user builds once, which then shows up on the Today page every day it's scheduled, with its
nested BlockTaskTemplates (app/blocks/block_task_template.py) stamped out as ordinary Tasks to
work through back to back. Replaces the old RecurringTaskTemplate model entirely — a block is a
container of sequential tasks, not a task itself.

A block's own occurrence is an ordered list of effective-dated BlockTemplateSegments (see
app/blocks/block_template_segment.py) — daily/weekly/monthly/yearly + an "every N" interval, plus
a set of per-unit time slots (a weekday for weekly, a day-of-month for monthly, a month+day for
yearly). Editing a template's shape appends a new segment effective from today rather than
mutating history, so a past or already-generated occurrence is never retroactively changed — see
upsert_shape_effective_today. The whole series is additionally bounded by an overall start_date/
end_date (e.g. a seasonal "training block"), independent of the segments' own shapes. See
app/blocks/block_schedule.py for "does this block occur on date D."
"""

import sys
from datetime import date

from core.storage import object_registry, record_store
from core.storage.control_chars import raise_if_contains_control_characters
from core.storage.field_types import (
    decode_bool,
    decode_optional_date,
    decode_optional_int,
    encode_bool,
    encode_optional_date,
    encode_optional_int,
)
from core.storage.record_block import RecordBlock, decode_list, encode_list
from app.blocks import block_template_segment
from app.blocks.block_template_segment import BlockTemplateSegment, InstanceRow
from app.recurrence.frequency import Frequency

OBJECT_TYPE = "BlockTemplate"

FIELD_TITLE = "title"
FIELD_DESCRIPTION = "description"
FIELD_TAGS = "tags"
FIELD_IS_ACTIVE = "is_active"
FIELD_ORDER = "order"
FIELD_START_DATE = "start_date"
FIELD_END_DATE = "end_date"
FIELD_SEGMENTS = "segments"
FIELD_WORKSPACE_ID = "workspace_id"


# --- --- --- ---
# Standard functions


def create(
    title: str,
    description: str = "",
    tags: list[str] | None = None,
    segments: list[BlockTemplateSegment] | None = None,
    start_date: date | None = None,
    end_date: date | None = None,
    workspace_id: str = "",
) -> RecordBlock:
    """Creates a new block template and saves it immediately.

    Inputs: title, required; description/tags, optional; segments, this block's occurrence shape
        history — defaults to no segments at all (never occurs) if omitted, so a template can be
        created and configured in a second step; start_date/end_date, optional overall bounds on
        when this block series is eligible at all (e.g. a seasonal block), independent of its
        segments' own shapes; workspace_id, optional — empty means unassigned. Generated Block
        instances don't carry their own workspace_id — they trace back to it via template_id, the
        same denormalized-but-not-everything pattern app/blocks/block.py already documents.
    Raises: ValidationError if title, description, or any tag contains a reserved control
        character. ValueError if any segment is invalid (see block_template_segment.encode_segments).
    """
    tags = tags or []
    raise_if_contains_control_characters(title)
    raise_if_contains_control_characters(description)
    for tag in tags:
        raise_if_contains_control_characters(tag)

    segments = segments if segments is not None else []

    initial_fields = {
        FIELD_TITLE: title,
        FIELD_DESCRIPTION: description,
        FIELD_TAGS: encode_list(tags),
        FIELD_WORKSPACE_ID: workspace_id,
        FIELD_IS_ACTIVE: encode_bool(True),
        FIELD_ORDER: encode_optional_int(_next_order()),
        FIELD_START_DATE: encode_optional_date(start_date),
        FIELD_END_DATE: encode_optional_date(end_date),
        FIELD_SEGMENTS: block_template_segment.encode_segments(segments),
    }
    return record_store.create_record(OBJECT_TYPE, initial_fields)


def load(block_template_id: str) -> RecordBlock:
    """Reads a block template from disk.

    Raises: RecordNotFoundError if no matching template exists.
    """
    return record_store.load_block(OBJECT_TYPE, block_template_id)


def save(block: RecordBlock) -> None:
    """Writes a template's block to disk if it has unsaved changes."""
    record_store.save_block(block)


def delete(block_template_id: str) -> None:
    """Deletes a block template. A no-op if it doesn't exist. Block instances already generated
    from it are unaffected — only future generation stops.
    """
    record_store.delete_record(OBJECT_TYPE, block_template_id)


def list_ids() -> list[str]:
    """Lists every template's id without reading any template's contents."""
    return record_store.list_record_ids(OBJECT_TYPE)


def list_all() -> list[RecordBlock]:
    """Loads every template. Expensive relative to list_ids — prefer list_ids when ids suffice."""
    return record_store.list_all_blocks(OBJECT_TYPE)


def list_active() -> list[RecordBlock]:
    """Loads every template that is currently active — the set today_engine checks for today's
    occurrences.
    """
    return [template for template in list_all() if get_is_active(block=template)]


def find(**raw_field_filters: str) -> list[RecordBlock]:
    """Loads every template whose raw field values match every given filter."""
    return record_store.find_blocks(OBJECT_TYPE, **raw_field_filters)


def find_one(**raw_field_filters: str) -> RecordBlock | None:
    """Loads the first template matching every given filter, or None if none do."""
    return record_store.find_one_block(OBJECT_TYPE, **raw_field_filters)


# --- --- --- ---
# Field getters and setters
#
# Every function below accepts exactly one of block_template_id= (one-shot) or block= (batched) —
# see core/storage/CLAUDE.md.


def get_id(block_template_id: str | None = None, *, block: RecordBlock | None = None) -> str:
    """Reads a template's id."""
    return record_store.resolve_block(OBJECT_TYPE, block_template_id, block).record_id


def get_title(block_template_id: str | None = None, *, block: RecordBlock | None = None) -> str:
    """Reads the title stamped onto every generated Block instance."""
    return record_store.resolve_block(OBJECT_TYPE, block_template_id, block).fields[FIELD_TITLE]


def set_title(
    value: str, block_template_id: str | None = None, *, block: RecordBlock | None = None
) -> RecordBlock:
    """Sets the title future instances will be stamped with.

    Raises: ValidationError if value contains a reserved control character.
    """
    raise_if_contains_control_characters(value)
    return _set_field(FIELD_TITLE, value, block_template_id, block)


def get_description(block_template_id: str | None = None, *, block: RecordBlock | None = None) -> str:
    """Reads the description stamped onto every generated Block instance."""
    return record_store.resolve_block(OBJECT_TYPE, block_template_id, block).fields[FIELD_DESCRIPTION]


def set_description(
    value: str, block_template_id: str | None = None, *, block: RecordBlock | None = None
) -> RecordBlock:
    """Sets the description future instances will be stamped with.

    Raises: ValidationError if value contains a reserved control character.
    """
    raise_if_contains_control_characters(value)
    return _set_field(FIELD_DESCRIPTION, value, block_template_id, block)


def get_tags(block_template_id: str | None = None, *, block: RecordBlock | None = None) -> list[str]:
    """Reads the tags stamped onto every generated Block instance."""
    return decode_list(record_store.resolve_block(OBJECT_TYPE, block_template_id, block).fields[FIELD_TAGS])


def set_tags(
    value: list[str], block_template_id: str | None = None, *, block: RecordBlock | None = None
) -> RecordBlock:
    """Sets the tags future instances will be stamped with.

    Raises: ValidationError if any tag contains a reserved control character.
    """
    for tag in value:
        raise_if_contains_control_characters(tag)
    return _set_field(FIELD_TAGS, encode_list(value), block_template_id, block)


def get_is_active(block_template_id: str | None = None, *, block: RecordBlock | None = None) -> bool:
    """Reads whether a template is currently active (inactive templates generate no instances)."""
    return decode_bool(
        record_store.resolve_block(OBJECT_TYPE, block_template_id, block).fields[FIELD_IS_ACTIVE]
    )


def set_is_active(
    value: bool, block_template_id: str | None = None, *, block: RecordBlock | None = None
) -> RecordBlock:
    """Sets whether a template is active."""
    return _set_field(FIELD_IS_ACTIVE, encode_bool(value), block_template_id, block)


def get_workspace_id(block_template_id: str | None = None, *, block: RecordBlock | None = None) -> str:
    """Reads the id of the workspace this template belongs to (empty string means unassigned)."""
    return record_store.resolve_block(OBJECT_TYPE, block_template_id, block).fields[FIELD_WORKSPACE_ID]


def set_workspace_id(
    value: str, block_template_id: str | None = None, *, block: RecordBlock | None = None
) -> RecordBlock:
    """Sets the workspace this template belongs to (empty string means unassigned)."""
    return _set_field(FIELD_WORKSPACE_ID, value, block_template_id, block)


def get_order(block_template_id: str | None = None, *, block: RecordBlock | None = None) -> int:
    """Reads a template's manual sort position — a same-time tiebreaker on the Today page; the
    weekly calendar config page has no manual ordering of its own (see
    source/frontend/app/blocks/BlockTemplatesPage.tsx).
    """
    return decode_optional_int(
        record_store.resolve_block(OBJECT_TYPE, block_template_id, block).fields[FIELD_ORDER]
    )


def set_order(
    value: int, block_template_id: str | None = None, *, block: RecordBlock | None = None
) -> RecordBlock:
    """Sets a template's manual sort position (see get_order)."""
    return _set_field(FIELD_ORDER, encode_optional_int(value), block_template_id, block)


def get_start_date(block_template_id: str | None = None, *, block: RecordBlock | None = None) -> date | None:
    """Reads the first date this block series is eligible at all, or None if it always has been."""
    return decode_optional_date(
        record_store.resolve_block(OBJECT_TYPE, block_template_id, block).fields[FIELD_START_DATE]
    )


def set_start_date(
    value: date | None, block_template_id: str | None = None, *, block: RecordBlock | None = None
) -> RecordBlock:
    """Sets (or clears, with None) the first date this block series is eligible at all."""
    return _set_field(FIELD_START_DATE, encode_optional_date(value), block_template_id, block)


def get_end_date(block_template_id: str | None = None, *, block: RecordBlock | None = None) -> date | None:
    """Reads the last date this block series is eligible at all, or None if it never ends."""
    return decode_optional_date(
        record_store.resolve_block(OBJECT_TYPE, block_template_id, block).fields[FIELD_END_DATE]
    )


def set_end_date(
    value: date | None, block_template_id: str | None = None, *, block: RecordBlock | None = None
) -> RecordBlock:
    """Sets (or clears, with None) the last date this block series is eligible at all."""
    return _set_field(FIELD_END_DATE, encode_optional_date(value), block_template_id, block)


def get_segments(
    block_template_id: str | None = None, *, block: RecordBlock | None = None
) -> list[BlockTemplateSegment]:
    """Reads this block's full effective-dated shape history, ordered by effective_from
    ascending.
    """
    raw = record_store.resolve_block(OBJECT_TYPE, block_template_id, block).fields[FIELD_SEGMENTS]
    return block_template_segment.decode_segments(raw)


def set_segments(
    value: list[BlockTemplateSegment],
    block_template_id: str | None = None,
    *,
    block: RecordBlock | None = None,
) -> RecordBlock:
    """Batch-replaces this block's entire shape history. Prefer upsert_shape_effective_today for
    an ordinary user edit — this setter is for the one-shot data migration and tests that need to
    write specific segment history directly.
    """
    return _set_field(FIELD_SEGMENTS, block_template_segment.encode_segments(value), block_template_id, block)


def shape_effective_on(
    target_date: date, block_template_id: str | None = None, *, block: RecordBlock | None = None
) -> BlockTemplateSegment | None:
    """Reads whichever segment governs target_date, or None if no segment covers it yet (the
    template has no configured shape, or every segment starts after target_date).
    """
    return block_template_segment.segment_effective_on(
        get_segments(block_template_id, block=block), target_date
    )


def upsert_shape_effective_today(
    today: date,
    frequency: Frequency,
    interval: int,
    is_advanced: bool,
    instance_rows: list[InstanceRow],
    block_template_id: str | None = None,
    *,
    block: RecordBlock | None = None,
) -> RecordBlock:
    """Applies a shape edit as of today: every date before today keeps whichever shape already
    governed it; today onward uses the new shape, exactly the "sidebar edits apply from today
    onward, leaving prior instances as they were" behavior this whole segment history exists for.

    Raises: ValueError if interval isn't > 0 or any instance row is invalid (see
        block_template_segment.upsert_effective_today).
    """
    existing = get_segments(block_template_id, block=block)
    updated = block_template_segment.upsert_effective_today(
        existing, today, frequency, interval, is_advanced, instance_rows
    )
    return set_segments(updated, block_template_id, block=block)


# --- --- --- ---
# Internal helpers


def _next_order() -> int:
    """Computes the sort position for a newly created template: one past the highest order among
    every existing template, so a new one always lands at the end.
    """
    templates = list_all()
    if not templates:
        return 0
    return max(get_order(block=template) for template in templates) + 1


def _set_field(
    field_name: str, raw_value: str, block_template_id: str | None, block: RecordBlock | None
) -> RecordBlock:
    """Applies one field change, saving immediately unless the caller is batching via block=."""
    target_block = record_store.resolve_block(OBJECT_TYPE, block_template_id, block)
    target_block.fields[field_name] = raw_value
    target_block.is_dirty = True
    if block is None:
        save(target_block)
    return target_block


object_registry.register(OBJECT_TYPE, sys.modules[__name__])
