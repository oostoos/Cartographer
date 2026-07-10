# @manualReviewRequested: 2026-07-07
"""A BlockTaskTemplate: one task blueprint nested inside a BlockTemplate (app/blocks/
block_template.py) — a title, a time estimate, and whether it's skippable, plus an optional
cadence override on top of the block's own occurrence. A task template with no frequency set is
included every time its block occurs (the common case — most checklist items, like "brush
teeth," should just always be there). A task template with a frequency set is only included on
days recurrence_engine.occurs_on (app/recurrence/recurrence_engine.py) says it occurs, layered on
top of whichever days the block itself occurs — e.g. within one "Morning Routine" block, "take
vitamins" can be every time while "change razor blade" is weekly and "deep clean shower" is
monthly. See app/journals/today_engine.py for the "which task templates apply today" generation
logic that reads this.
"""

import sys
from datetime import date

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
from app.recurrence.frequency import DEFAULT_INTERVAL, FREQUENCY_DAILY, FREQUENCY_MONTHLY  # noqa: F401
from app.recurrence.frequency import FREQUENCY_WEEKLY, FREQUENCY_YEARLY, Frequency  # noqa: F401

OBJECT_TYPE = "BlockTaskTemplate"

FIELD_BLOCK_TEMPLATE_ID = "block_template_id"
FIELD_TITLE = "title"
FIELD_IS_SKIPPABLE = "is_skippable"
FIELD_ESTIMATED_MINUTES = "estimated_minutes"
FIELD_ORDER = "order"
FIELD_FREQUENCY = "frequency"
FIELD_INTERVAL = "interval"
FIELD_START_DATE = "start_date"
FIELD_END_DATE = "end_date"
FIELD_DAYS_OF_WEEK = "days_of_week"
FIELD_DAY_OF_MONTH = "day_of_month"
FIELD_MONTH_OF_YEAR = "month_of_year"


# --- --- --- ---
# Standard functions


def create(
    title: str,
    block_template_id: str,
    order: int,
    is_skippable: bool = True,
    estimated_minutes: int = 5,
    frequency: Frequency | None = None,
    interval: int = DEFAULT_INTERVAL,
    start_date: date | None = None,
    end_date: date | None = None,
    days_of_week: list[int] | None = None,
    day_of_month: int | None = None,
    month_of_year: int | None = None,
) -> RecordBlock:
    """Creates a new block task template and saves it immediately.

    Inputs: title, required; block_template_id, the owning BlockTemplate; order, this task
        template's sort position among its siblings (assigned by the caller — block_template's
        whole-list-replace save assigns these from payload position, see
        app/blocks/block_template_routes.py); is_skippable, whether the generated Task defaults
        to skippable (default True); estimated_minutes, must be >= 0 (0 means unset, same
        convention as Task.estimated_minutes), this task's time estimate, used to compute the
        owning block's task time range (see app/blocks/block_time_estimate.py) and today's
        scheduled-minutes readout; frequency, optional — None means "every time the block occurs"
        (the common case); a set frequency layers recurrence_engine.occurs_on on top of the
        block's own occurrence, and requires start_date to also be given; interval/end_date/
        days_of_week/day_of_month/month_of_year, same meaning as recurrence_engine's other cadence
        fields, only relevant when frequency is set.
    Raises: ValidationError if title contains a reserved control character. ValueError if
        estimated_minutes is negative, frequency is given and isn't a Frequency member, or
        frequency is given without start_date.
    """
    raise_if_contains_control_characters(title)
    if estimated_minutes < 0:
        raise ValueError(f"estimated_minutes must be >= 0, got {estimated_minutes!r}.")
    if frequency is not None:
        if not isinstance(frequency, Frequency):
            raise ValueError(f"frequency must be a Frequency member, got {frequency!r}.")
        if start_date is None:
            raise ValueError("start_date is required when frequency is set.")

    initial_fields = {
        FIELD_BLOCK_TEMPLATE_ID: block_template_id,
        FIELD_TITLE: title,
        FIELD_IS_SKIPPABLE: encode_bool(is_skippable),
        FIELD_ESTIMATED_MINUTES: str(estimated_minutes),
        FIELD_ORDER: str(order),
        FIELD_FREQUENCY: encode_optional_enum(frequency),
        FIELD_INTERVAL: str(interval),
        FIELD_START_DATE: encode_optional_date(start_date),
        FIELD_END_DATE: encode_optional_date(end_date),
        FIELD_DAYS_OF_WEEK: encode_list([str(day) for day in (days_of_week or [])]),
        FIELD_DAY_OF_MONTH: encode_optional_int(day_of_month),
        FIELD_MONTH_OF_YEAR: encode_optional_int(month_of_year),
    }
    return record_store.create_record(OBJECT_TYPE, initial_fields)


def load(task_template_id: str) -> RecordBlock:
    """Reads a block task template from disk.

    Raises: RecordNotFoundError if no matching task template exists.
    """
    return record_store.load_block(OBJECT_TYPE, task_template_id)


def save(block: RecordBlock) -> None:
    """Writes a task template's block to disk if it has unsaved changes."""
    record_store.save_block(block)


def delete(task_template_id: str) -> None:
    """Deletes a block task template. A no-op if it doesn't exist."""
    record_store.delete_record(OBJECT_TYPE, task_template_id)


def list_ids() -> list[str]:
    """Lists every task template's id without reading any task template's contents."""
    return record_store.list_record_ids(OBJECT_TYPE)


def list_all() -> list[RecordBlock]:
    """Loads every task template. Expensive relative to list_ids — prefer list_ids when ids
    suffice.
    """
    return record_store.list_all_blocks(OBJECT_TYPE)


def find(**raw_field_filters: str) -> list[RecordBlock]:
    """Loads every task template whose raw field values match every given filter."""
    return record_store.find_blocks(OBJECT_TYPE, **raw_field_filters)


def find_one(**raw_field_filters: str) -> RecordBlock | None:
    """Loads the first task template matching every given filter, or None if none do."""
    return record_store.find_one_block(OBJECT_TYPE, **raw_field_filters)


def find_for_block_template(block_template_id: str) -> list[RecordBlock]:
    """Loads every task template belonging to one block template, ordered by their sort
    position.
    """
    templates = find(block_template_id=block_template_id)
    templates.sort(key=lambda template: get_order(block=template))
    return templates


def delete_all_for_block_template(block_template_id: str) -> None:
    """Deletes every task template belonging to one block template — used when a block template
    is deleted, and when its task templates are wholesale-replaced on save (see
    app/blocks/block_template_routes.py).
    """
    for template in find(block_template_id=block_template_id):
        delete(get_id(block=template))


# --- --- --- ---
# Field getters and setters
#
# Every function below accepts exactly one of task_template_id= (one-shot) or block= (batched) —
# see core/storage/CLAUDE.md.


def get_id(task_template_id: str | None = None, *, block: RecordBlock | None = None) -> str:
    """Reads a task template's id."""
    return record_store.resolve_block(OBJECT_TYPE, task_template_id, block).record_id


def get_block_template_id(task_template_id: str | None = None, *, block: RecordBlock | None = None) -> str:
    """Reads the id of the BlockTemplate this task template belongs to."""
    return record_store.resolve_block(OBJECT_TYPE, task_template_id, block).fields[FIELD_BLOCK_TEMPLATE_ID]


def get_title(task_template_id: str | None = None, *, block: RecordBlock | None = None) -> str:
    """Reads the title stamped onto every generated Task."""
    return record_store.resolve_block(OBJECT_TYPE, task_template_id, block).fields[FIELD_TITLE]


def get_is_skippable(task_template_id: str | None = None, *, block: RecordBlock | None = None) -> bool:
    """Reads whether the generated Task defaults to skippable."""
    return decode_bool(
        record_store.resolve_block(OBJECT_TYPE, task_template_id, block).fields[FIELD_IS_SKIPPABLE]
    )


def get_estimated_minutes(task_template_id: str | None = None, *, block: RecordBlock | None = None) -> int:
    """Reads this task's time estimate, in minutes."""
    return int(
        record_store.resolve_block(OBJECT_TYPE, task_template_id, block).fields[FIELD_ESTIMATED_MINUTES]
    )


def get_order(task_template_id: str | None = None, *, block: RecordBlock | None = None) -> int:
    """Reads this task template's sort position among its siblings within the same block
    template.
    """
    return int(record_store.resolve_block(OBJECT_TYPE, task_template_id, block).fields[FIELD_ORDER])


def get_frequency(
    task_template_id: str | None = None, *, block: RecordBlock | None = None
) -> Frequency | None:
    """Reads this task template's cadence override, or None if unset (meaning "every time the
    block occurs").
    """
    return decode_optional_enum(
        record_store.resolve_block(OBJECT_TYPE, task_template_id, block).fields[FIELD_FREQUENCY], Frequency
    )


def get_interval(task_template_id: str | None = None, *, block: RecordBlock | None = None) -> int:
    """Reads this task template's every-X-units interval (only meaningful when frequency is
    set).
    """
    return int(record_store.resolve_block(OBJECT_TYPE, task_template_id, block).fields[FIELD_INTERVAL])


def get_start_date(task_template_id: str | None = None, *, block: RecordBlock | None = None) -> date | None:
    """Reads the first date this task template's cadence override can occur on (required
    whenever frequency is set, unset otherwise).
    """
    return decode_optional_date(
        record_store.resolve_block(OBJECT_TYPE, task_template_id, block).fields[FIELD_START_DATE]
    )


def get_end_date(task_template_id: str | None = None, *, block: RecordBlock | None = None) -> date | None:
    """Reads the last date this task template's cadence override can occur on, or None if it
    never ends.
    """
    return decode_optional_date(
        record_store.resolve_block(OBJECT_TYPE, task_template_id, block).fields[FIELD_END_DATE]
    )


def get_days_of_week(task_template_id: str | None = None, *, block: RecordBlock | None = None) -> list[int]:
    """Reads the weekday numbers (0=Monday..6=Sunday) a weekly cadence override occurs on."""
    raw = record_store.resolve_block(OBJECT_TYPE, task_template_id, block).fields[FIELD_DAYS_OF_WEEK]
    return [int(day) for day in decode_list(raw)]


def get_day_of_month(task_template_id: str | None = None, *, block: RecordBlock | None = None) -> int | None:
    """Reads the day-of-month a monthly/yearly cadence override occurs on, or None if unset."""
    return decode_optional_int(
        record_store.resolve_block(OBJECT_TYPE, task_template_id, block).fields[FIELD_DAY_OF_MONTH]
    )


def get_month_of_year(task_template_id: str | None = None, *, block: RecordBlock | None = None) -> int | None:
    """Reads the month (1-12) a yearly cadence override occurs in, or None if unset."""
    return decode_optional_int(
        record_store.resolve_block(OBJECT_TYPE, task_template_id, block).fields[FIELD_MONTH_OF_YEAR]
    )


object_registry.register(OBJECT_TYPE, sys.modules[__name__])
