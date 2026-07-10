# @manualReviewRequested: 2026-07-07
"""A BlockTemplateSegment: one effective-dated occurrence shape within a BlockTemplate's history.
A template holds an ordered list of these (see app/blocks/block_template.py's FIELD_SEGMENTS) —
editing a template's shape from the calendar's sidebar appends a new segment effective from today
(see upsert_effective_today), rather than mutating history, so a past or already-generated
occurrence is never retroactively changed; segment_effective_on picks whichever segment governs a
given date.

A segment's own shape is one Frequency (daily/weekly/monthly/yearly) plus an "every N" interval,
plus a set of InstanceRows — one per selectable unit the frequency exposes (a weekday for weekly,
a day-of-month for monthly, a month+day for yearly; daily has exactly one implicit unit). A unit
with no row is off, the same meaning the old weekly_schedule's per-day is_active=False carried.
"Simple" vs "advanced" editing (BlockTemplateSegment.is_advanced) is a pure frontend-form
distinction — simple mode just writes every generated row with the same start_time/duration_minutes;
storage and occurrence math never look at is_advanced.

Occurrence math is entirely delegated to app/recurrence/recurrence_engine.occurs_on, called once
per instance row with that row's selector translated into whichever cadence field its frequency
uses — this is what lets a block's own occurrence reuse the exact same, already-tested cadence math
app/blocks/block_task_template.py's per-task cadence override uses, with no duplicated date logic.
"""

from datetime import date, datetime
from typing import NamedTuple

from core.storage.field_types import decode_bool, decode_enum, encode_bool, encode_enum
from core.storage.record_block import decode_table, encode_table
from app.recurrence import recurrence_engine
from app.recurrence.frequency import Frequency

# The wire format an instance row's start_time must parse as (mirrors block_template's old
# START_TIME_FORMAT for the weekly_schedule it replaces).
START_TIME_FORMAT = "%H:%M"

# The sentinel selector a DAILY segment's single instance row always uses — daily has no
# selectable sub-unit (unlike a weekday, a day-of-month, or a month+day), so at most one row ever
# exists for it.
DAILY_SELECTOR = "daily"


class InstanceRow(NamedTuple):
    """One selectable unit's own time slot within a segment. selector's format depends on the
    owning segment's frequency: DAILY_SELECTOR for daily, "0".."6" (Monday=0) for weekly, "1".."31"
    for monthly, "MM-DD" for yearly.
    """

    selector: str
    start_time: str
    duration_minutes: int


class BlockTemplateSegment(NamedTuple):
    """One effective-dated shape. effective_from is inclusive — this segment governs every date
    from there up to (not including) the next segment's own effective_from, or forever if it's the
    last one.
    """

    effective_from: date
    frequency: Frequency
    interval: int
    is_advanced: bool
    instance_rows: list[InstanceRow]


def segment_effective_on(
    segments: list[BlockTemplateSegment], target_date: date
) -> BlockTemplateSegment | None:
    """Returns whichever segment governs target_date — the one with the latest effective_from that
    still isn't after target_date — or None if every segment starts after target_date (or there
    are no segments at all, meaning the template has no configured shape yet).
    """
    applicable = [segment for segment in segments if segment.effective_from <= target_date]
    if not applicable:
        return None
    return max(applicable, key=lambda segment: segment.effective_from)


def matching_row(segment: BlockTemplateSegment, target_date: date) -> InstanceRow | None:
    """Returns the instance row governing target_date within segment, or None if nothing occurs
    then — either because target_date is before the segment even starts, or because every row's
    own cadence check comes back false for it (including a unit that's simply not selected at all,
    i.e. has no row).
    """
    for row in segment.instance_rows:
        if _row_occurs_on(segment, row, target_date):
            return row
    return None


def upsert_effective_today(
    segments: list[BlockTemplateSegment],
    today: date,
    frequency: Frequency,
    interval: int,
    is_advanced: bool,
    instance_rows: list[InstanceRow],
) -> list[BlockTemplateSegment]:
    """Returns a new segments list reflecting a shape edit made today: replaces the existing
    segment whose effective_from is already today, if any (so several edits on the same day don't
    accumulate no-op history), or otherwise appends a new one — every earlier segment is left
    exactly as it was, so any already-generated or projected occurrence before today is unaffected.

    Raises: ValueError if interval isn't > 0, or any instance row is invalid (see
        _validate_instance_rows).
    """
    if interval <= 0:
        raise ValueError(f"interval must be > 0, got {interval!r}.")
    _validate_instance_rows(frequency, instance_rows)

    new_segment = BlockTemplateSegment(today, frequency, interval, is_advanced, instance_rows)
    return [segment for segment in segments if segment.effective_from != today] + [new_segment]


def encode_segments(segments: list[BlockTemplateSegment]) -> str:
    """Encodes every segment's every instance row as one flat table — one row per (segment,
    instance row) pair, each carrying its owning segment's effective_from/frequency/interval/
    is_advanced alongside that instance row's own selector/start_time/duration_minutes. Flat
    rather than nested because the storage format's encode_table only supports a 2D table, not a
    table of tables — denormalizing by repeating the segment's own fields on every one of its rows
    is simpler than inventing a second nesting primitive for what both use only a few segments/rows
    at a time.
    """
    rows = [
        [
            segment.effective_from.isoformat(),
            encode_enum(segment.frequency),
            str(segment.interval),
            encode_bool(segment.is_advanced),
            row.selector,
            row.start_time,
            str(row.duration_minutes),
        ]
        for segment in segments
        for row in segment.instance_rows
    ]
    return encode_table(rows)


def decode_segments(raw: str) -> list[BlockTemplateSegment]:
    """Decodes encode_segments's flat table back into grouped BlockTemplateSegments, ordered by
    effective_from ascending.
    """
    rows = decode_table(raw)
    segments_by_key: dict[tuple[str, str, str, str], BlockTemplateSegment] = {}
    for (
        effective_from_raw,
        frequency_raw,
        interval_raw,
        is_advanced_raw,
        selector,
        start_time,
        duration_raw,
    ) in rows:
        key = (effective_from_raw, frequency_raw, interval_raw, is_advanced_raw)
        if key not in segments_by_key:
            segments_by_key[key] = BlockTemplateSegment(
                effective_from=date.fromisoformat(effective_from_raw),
                frequency=decode_enum(frequency_raw, Frequency),
                interval=int(interval_raw),
                is_advanced=decode_bool(is_advanced_raw),
                instance_rows=[],
            )
        segments_by_key[key].instance_rows.append(InstanceRow(selector, start_time, int(duration_raw)))
    return sorted(segments_by_key.values(), key=lambda segment: segment.effective_from)


def build_simple_instance_rows(
    frequency: Frequency, selectors: list[str], start_time: str, duration_minutes: int
) -> list[InstanceRow]:
    """Builds every instance row a "simple mode" edit needs — one row per selected unit, all
    sharing the same start_time/duration_minutes. selectors is the raw list of selected units
    (weekdays for weekly, days-of-month for monthly, "MM-DD" values for yearly); ignored for daily,
    which always gets exactly one DAILY_SELECTOR row.
    """
    if frequency == Frequency.DAILY:
        return [InstanceRow(DAILY_SELECTOR, start_time, duration_minutes)]
    return [InstanceRow(selector, start_time, duration_minutes) for selector in selectors]


# --- --- --- ---
# Internal helpers


def _row_occurs_on(segment: BlockTemplateSegment, row: InstanceRow, target_date: date) -> bool:
    """Checks one instance row's own cadence, by translating its selector into whichever cadence
    field recurrence_engine.occurs_on needs for the segment's frequency."""
    days_of_week: list[int] = []
    day_of_month: int | None = None
    month_of_year: int | None = None
    if segment.frequency == Frequency.WEEKLY:
        days_of_week = [int(row.selector)]
    elif segment.frequency == Frequency.MONTHLY:
        day_of_month = int(row.selector)
    elif segment.frequency == Frequency.YEARLY:
        month_str, day_str = row.selector.split("-")
        month_of_year, day_of_month = int(month_str), int(day_str)

    return recurrence_engine.occurs_on(
        frequency=segment.frequency,
        interval=segment.interval,
        start_date=segment.effective_from,
        end_date=None,
        days_of_week=days_of_week,
        day_of_month=day_of_month,
        month_of_year=month_of_year,
        target_date=target_date,
    )


def _validate_instance_rows(frequency: Frequency, instance_rows: list[InstanceRow]) -> None:
    """Raises ValueError if any row's start_time isn't "HH:MM", duration_minutes is negative, or
    selector doesn't match the shape frequency expects (see InstanceRow's own docstring) — and, for
    daily specifically, if there's more than one row, since daily has no selectable sub-unit.
    """

    if frequency == Frequency.DAILY and len(instance_rows) > 1:
        raise ValueError(f"A daily segment can have at most one instance row, got {len(instance_rows)}.")

    for row in instance_rows:
        try:
            datetime.strptime(row.start_time, START_TIME_FORMAT)
        except ValueError:
            raise ValueError(
                f'An instance row\'s start_time must be "HH:MM", got {row.start_time!r}.'
            ) from None
        if row.duration_minutes < 0:
            raise ValueError(
                f"An instance row's duration_minutes must be >= 0, got {row.duration_minutes!r}."
            )
        _validate_selector(frequency, row.selector)


def _validate_selector(frequency: Frequency, selector: str) -> None:
    """Raises ValueError if selector's format doesn't match what frequency expects."""
    if frequency == Frequency.DAILY:
        if selector != DAILY_SELECTOR:
            raise ValueError(f"A daily instance row's selector must be {DAILY_SELECTOR!r}, got {selector!r}.")
    elif frequency == Frequency.WEEKLY:
        if selector not in {str(weekday) for weekday in range(7)}:
            raise ValueError(f'A weekly instance row\'s selector must be "0".."6", got {selector!r}.')
    elif frequency == Frequency.MONTHLY:
        if not selector.isdigit() or not (1 <= int(selector) <= 31):
            raise ValueError(f'A monthly instance row\'s selector must be "1".."31", got {selector!r}.')
    elif frequency == Frequency.YEARLY:
        parts = selector.split("-")
        if len(parts) != 2 or not all(part.isdigit() for part in parts):
            raise ValueError(f'A yearly instance row\'s selector must be "MM-DD", got {selector!r}.')
        month, day = int(parts[0]), int(parts[1])
        if not (1 <= month <= 12 and 1 <= day <= 31):
            raise ValueError(f'A yearly instance row\'s selector must be "MM-DD", got {selector!r}.')
    else:
        raise ValueError(f"Unrecognized recurrence frequency {frequency!r}.")
