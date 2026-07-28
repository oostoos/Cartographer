import pytest

from lib.stack.parchment.page_store import writePage
from src.backend.database import record_store as record_store_module
from src.backend.database.group import (
    GROUP_OBJECT_TYPE,
    EmptyGroupNameError,
    createGroup,
    deleteGroup,
    getAllGroups,
    getGroup,
    reorderGroups,
    updateGroup,
)
from src.backend.database.task import createTask, getTask
from src.backend.groups.group_color_palette import GROUP_COLOR_PALETTE


def test_create_group_persists_and_is_retrievable():
    group = createGroup("Home renovation")

    fetched = getGroup(group.id)

    assert fetched == group
    assert fetched.name == "Home renovation"


def test_create_group_with_empty_name_raises():
    with pytest.raises(EmptyGroupNameError):
        createGroup("")


def test_create_group_with_whitespace_only_name_raises():
    with pytest.raises(EmptyGroupNameError):
        createGroup("   ")


def test_get_group_on_unknown_id_returns_none():
    assert getGroup("does-not-exist") is None


def test_create_group_assigns_increasing_order():
    first = createGroup("Group one")
    second = createGroup("Group two")

    assert first.order < second.order


def test_get_all_groups_sorts_by_order():
    first = createGroup("Group one")
    second = createGroup("Group two")

    all_groups = getAllGroups()

    assert [group.id for group in all_groups] == [first.id, second.id]


def test_get_all_groups_returns_empty_list_when_no_groups_exist():
    assert getAllGroups() == []


def test_delete_group_returns_false_for_unknown_id():
    assert deleteGroup("does-not-exist") is False


def test_delete_group_removes_it():
    group = createGroup("Home renovation")

    deleted = deleteGroup(group.id)

    assert deleted is True
    assert getGroup(group.id) is None


def test_delete_group_unassigns_its_tasks():
    group = createGroup("Home renovation")
    task = createTask("Paint the fence", group_id=group.id)

    deleteGroup(group.id)

    assert getTask(task.id).group_id is None


def test_delete_group_leaves_other_groups_tasks_unaffected():
    group = createGroup("Home renovation")
    other_group = createGroup("Other group")
    other_task = createTask("Task in other group", group_id=other_group.id)

    deleteGroup(group.id)

    assert getTask(other_task.id).group_id == other_group.id


def test_update_group_renames_it():
    group = createGroup("Home renovation")

    updated = updateGroup(group.id, "Home projects")

    assert updated.name == "Home projects"
    assert getGroup(group.id).name == "Home projects"


def test_update_group_on_unknown_id_returns_none():
    assert updateGroup("does-not-exist", "New name") is None


def test_update_group_with_empty_name_raises():
    group = createGroup("Home renovation")

    with pytest.raises(EmptyGroupNameError):
        updateGroup(group.id, "")


def test_create_group_assigns_a_color_from_the_palette():
    group = createGroup("Home renovation")

    assert group.color in GROUP_COLOR_PALETTE


def test_create_group_cycles_through_the_palette():
    groups = [createGroup(f"Group {i}") for i in range(len(GROUP_COLOR_PALETTE) + 1)]

    colors = [group.color for group in groups]

    assert colors == GROUP_COLOR_PALETTE + [GROUP_COLOR_PALETTE[0]]


def test_update_group_sets_color():
    group = createGroup("Home renovation")
    new_color = GROUP_COLOR_PALETTE[1] if group.color != GROUP_COLOR_PALETTE[1] else GROUP_COLOR_PALETTE[2]

    updated = updateGroup(group.id, color=new_color)

    assert updated.color == new_color
    assert getGroup(group.id).color == new_color


def test_update_group_color_leaves_name_unchanged():
    group = createGroup("Home renovation")

    updated = updateGroup(group.id, color=GROUP_COLOR_PALETTE[3])

    assert updated.name == "Home renovation"


def test_update_group_name_leaves_color_unchanged():
    group = createGroup("Home renovation")

    updated = updateGroup(group.id, name="Home projects")

    assert updated.color == group.color


def test_decode_group_defaults_color_to_first_palette_entry_for_legacy_five_field_record():
    group = createGroup("Home renovation")
    legacy_fields = [group.id, group.name, group.created_at, group.updated_at, str(group.order)]
    writePage(record_store_module.DATA_ROOT, GROUP_OBJECT_TYPE, group.id, legacy_fields)

    fetched = getGroup(group.id)

    assert fetched.color == GROUP_COLOR_PALETTE[0]


def test_reorder_groups_reassigns_order_to_match_given_sequence():
    first = createGroup("Group one")
    second = createGroup("Group two")

    reordered = reorderGroups([second.id, first.id])

    assert [group.id for group in reordered] == [second.id, first.id]


def test_reorder_groups_skips_unknown_ids():
    first = createGroup("Group one")
    second = createGroup("Group two")

    reordered = reorderGroups([second.id, "does-not-exist", first.id])

    assert [group.id for group in reordered] == [second.id, first.id]


def test_reorder_groups_persists_across_reads():
    first = createGroup("Group one")
    second = createGroup("Group two")

    reorderGroups([second.id, first.id])

    assert [group.id for group in getAllGroups()] == [second.id, first.id]
