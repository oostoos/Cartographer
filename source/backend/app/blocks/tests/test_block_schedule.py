# @manualReviewRequested: 2026-07-07
from datetime import date

from app.blocks import block_schedule, block_template
from app.blocks.block_template_segment import BlockTemplateSegment, InstanceRow
from app.recurrence.frequency import Frequency

_WEEKDAYS_ONLY = BlockTemplateSegment(
    effective_from=date(2000, 1, 1),
    frequency=Frequency.WEEKLY,
    interval=1,
    is_advanced=True,
    instance_rows=[InstanceRow(str(weekday), "06:00", 90) for weekday in range(5)],
)


def test_occurs_on_a_weekday_that_is_active():
    template = block_template.create("Morning Training", segments=[_WEEKDAYS_ONLY])
    monday = date(2026, 7, 6)  # a Monday
    assert block_schedule.occurs_on(template, monday) is True


def test_does_not_occur_on_a_weekday_that_is_inactive():
    template = block_template.create("Morning Training", segments=[_WEEKDAYS_ONLY])
    saturday = date(2026, 7, 4)  # a Saturday
    assert block_schedule.occurs_on(template, saturday) is False


def test_does_not_occur_before_the_series_start_date():
    template = block_template.create("Seasonal block", segments=[_WEEKDAYS_ONLY], start_date=date(2026, 8, 1))
    monday_in_july = date(2026, 7, 6)
    assert block_schedule.occurs_on(template, monday_in_july) is False


def test_does_not_occur_after_the_series_end_date():
    template = block_template.create("Seasonal block", segments=[_WEEKDAYS_ONLY], end_date=date(2026, 7, 1))
    later_monday = date(2026, 7, 6)
    assert block_schedule.occurs_on(template, later_monday) is False


def test_a_different_shape_on_weekends_is_respected():
    weekend_shape = BlockTemplateSegment(
        effective_from=date(2000, 1, 1),
        frequency=Frequency.WEEKLY,
        interval=1,
        is_advanced=True,
        instance_rows=[InstanceRow(str(weekday), "08:00", 120) for weekday in range(5, 7)],
    )
    template = block_template.create("Weekend-only block", segments=[weekend_shape])
    saturday = date(2026, 7, 4)
    monday = date(2026, 7, 6)
    assert block_schedule.occurs_on(template, saturday) is True
    assert block_schedule.occurs_on(template, monday) is False


def test_does_not_occur_when_no_segment_governs_the_date():
    template = block_template.create("Not yet configured", segments=[_WEEKDAYS_ONLY])
    assert block_template.get_segments(block=template)[0].effective_from == date(
        2000, 1, 1
    )  # sanity: this template does have a segment...
    before_any_segment = date(1999, 1, 4)  # ...but this date is still before it takes effect
    assert block_schedule.occurs_on(template, before_any_segment) is False


def test_daily_frequency_occurs_every_day():
    daily_shape = BlockTemplateSegment(
        effective_from=date(2026, 1, 1),
        frequency=Frequency.DAILY,
        interval=1,
        is_advanced=False,
        instance_rows=[InstanceRow("daily", "09:00", 15)],
    )
    template = block_template.create("Daily habit", segments=[daily_shape])
    assert block_schedule.occurs_on(template, date(2026, 1, 5)) is True
    assert block_schedule.occurs_on(template, date(2025, 12, 31)) is False


def test_every_other_week_interval_is_respected():
    biweekly_shape = BlockTemplateSegment(
        effective_from=date(2026, 1, 5),  # a Monday
        frequency=Frequency.WEEKLY,
        interval=2,
        is_advanced=False,
        instance_rows=[InstanceRow("0", "07:00", 30)],
    )
    template = block_template.create("Every other Monday", segments=[biweekly_shape])
    assert block_schedule.occurs_on(template, date(2026, 1, 5)) is True  # week 0
    assert block_schedule.occurs_on(template, date(2026, 1, 12)) is False  # week 1, skipped
    assert block_schedule.occurs_on(template, date(2026, 1, 19)) is True  # week 2


def test_monthly_frequency_with_multiple_selected_days_advanced_mode():
    monthly_shape = BlockTemplateSegment(
        effective_from=date(2026, 1, 1),
        frequency=Frequency.MONTHLY,
        interval=1,
        is_advanced=True,
        instance_rows=[InstanceRow("1", "06:00", 20), InstanceRow("15", "18:00", 45)],
    )
    template = block_template.create("Twice a month", segments=[monthly_shape])
    assert block_schedule.shape_for_date(template, date(2026, 2, 1)).start_time == "06:00"
    assert block_schedule.shape_for_date(template, date(2026, 2, 15)).start_time == "18:00"
    assert block_schedule.occurs_on(template, date(2026, 2, 10)) is False


def test_yearly_frequency_with_multiple_selected_month_days_advanced_mode():
    yearly_shape = BlockTemplateSegment(
        effective_from=date(2020, 1, 1),
        frequency=Frequency.YEARLY,
        interval=1,
        is_advanced=True,
        instance_rows=[InstanceRow("03-15", "10:00", 30), InstanceRow("11-01", "10:00", 30)],
    )
    template = block_template.create("Twice a year", segments=[yearly_shape])
    assert block_schedule.occurs_on(template, date(2026, 3, 15)) is True
    assert block_schedule.occurs_on(template, date(2026, 11, 1)) is True
    assert block_schedule.occurs_on(template, date(2026, 6, 1)) is False


def test_effective_dated_segments_leave_past_dates_on_the_old_shape():
    old_shape = BlockTemplateSegment(
        date(2026, 1, 1), Frequency.WEEKLY, 1, False, [InstanceRow("0", "07:00", 30)]
    )
    new_shape = BlockTemplateSegment(
        date(2026, 3, 1), Frequency.DAILY, 1, False, [InstanceRow("daily", "09:00", 15)]
    )
    template = block_template.create("Changed shape", segments=[old_shape, new_shape])
    # Before the new segment's effective date, the old weekly Monday-only shape still governs.
    assert block_schedule.occurs_on(template, date(2026, 2, 2)) is True  # a Monday
    assert block_schedule.occurs_on(template, date(2026, 2, 3)) is False  # a Tuesday
    # From the new segment's effective date onward, it occurs daily instead.
    assert block_schedule.occurs_on(template, date(2026, 3, 2)) is True
    assert block_schedule.occurs_on(template, date(2026, 3, 3)) is True
