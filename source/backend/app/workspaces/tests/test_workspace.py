# @manualReviewRequested: 2026-07-07
import pytest

from core.storage.errors import RecordNotFoundError, ValidationError
from app.workspaces import workspace


def test_create_sets_every_field_to_its_given_or_default_value():
    block = workspace.create("School", description="Classes and assignments", color="1")
    assert workspace.get_title(block=block) == "School"
    assert workspace.get_description(block=block) == "Classes and assignments"
    assert workspace.get_color(block=block) == "1"
    assert workspace.get_is_archived(block=block) is False
    assert workspace.get_created_at(block=block) != ""


def test_create_defaults_description_and_color_to_empty():
    block = workspace.create("Work")
    assert workspace.get_description(block=block) == ""
    assert workspace.get_color(block=block) == ""


def test_create_rejects_a_title_containing_a_control_character():
    with pytest.raises(ValidationError):
        workspace.create("tainted\x1etitle")


def test_create_rejects_a_description_containing_a_control_character():
    with pytest.raises(ValidationError):
        workspace.create("Fine title", description="tainted\x1edescription")


def test_load_raises_for_a_missing_workspace():
    with pytest.raises(RecordNotFoundError):
        workspace.load("does-not-exist")


def test_one_shot_setter_saves_immediately():
    created = workspace.create("Original")
    workspace_id = workspace.get_id(block=created)
    workspace.set_title("Updated", workspace_id)
    reloaded = workspace.load(workspace_id)
    assert workspace.get_title(block=reloaded) == "Updated"


def test_delete_removes_the_workspace():
    created = workspace.create("Temporary")
    workspace_id = workspace.get_id(block=created)
    workspace.delete(workspace_id)
    with pytest.raises(RecordNotFoundError):
        workspace.load(workspace_id)


def test_find_filters_by_title():
    workspace.create("Unrelated")
    matching = workspace.create("Findable")
    results = workspace.find(title="Findable")
    assert [workspace.get_id(block=block) for block in results] == [workspace.get_id(block=matching)]


def test_set_description_round_trips():
    created = workspace.create("Describe me")
    workspace.set_description("A better description", block=created)
    assert workspace.get_description(block=created) == "A better description"


def test_set_color_round_trips_and_can_be_cleared():
    created = workspace.create("Recolor me", color="2")
    workspace.set_color("4", block=created)
    assert workspace.get_color(block=created) == "4"
    workspace.set_color("", block=created)
    assert workspace.get_color(block=created) == ""


def test_set_is_archived_round_trips():
    created = workspace.create("Archive me")
    workspace.set_is_archived(True, block=created)
    assert workspace.get_is_archived(block=created) is True
