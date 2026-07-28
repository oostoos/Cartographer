"""Task records: business-facing wrapper around the common page_store engine."""
from typing import Callable

from lib.language.python.collections.dict_utils import buildDictFromKeysAndValues
from lib.language.python.date.utc_timestamp import currentUtcIsoTimestamp
from lib.language.python.strings.bool_codec import decodeBoolFromString, encodeBoolAsString
from lib.language.python.strings.constants import EMPTY_STRING
from lib.language.python.strings.optional_int_codec import (
    decodeOptionalIntFromString,
    encodeOptionalIntAsString,
)
from lib.stack.parchment.ids import generateRecordId
from src.backend.database.models import Task
from lib.language.python.collections.ordering import computeNextOrder, reorderRecordsByIds
from src.backend.database.record_store import (
    clearObjectType,
    deleteRecord,
    listRecordIds,
    readRecord,
    writeRecord,
)

TASK_OBJECT_TYPE = "task"
TASK_FIELD_ORDER = [
    "id",
    "title",
    "description",
    "completed",
    "created_at",
    "updated_at",
    "completed_at",
    "order",
    "group_id",
    "energy_requirement",
    "impact",
    "due_date",
    "time_estimate_minutes",
]

class EmptyTaskTitleError(ValueError):
    """Raised when creating or updating a task with a blank title."""


def createTask(title: str, description: str = "", group_id: str | None = None) -> Task:
    """Create and persist a new task. Raises EmptyTaskTitleError if title is blank."""
    _requireNonEmptyTitle(title)
    now = currentUtcIsoTimestamp()
    task = Task(
        id=generateRecordId(),
        title=title,
        description=description,
        completed=False,
        created_at=now,
        updated_at=now,
        order=_nextTaskOrder(),
        group_id=group_id,
    )
    writeRecord(TASK_OBJECT_TYPE, task.id, _encodeTask(task))
    return task


def getTask(task_id: str) -> Task | None:
    """Fetch a task by id, or None if no task with that id exists."""
    fields = readRecord(TASK_OBJECT_TYPE, task_id)
    if fields is None:
        return None
    return _decodeTask(fields)


def deleteTask(task_id: str) -> bool:
    """Delete a single task. Returns False (no-op) if it doesn't exist."""
    if getTask(task_id) is None:
        return False
    deleteRecord(TASK_OBJECT_TYPE, task_id)
    return True


def updateTask(task_id: str, title: str | None = None, description: str | None = None) -> Task | None:
    """Update a task's title and/or description. Returns None if the task doesn't exist.

    Raises EmptyTaskTitleError if title is provided but blank.
    """
    task = getTask(task_id)
    if task is None:
        return None
    if title is not None:
        _requireNonEmptyTitle(title)
        task.title = title
    if description is not None:
        task.description = description
    task.updated_at = currentUtcIsoTimestamp()
    writeRecord(TASK_OBJECT_TYPE, task.id, _encodeTask(task))
    return task


def setTaskCompleted(task_id: str, completed: bool) -> Task | None:
    """Set a task's completed flag. Returns None if the task doesn't exist.

    Stamps completed_at with the current time on the False->True transition (left
    unchanged if the task is already completed, so re-completing doesn't lose the
    original completion moment), and clears it back to None whenever completed is False.
    """
    task = getTask(task_id)
    if task is None:
        return None
    task.completed = completed
    if completed:
        if task.completed_at is None:
            task.completed_at = currentUtcIsoTimestamp()
    else:
        task.completed_at = None
    task.updated_at = currentUtcIsoTimestamp()
    writeRecord(TASK_OBJECT_TYPE, task.id, _encodeTask(task))
    return task


def setTaskGroup(task_id: str, group_id: str | None) -> Task | None:
    """Assign a task to a group, or clear its group when group_id is None.

    Returns None if the task doesn't exist.
    """
    task = getTask(task_id)
    if task is None:
        return None
    task.group_id = group_id
    task.updated_at = currentUtcIsoTimestamp()
    writeRecord(TASK_OBJECT_TYPE, task.id, _encodeTask(task))
    return task


def setTaskEnergyRequirement(task_id: str, energy_requirement: int | None) -> Task | None:
    """Set a task's energy requirement (1-5), or clear it when energy_requirement is None.

    Returns None if the task doesn't exist.
    """
    return _applyFieldUpdate(task_id, lambda task: setattr(task, "energy_requirement", energy_requirement))


def setTaskImpact(task_id: str, impact: int | None) -> Task | None:
    """Set a task's impact (1-5), or clear it when impact is None.

    Returns None if the task doesn't exist.
    """
    return _applyFieldUpdate(task_id, lambda task: setattr(task, "impact", impact))


def setTaskDueDate(task_id: str, due_date: str | None) -> Task | None:
    """Set a task's due date (YYYY-MM-DD), or clear it when due_date is None.

    Returns None if the task doesn't exist.
    """
    return _applyFieldUpdate(task_id, lambda task: setattr(task, "due_date", due_date))


def setTaskTimeEstimateMinutes(task_id: str, time_estimate_minutes: int | None) -> Task | None:
    """Set a task's time estimate in minutes, or clear it when time_estimate_minutes is None.

    Returns None if the task doesn't exist.
    """
    return _applyFieldUpdate(
        task_id, lambda task: setattr(task, "time_estimate_minutes", time_estimate_minutes)
    )


def unassignTasksFromGroup(group_id: str) -> None:
    """Clear group_id on every task currently assigned to the given group.

    Used when that group is deleted, so its tasks fall back to "no group"
    instead of pointing at a group that no longer exists.
    """
    for task in getAllTasks():
        if task.group_id == group_id:
            setTaskGroup(task.id, None)


def reorderTasks(task_ids: list[str]) -> list[Task]:
    """Reassign order so tasks sort in the given id sequence. Unknown ids are skipped.

    Returns every task, freshly sorted by order.
    """
    reorderRecordsByIds(task_ids, getTask, _saveTaskAtOrder)
    return getAllTasks()


def getAllTasks() -> list[Task]:
    """Fetch every task, ordered by its persisted position (ascending)."""
    tasks = []
    for task_id in listRecordIds(TASK_OBJECT_TYPE):
        task = getTask(task_id)
        if task is not None:
            tasks.append(task)
    tasks.sort(key=lambda task: task.order)
    return tasks


def deleteAllTasks() -> None:
    """Delete every task record."""
    clearObjectType(TASK_OBJECT_TYPE)


def _requireNonEmptyTitle(title: str) -> None:
    """Raise EmptyTaskTitleError if title is blank (empty or whitespace-only)."""
    if not title.strip():
        raise EmptyTaskTitleError("Task title must not be empty")


def _nextTaskOrder() -> float:
    """The order value a newly created task should get: one past the current highest."""
    return computeNextOrder([task.order for task in getAllTasks()])


def _saveTaskAtOrder(task: Task, order: float) -> None:
    """Persist a task at a new order, stamping updated_at."""
    task.order = order
    task.updated_at = currentUtcIsoTimestamp()
    writeRecord(TASK_OBJECT_TYPE, task.id, _encodeTask(task))


def _applyFieldUpdate(task_id: str, mutate: Callable[[Task], None]) -> Task | None:
    """Shared scaffold for single-field setters: fetch, mutate in place, stamp updated_at, persist.

    Returns None if the task doesn't exist.
    """
    task = getTask(task_id)
    if task is None:
        return None
    mutate(task)
    task.updated_at = currentUtcIsoTimestamp()
    writeRecord(TASK_OBJECT_TYPE, task.id, _encodeTask(task))
    return task


def _encodeTask(task: Task) -> list[str]:
    """Encode a Task into the field list page_store expects, in TASK_FIELD_ORDER."""
    values = {
        "id": task.id,
        "title": task.title,
        "description": task.description,
        "completed": encodeBoolAsString(task.completed),
        "created_at": task.created_at,
        "updated_at": task.updated_at,
        "completed_at": task.completed_at if task.completed_at is not None else EMPTY_STRING,
        "order": str(task.order),
        "group_id": task.group_id if task.group_id is not None else EMPTY_STRING,
        "energy_requirement": encodeOptionalIntAsString(task.energy_requirement),
        "impact": encodeOptionalIntAsString(task.impact),
        "due_date": task.due_date if task.due_date is not None else EMPTY_STRING,
        "time_estimate_minutes": encodeOptionalIntAsString(task.time_estimate_minutes),
    }
    return [values[field] for field in TASK_FIELD_ORDER]


def _decodeTask(fields: list[str]) -> Task:
    """Decode a page_store field list (in TASK_FIELD_ORDER) back into a Task.

    completed_at, order, group_id, energy_requirement, impact, due_date, and
    time_estimate_minutes are read defensively since legacy records written before
    those fields existed have fewer fields on disk; zip() simply omits the key in
    that case, so missing ones default to None (or 0.0 for order).
    """
    values = buildDictFromKeysAndValues(TASK_FIELD_ORDER, fields)
    return Task(
        id=values["id"],
        title=values["title"],
        description=values["description"],
        completed=decodeBoolFromString(values["completed"]),
        created_at=values["created_at"],
        updated_at=values["updated_at"],
        completed_at=values.get("completed_at", EMPTY_STRING) or None,
        order=float(values.get("order") or 0.0),
        group_id=values.get("group_id", EMPTY_STRING) or None,
        energy_requirement=decodeOptionalIntFromString(values.get("energy_requirement", EMPTY_STRING)),
        impact=decodeOptionalIntFromString(values.get("impact", EMPTY_STRING)),
        due_date=values.get("due_date", EMPTY_STRING) or None,
        time_estimate_minutes=decodeOptionalIntFromString(values.get("time_estimate_minutes", EMPTY_STRING)),
    )
