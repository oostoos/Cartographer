# @manualReviewRequested: 2026-07-07
"""The math that turns a cadence (a Frequency plus an interval, an anchor start_date, and whichever
selector fields the frequency uses — days_of_week for weekly, day_of_month/month_of_year for
monthly/yearly) into "does this occur on date D" and "which dates in this range does it occur on."
Uses datetime.date exclusively (never timezone-aware datetimes), which sidesteps DST entirely by
construction — there is no local time-of-day to be ambiguous about.

Takes every input as a primitive value rather than a loaded record, so it has no dependency on any
object module's storage shape — both app/blocks/block_task_template.py's optional per-task cadence
override and app/blocks/block_template_segment.py's block-level occurrence cadence build on this
same math without either duplicating it or creating an import cycle with this module.
"""

import calendar
from datetime import date, timedelta

from app.recurrence.frequency import Frequency


def occurs_on(
    frequency: Frequency,
    interval: int,
    start_date: date,
    end_date: date | None,
    days_of_week: list[int],
    day_of_month: int | None,
    month_of_year: int | None,
    target_date: date,
) -> bool:
    """Decides whether a cadence produces an occurrence on target_date.

    Inputs: frequency, one of the Frequency members; interval, "every N" units of frequency;
        start_date, the cadence's anchor date (interval counting starts here); end_date, optional
        last eligible date; days_of_week, weekday numbers (0=Monday..6=Sunday) a weekly cadence
        occurs on, defaulting to start_date's own weekday when empty; day_of_month/month_of_year,
        the day/month a monthly or yearly cadence occurs on, defaulting to start_date's own
        day/month when None; target_date, the date to check.
    Raises: ValueError if frequency isn't a recognized Frequency member.
    """
    if target_date < start_date:
        return False
    if end_date is not None and target_date > end_date:
        return False

    if frequency == Frequency.DAILY:
        return _occurs_daily(start_date, interval, target_date)
    if frequency == Frequency.WEEKLY:
        return _occurs_weekly(start_date, interval, days_of_week, target_date)
    if frequency == Frequency.MONTHLY:
        return _occurs_monthly(start_date, interval, day_of_month, target_date)
    if frequency == Frequency.YEARLY:
        return _occurs_yearly(start_date, interval, day_of_month, month_of_year, target_date)
    raise ValueError(f"Unrecognized recurrence frequency {frequency!r}.")


def generate_occurrences(
    frequency: Frequency,
    interval: int,
    start_date: date,
    end_date: date | None,
    days_of_week: list[int],
    day_of_month: int | None,
    month_of_year: int | None,
    range_start: date,
    range_end: date,
) -> list[date]:
    """Returns every date in [range_start, range_end] on which a cadence occurs.

    Inputs: same cadence fields as occurs_on; range_start/range_end, an inclusive date range.
    Notes: scans day-by-day rather than computing occurrences in closed form — deliberately
        simple, since every caller in this app only ever asks about a single day or a short
        catch-up window, where the difference is not worth the added complexity.
    """
    occurrences = []
    current_date = range_start
    while current_date <= range_end:
        if occurs_on(
            frequency, interval, start_date, end_date, days_of_week, day_of_month, month_of_year, current_date
        ):
            occurrences.append(current_date)
        current_date += timedelta(days=1)
    return occurrences


def clamp_day_to_month(year: int, month: int, day: int) -> int:
    """Clamps a day-of-month to a valid day in the given year/month, so e.g. day 31 lands on
    the 30th in April or the 28th/29th in February.

    Inputs: year, month (1-12), day (the intended day-of-month, may exceed the month's length).
    """
    last_day_of_month = calendar.monthrange(year, month)[1]
    return min(day, last_day_of_month)


# --- --- --- ---
# Internal helpers, one per frequency


def _occurs_daily(start_date: date, interval: int, target_date: date) -> bool:
    """A daily/every-X-days cadence occurs when the day count since start_date is a multiple of
    interval.
    """
    days_since_start = (target_date - start_date).days
    return days_since_start % interval == 0


def _occurs_weekly(start_date: date, interval: int, days_of_week: list[int], target_date: date) -> bool:
    """A weekly/every-X-weeks cadence occurs on its configured weekdays (defaulting to
    start_date's own weekday when none are configured), on weeks spaced interval apart.
    """
    effective_days_of_week = days_of_week or [start_date.weekday()]
    if target_date.weekday() not in effective_days_of_week:
        return False
    weeks_since_start = (_start_of_week(target_date) - _start_of_week(start_date)).days // 7
    return weeks_since_start % interval == 0


def _occurs_monthly(start_date: date, interval: int, day_of_month: int | None, target_date: date) -> bool:
    """A monthly/every-X-months cadence occurs on its configured day-of-month (defaulting to
    start_date's own day, clamped to each target month's length), on months spaced interval
    apart.
    """
    effective_day_of_month = day_of_month or start_date.day
    effective_day = clamp_day_to_month(target_date.year, target_date.month, effective_day_of_month)
    if target_date.day != effective_day:
        return False
    months_since_start = (target_date.year - start_date.year) * 12 + (target_date.month - start_date.month)
    return months_since_start % interval == 0


def _occurs_yearly(
    start_date: date, interval: int, day_of_month: int | None, month_of_year: int | None, target_date: date
) -> bool:
    """A yearly/every-X-years cadence occurs on its configured month/day (defaulting to
    start_date's own month/day, clamped to the target year's month length — e.g. a Feb 29 rule
    still occurs on Feb 28 in non-leap years), on years spaced interval apart.
    """
    effective_month_of_year = month_of_year or start_date.month
    effective_day_of_month = day_of_month or start_date.day
    effective_day = clamp_day_to_month(target_date.year, effective_month_of_year, effective_day_of_month)
    if target_date.month != effective_month_of_year or target_date.day != effective_day:
        return False
    years_since_start = target_date.year - start_date.year
    return years_since_start % interval == 0


def _start_of_week(value: date) -> date:
    """Returns the Monday that starts the week containing value."""
    return value - timedelta(days=value.weekday())
