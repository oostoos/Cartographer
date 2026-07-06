# @manualReviewRequested: 2026-07-06
from datetime import date, timedelta

import pytest

from app.recurrence import recurrence_engine, recurring_task_template


def _template(**kwargs):
    kwargs.setdefault("title", "Test template")
    return recurring_task_template.create(**kwargs)


# --- --- --- ---
# Daily / every-X-days


def test_daily_occurs_every_day():
    template = _template(frequency=recurring_task_template.FREQUENCY_DAILY, start_date=date(2026, 1, 1))
    for offset in range(5):
        assert recurrence_engine.occurs_on(template, date(2026, 1, 1 + offset)) is True


def test_daily_does_not_occur_before_start_date():
    template = _template(frequency=recurring_task_template.FREQUENCY_DAILY, start_date=date(2026, 1, 10))
    assert recurrence_engine.occurs_on(template, date(2026, 1, 9)) is False


def test_every_third_day_occurs_only_on_multiples_of_the_interval():
    template = _template(
        frequency=recurring_task_template.FREQUENCY_DAILY, start_date=date(2026, 1, 1), interval=3
    )
    expected = {date(2026, 1, 1), date(2026, 1, 4), date(2026, 1, 7)}
    for day in range(1, 8):
        current = date(2026, 1, day)
        assert recurrence_engine.occurs_on(template, current) == (current in expected)


def test_daily_respects_the_end_date():
    template = _template(
        frequency=recurring_task_template.FREQUENCY_DAILY,
        start_date=date(2026, 1, 1),
        end_date=date(2026, 1, 3),
    )
    assert recurrence_engine.occurs_on(template, date(2026, 1, 3)) is True
    assert recurrence_engine.occurs_on(template, date(2026, 1, 4)) is False


# --- --- --- ---
# Weekly / every-X-weeks


def test_weekly_defaults_to_the_start_dates_own_weekday():
    monday = date(2026, 1, 5)  # a Monday
    template = _template(frequency=recurring_task_template.FREQUENCY_WEEKLY, start_date=monday)
    assert recurrence_engine.occurs_on(template, monday) is True
    assert recurrence_engine.occurs_on(template, monday + timedelta(days=1)) is False
    assert recurrence_engine.occurs_on(template, monday + timedelta(days=7)) is True


def test_weekly_occurs_on_every_configured_weekday():
    monday = date(2026, 1, 5)
    template = _template(
        frequency=recurring_task_template.FREQUENCY_WEEKLY,
        start_date=monday,
        days_of_week=[0, 2],  # Monday and Wednesday
    )
    assert recurrence_engine.occurs_on(template, date(2026, 1, 5)) is True  # Monday
    assert recurrence_engine.occurs_on(template, date(2026, 1, 6)) is False  # Tuesday
    assert recurrence_engine.occurs_on(template, date(2026, 1, 7)) is True  # Wednesday


def test_every_other_week_skips_alternating_weeks():
    monday = date(2026, 1, 5)
    template = _template(
        frequency=recurring_task_template.FREQUENCY_WEEKLY,
        start_date=monday,
        interval=2,
        days_of_week=[0],
    )
    assert recurrence_engine.occurs_on(template, date(2026, 1, 5)) is True  # week 0
    assert recurrence_engine.occurs_on(template, date(2026, 1, 12)) is False  # week 1 — skipped
    assert recurrence_engine.occurs_on(template, date(2026, 1, 19)) is True  # week 2


# --- --- --- ---
# Monthly / every-X-months, including month-end clamping


def test_monthly_defaults_to_the_start_dates_own_day():
    template = _template(frequency=recurring_task_template.FREQUENCY_MONTHLY, start_date=date(2026, 1, 15))
    assert recurrence_engine.occurs_on(template, date(2026, 2, 15)) is True
    assert recurrence_engine.occurs_on(template, date(2026, 2, 14)) is False


def test_every_other_month_skips_alternating_months():
    template = _template(
        frequency=recurring_task_template.FREQUENCY_MONTHLY, start_date=date(2026, 1, 15), interval=2
    )
    assert recurrence_engine.occurs_on(template, date(2026, 2, 15)) is False
    assert recurrence_engine.occurs_on(template, date(2026, 3, 15)) is True


def test_day_31_clamps_to_aprils_last_day():
    template = _template(
        frequency=recurring_task_template.FREQUENCY_MONTHLY, start_date=date(2026, 1, 31), day_of_month=31
    )
    assert recurrence_engine.occurs_on(template, date(2026, 4, 30)) is True
    assert recurrence_engine.occurs_on(template, date(2026, 4, 29)) is False


def test_day_31_clamps_to_februarys_last_day_in_a_non_leap_year():
    template = _template(
        frequency=recurring_task_template.FREQUENCY_MONTHLY, start_date=date(2026, 1, 31), day_of_month=31
    )
    assert recurrence_engine.occurs_on(template, date(2026, 2, 28)) is True  # 2026 is not a leap year


def test_day_31_clamps_to_februarys_last_day_in_a_leap_year():
    template = _template(
        frequency=recurring_task_template.FREQUENCY_MONTHLY, start_date=date(2024, 1, 31), day_of_month=31
    )
    assert recurrence_engine.occurs_on(template, date(2024, 2, 29)) is True  # 2024 is a leap year
    assert recurrence_engine.occurs_on(template, date(2024, 2, 28)) is False


# --- --- --- ---
# Yearly / every-X-years, including leap-day handling


def test_yearly_defaults_to_the_start_dates_own_month_and_day():
    template = _template(frequency=recurring_task_template.FREQUENCY_YEARLY, start_date=date(2026, 12, 25))
    assert recurrence_engine.occurs_on(template, date(2027, 12, 25)) is True
    assert recurrence_engine.occurs_on(template, date(2027, 12, 24)) is False


def test_every_other_year_skips_alternating_years():
    template = _template(
        frequency=recurring_task_template.FREQUENCY_YEARLY, start_date=date(2026, 6, 1), interval=2
    )
    assert recurrence_engine.occurs_on(template, date(2027, 6, 1)) is False
    assert recurrence_engine.occurs_on(template, date(2028, 6, 1)) is True


def test_leap_day_template_clamps_to_february_28_in_non_leap_years():
    template = _template(frequency=recurring_task_template.FREQUENCY_YEARLY, start_date=date(2024, 2, 29))
    assert recurrence_engine.occurs_on(template, date(2025, 2, 28)) is True  # 2025 is not a leap year
    assert recurrence_engine.occurs_on(template, date(2028, 2, 29)) is True  # 2028 is a leap year


# --- --- --- ---
# Cross-cutting


def test_occurs_on_raises_for_an_unrecognized_frequency(monkeypatch):
    template = _template(frequency=recurring_task_template.FREQUENCY_DAILY, start_date=date(2026, 1, 1))
    monkeypatch.setitem(template.fields, recurring_task_template.FIELD_FREQUENCY, "fortnightly")
    with pytest.raises(ValueError):
        recurrence_engine.occurs_on(template, date(2026, 1, 1))


def test_generate_occurrences_returns_every_matching_date_in_range():
    template = _template(
        frequency=recurring_task_template.FREQUENCY_DAILY, start_date=date(2026, 1, 1), interval=2
    )
    occurrences = recurrence_engine.generate_occurrences(template, date(2026, 1, 1), date(2026, 1, 6))
    assert occurrences == [date(2026, 1, 1), date(2026, 1, 3), date(2026, 1, 5)]


def test_generate_occurrences_returns_empty_list_when_range_is_entirely_before_start():
    template = _template(frequency=recurring_task_template.FREQUENCY_DAILY, start_date=date(2026, 6, 1))
    occurrences = recurrence_engine.generate_occurrences(template, date(2026, 1, 1), date(2026, 1, 5))
    assert occurrences == []


def test_clamp_day_to_month_passes_through_a_valid_day():
    assert recurrence_engine.clamp_day_to_month(2026, 1, 15) == 15


def test_clamp_day_to_month_clamps_an_overflowing_day():
    assert recurrence_engine.clamp_day_to_month(2026, 2, 30) == 28
    assert recurrence_engine.clamp_day_to_month(2024, 2, 30) == 29


def test_a_dst_transition_adjacent_range_produces_the_expected_daily_count():
    # datetime.date has no concept of local time-of-day, so a DST transition (which shifts wall
    # clock time, not calendar dates) cannot skip or double-count a date here.
    template = _template(frequency=recurring_task_template.FREQUENCY_DAILY, start_date=date(2026, 3, 1))
    occurrences = recurrence_engine.generate_occurrences(template, date(2026, 3, 1), date(2026, 3, 10))
    assert len(occurrences) == 10
