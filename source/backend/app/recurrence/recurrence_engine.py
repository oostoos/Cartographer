"""The math that turns a RecurringTaskTemplate's cadence fields into "does this occur on date D"
and "which dates in this range does it occur on." Uses datetime.date exclusively (never
timezone-aware datetimes), which sidesteps DST entirely by construction — there is no local
time-of-day to be ambiguous about.
"""

import calendar
from datetime import date, timedelta

from app.recurrence import recurring_task_template
from core.storage.record_block import RecordBlock


def occurs_on(template: RecordBlock, target_date: date) -> bool:
    """Decides whether a recurring task template produces an occurrence on target_date.

    Inputs: template, a loaded RecurringTaskTemplate block; target_date, the date to check.
    Raises: ValueError if the template's frequency is not one of
        recurring_task_template.VALID_FREQUENCIES.
    """
    start_date = recurring_task_template.get_start_date(block=template)
    if target_date < start_date:
        return False

    end_date = recurring_task_template.get_end_date(block=template)
    if end_date is not None and target_date > end_date:
        return False

    frequency = recurring_task_template.get_frequency(block=template)
    interval = recurring_task_template.get_interval(block=template)

    if frequency == recurring_task_template.FREQUENCY_DAILY:
        return _occurs_daily(start_date, interval, target_date)
    if frequency == recurring_task_template.FREQUENCY_WEEKLY:
        return _occurs_weekly(template, start_date, interval, target_date)
    if frequency == recurring_task_template.FREQUENCY_MONTHLY:
        return _occurs_monthly(template, start_date, interval, target_date)
    if frequency == recurring_task_template.FREQUENCY_YEARLY:
        return _occurs_yearly(template, start_date, interval, target_date)
    raise ValueError(f"Unrecognized recurrence frequency {frequency!r}.")


def generate_occurrences(template: RecordBlock, range_start: date, range_end: date) -> list[date]:
    """Returns every date in [range_start, range_end] on which a template occurs.

    Inputs: template, a loaded RecurringTaskTemplate block; range_start/range_end, an inclusive
        date range.
    Notes: scans day-by-day rather than computing occurrences in closed form — deliberately
        simple, since every caller in this app only ever asks about a single day or a short
        catch-up window, where the difference is not worth the added complexity.
    """
    occurrences = []
    current_date = range_start
    while current_date <= range_end:
        if occurs_on(template, current_date):
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
    """A daily/every-X-days template occurs when the day count since start_date is a multiple of
    interval.
    """
    days_since_start = (target_date - start_date).days
    return days_since_start % interval == 0


def _occurs_weekly(template: RecordBlock, start_date: date, interval: int, target_date: date) -> bool:
    """A weekly/every-X-weeks template occurs on its configured weekdays (defaulting to
    start_date's own weekday when none are configured), on weeks spaced interval apart.
    """
    days_of_week = recurring_task_template.get_days_of_week(block=template) or [start_date.weekday()]
    if target_date.weekday() not in days_of_week:
        return False
    weeks_since_start = (_start_of_week(target_date) - _start_of_week(start_date)).days // 7
    return weeks_since_start % interval == 0


def _occurs_monthly(template: RecordBlock, start_date: date, interval: int, target_date: date) -> bool:
    """A monthly/every-X-months template occurs on its configured day-of-month (defaulting to
    start_date's own day, clamped to each target month's length), on months spaced interval
    apart.
    """
    day_of_month = recurring_task_template.get_day_of_month(block=template) or start_date.day
    effective_day = clamp_day_to_month(target_date.year, target_date.month, day_of_month)
    if target_date.day != effective_day:
        return False
    months_since_start = (target_date.year - start_date.year) * 12 + (target_date.month - start_date.month)
    return months_since_start % interval == 0


def _occurs_yearly(template: RecordBlock, start_date: date, interval: int, target_date: date) -> bool:
    """A yearly/every-X-years template occurs on its configured month/day (defaulting to
    start_date's own month/day, clamped to the target year's month length — e.g. a Feb 29 rule
    still occurs on Feb 28 in non-leap years), on years spaced interval apart.
    """
    month_of_year = recurring_task_template.get_month_of_year(block=template) or start_date.month
    day_of_month = recurring_task_template.get_day_of_month(block=template) or start_date.day
    effective_day = clamp_day_to_month(target_date.year, month_of_year, day_of_month)
    if target_date.month != month_of_year or target_date.day != effective_day:
        return False
    years_since_start = target_date.year - start_date.year
    return years_since_start % interval == 0


def _start_of_week(value: date) -> date:
    """Returns the Monday that starts the week containing value."""
    return value - timedelta(days=value.weekday())
