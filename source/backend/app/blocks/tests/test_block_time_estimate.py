# @manualReviewRequested: 2026-07-07
from datetime import date

from app.blocks import block_task_template, block_time_estimate
from app.recurrence.frequency import FREQUENCY_WEEKLY


def test_compute_task_time_range_with_no_task_templates_is_zero_to_zero():
    assert block_time_estimate.compute_task_time_range([]) == (0, 0)


def test_min_minutes_only_counts_tasks_with_no_cadence_override():
    always_included = block_task_template.create(
        "Take vitamins", block_template_id="t1", order=0, estimated_minutes=2
    )
    weekly_only = block_task_template.create(
        "Change razor blade",
        block_template_id="t1",
        order=1,
        estimated_minutes=5,
        frequency=FREQUENCY_WEEKLY,
        start_date=date(2026, 1, 5),
    )
    time_range = block_time_estimate.compute_task_time_range([always_included, weekly_only])
    assert time_range.min_minutes == 2
    assert time_range.max_minutes == 7
