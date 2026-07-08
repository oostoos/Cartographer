# @manualReviewRequested: 2026-07-07
from datetime import date, timedelta

import pytest

from app.recurrence import recurrence_engine
from app.recurrence.frequency import FREQUENCY_DAILY, FREQUENCY_MONTHLY, FREQUENCY_WEEKLY, FREQUENCY_YEARLY


def _occurs_on(target_date, **kwargs):
    kwargs.setdefault("interval", 1)
    kwargs.setdefault("end_date", None)
    kwargs.setdefault("days_of_week", [])
    kwargs.setdefault("day_of_month", None)
    kwargs.setdefault("month_of_year", None)
    return recurrence_engine.occurs_on(target_date=target_date, **kwargs)


# --- --- --- ---
# Daily / every-X-days


def test_daily_occurs_every_day():
    for offset in range(5):
        assert (
            _occurs_on(
                frequency=FREQUENCY_DAILY,
                start_date=date(2026, 1, 1),
                target_date=date(2026, 1, 1 + offset),
            )
            is True
        )


def test_daily_does_not_occur_before_start_date():
    assert (
        _occurs_on(frequency=FREQUENCY_DAILY, start_date=date(2026, 1, 10), target_date=date(2026, 1, 9))
        is False
    )


def test_every_third_day_occurs_only_on_multiples_of_the_interval():
    expected = {date(2026, 1, 1), date(2026, 1, 4), date(2026, 1, 7)}
    for day in range(1, 8):
        current = date(2026, 1, day)
        assert _occurs_on(
            frequency=FREQUENCY_DAILY, start_date=date(2026, 1, 1), interval=3, target_date=current
        ) == (current in expected)


def test_daily_respects_the_end_date():
    kwargs = {"frequency": FREQUENCY_DAILY, "start_date": date(2026, 1, 1), "end_date": date(2026, 1, 3)}
    assert _occurs_on(target_date=date(2026, 1, 3), **kwargs) is True
    assert _occurs_on(target_date=date(2026, 1, 4), **kwargs) is False


# --- --- --- ---
# Weekly / every-X-weeks


def test_weekly_defaults_to_the_start_dates_own_weekday():
    monday = date(2026, 1, 5)  # a Monday
    kwargs = {"frequency": FREQUENCY_WEEKLY, "start_date": monday}
    assert _occurs_on(target_date=monday, **kwargs) is True
    assert _occurs_on(target_date=monday + timedelta(days=1), **kwargs) is False
    assert _occurs_on(target_date=monday + timedelta(days=7), **kwargs) is True


def test_weekly_occurs_on_every_configured_weekday():
    monday = date(2026, 1, 5)
    kwargs = {
        "frequency": FREQUENCY_WEEKLY,
        "start_date": monday,
        "days_of_week": [0, 2],  # Monday and Wednesday
    }
    assert _occurs_on(target_date=date(2026, 1, 5), **kwargs) is True  # Monday
    assert _occurs_on(target_date=date(2026, 1, 6), **kwargs) is False  # Tuesday
    assert _occurs_on(target_date=date(2026, 1, 7), **kwargs) is True  # Wednesday


def test_every_other_week_skips_alternating_weeks():
    monday = date(2026, 1, 5)
    kwargs = {
        "frequency": FREQUENCY_WEEKLY,
        "start_date": monday,
        "interval": 2,
        "days_of_week": [0],
    }
    assert _occurs_on(target_date=date(2026, 1, 5), **kwargs) is True  # week 0
    assert _occurs_on(target_date=date(2026, 1, 12), **kwargs) is False  # week 1 — skipped
    assert _occurs_on(target_date=date(2026, 1, 19), **kwargs) is True  # week 2


# --- --- --- ---
# Monthly / every-X-months, including month-end clamping


def test_monthly_defaults_to_the_start_dates_own_day():
    kwargs = {"frequency": FREQUENCY_MONTHLY, "start_date": date(2026, 1, 15)}
    assert _occurs_on(target_date=date(2026, 2, 15), **kwargs) is True
    assert _occurs_on(target_date=date(2026, 2, 14), **kwargs) is False


def test_every_other_month_skips_alternating_months():
    kwargs = {"frequency": FREQUENCY_MONTHLY, "start_date": date(2026, 1, 15), "interval": 2}
    assert _occurs_on(target_date=date(2026, 2, 15), **kwargs) is False
    assert _occurs_on(target_date=date(2026, 3, 15), **kwargs) is True


def test_day_31_clamps_to_aprils_last_day():
    kwargs = {"frequency": FREQUENCY_MONTHLY, "start_date": date(2026, 1, 31), "day_of_month": 31}
    assert _occurs_on(target_date=date(2026, 4, 30), **kwargs) is True
    assert _occurs_on(target_date=date(2026, 4, 29), **kwargs) is False


def test_day_31_clamps_to_februarys_last_day_in_a_non_leap_year():
    kwargs = {"frequency": FREQUENCY_MONTHLY, "start_date": date(2026, 1, 31), "day_of_month": 31}
    assert _occurs_on(target_date=date(2026, 2, 28), **kwargs) is True  # 2026 is not a leap year


def test_day_31_clamps_to_februarys_last_day_in_a_leap_year():
    kwargs = {"frequency": FREQUENCY_MONTHLY, "start_date": date(2024, 1, 31), "day_of_month": 31}
    assert _occurs_on(target_date=date(2024, 2, 29), **kwargs) is True  # 2024 is a leap year
    assert _occurs_on(target_date=date(2024, 2, 28), **kwargs) is False


# --- --- --- ---
# Yearly / every-X-years, including leap-day handling


def test_yearly_defaults_to_the_start_dates_own_month_and_day():
    kwargs = {"frequency": FREQUENCY_YEARLY, "start_date": date(2026, 12, 25)}
    assert _occurs_on(target_date=date(2027, 12, 25), **kwargs) is True
    assert _occurs_on(target_date=date(2027, 12, 24), **kwargs) is False


def test_every_other_year_skips_alternating_years():
    kwargs = {"frequency": FREQUENCY_YEARLY, "start_date": date(2026, 6, 1), "interval": 2}
    assert _occurs_on(target_date=date(2027, 6, 1), **kwargs) is False
    assert _occurs_on(target_date=date(2028, 6, 1), **kwargs) is True


def test_leap_day_template_clamps_to_february_28_in_non_leap_years():
    kwargs = {"frequency": FREQUENCY_YEARLY, "start_date": date(2024, 2, 29)}
    assert _occurs_on(target_date=date(2025, 2, 28), **kwargs) is True  # 2025 is not a leap year
    assert _occurs_on(target_date=date(2028, 2, 29), **kwargs) is True  # 2028 is a leap year


# --- --- --- ---
# Cross-cutting


def test_occurs_on_raises_for_an_unrecognized_frequency():
    with pytest.raises(ValueError):
        _occurs_on(frequency=99, start_date=date(2026, 1, 1), target_date=date(2026, 1, 1))


def test_generate_occurrences_returns_every_matching_date_in_range():
    occurrences = recurrence_engine.generate_occurrences(
        frequency=FREQUENCY_DAILY,
        interval=2,
        start_date=date(2026, 1, 1),
        end_date=None,
        days_of_week=[],
        day_of_month=None,
        month_of_year=None,
        range_start=date(2026, 1, 1),
        range_end=date(2026, 1, 6),
    )
    assert occurrences == [date(2026, 1, 1), date(2026, 1, 3), date(2026, 1, 5)]


def test_generate_occurrences_returns_empty_list_when_range_is_entirely_before_start():
    occurrences = recurrence_engine.generate_occurrences(
        frequency=FREQUENCY_DAILY,
        interval=1,
        start_date=date(2026, 6, 1),
        end_date=None,
        days_of_week=[],
        day_of_month=None,
        month_of_year=None,
        range_start=date(2026, 1, 1),
        range_end=date(2026, 1, 5),
    )
    assert occurrences == []


def test_clamp_day_to_month_passes_through_a_valid_day():
    assert recurrence_engine.clamp_day_to_month(2026, 1, 15) == 15


def test_clamp_day_to_month_clamps_an_overflowing_day():
    assert recurrence_engine.clamp_day_to_month(2026, 2, 30) == 28
    assert recurrence_engine.clamp_day_to_month(2024, 2, 30) == 29


def test_a_dst_transition_adjacent_range_produces_the_expected_daily_count():
    # datetime.date has no concept of local time-of-day, so a DST transition (which shifts wall
    # clock time, not calendar dates) cannot skip or double-count a date here.
    occurrences = recurrence_engine.generate_occurrences(
        frequency=FREQUENCY_DAILY,
        interval=1,
        start_date=date(2026, 3, 1),
        end_date=None,
        days_of_week=[],
        day_of_month=None,
        month_of_year=None,
        range_start=date(2026, 3, 1),
        range_end=date(2026, 3, 10),
    )
    assert len(occurrences) == 10
