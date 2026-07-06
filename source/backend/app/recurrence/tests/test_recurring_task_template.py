# @manualReviewRequested: 2026-07-06
from datetime import date

import pytest

from core.storage.errors import ValidationError
from app.recurrence import recurring_task_template


def test_create_sets_every_field_to_its_given_or_default_value():
    block = recurring_task_template.create(
        "Water the plants",
        recurring_task_template.FREQUENCY_WEEKLY,
        start_date=date(2026, 1, 5),
        description="Check the soil first",
        project_id="project-123",
        tags=["chores"],
        subtask_titles=["Check soil", "Water"],
        interval=2,
        days_of_week=[0, 2],
    )
    assert recurring_task_template.get_title(block=block) == "Water the plants"
    assert recurring_task_template.get_description(block=block) == "Check the soil first"
    assert recurring_task_template.get_project_id(block=block) == "project-123"
    assert recurring_task_template.get_tags(block=block) == ["chores"]
    assert recurring_task_template.get_subtask_titles(block=block) == ["Check soil", "Water"]
    assert recurring_task_template.get_frequency(block=block) == recurring_task_template.FREQUENCY_WEEKLY
    assert recurring_task_template.get_interval(block=block) == 2
    assert recurring_task_template.get_start_date(block=block) == date(2026, 1, 5)
    assert recurring_task_template.get_end_date(block=block) is None
    assert recurring_task_template.get_days_of_week(block=block) == [0, 2]
    assert recurring_task_template.get_day_of_month(block=block) is None
    assert recurring_task_template.get_month_of_year(block=block) is None
    assert recurring_task_template.get_is_active(block=block) is True


def test_create_defaults_interval_to_one():
    block = recurring_task_template.create(
        "Daily habit", recurring_task_template.FREQUENCY_DAILY, start_date=date(2026, 1, 1)
    )
    assert recurring_task_template.get_interval(block=block) == 1


def test_create_rejects_an_unrecognized_frequency():
    with pytest.raises(ValueError):
        recurring_task_template.create("Nope", "fortnightly", start_date=date(2026, 1, 1))


def test_create_rejects_a_title_containing_a_control_character():
    with pytest.raises(ValidationError):
        recurring_task_template.create(
            "tainted\x1etitle", recurring_task_template.FREQUENCY_DAILY, start_date=date(2026, 1, 1)
        )


def test_create_rejects_a_tainted_subtask_title():
    with pytest.raises(ValidationError):
        recurring_task_template.create(
            "Fine title",
            recurring_task_template.FREQUENCY_DAILY,
            start_date=date(2026, 1, 1),
            subtask_titles=["fine", "tainted\x1dtitle"],
        )


def test_list_active_excludes_inactive_templates():
    active = recurring_task_template.create(
        "Active", recurring_task_template.FREQUENCY_DAILY, start_date=date(2026, 1, 1)
    )
    inactive = recurring_task_template.create(
        "Inactive", recurring_task_template.FREQUENCY_DAILY, start_date=date(2026, 1, 1)
    )
    recurring_task_template.set_is_active(False, recurring_task_template.get_id(block=inactive))

    active_ids = [recurring_task_template.get_id(block=t) for t in recurring_task_template.list_active()]
    assert recurring_task_template.get_id(block=active) in active_ids
    assert recurring_task_template.get_id(block=inactive) not in active_ids


def test_set_end_date_round_trips():
    created = recurring_task_template.create(
        "Yearly thing", recurring_task_template.FREQUENCY_YEARLY, start_date=date(2026, 1, 1)
    )
    recurring_task_template.set_end_date(date(2030, 1, 1), block=created)
    assert recurring_task_template.get_end_date(block=created) == date(2030, 1, 1)


def test_set_title_does_not_affect_other_fields():
    created = recurring_task_template.create(
        "Original", recurring_task_template.FREQUENCY_DAILY, start_date=date(2026, 1, 1), project_id="p1"
    )
    recurring_task_template.set_title("Renamed", block=created)
    assert recurring_task_template.get_title(block=created) == "Renamed"
    assert recurring_task_template.get_project_id(block=created) == "p1"


def test_set_subtask_titles_replaces_the_full_list():
    created = recurring_task_template.create(
        "Has subtasks",
        recurring_task_template.FREQUENCY_DAILY,
        start_date=date(2026, 1, 1),
        subtask_titles=["one"],
    )
    recurring_task_template.set_subtask_titles(["two", "three"], block=created)
    assert recurring_task_template.get_subtask_titles(block=created) == ["two", "three"]


def test_set_frequency_round_trips():
    created = recurring_task_template.create(
        "Switch cadence", recurring_task_template.FREQUENCY_DAILY, start_date=date(2026, 1, 1)
    )
    recurring_task_template.set_frequency(recurring_task_template.FREQUENCY_WEEKLY, block=created)
    assert recurring_task_template.get_frequency(block=created) == recurring_task_template.FREQUENCY_WEEKLY


def test_set_frequency_rejects_an_unrecognized_value():
    created = recurring_task_template.create(
        "Switch cadence", recurring_task_template.FREQUENCY_DAILY, start_date=date(2026, 1, 1)
    )
    with pytest.raises(ValueError):
        recurring_task_template.set_frequency("fortnightly", block=created)


def test_set_interval_round_trips():
    created = recurring_task_template.create(
        "Every other day", recurring_task_template.FREQUENCY_DAILY, start_date=date(2026, 1, 1)
    )
    recurring_task_template.set_interval(2, block=created)
    assert recurring_task_template.get_interval(block=created) == 2


def test_set_start_date_round_trips():
    created = recurring_task_template.create(
        "Push it back", recurring_task_template.FREQUENCY_DAILY, start_date=date(2026, 1, 1)
    )
    recurring_task_template.set_start_date(date(2026, 2, 1), block=created)
    assert recurring_task_template.get_start_date(block=created) == date(2026, 2, 1)


def test_set_days_of_week_round_trips():
    created = recurring_task_template.create(
        "Weekly thing", recurring_task_template.FREQUENCY_WEEKLY, start_date=date(2026, 1, 5)
    )
    recurring_task_template.set_days_of_week([1, 3], block=created)
    assert recurring_task_template.get_days_of_week(block=created) == [1, 3]


def test_set_day_of_month_round_trips_and_can_be_cleared():
    created = recurring_task_template.create(
        "Monthly thing", recurring_task_template.FREQUENCY_MONTHLY, start_date=date(2026, 1, 1)
    )
    recurring_task_template.set_day_of_month(15, block=created)
    assert recurring_task_template.get_day_of_month(block=created) == 15
    recurring_task_template.set_day_of_month(None, block=created)
    assert recurring_task_template.get_day_of_month(block=created) is None


def test_set_month_of_year_round_trips_and_can_be_cleared():
    created = recurring_task_template.create(
        "Yearly thing", recurring_task_template.FREQUENCY_YEARLY, start_date=date(2026, 1, 1)
    )
    recurring_task_template.set_month_of_year(6, block=created)
    assert recurring_task_template.get_month_of_year(block=created) == 6
    recurring_task_template.set_month_of_year(None, block=created)
    assert recurring_task_template.get_month_of_year(block=created) is None
