# @manualReviewRequested: 2026-07-06
from datetime import date

import pytest

from core.storage.errors import RecordNotFoundError, ValidationError
from app.tasks import task


def test_create_sets_every_field_to_its_given_or_default_value():
    block = task.create("Buy milk", description="2%, not skim", tags=["errands"], due_date=date(2026, 7, 10))
    assert task.get_title(block=block) == "Buy milk"
    assert task.get_description(block=block) == "2%, not skim"
    assert task.get_tags(block=block) == ["errands"]
    assert task.get_project_id(block=block) == ""
    assert task.get_block_id(block=block) == ""
    assert task.get_is_archived(block=block) is False
    assert task.get_created_at(block=block) != ""
    assert task.get_due_date(block=block) == date(2026, 7, 10)
    assert task.get_scheduled_at(block=block) == ""
    assert task.get_is_complete(block=block) is False
    assert task.get_completed_at(block=block) == ""
    assert task.get_parent_task_id(block=block) == ""
    assert task.get_is_skipped(block=block) is False
    assert task.get_is_skippable(block=block) is False
    assert task.get_order(block=block) == 0
    assert task.get_duration_bucket(block=block) is None
    assert task.get_estimated_minutes(block=block) == 0


def test_create_defaults_due_date_to_none():
    block = task.create("No due date yet")
    assert task.get_due_date(block=block) is None


def test_create_rejects_a_title_containing_a_control_character():
    with pytest.raises(ValidationError):
        task.create("tainted\x1etitle")


def test_load_reads_back_a_created_task():
    created = task.create("Buy milk")
    loaded = task.load(task.get_id(block=created))
    assert task.get_title(block=loaded) == "Buy milk"


def test_load_raises_for_a_missing_task():
    with pytest.raises(RecordNotFoundError):
        task.load("does-not-exist")


def test_one_shot_setter_saves_immediately():
    created = task.create("Original title")
    task_id = task.get_id(block=created)
    task.set_title("Updated title", task_id)
    reloaded = task.load(task_id)
    assert task.get_title(block=reloaded) == "Updated title"


def test_setter_rejects_a_value_containing_a_control_character():
    created = task.create("Original title")
    task_id = task.get_id(block=created)
    with pytest.raises(ValidationError):
        task.set_title("tainted\x1etitle", task_id)


def test_batched_setters_do_not_write_until_saved(monkeypatch):
    created = task.create("Original title")
    write_calls = []
    monkeypatch.setattr(
        "core.storage.record_store.write_text_atomically",
        lambda path, content: write_calls.append(path),
    )
    task.set_title("Batched title", block=created)
    task.set_description("Batched description", block=created)
    assert write_calls == []  # nothing written yet — still batching
    task.save(created)
    assert len(write_calls) == 1  # exactly one write for both batched changes


def test_setter_requires_exactly_one_of_task_id_or_block():
    created = task.create("Original title")
    with pytest.raises(ValueError):
        task.set_title("New title")  # neither given
    with pytest.raises(ValueError):
        task.set_title("New title", task.get_id(block=created), block=created)  # both given


def test_delete_removes_the_task():
    created = task.create("Temporary")
    task_id = task.get_id(block=created)
    task.delete(task_id)
    with pytest.raises(RecordNotFoundError):
        task.load(task_id)


def test_list_ids_includes_every_created_task():
    first = task.create("One")
    second = task.create("Two")
    ids = task.list_ids()
    assert task.get_id(block=first) in ids
    assert task.get_id(block=second) in ids


def test_find_filters_by_project_id():
    task.create("Unrelated task")
    matching = task.create("Project task", project_id="project-123")
    results = task.find(project_id="project-123")
    assert [task.get_id(block=block) for block in results] == [task.get_id(block=matching)]


def test_find_one_returns_none_when_nothing_matches():
    assert task.find_one(project_id="never-used") is None


def test_set_is_archived_round_trips():
    created = task.create("Archive me")
    task.set_is_archived(True, block=created)
    assert task.get_is_archived(block=created) is True


def test_set_tags_rejects_a_tainted_tag():
    created = task.create("Has tags")
    with pytest.raises(ValidationError):
        task.set_tags(["fine", "tainted\x1dtag"], block=created)


def test_set_due_date_round_trips_and_can_be_cleared():
    created = task.create("Has a due date")
    task.set_due_date(date(2026, 8, 1), block=created)
    assert task.get_due_date(block=created) == date(2026, 8, 1)
    task.set_due_date(None, block=created)
    assert task.get_due_date(block=created) is None


def test_set_scheduled_at_round_trips():
    created = task.create("Plan me")
    task.set_scheduled_at("2026-08-01T09:00:00", block=created)
    assert task.get_scheduled_at(block=created) == "2026-08-01T09:00:00"


def test_set_is_complete_records_a_completion_timestamp():
    created = task.create("Finish this")
    task.set_is_complete(True, block=created)
    assert task.get_is_complete(block=created) is True
    assert task.get_completed_at(block=created) != ""


def test_set_is_complete_false_clears_the_completion_timestamp():
    created = task.create("Finish this")
    task.set_is_complete(True, block=created)
    task.set_is_complete(False, block=created)
    assert task.get_is_complete(block=created) is False
    assert task.get_completed_at(block=created) == ""


def test_set_block_id_round_trips():
    created = task.create("Nested in a block")
    task.set_block_id("block-123", block=created)
    assert task.get_block_id(block=created) == "block-123"


def test_create_defaults_is_skippable_true_for_a_block_nested_task():
    block = task.create("Block-nested task", block_id="block-123")
    assert task.get_is_skippable(block=block) is True


def test_create_defaults_is_skippable_true_for_a_subtask():
    parent = task.create("Parent task")
    block = task.create("Subtask", parent_task_id=task.get_id(block=parent))
    assert task.get_is_skippable(block=block) is True


def test_create_accepts_an_explicit_is_skippable_override():
    block = task.create("Ad-hoc but skippable", is_skippable=True)
    assert task.get_is_skippable(block=block) is True


def test_set_parent_task_id_round_trips():
    parent = task.create("Parent task")
    child = task.create("Child task")
    task.set_parent_task_id(task.get_id(block=parent), block=child)
    assert task.get_parent_task_id(block=child) == task.get_id(block=parent)


def test_find_filters_by_parent_task_id():
    parent = task.create("Parent task")
    parent_id = task.get_id(block=parent)
    task.create("Unrelated task")
    matching = task.create("Subtask", parent_task_id=parent_id)
    results = task.find(parent_task_id=parent_id)
    assert [task.get_id(block=block) for block in results] == [task.get_id(block=matching)]


def test_set_is_skipped_round_trips():
    created = task.create("Skip me", is_skippable=True)
    task.set_is_skipped(True, block=created)
    assert task.get_is_skipped(block=created) is True


def test_set_is_skippable_round_trips():
    created = task.create("Toggle skippability")
    task.set_is_skippable(True, block=created)
    assert task.get_is_skippable(block=created) is True


def test_create_appends_ad_hoc_top_level_tasks_to_the_end_of_their_own_order():
    first = task.create("First ad-hoc")
    second = task.create("Second ad-hoc")
    third = task.create("Third ad-hoc")
    assert task.get_order(block=first) == 0
    assert task.get_order(block=second) == 1
    assert task.get_order(block=third) == 2


def test_create_defaults_order_to_zero_for_project_and_block_nested_tasks():
    project_task = task.create("In a project", project_id="project-123")
    block_nested_task = task.create("Nested in a block", block_id="block-123")
    assert task.get_order(block=project_task) == 0
    assert task.get_order(block=block_nested_task) == 0


def test_create_appends_subtasks_to_the_end_of_their_own_order():
    parent = task.create("Parent")
    parent_id = task.get_id(block=parent)
    first = task.create("First subtask", parent_task_id=parent_id)
    second = task.create("Second subtask", parent_task_id=parent_id)
    third = task.create("Third subtask", parent_task_id=parent_id)
    assert task.get_order(block=first) == 0
    assert task.get_order(block=second) == 1
    assert task.get_order(block=third) == 2


def test_create_orders_subtasks_independently_per_parent():
    first_parent = task.create("First parent")
    second_parent = task.create("Second parent")
    first_parent_subtask = task.create("Subtask", parent_task_id=task.get_id(block=first_parent))
    second_parent_subtask = task.create("Subtask", parent_task_id=task.get_id(block=second_parent))
    assert task.get_order(block=first_parent_subtask) == 0
    assert task.get_order(block=second_parent_subtask) == 0


def test_create_appends_block_nested_tasks_to_the_end_of_their_own_order():
    first = task.create("First", block_id="block-1")
    second = task.create("Second", block_id="block-1")
    other_block_task = task.create("Other block's task", block_id="block-2")
    assert task.get_order(block=first) == 0
    assert task.get_order(block=second) == 1
    assert task.get_order(block=other_block_task) == 0


def test_set_order_round_trips():
    created = task.create("Reorder me")
    task.set_order(5, block=created)
    assert task.get_order(block=created) == 5


def test_set_estimated_minutes_round_trips_and_can_be_cleared():
    created = task.create("Estimate me precisely")
    task.set_estimated_minutes(15, block=created)
    assert task.get_estimated_minutes(block=created) == 15
    task.set_estimated_minutes(0, block=created)
    assert task.get_estimated_minutes(block=created) == 0


def test_set_duration_bucket_round_trips_and_can_be_cleared():
    created = task.create("Estimate me")
    task.set_duration_bucket(task.DurationBucket.TEN_TO_30_MIN, block=created)
    assert task.get_duration_bucket(block=created) == task.DurationBucket.TEN_TO_30_MIN
    task.set_duration_bucket(None, block=created)
    assert task.get_duration_bucket(block=created) is None


def test_set_duration_bucket_rejects_a_non_member_value():
    created = task.create("Estimate me")
    with pytest.raises(ValueError):
        task.set_duration_bucket("10-30 min", block=created)


def test_create_accepts_an_explicit_duration_bucket():
    block = task.create("Quick task", duration_bucket=task.DurationBucket.FIVE_TO_10_MIN)
    assert task.get_duration_bucket(block=block) == task.DurationBucket.FIVE_TO_10_MIN


def test_create_rejects_a_non_member_duration_bucket():
    with pytest.raises(ValueError):
        task.create("Quick task", duration_bucket="5-10 min")
