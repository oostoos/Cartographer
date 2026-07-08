# @manualReviewRequested: 2026-07-07
from datetime import date

import pytest

from app.blocks import block, block_task_template, block_template
from app.blocks.block_template_segment import BlockTemplateSegment, InstanceRow
from app.journals import today_engine
from app.recurrence.frequency import FREQUENCY_MONTHLY, FREQUENCY_WEEKLY, Frequency
from app.tasks import task


def _set_today(monkeypatch, fake_today):
    monkeypatch.setattr("core.utils.clock.today", lambda: fake_today)


def _all_days_active(start_time="07:00", duration_minutes=30):
    return BlockTemplateSegment(
        effective_from=date(2000, 1, 1),
        frequency=Frequency.WEEKLY,
        interval=1,
        is_advanced=True,
        instance_rows=[InstanceRow(str(weekday), start_time, duration_minutes) for weekday in range(7)],
    )


def _weekdays_only(start_time="07:00", duration_minutes=30):
    return BlockTemplateSegment(
        effective_from=date(2000, 1, 1),
        frequency=Frequency.WEEKLY,
        interval=1,
        is_advanced=True,
        instance_rows=[InstanceRow(str(weekday), start_time, duration_minutes) for weekday in range(5)],
    )


def test_ensure_todays_blocks_exist_creates_an_instance_for_a_template_due_today(monkeypatch):
    _set_today(monkeypatch, date(2026, 7, 6))  # a Monday
    template = block_template.create(
        "Morning Routine",
        description="Wake up right",
        tags=["self-care"],
        segments=[_all_days_active()],
    )
    today_engine.ensure_todays_blocks_exist()

    instances = block.find(template_id=block_template.get_id(block=template))
    assert len(instances) == 1
    instance = instances[0]
    assert block.get_title(block=instance) == "Morning Routine"
    assert block.get_description(block=instance) == "Wake up right"
    assert block.get_tags(block=instance) == ["self-care"]
    assert block.get_start_time(block=instance) == "07:00"
    assert block.get_duration_minutes(block=instance) == 30
    assert block.get_date(block=instance) == date(2026, 7, 6)
    assert block.get_is_template_synced(block=instance) is True


def test_ensure_todays_blocks_exist_generates_tasks_for_every_always_included_task_template(monkeypatch):
    _set_today(monkeypatch, date(2026, 7, 6))
    template = block_template.create("Morning Routine", segments=[_all_days_active()])
    template_id = block_template.get_id(block=template)
    block_task_template.create("Stretch", block_template_id=template_id, order=0, estimated_minutes=5)
    block_task_template.create("Hydrate", block_template_id=template_id, order=1, estimated_minutes=1)

    today_engine.ensure_todays_blocks_exist()

    instance = block.find_one(template_id=template_id)
    nested = task.find(block_id=block.get_id(block=instance))
    titles = sorted(task.get_title(block=t) for t in nested)
    assert titles == ["Hydrate", "Stretch"]
    assert all(task.get_is_skippable(block=t) is True for t in nested)


def test_ensure_todays_blocks_exist_only_includes_task_templates_due_today(monkeypatch):
    _set_today(monkeypatch, date(2026, 1, 5))  # a Monday
    template = block_template.create("Morning Routine", segments=[_all_days_active()])
    template_id = block_template.get_id(block=template)
    block_task_template.create("Every time", block_template_id=template_id, order=0)
    block_task_template.create(
        "Weekly on Wednesdays",
        block_template_id=template_id,
        order=1,
        frequency=FREQUENCY_WEEKLY,
        start_date=date(2026, 1, 1),
        days_of_week=[2],
    )

    today_engine.ensure_todays_blocks_exist()

    instance = block.find_one(template_id=template_id)
    titles = {task.get_title(block=t) for t in task.find(block_id=block.get_id(block=instance))}
    assert titles == {"Every time"}  # Monday isn't Wednesday, so the weekly one is skipped


def test_ensure_todays_blocks_exist_is_idempotent_within_the_same_day(monkeypatch):
    _set_today(monkeypatch, date(2026, 7, 6))
    template = block_template.create("Daily block", segments=[_all_days_active()])
    today_engine.ensure_todays_blocks_exist()
    today_engine.ensure_todays_blocks_exist()

    instances = block.find(template_id=block_template.get_id(block=template))
    assert len(instances) == 1


def test_ensure_todays_blocks_exist_skips_a_template_not_due_today(monkeypatch):
    _set_today(monkeypatch, date(2026, 7, 4))  # a Saturday
    weekday_only = block_template.create("Weekday block", segments=[_weekdays_only()])
    today_engine.ensure_todays_blocks_exist()

    assert block.find(template_id=block_template.get_id(block=weekday_only)) == []


def test_ensure_todays_blocks_exist_skips_an_inactive_template(monkeypatch):
    _set_today(monkeypatch, date(2026, 7, 6))
    template = block_template.create("Daily block", segments=[_all_days_active()])
    block_template.set_is_active(False, block_template.get_id(block=template))
    today_engine.ensure_todays_blocks_exist()

    assert block.find(template_id=block_template.get_id(block=template)) == []


def test_ensure_todays_blocks_exist_uses_a_different_shape_on_weekends(monkeypatch):
    segment = BlockTemplateSegment(
        effective_from=date(2000, 1, 1),
        frequency=Frequency.WEEKLY,
        interval=1,
        is_advanced=True,
        instance_rows=[
            InstanceRow(str(weekday), "06:00" if weekday < 5 else "08:00", 90) for weekday in range(7)
        ],
    )
    template = block_template.create("Training", segments=[segment])

    _set_today(monkeypatch, date(2026, 7, 6))  # Monday
    today_engine.ensure_todays_blocks_exist()
    monday_instance = block.find_one(template_id=block_template.get_id(block=template))
    assert block.get_start_time(block=monday_instance) == "06:00"

    _set_today(monkeypatch, date(2026, 7, 4))  # Saturday
    today_engine.ensure_todays_blocks_exist()
    saturday_instance = block.find_one(template_id=block_template.get_id(block=template), date="2026-07-04")
    assert block.get_start_time(block=saturday_instance) == "08:00"


def test_get_todays_view_buckets_a_block_under_blocks(monkeypatch):
    _set_today(monkeypatch, date(2026, 7, 6))
    block_template.create("Morning Routine", segments=[_all_days_active()])
    view = today_engine.get_todays_view()
    assert [block.get_title(block=b["block"]) for b in view["blocks"]] == ["Morning Routine"]
    assert view["due"] == []
    assert view["backburner"] == []


def test_get_todays_view_computes_scheduled_minutes_from_nested_tasks(monkeypatch):
    _set_today(monkeypatch, date(2026, 7, 6))
    template = block_template.create("Morning Routine", segments=[_all_days_active()])
    template_id = block_template.get_id(block=template)
    block_task_template.create("A", block_template_id=template_id, order=0, estimated_minutes=5)
    block_task_template.create("B", block_template_id=template_id, order=1, estimated_minutes=10)

    view = today_engine.get_todays_view()
    assert view["blocks"][0]["scheduled_minutes"] == 15


def test_get_todays_view_buckets_a_task_due_today_under_due(monkeypatch):
    _set_today(monkeypatch, date(2026, 7, 4))
    task.create("Pay rent", due_date=date(2026, 7, 4))
    view = today_engine.get_todays_view()
    assert [task.get_title(block=t) for t in view["due"]] == ["Pay rent"]


def test_get_todays_view_buckets_an_overdue_task_under_due(monkeypatch):
    _set_today(monkeypatch, date(2026, 7, 4))
    task.create("Overdue bill", due_date=date(2026, 7, 1))
    view = today_engine.get_todays_view()
    assert [task.get_title(block=t) for t in view["due"]] == ["Overdue bill"]


def test_get_todays_view_excludes_a_task_due_in_the_future(monkeypatch):
    _set_today(monkeypatch, date(2026, 7, 4))
    task.create("Not yet", due_date=date(2026, 7, 10))
    view = today_engine.get_todays_view()
    assert view["due"] == []
    assert view["backburner"] == []


def test_get_todays_view_buckets_a_task_with_no_due_date_under_backburner(monkeypatch):
    _set_today(monkeypatch, date(2026, 7, 4))
    task.create("Someday maybe")
    view = today_engine.get_todays_view()
    assert [task.get_title(block=t) for t in view["backburner"]] == ["Someday maybe"]


def test_get_todays_view_excludes_a_completed_ad_hoc_task(monkeypatch):
    _set_today(monkeypatch, date(2026, 7, 4))
    created = task.create("Already done", due_date=date(2026, 7, 1))
    task.set_is_complete(True, task.get_id(block=created))
    view = today_engine.get_todays_view()
    assert view["due"] == []


def test_get_todays_view_excludes_subtasks_from_every_bucket(monkeypatch):
    _set_today(monkeypatch, date(2026, 7, 4))
    parent = task.create("Parent task", due_date=date(2026, 7, 4))
    task.create("A subtask", parent_task_id=task.get_id(block=parent))
    view = today_engine.get_todays_view()
    assert [task.get_title(block=t) for t in view["due"]] == ["Parent task"]
    assert view["backburner"] == []


def test_get_todays_view_excludes_block_nested_tasks_from_due_and_backburner(monkeypatch):
    _set_today(monkeypatch, date(2026, 7, 6))
    template = block_template.create("Morning Routine", segments=[_all_days_active()])
    block_task_template.create(
        "Brush teeth", block_template_id=block_template.get_id(block=template), order=0
    )
    view = today_engine.get_todays_view()
    assert view["due"] == []
    assert view["backburner"] == []


def test_get_todays_view_excludes_archived_tasks(monkeypatch):
    _set_today(monkeypatch, date(2026, 7, 4))
    created = task.create("Archived one")
    task.set_is_archived(True, task.get_id(block=created))
    view = today_engine.get_todays_view()
    assert view["backburner"] == []


def test_get_todays_view_does_not_carry_forward_a_missed_block(monkeypatch):
    _set_today(monkeypatch, date(2026, 7, 6))
    block_template.create("Daily block", segments=[_all_days_active()])
    today_engine.get_todays_view()  # generates + leaves incomplete for 7/6

    _set_today(monkeypatch, date(2026, 7, 7))
    view = today_engine.get_todays_view()
    assert len(view["blocks"]) == 1  # today's fresh instance only
    assert view["due"] == []  # yesterday's miss is not nagging as overdue


def test_get_block_completion_calendar_reports_every_date_in_range_even_with_no_data():
    counts = today_engine.get_block_completion_calendar(date(2026, 7, 1), date(2026, 7, 3))
    assert counts == {
        "2026-07-01": {"completed": 0, "total": 0},
        "2026-07-02": {"completed": 0, "total": 0},
        "2026-07-03": {"completed": 0, "total": 0},
    }


def test_get_block_completion_calendar_counts_completed_and_total_block_nested_tasks():
    done = task.create("Brush teeth", block_id="block-1", due_date=date(2026, 7, 1))
    task.set_is_complete(True, task.get_id(block=done))
    task.create("Shower", block_id="block-1", due_date=date(2026, 7, 1))

    counts = today_engine.get_block_completion_calendar(date(2026, 7, 1), date(2026, 7, 1))
    assert counts["2026-07-01"] == {"completed": 1, "total": 2}


def test_get_block_completion_calendar_does_not_count_a_skipped_task_as_completed():
    skipped = task.create("Brush teeth", block_id="block-1", due_date=date(2026, 7, 1))
    task.set_is_skipped(True, task.get_id(block=skipped))

    counts = today_engine.get_block_completion_calendar(date(2026, 7, 1), date(2026, 7, 1))
    assert counts["2026-07-01"] == {"completed": 0, "total": 1}


def test_get_block_completion_calendar_excludes_ad_hoc_tasks():
    task.create("One-off errand", due_date=date(2026, 7, 1))
    counts = today_engine.get_block_completion_calendar(date(2026, 7, 1), date(2026, 7, 1))
    assert counts["2026-07-01"] == {"completed": 0, "total": 0}


def test_get_block_completion_calendar_rejects_an_end_date_before_the_start_date():
    with pytest.raises(ValueError):
        today_engine.get_block_completion_calendar(date(2026, 7, 5), date(2026, 7, 1))


def test_sync_future_blocks_with_template_is_a_noop_when_no_instance_generated_yet(monkeypatch):
    _set_today(monkeypatch, date(2026, 7, 6))
    template = block_template.create("Daily block", segments=[_all_days_active()])
    template_id = block_template.get_id(block=template)
    today_engine.sync_future_blocks_with_template(template_id)  # no instance yet — must not raise
    assert block.find(template_id=template_id) == []


def test_sync_future_blocks_with_template_updates_mirrored_fields_on_todays_instance(monkeypatch):
    _set_today(monkeypatch, date(2026, 7, 6))
    template = block_template.create(
        "Old title",
        description="Old description",
        tags=["old"],
        segments=[_all_days_active(start_time="06:00", duration_minutes=30)],
    )
    today_engine.ensure_todays_blocks_exist()
    template_id = block_template.get_id(block=template)

    block_template.set_title("New title", block_template_id=template_id)
    block_template.set_description("New description", block_template_id=template_id)
    block_template.set_tags(["new"], block_template_id=template_id)
    block_template.upsert_shape_effective_today(
        date(2026, 7, 6),
        Frequency.WEEKLY,
        1,
        True,
        [InstanceRow(str(weekday), "09:00", 60) for weekday in range(7)],
        block_template_id=template_id,
    )

    today_engine.sync_future_blocks_with_template(template_id)

    instance = block.find_one(template_id=template_id)
    assert block.get_title(block=instance) == "New title"
    assert block.get_description(block=instance) == "New description"
    assert block.get_tags(block=instance) == ["new"]
    assert block.get_start_time(block=instance) == "09:00"
    assert block.get_duration_minutes(block=instance) == 60


def test_sync_future_blocks_with_template_does_not_touch_completion_state(monkeypatch):
    _set_today(monkeypatch, date(2026, 7, 6))
    template = block_template.create("Daily block", segments=[_all_days_active()])
    template_id = block_template.get_id(block=template)
    block_task_template.create("Brush teeth", block_template_id=template_id, order=0)
    today_engine.ensure_todays_blocks_exist()
    instance = block.find_one(template_id=template_id)
    nested_task = task.find(block_id=block.get_id(block=instance))[0]
    task.set_is_complete(True, task.get_id(block=nested_task))

    block_template.set_title("Renamed", block_template_id=template_id)
    today_engine.sync_future_blocks_with_template(template_id)

    refreshed = task.load(task.get_id(block=nested_task))
    assert task.get_is_complete(block=refreshed) is True


def test_sync_future_blocks_with_template_only_adds_missing_tasks(monkeypatch):
    _set_today(monkeypatch, date(2026, 7, 6))
    template = block_template.create("Morning Routine", segments=[_all_days_active()])
    template_id = block_template.get_id(block=template)
    block_task_template.create("Stretch", block_template_id=template_id, order=0)
    block_task_template.create("Hydrate", block_template_id=template_id, order=1)
    today_engine.ensure_todays_blocks_exist()
    instance = block.find_one(template_id=template_id)
    nested = task.find(block_id=block.get_id(block=instance))
    stretch = next(t for t in nested if task.get_title(block=t) == "Stretch")
    task.set_is_complete(True, task.get_id(block=stretch))

    block_task_template.delete_all_for_block_template(template_id)
    block_task_template.create("Hydrate", block_template_id=template_id, order=0)
    block_task_template.create("Meditate", block_template_id=template_id, order=1)
    today_engine.sync_future_blocks_with_template(template_id)

    refreshed = task.find(block_id=block.get_id(block=instance))
    titles = sorted(task.get_title(block=t) for t in refreshed)
    assert titles == ["Hydrate", "Meditate", "Stretch"]  # Stretch kept even though template dropped it
    refreshed_stretch = task.load(task.get_id(block=stretch))
    assert task.get_is_complete(block=refreshed_stretch) is True  # its progress survived


def test_sync_future_blocks_with_template_does_not_overwrite_an_overridden_instance(monkeypatch):
    _set_today(monkeypatch, date(2026, 7, 6))
    template = block_template.create("Daily block", segments=[_all_days_active()])
    template_id = block_template.get_id(block=template)
    today_engine.ensure_todays_blocks_exist()
    instance = block.find_one(template_id=template_id)
    block.set_title("User's own title", block=instance)
    block.set_is_template_synced(False, block=instance)
    block.save(instance)

    block_template.set_title("Template renamed", block_template_id=template_id)
    today_engine.sync_future_blocks_with_template(template_id)

    refreshed = block.load(block.get_id(block=instance))
    assert block.get_title(block=refreshed) == "User's own title"


def test_sync_future_blocks_with_template_updates_an_already_materialized_future_instance(monkeypatch):
    _set_today(monkeypatch, date(2026, 7, 6))
    template = block_template.create("Daily block", segments=[_all_days_active()])
    template_id = block_template.get_id(block=template)
    future_instance = today_engine.materialize_occurrence(template_id, date(2026, 7, 10))
    assert block.get_is_template_synced(block=future_instance) is True  # ordinary materialization

    block_template.set_title("Renamed", block_template_id=template_id)
    today_engine.sync_future_blocks_with_template(template_id)

    refreshed = block.load(block.get_id(block=future_instance))
    assert block.get_title(block=refreshed) == "Renamed"


def test_sync_future_blocks_with_template_leaves_a_past_instance_untouched(monkeypatch):
    _set_today(monkeypatch, date(2026, 7, 4))
    template = block_template.create("Daily block", segments=[_all_days_active()])
    template_id = block_template.get_id(block=template)
    today_engine.ensure_todays_blocks_exist()
    past_instance = block.find_one(template_id=template_id, date="2026-07-04")

    _set_today(monkeypatch, date(2026, 7, 6))
    block_template.set_title("Renamed", block_template_id=template_id)
    today_engine.sync_future_blocks_with_template(template_id)

    refreshed = block.load(block.get_id(block=past_instance))
    assert block.get_title(block=refreshed) == "Daily block"  # unchanged — it's history now


def test_sync_future_blocks_with_template_only_skips_overridden_future_instances(monkeypatch):
    _set_today(monkeypatch, date(2026, 7, 6))
    template = block_template.create("Daily block", segments=[_all_days_active()])
    template_id = block_template.get_id(block=template)
    today_engine.ensure_todays_blocks_exist()
    todays_instance = block.find_one(template_id=template_id, date="2026-07-06")
    overridden_future = today_engine.materialize_occurrence(template_id, date(2026, 7, 8))
    block.set_title("User's own title", block=overridden_future)
    block.set_is_template_synced(False, block=overridden_future)
    block.save(overridden_future)
    synced_future = today_engine.materialize_occurrence(template_id, date(2026, 7, 9))

    block_template.set_title("Renamed", block_template_id=template_id)
    today_engine.sync_future_blocks_with_template(template_id)

    assert block.get_title(block=block.load(block.get_id(block=todays_instance))) == "Renamed"
    assert block.get_title(block=block.load(block.get_id(block=synced_future))) == "Renamed"
    assert block.get_title(block=block.load(block.get_id(block=overridden_future))) == "User's own title"


def test_ensure_todays_blocks_exist_generation_lock_does_not_block_unrelated_templates(monkeypatch):
    _set_today(monkeypatch, date(2026, 7, 6))
    block_template.create("First block", segments=[_all_days_active()])
    block_template.create("Second block", segments=[_all_days_active()])
    today_engine.ensure_todays_blocks_exist()

    titles = sorted(block.get_title(block=b) for b in block.list_all())
    assert titles == ["First block", "Second block"]


def test_ensure_todays_blocks_exist_includes_a_monthly_task_template_on_its_day(monkeypatch):
    _set_today(monkeypatch, date(2026, 1, 1))
    template = block_template.create("Morning Routine", segments=[_all_days_active()])
    template_id = block_template.get_id(block=template)
    block_task_template.create(
        "Deep clean shower",
        block_template_id=template_id,
        order=0,
        frequency=FREQUENCY_MONTHLY,
        start_date=date(2026, 1, 1),
        day_of_month=1,
    )
    today_engine.ensure_todays_blocks_exist()
    instance = block.find_one(template_id=template_id)
    titles = {task.get_title(block=t) for t in task.find(block_id=block.get_id(block=instance))}
    assert titles == {"Deep clean shower"}


def test_materialize_occurrence_creates_a_real_instance_for_a_future_date(monkeypatch):
    _set_today(monkeypatch, date(2026, 7, 6))  # a Monday
    template = block_template.create("Weekday Routine", segments=[_weekdays_only()])
    template_id = block_template.get_id(block=template)
    future_date = date(2026, 7, 8)  # a Wednesday

    materialized = today_engine.materialize_occurrence(template_id, future_date)

    assert block.get_date(block=materialized) == future_date
    assert block.get_template_id(block=materialized) == template_id
    assert block.find_one(template_id=template_id, date=future_date.isoformat()) is not None


def test_materialize_occurrence_returns_the_existing_instance_if_already_materialized(monkeypatch):
    _set_today(monkeypatch, date(2026, 7, 6))
    template = block_template.create("Weekday Routine", segments=[_weekdays_only()])
    template_id = block_template.get_id(block=template)
    future_date = date(2026, 7, 8)

    first = today_engine.materialize_occurrence(template_id, future_date)
    block.set_title("Already customized", block=first)
    block.save(first)

    second = today_engine.materialize_occurrence(template_id, future_date)

    assert block.get_id(block=second) == block.get_id(block=first)
    assert block.get_title(block=second) == "Already customized"
