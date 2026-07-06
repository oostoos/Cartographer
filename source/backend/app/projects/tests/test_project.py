import pytest

from core.storage.errors import RecordNotFoundError, ValidationError
from app.projects import project


def test_create_sets_every_field_to_its_given_or_default_value():
    block = project.create("Home renovation", description="Kitchen first")
    assert project.get_title(block=block) == "Home renovation"
    assert project.get_description(block=block) == "Kitchen first"
    assert project.get_parent_project_id(block=block) == ""
    assert project.get_is_archived(block=block) is False
    assert project.get_created_at(block=block) != ""


def test_create_can_set_a_parent_project_id():
    parent = project.create("Parent")
    child = project.create("Child", parent_project_id=project.get_id(block=parent))
    assert project.get_parent_project_id(block=child) == project.get_id(block=parent)


def test_create_rejects_a_title_containing_a_control_character():
    with pytest.raises(ValidationError):
        project.create("tainted\x1etitle")


def test_load_raises_for_a_missing_project():
    with pytest.raises(RecordNotFoundError):
        project.load("does-not-exist")


def test_one_shot_setter_saves_immediately():
    created = project.create("Original")
    project_id = project.get_id(block=created)
    project.set_title("Updated", project_id)
    reloaded = project.load(project_id)
    assert project.get_title(block=reloaded) == "Updated"


def test_delete_removes_the_project():
    created = project.create("Temporary")
    project_id = project.get_id(block=created)
    project.delete(project_id)
    with pytest.raises(RecordNotFoundError):
        project.load(project_id)


def test_find_filters_by_title():
    project.create("Unrelated")
    matching = project.create("Findable")
    results = project.find(title="Findable")
    assert [project.get_id(block=block) for block in results] == [project.get_id(block=matching)]


def test_find_filters_by_parent_project_id():
    parent = project.create("Parent")
    parent_id = project.get_id(block=parent)
    project.create("Unrelated")
    child = project.create("Child", parent_project_id=parent_id)

    results = project.find(parent_project_id=parent_id)
    assert [project.get_id(block=block) for block in results] == [project.get_id(block=child)]


def test_set_is_archived_round_trips():
    created = project.create("Archive me")
    project.set_is_archived(True, block=created)
    assert project.get_is_archived(block=created) is True


def test_set_parent_project_id_round_trips():
    created = project.create("Reparent me")
    other = project.create("New parent")
    project.set_parent_project_id(project.get_id(block=other), block=created)
    assert project.get_parent_project_id(block=created) == project.get_id(block=other)
