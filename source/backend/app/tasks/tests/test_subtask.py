# @manualReviewRequested: 2026-07-06
import pytest

from core.storage.errors import RecordNotFoundError, ValidationError
from app.tasks import subtask


def test_create_sets_every_field_to_its_given_or_default_value():
    block = subtask.create("task-123", "Pack the bag")
    assert subtask.get_task_id(block=block) == "task-123"
    assert subtask.get_title(block=block) == "Pack the bag"
    assert subtask.get_is_complete(block=block) is False
    assert subtask.get_is_skipped(block=block) is False
    assert subtask.get_created_at(block=block) != ""


def test_create_rejects_a_title_containing_a_control_character():
    with pytest.raises(ValidationError):
        subtask.create("task-123", "tainted\x1etitle")


def test_load_reads_back_a_created_subtask():
    created = subtask.create("task-123", "Pack the bag")
    loaded = subtask.load(subtask.get_id(block=created))
    assert subtask.get_title(block=loaded) == "Pack the bag"


def test_load_raises_for_a_missing_subtask():
    with pytest.raises(RecordNotFoundError):
        subtask.load("does-not-exist")


def test_one_shot_setter_saves_immediately():
    created = subtask.create("task-123", "Original title")
    subtask_id = subtask.get_id(block=created)
    subtask.set_title("Updated title", subtask_id)
    reloaded = subtask.load(subtask_id)
    assert subtask.get_title(block=reloaded) == "Updated title"


def test_setter_rejects_a_value_containing_a_control_character():
    created = subtask.create("task-123", "Original title")
    subtask_id = subtask.get_id(block=created)
    with pytest.raises(ValidationError):
        subtask.set_title("tainted\x1etitle", subtask_id)


def test_batched_setters_do_not_write_until_saved(monkeypatch):
    created = subtask.create("task-123", "Original title")
    write_calls = []
    monkeypatch.setattr(
        "core.storage.record_store.write_text_atomically",
        lambda path, content: write_calls.append(path),
    )
    subtask.set_is_complete(True, block=created)
    subtask.set_title("Batched title", block=created)
    assert write_calls == []  # nothing written yet — still batching
    subtask.save(created)
    assert len(write_calls) == 1  # exactly one write for both batched changes


def test_setter_requires_exactly_one_of_subtask_id_or_block():
    created = subtask.create("task-123", "Original title")
    with pytest.raises(ValueError):
        subtask.set_title("New title")  # neither given
    with pytest.raises(ValueError):
        subtask.set_title("New title", subtask.get_id(block=created), block=created)  # both given


def test_delete_removes_the_subtask():
    created = subtask.create("task-123", "Temporary")
    subtask_id = subtask.get_id(block=created)
    subtask.delete(subtask_id)
    with pytest.raises(RecordNotFoundError):
        subtask.load(subtask_id)


def test_list_ids_includes_every_created_subtask():
    first = subtask.create("task-123", "One")
    second = subtask.create("task-123", "Two")
    ids = subtask.list_ids()
    assert subtask.get_id(block=first) in ids
    assert subtask.get_id(block=second) in ids


def test_find_filters_by_task_id():
    subtask.create("other-task", "Unrelated subtask")
    matching = subtask.create("task-123", "Matching subtask")
    results = subtask.find(task_id="task-123")
    assert [subtask.get_id(block=block) for block in results] == [subtask.get_id(block=matching)]


def test_find_one_returns_none_when_nothing_matches():
    assert subtask.find_one(task_id="never-used") is None


def test_set_is_complete_round_trips():
    created = subtask.create("task-123", "Complete me")
    subtask.set_is_complete(True, block=created)
    assert subtask.get_is_complete(block=created) is True


def test_set_is_skipped_round_trips():
    created = subtask.create("task-123", "Skip me")
    subtask.set_is_skipped(True, block=created)
    assert subtask.get_is_skipped(block=created) is True


def test_delete_all_for_task_removes_only_that_tasks_subtasks():
    to_delete_one = subtask.create("task-123", "One")
    to_delete_two = subtask.create("task-123", "Two")
    unrelated = subtask.create("other-task", "Unrelated")

    subtask.delete_all_for_task("task-123")

    with pytest.raises(RecordNotFoundError):
        subtask.load(subtask.get_id(block=to_delete_one))
    with pytest.raises(RecordNotFoundError):
        subtask.load(subtask.get_id(block=to_delete_two))
    subtask.load(subtask.get_id(block=unrelated))  # must not raise
