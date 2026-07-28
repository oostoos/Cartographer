import pytest

from lib.stack.parchment.page_store import writePage
from src.backend.database import record_store as record_store_module
from src.backend.database.task import (
    TASK_OBJECT_TYPE,
    EmptyTaskTitleError,
    createTask,
    deleteAllTasks,
    deleteTask,
    getAllTasks,
    getTask,
    reorderTasks,
    setTaskCompleted,
    setTaskDueDate,
    setTaskEnergyRequirement,
    setTaskGroup,
    setTaskImpact,
    setTaskTimeEstimateMinutes,
    unassignTasksFromGroup,
    updateTask,
)


def test_create_task_persists_and_is_retrievable():
    task = createTask("Buy milk", "2%")

    fetched = getTask(task.id)

    assert fetched == task
    assert fetched.title == "Buy milk"
    assert fetched.description == "2%"
    assert fetched.completed is False


def test_create_task_defaults_description_to_empty_string():
    task = createTask("Buy milk")

    assert task.description == ""


def test_create_task_with_empty_title_raises():
    with pytest.raises(EmptyTaskTitleError):
        createTask("")


def test_create_task_with_whitespace_only_title_raises():
    with pytest.raises(EmptyTaskTitleError):
        createTask("   ")


def test_get_task_on_unknown_id_returns_none():
    assert getTask("does-not-exist") is None


def test_update_task_changes_title_and_description():
    task = createTask("Buy milk")

    updated = updateTask(task.id, title="Buy oat milk", description="unsweetened")

    assert updated.title == "Buy oat milk"
    assert updated.description == "unsweetened"
    assert updated.updated_at >= task.updated_at


def test_update_task_partial_update_leaves_other_field_unchanged():
    task = createTask("Buy milk", "2%")

    updated = updateTask(task.id, title="Buy oat milk")

    assert updated.title == "Buy oat milk"
    assert updated.description == "2%"


def test_update_task_with_empty_title_raises():
    task = createTask("Buy milk")

    with pytest.raises(EmptyTaskTitleError):
        updateTask(task.id, title="")


def test_update_task_on_unknown_id_returns_none():
    assert updateTask("does-not-exist", title="x") is None


def test_set_task_completed_toggles_flag():
    task = createTask("Buy milk")

    completed = setTaskCompleted(task.id, True)
    assert completed.completed is True

    reverted = setTaskCompleted(task.id, False)
    assert reverted.completed is False


def test_set_task_completed_on_unknown_id_returns_none():
    assert setTaskCompleted("does-not-exist", True) is None


def test_create_task_defaults_completed_at_to_none():
    task = createTask("Buy milk")

    assert task.completed_at is None


def test_set_task_completed_stamps_completed_at_when_completing():
    task = createTask("Buy milk")
    assert task.completed_at is None

    completed = setTaskCompleted(task.id, True)

    assert completed.completed_at is not None


def test_set_task_completed_clears_completed_at_when_uncompleting():
    task = createTask("Buy milk")
    setTaskCompleted(task.id, True)

    reverted = setTaskCompleted(task.id, False)

    assert reverted.completed_at is None


def test_set_task_completed_does_not_overwrite_existing_completed_at():
    task = createTask("Buy milk")

    first = setTaskCompleted(task.id, True)
    second = setTaskCompleted(task.id, True)

    assert second.completed_at == first.completed_at


def test_decode_task_defaults_completed_at_to_none_for_legacy_six_field_record():
    task = createTask("Buy milk")
    legacy_fields = [task.id, task.title, task.description, "true", task.created_at, task.updated_at]
    writePage(record_store_module.DATA_ROOT, TASK_OBJECT_TYPE, task.id, legacy_fields)

    fetched = getTask(task.id)

    assert fetched.completed is True
    assert fetched.completed_at is None


def test_decode_task_defaults_order_to_zero_for_legacy_seven_field_record():
    task = createTask("Buy milk")
    legacy_fields = [
        task.id,
        task.title,
        task.description,
        "false",
        task.created_at,
        task.updated_at,
        "",
    ]
    writePage(record_store_module.DATA_ROOT, TASK_OBJECT_TYPE, task.id, legacy_fields)

    fetched = getTask(task.id)

    assert fetched.order == 0.0


def test_create_task_assigns_increasing_order():
    first = createTask("Task one")
    second = createTask("Task two")
    third = createTask("Task three")

    assert first.order < second.order < third.order


def test_get_all_tasks_sorts_by_order():
    first = createTask("Task one")
    second = createTask("Task two")

    all_tasks = getAllTasks()

    assert [task.id for task in all_tasks] == [first.id, second.id]


def test_reorder_tasks_reassigns_order_to_match_given_sequence():
    first = createTask("Task one")
    second = createTask("Task two")

    reordered = reorderTasks([second.id, first.id])

    assert [task.id for task in reordered] == [second.id, first.id]


def test_reorder_tasks_skips_unknown_ids():
    first = createTask("Task one")
    second = createTask("Task two")

    reordered = reorderTasks([second.id, "does-not-exist", first.id])

    assert [task.id for task in reordered] == [second.id, first.id]


def test_reorder_tasks_persists_across_reads():
    first = createTask("Task one")
    second = createTask("Task two")

    reorderTasks([second.id, first.id])

    assert [task.id for task in getAllTasks()] == [second.id, first.id]


def test_get_all_tasks_returns_every_created_task():
    first = createTask("Task one")
    second = createTask("Task two")

    all_tasks = getAllTasks()

    assert {t.id for t in all_tasks} == {first.id, second.id}


def test_get_all_tasks_returns_empty_list_when_no_tasks_exist():
    assert getAllTasks() == []


def test_delete_task_removes_it():
    task = createTask("Buy milk")

    deleted = deleteTask(task.id)

    assert deleted is True
    assert getTask(task.id) is None


def test_delete_task_returns_false_for_unknown_id():
    assert deleteTask("does-not-exist") is False


def test_delete_task_leaves_other_tasks_unaffected():
    keep = createTask("Keep me")
    remove = createTask("Remove me")

    deleteTask(remove.id)

    assert getTask(keep.id) == keep


def test_delete_all_tasks_clears_every_task():
    createTask("Task one")
    createTask("Task two")

    deleteAllTasks()

    assert getAllTasks() == []


def test_create_task_defaults_group_id_to_none():
    task = createTask("Buy milk")

    assert task.group_id is None


def test_create_task_with_group_id_persists_it():
    task = createTask("Buy milk", group_id="group-1")

    assert task.group_id == "group-1"
    assert getTask(task.id).group_id == "group-1"


def test_set_task_group_assigns_group():
    task = createTask("Buy milk")

    updated = setTaskGroup(task.id, "group-1")

    assert updated.group_id == "group-1"


def test_set_task_group_clears_with_none():
    task = createTask("Buy milk", group_id="group-1")

    updated = setTaskGroup(task.id, None)

    assert updated.group_id is None


def test_set_task_group_on_unknown_id_returns_none():
    assert setTaskGroup("does-not-exist", "group-1") is None


def test_unassign_tasks_from_group_clears_matching_tasks_only():
    in_group = createTask("Task in group", group_id="group-1")
    other_group = createTask("Task in other group", group_id="group-2")
    unassigned = createTask("Unassigned task")

    unassignTasksFromGroup("group-1")

    assert getTask(in_group.id).group_id is None
    assert getTask(other_group.id).group_id == "group-2"
    assert getTask(unassigned.id).group_id is None


def test_decode_task_defaults_group_id_to_none_for_legacy_eight_field_record():
    task = createTask("Buy milk")
    legacy_fields = [
        task.id,
        task.title,
        task.description,
        "false",
        task.created_at,
        task.updated_at,
        "",
        str(task.order),
    ]
    writePage(record_store_module.DATA_ROOT, TASK_OBJECT_TYPE, task.id, legacy_fields)

    fetched = getTask(task.id)

    assert fetched.group_id is None


def test_create_task_defaults_new_fields_to_none():
    task = createTask("Buy milk")

    assert task.energy_requirement is None
    assert task.impact is None
    assert task.due_date is None
    assert task.time_estimate_minutes is None


def test_set_task_energy_requirement_sets_value():
    task = createTask("Buy milk")

    updated = setTaskEnergyRequirement(task.id, 3)

    assert updated.energy_requirement == 3
    assert getTask(task.id).energy_requirement == 3


def test_set_task_energy_requirement_clears_with_none():
    task = createTask("Buy milk")
    setTaskEnergyRequirement(task.id, 3)

    updated = setTaskEnergyRequirement(task.id, None)

    assert updated.energy_requirement is None


def test_set_task_energy_requirement_on_unknown_id_returns_none():
    assert setTaskEnergyRequirement("does-not-exist", 3) is None


def test_set_task_energy_requirement_advances_updated_at():
    task = createTask("Buy milk")

    updated = setTaskEnergyRequirement(task.id, 3)

    assert updated.updated_at >= task.updated_at


def test_set_task_impact_sets_value():
    task = createTask("Buy milk")

    updated = setTaskImpact(task.id, 5)

    assert updated.impact == 5
    assert getTask(task.id).impact == 5


def test_set_task_impact_clears_with_none():
    task = createTask("Buy milk")
    setTaskImpact(task.id, 5)

    updated = setTaskImpact(task.id, None)

    assert updated.impact is None


def test_set_task_impact_on_unknown_id_returns_none():
    assert setTaskImpact("does-not-exist", 5) is None


def test_set_task_due_date_sets_value():
    task = createTask("Buy milk")

    updated = setTaskDueDate(task.id, "2026-08-01")

    assert updated.due_date == "2026-08-01"
    assert getTask(task.id).due_date == "2026-08-01"


def test_set_task_due_date_clears_with_none():
    task = createTask("Buy milk")
    setTaskDueDate(task.id, "2026-08-01")

    updated = setTaskDueDate(task.id, None)

    assert updated.due_date is None


def test_set_task_due_date_on_unknown_id_returns_none():
    assert setTaskDueDate("does-not-exist", "2026-08-01") is None


def test_set_task_time_estimate_minutes_sets_value():
    task = createTask("Buy milk")

    updated = setTaskTimeEstimateMinutes(task.id, 45)

    assert updated.time_estimate_minutes == 45
    assert getTask(task.id).time_estimate_minutes == 45


def test_set_task_time_estimate_minutes_clears_with_none():
    task = createTask("Buy milk")
    setTaskTimeEstimateMinutes(task.id, 45)

    updated = setTaskTimeEstimateMinutes(task.id, None)

    assert updated.time_estimate_minutes is None


def test_set_task_time_estimate_minutes_on_unknown_id_returns_none():
    assert setTaskTimeEstimateMinutes("does-not-exist", 45) is None


def test_encode_decode_round_trip_preserves_new_fields():
    task = createTask("Buy milk")
    setTaskEnergyRequirement(task.id, 2)
    setTaskImpact(task.id, 4)
    setTaskDueDate(task.id, "2026-08-01")
    updated = setTaskTimeEstimateMinutes(task.id, 30)

    fetched = getTask(task.id)

    assert fetched == updated
    assert fetched.energy_requirement == 2
    assert fetched.impact == 4
    assert fetched.due_date == "2026-08-01"
    assert fetched.time_estimate_minutes == 30


def test_decode_task_defaults_new_fields_to_none_for_legacy_nine_field_record():
    task = createTask("Buy milk")
    legacy_fields = [
        task.id,
        task.title,
        task.description,
        "false",
        task.created_at,
        task.updated_at,
        "",
        str(task.order),
        "",
    ]
    writePage(record_store_module.DATA_ROOT, TASK_OBJECT_TYPE, task.id, legacy_fields)

    fetched = getTask(task.id)

    assert fetched.energy_requirement is None
    assert fetched.impact is None
    assert fetched.due_date is None
    assert fetched.time_estimate_minutes is None
