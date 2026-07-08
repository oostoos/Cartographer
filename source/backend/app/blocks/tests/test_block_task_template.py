# @manualReviewRequested: 2026-07-07
from datetime import date

import pytest

from core.storage.errors import ValidationError
from app.blocks import block_task_template
from app.recurrence.frequency import FREQUENCY_MONTHLY, FREQUENCY_WEEKLY


def test_create_sets_every_field_to_its_given_or_default_value():
    created = block_task_template.create(
        "Take vitamins", block_template_id="template-1", order=2, is_skippable=False, estimated_minutes=1
    )
    assert block_task_template.get_title(block=created) == "Take vitamins"
    assert block_task_template.get_block_template_id(block=created) == "template-1"
    assert block_task_template.get_order(block=created) == 2
    assert block_task_template.get_is_skippable(block=created) is False
    assert block_task_template.get_estimated_minutes(block=created) == 1
    assert block_task_template.get_frequency(block=created) is None
    assert block_task_template.get_start_date(block=created) is None


def test_create_rejects_a_title_containing_a_control_character():
    with pytest.raises(ValidationError):
        block_task_template.create("tainted\x1etitle", block_template_id="t1", order=0)


def test_create_rejects_a_non_positive_estimated_minutes():
    with pytest.raises(ValueError):
        block_task_template.create("Bad estimate", block_template_id="t1", order=0, estimated_minutes=0)


def test_create_rejects_a_frequency_without_a_start_date():
    with pytest.raises(ValueError):
        block_task_template.create(
            "Weekly thing", block_template_id="t1", order=0, frequency=FREQUENCY_WEEKLY
        )


def test_create_accepts_a_cadence_override_with_a_start_date():
    created = block_task_template.create(
        "Change razor blade",
        block_template_id="t1",
        order=0,
        frequency=FREQUENCY_WEEKLY,
        start_date=date(2026, 1, 5),
        days_of_week=[0],
    )
    assert block_task_template.get_frequency(block=created) == FREQUENCY_WEEKLY
    assert block_task_template.get_start_date(block=created) == date(2026, 1, 5)
    assert block_task_template.get_days_of_week(block=created) == [0]


def test_create_rejects_an_unrecognized_frequency():
    with pytest.raises(ValueError):
        block_task_template.create(
            "Nope", block_template_id="t1", order=0, frequency="fortnightly", start_date=date(2026, 1, 1)
        )


def test_find_for_block_template_returns_only_matching_templates_sorted_by_order():
    block_task_template.create("Third", block_template_id="t1", order=2)
    block_task_template.create("First", block_template_id="t1", order=0)
    block_task_template.create("Other block's task", block_template_id="t2", order=0)
    block_task_template.create("Second", block_template_id="t1", order=1)

    titles = [
        block_task_template.get_title(block=t) for t in block_task_template.find_for_block_template("t1")
    ]
    assert titles == ["First", "Second", "Third"]


def test_delete_all_for_block_template_removes_only_that_templates_tasks():
    block_task_template.create("Mine", block_template_id="t1", order=0)
    other = block_task_template.create("Other's", block_template_id="t2", order=0)

    block_task_template.delete_all_for_block_template("t1")

    assert block_task_template.find_for_block_template("t1") == []
    assert block_task_template.find_for_block_template("t2") == [other]


def test_create_accepts_a_monthly_cadence_override():
    created = block_task_template.create(
        "Deep clean shower",
        block_template_id="t1",
        order=0,
        frequency=FREQUENCY_MONTHLY,
        start_date=date(2026, 1, 1),
        day_of_month=1,
    )
    assert block_task_template.get_frequency(block=created) == FREQUENCY_MONTHLY
    assert block_task_template.get_day_of_month(block=created) == 1
