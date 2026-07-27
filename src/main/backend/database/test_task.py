import pytest

from src.common.backend.database.page_store import writePage
from src.main.backend.database import record_store as record_store_module
from src.main.backend.database.task import (
    TASK_OBJECT_TYPE,
    EmptyTaskTitleError,
    createTask,
    deleteAllTasks,
    deleteTask,
    getAllTasks,
    getTask,
    reorderTasks,
    setTaskCompleted,
    setTaskProject,
    unassignTasksFromProject,
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


def test_create_task_defaults_project_id_to_none():
    task = createTask("Buy milk")

    assert task.project_id is None


def test_create_task_with_project_id_persists_it():
    task = createTask("Buy milk", project_id="proj-1")

    assert task.project_id == "proj-1"
    assert getTask(task.id).project_id == "proj-1"


def test_set_task_project_assigns_project():
    task = createTask("Buy milk")

    updated = setTaskProject(task.id, "proj-1")

    assert updated.project_id == "proj-1"


def test_set_task_project_clears_with_none():
    task = createTask("Buy milk", project_id="proj-1")

    updated = setTaskProject(task.id, None)

    assert updated.project_id is None


def test_set_task_project_on_unknown_id_returns_none():
    assert setTaskProject("does-not-exist", "proj-1") is None


def test_unassign_tasks_from_project_clears_matching_tasks_only():
    in_project = createTask("Task in project", project_id="proj-1")
    other_project = createTask("Task in other project", project_id="proj-2")
    unassigned = createTask("Unassigned task")

    unassignTasksFromProject("proj-1")

    assert getTask(in_project.id).project_id is None
    assert getTask(other_project.id).project_id == "proj-2"
    assert getTask(unassigned.id).project_id is None


def test_decode_task_defaults_project_id_to_none_for_legacy_eight_field_record():
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

    assert fetched.project_id is None
