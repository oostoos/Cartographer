# @manualReviewRequested: 2026-07-06
"""A RecurringTaskTemplate: describes both how often a task repeats and the shape of the Task
instances stamped out for each occurrence — title, description, project, tags, and a checklist
of subtask titles. See app/journals/today_engine.py for the "which templates apply today, and
what does today's instance look like" logic that reads this, and
app/recurrence/recurrence_engine.py for the "does this occur on date D" math.

Scope cut: "Nth weekday of month" (e.g. "2nd Tuesday") is not supported — it would need an
additional week_of_month field, and wasn't requested.
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

OBJECT_TYPE = "RecurringTaskTemplate"

FIELD_TITLE = "title"
FIELD_DESCRIPTION = "description"
FIELD_PROJECT_ID = "project_id"
FIELD_TAGS = "tags"
FIELD_SUBTASK_TITLES = "subtask_titles"
FIELD_FREQUENCY = "frequency"
FIELD_INTERVAL = "interval"
FIELD_START_DATE = "start_date"
FIELD_END_DATE = "end_date"
FIELD_DAYS_OF_WEEK = "days_of_week"
FIELD_DAY_OF_MONTH = "day_of_month"
FIELD_MONTH_OF_YEAR = "month_of_year"
FIELD_IS_ACTIVE = "is_active"

FREQUENCY_DAILY = "daily"
FREQUENCY_WEEKLY = "weekly"
FREQUENCY_MONTHLY = "monthly"
FREQUENCY_YEARLY = "yearly"
VALID_FREQUENCIES = (FREQUENCY_DAILY, FREQUENCY_WEEKLY, FREQUENCY_MONTHLY, FREQUENCY_YEARLY)

# Default "every-X" interval: repeats every single unit of the frequency.
DEFAULT_INTERVAL = 1


# --- --- --- ---
# Standard functions


def create(
    title: str,
    frequency: str,
    start_date: date,
    description: str = "",
    project_id: str = "",
    tags: list[str] | None = None,
    subtask_titles: list[str] | None = None,
    interval: int = DEFAULT_INTERVAL,
    end_date: date | None = None,
    days_of_week: list[int] | None = None,
    day_of_month: int | None = None,
    month_of_year: int | None = None,
) -> RecordBlock:
    """Creates a new recurring task template and saves it immediately.

    Inputs: title, required — stamped onto every generated instance; frequency, one of
        VALID_FREQUENCIES; start_date, the first date this template can occur on; description/
        project_id/tags/subtask_titles, optional — also stamped onto every generated instance
        (subtask_titles become that instance's own fresh Subtasks); interval, repeat every N
        units of frequency (default 1); end_date, optional last date this template can occur on;
        days_of_week, weekday numbers 0 (Monday) - 6 (Sunday), for weekly templates; day_of_month,
        for monthly/yearly templates; month_of_year, for yearly templates.
    Raises: ValidationError if title, description, or any tag/subtask title contains a reserved
        control character. ValueError if frequency is not one of VALID_FREQUENCIES.
    """
    if frequency not in VALID_FREQUENCIES:
        raise ValueError(f"frequency must be one of {VALID_FREQUENCIES}, got {frequency!r}.")

    tags = tags or []
    subtask_titles = subtask_titles or []
    raise_if_contains_control_characters(title)
    raise_if_contains_control_characters(description)
    for tag in tags:
        raise_if_contains_control_characters(tag)
    for subtask_title in subtask_titles:
        raise_if_contains_control_characters(subtask_title)

    initial_fields = {
        FIELD_TITLE: title,
        FIELD_DESCRIPTION: description,
        FIELD_PROJECT_ID: project_id,
        FIELD_TAGS: encode_list(tags),
        FIELD_SUBTASK_TITLES: encode_list(subtask_titles),
        FIELD_FREQUENCY: frequency,
        FIELD_INTERVAL: str(interval),
        FIELD_START_DATE: start_date.isoformat(),
        FIELD_END_DATE: encode_optional_date(end_date),
        FIELD_DAYS_OF_WEEK: encode_list([str(day) for day in (days_of_week or [])]),
        FIELD_DAY_OF_MONTH: encode_optional_int(day_of_month),
        FIELD_MONTH_OF_YEAR: encode_optional_int(month_of_year),
        FIELD_IS_ACTIVE: encode_bool(True),
    }
    return record_store.create_record(OBJECT_TYPE, initial_fields)


def load(recurring_template_id: str) -> RecordBlock:
    """Reads a recurring task template from disk.

    Raises: RecordNotFoundError if no matching template exists.
    """
    return record_store.load_block(OBJECT_TYPE, recurring_template_id)


def save(block: RecordBlock) -> None:
    """Writes a template's block to disk if it has unsaved changes."""
    record_store.save_block(block)


def delete(recurring_template_id: str) -> None:
    """Deletes a recurring task template. A no-op if it doesn't exist. Instances already
    generated from it are unaffected — only future generation stops.
    """
    record_store.delete_record(OBJECT_TYPE, recurring_template_id)


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
# Every function below accepts exactly one of recurring_template_id= (one-shot) or block=
# (batched) — see core/storage/CLAUDE.md.


def get_id(recurring_template_id: str | None = None, *, block: RecordBlock | None = None) -> str:
    """Reads a template's id."""
    return record_store.resolve_block(OBJECT_TYPE, recurring_template_id, block).record_id


def get_title(recurring_template_id: str | None = None, *, block: RecordBlock | None = None) -> str:
    """Reads the title stamped onto every generated instance."""
    return record_store.resolve_block(OBJECT_TYPE, recurring_template_id, block).fields[FIELD_TITLE]


def set_title(
    value: str, recurring_template_id: str | None = None, *, block: RecordBlock | None = None
) -> RecordBlock:
    """Sets the title future instances will be stamped with. Doesn't affect already-generated
    instances.

    Raises: ValidationError if value contains a reserved control character.
    """
    raise_if_contains_control_characters(value)
    return _set_field(FIELD_TITLE, value, recurring_template_id, block)


def get_description(recurring_template_id: str | None = None, *, block: RecordBlock | None = None) -> str:
    """Reads the description stamped onto every generated instance."""
    return record_store.resolve_block(OBJECT_TYPE, recurring_template_id, block).fields[FIELD_DESCRIPTION]


def set_description(
    value: str, recurring_template_id: str | None = None, *, block: RecordBlock | None = None
) -> RecordBlock:
    """Sets the description future instances will be stamped with.

    Raises: ValidationError if value contains a reserved control character.
    """
    raise_if_contains_control_characters(value)
    return _set_field(FIELD_DESCRIPTION, value, recurring_template_id, block)


def get_project_id(recurring_template_id: str | None = None, *, block: RecordBlock | None = None) -> str:
    """Reads the project id stamped onto every generated instance (empty means no project)."""
    return record_store.resolve_block(OBJECT_TYPE, recurring_template_id, block).fields[FIELD_PROJECT_ID]


def set_project_id(
    value: str, recurring_template_id: str | None = None, *, block: RecordBlock | None = None
) -> RecordBlock:
    """Sets the project future instances will be stamped with."""
    return _set_field(FIELD_PROJECT_ID, value, recurring_template_id, block)


def get_tags(recurring_template_id: str | None = None, *, block: RecordBlock | None = None) -> list[str]:
    """Reads the tags stamped onto every generated instance."""
    return decode_list(
        record_store.resolve_block(OBJECT_TYPE, recurring_template_id, block).fields[FIELD_TAGS]
    )


def set_tags(
    value: list[str], recurring_template_id: str | None = None, *, block: RecordBlock | None = None
) -> RecordBlock:
    """Sets the tags future instances will be stamped with.

    Raises: ValidationError if any tag contains a reserved control character.
    """
    for tag in value:
        raise_if_contains_control_characters(tag)
    return _set_field(FIELD_TAGS, encode_list(value), recurring_template_id, block)


def get_subtask_titles(
    recurring_template_id: str | None = None, *, block: RecordBlock | None = None
) -> list[str]:
    """Reads the checklist titles copied onto each freshly generated instance's own Subtasks."""
    return decode_list(
        record_store.resolve_block(OBJECT_TYPE, recurring_template_id, block).fields[FIELD_SUBTASK_TITLES]
    )


def set_subtask_titles(
    value: list[str], recurring_template_id: str | None = None, *, block: RecordBlock | None = None
) -> RecordBlock:
    """Sets the checklist titles future instances will be stamped with. Doesn't affect
    already-generated instances' own Subtasks.

    Raises: ValidationError if any subtask title contains a reserved control character.
    """
    for subtask_title in value:
        raise_if_contains_control_characters(subtask_title)
    return _set_field(FIELD_SUBTASK_TITLES, encode_list(value), recurring_template_id, block)


def get_frequency(recurring_template_id: str | None = None, *, block: RecordBlock | None = None) -> str:
    """Reads a template's frequency (one of VALID_FREQUENCIES)."""
    return record_store.resolve_block(OBJECT_TYPE, recurring_template_id, block).fields[FIELD_FREQUENCY]


def set_frequency(
    value: str, recurring_template_id: str | None = None, *, block: RecordBlock | None = None
) -> RecordBlock:
    """Sets a template's frequency.

    Raises: ValueError if value is not one of VALID_FREQUENCIES.
    """
    if value not in VALID_FREQUENCIES:
        raise ValueError(f"frequency must be one of {VALID_FREQUENCIES}, got {value!r}.")
    return _set_field(FIELD_FREQUENCY, value, recurring_template_id, block)


def get_interval(recurring_template_id: str | None = None, *, block: RecordBlock | None = None) -> int:
    """Reads a template's every-X-units interval."""
    return int(record_store.resolve_block(OBJECT_TYPE, recurring_template_id, block).fields[FIELD_INTERVAL])


def set_interval(
    value: int, recurring_template_id: str | None = None, *, block: RecordBlock | None = None
) -> RecordBlock:
    """Sets a template's every-X-units interval."""
    return _set_field(FIELD_INTERVAL, str(value), recurring_template_id, block)


def get_start_date(recurring_template_id: str | None = None, *, block: RecordBlock | None = None) -> date:
    """Reads the first date a template can occur on."""
    raw = record_store.resolve_block(OBJECT_TYPE, recurring_template_id, block).fields[FIELD_START_DATE]
    return date.fromisoformat(raw)


def set_start_date(
    value: date, recurring_template_id: str | None = None, *, block: RecordBlock | None = None
) -> RecordBlock:
    """Sets the first date a template can occur on."""
    return _set_field(FIELD_START_DATE, value.isoformat(), recurring_template_id, block)


def get_end_date(
    recurring_template_id: str | None = None, *, block: RecordBlock | None = None
) -> date | None:
    """Reads the last date a template can occur on, or None if it never ends."""
    return decode_optional_date(
        record_store.resolve_block(OBJECT_TYPE, recurring_template_id, block).fields[FIELD_END_DATE]
    )


def get_days_of_week(
    recurring_template_id: str | None = None, *, block: RecordBlock | None = None
) -> list[int]:
    """Reads the weekday numbers (0=Monday..6=Sunday) a weekly template occurs on."""
    raw = record_store.resolve_block(OBJECT_TYPE, recurring_template_id, block).fields[FIELD_DAYS_OF_WEEK]
    return [int(day) for day in decode_list(raw)]


def set_days_of_week(
    value: list[int], recurring_template_id: str | None = None, *, block: RecordBlock | None = None
) -> RecordBlock:
    """Sets the weekday numbers (0=Monday..6=Sunday) a weekly template occurs on."""
    return _set_field(
        FIELD_DAYS_OF_WEEK, encode_list([str(day) for day in value]), recurring_template_id, block
    )


def get_day_of_month(
    recurring_template_id: str | None = None, *, block: RecordBlock | None = None
) -> int | None:
    """Reads the day-of-month a monthly/yearly template occurs on, or None if unset."""
    return decode_optional_int(
        record_store.resolve_block(OBJECT_TYPE, recurring_template_id, block).fields[FIELD_DAY_OF_MONTH]
    )


def set_day_of_month(
    value: int | None, recurring_template_id: str | None = None, *, block: RecordBlock | None = None
) -> RecordBlock:
    """Sets (or clears, with None) the day-of-month a monthly/yearly template occurs on."""
    return _set_field(FIELD_DAY_OF_MONTH, encode_optional_int(value), recurring_template_id, block)


def get_month_of_year(
    recurring_template_id: str | None = None, *, block: RecordBlock | None = None
) -> int | None:
    """Reads the month (1-12) a yearly template occurs in, or None if unset."""
    return decode_optional_int(
        record_store.resolve_block(OBJECT_TYPE, recurring_template_id, block).fields[FIELD_MONTH_OF_YEAR]
    )


def set_month_of_year(
    value: int | None, recurring_template_id: str | None = None, *, block: RecordBlock | None = None
) -> RecordBlock:
    """Sets (or clears, with None) the month (1-12) a yearly template occurs in."""
    return _set_field(FIELD_MONTH_OF_YEAR, encode_optional_int(value), recurring_template_id, block)


def get_is_active(recurring_template_id: str | None = None, *, block: RecordBlock | None = None) -> bool:
    """Reads whether a template is currently active (inactive templates generate no instances)."""
    return decode_bool(
        record_store.resolve_block(OBJECT_TYPE, recurring_template_id, block).fields[FIELD_IS_ACTIVE]
    )


def set_is_active(
    value: bool, recurring_template_id: str | None = None, *, block: RecordBlock | None = None
) -> RecordBlock:
    """Sets whether a template is active."""
    return _set_field(FIELD_IS_ACTIVE, encode_bool(value), recurring_template_id, block)


def set_end_date(
    value: date | None, recurring_template_id: str | None = None, *, block: RecordBlock | None = None
) -> RecordBlock:
    """Sets (or clears, with None) the last date a template can occur on."""
    return _set_field(FIELD_END_DATE, encode_optional_date(value), recurring_template_id, block)


# --- --- --- ---
# Internal helpers


def _set_field(
    field_name: str, raw_value: str, recurring_template_id: str | None, block: RecordBlock | None
) -> RecordBlock:
    """Applies one field change, saving immediately unless the caller is batching via block=."""
    target_block = record_store.resolve_block(OBJECT_TYPE, recurring_template_id, block)
    target_block.fields[field_name] = raw_value
    target_block.is_dirty = True
    if block is None:
        save(target_block)
    return target_block


object_registry.register(OBJECT_TYPE, sys.modules[__name__])
