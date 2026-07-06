from datetime import date

import pytest

from core.storage.errors import RecordNotFoundError, ValidationError
from app.journals import note


def test_create_sets_every_field_to_its_given_value():
    block = note.create("Reflection", "Felt good about today", journal_date=date(2026, 7, 4))
    assert note.get_title(block=block) == "Reflection"
    assert note.get_content(block=block) == "Felt good about today"
    assert note.get_journal_date(block=block) == date(2026, 7, 4)
    assert note.get_target_type(block=block) == ""
    assert note.get_target_id(block=block) == ""
    assert note.get_created_at(block=block) != ""


def test_create_defaults_to_no_journal_date_and_no_target():
    block = note.create(content="Just some text")
    assert note.get_journal_date(block=block) is None
    assert note.get_target_type(block=block) == ""
    assert note.get_target_id(block=block) == ""


def test_create_can_attach_to_a_task():
    block = note.create(content="Remember to check X", target_type=note.TARGET_TYPE_TASK, target_id="task-1")
    assert note.get_target_type(block=block) == note.TARGET_TYPE_TASK
    assert note.get_target_id(block=block) == "task-1"


def test_create_can_attach_to_a_project():
    block = note.create(content="Kickoff notes", target_type=note.TARGET_TYPE_PROJECT, target_id="project-1")
    assert note.get_target_type(block=block) == note.TARGET_TYPE_PROJECT
    assert note.get_target_id(block=block) == "project-1"


def test_create_rejects_target_type_without_a_target_id():
    with pytest.raises(ValidationError):
        note.create(content="Broken", target_type=note.TARGET_TYPE_TASK)


def test_create_rejects_target_id_without_a_target_type():
    with pytest.raises(ValidationError):
        note.create(content="Broken", target_id="task-1")


def test_create_rejects_an_unrecognized_target_type():
    with pytest.raises(ValidationError):
        note.create(content="Broken", target_type="Widget", target_id="widget-1")


def test_create_rejects_content_containing_a_control_character():
    with pytest.raises(ValidationError):
        note.create(content="tainted\x1econtent")


def test_load_raises_for_a_missing_note():
    with pytest.raises(RecordNotFoundError):
        note.load("does-not-exist")


def test_one_shot_setter_saves_immediately():
    created = note.create(content="Original", journal_date=date(2026, 7, 4))
    note_id = note.get_id(block=created)
    note.set_content("Updated", note_id)
    reloaded = note.load(note_id)
    assert note.get_content(block=reloaded) == "Updated"


def test_setter_rejects_a_value_containing_a_control_character():
    created = note.create(content="Original", journal_date=date(2026, 7, 4))
    note_id = note.get_id(block=created)
    with pytest.raises(ValidationError):
        note.set_content("tainted\x1econtent", note_id)


def test_set_journal_date_moves_the_note_and_can_clear_it():
    created = note.create(content="Original", journal_date=date(2026, 7, 4))
    note.set_journal_date(date(2026, 7, 5), block=created)
    assert note.get_journal_date(block=created) == date(2026, 7, 5)
    note.set_journal_date(None, block=created)
    assert note.get_journal_date(block=created) is None


def test_set_target_updates_both_fields_together():
    created = note.create(content="Original")
    note.set_target(note.TARGET_TYPE_TASK, "task-1", block=created)
    assert note.get_target_type(block=created) == note.TARGET_TYPE_TASK
    assert note.get_target_id(block=created) == "task-1"


def test_set_target_rejects_a_mismatched_pair():
    created = note.create(content="Original")
    with pytest.raises(ValidationError):
        note.set_target(note.TARGET_TYPE_TASK, "", block=created)


def test_find_filters_by_journal_date():
    note.create(content="Unrelated", journal_date=date(2026, 7, 3))
    matching = note.create(content="Findable", journal_date=date(2026, 7, 4))
    results = note.find(journal_date="2026-07-04")
    assert [note.get_id(block=block) for block in results] == [note.get_id(block=matching)]


def test_find_filters_by_target():
    note.create(content="Journal entry", journal_date=date(2026, 7, 4))
    matching = note.create(content="Task note", target_type=note.TARGET_TYPE_TASK, target_id="task-1")
    results = note.find(target_type=note.TARGET_TYPE_TASK, target_id="task-1")
    assert [note.get_id(block=block) for block in results] == [note.get_id(block=matching)]
