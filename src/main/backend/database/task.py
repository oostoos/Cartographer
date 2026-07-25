"""Task records: business-facing wrapper around the common page_store engine."""
from lib.python.date.utc_timestamp import currentUtcIsoTimestamp
from src.common.backend.database.ids import generateRecordId
from src.main.backend.database.models import Task
from src.main.backend.database.record_store import (
    clearObjectType,
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
]

COMPLETED_TRUE_VALUE = "true"
COMPLETED_FALSE_VALUE = "false"
EMPTY_COMPLETED_AT_VALUE = ""


class EmptyTaskTitleError(ValueError):
    """Raised when creating or updating a task with a blank title."""


def createTask(title: str, description: str = "") -> Task:
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
    )
    writeRecord(TASK_OBJECT_TYPE, task.id, _encodeTask(task))
    return task


def getTask(task_id: str) -> Task | None:
    """Fetch a task by id, or None if no task with that id exists."""
    fields = readRecord(TASK_OBJECT_TYPE, task_id)
    if fields is None:
        return None
    return _decodeTask(fields)


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


def getAllTasks() -> list[Task]:
    """Fetch every task, in no particular order."""
    tasks = []
    for task_id in listRecordIds(TASK_OBJECT_TYPE):
        task = getTask(task_id)
        if task is not None:
            tasks.append(task)
    return tasks


def deleteAllTasks() -> None:
    """Delete every task record."""
    clearObjectType(TASK_OBJECT_TYPE)


def _requireNonEmptyTitle(title: str) -> None:
    """Raise EmptyTaskTitleError if title is blank (empty or whitespace-only)."""
    if not title.strip():
        raise EmptyTaskTitleError("Task title must not be empty")


def _encodeTask(task: Task) -> list[str]:
    """Encode a Task into the field list page_store expects, in TASK_FIELD_ORDER."""
    values = {
        "id": task.id,
        "title": task.title,
        "description": task.description,
        "completed": COMPLETED_TRUE_VALUE if task.completed else COMPLETED_FALSE_VALUE,
        "created_at": task.created_at,
        "updated_at": task.updated_at,
        "completed_at": task.completed_at if task.completed_at is not None else EMPTY_COMPLETED_AT_VALUE,
    }
    return [values[field] for field in TASK_FIELD_ORDER]


def _decodeTask(fields: list[str]) -> Task:
    """Decode a page_store field list (in TASK_FIELD_ORDER) back into a Task.

    completed_at is read defensively since legacy records written before this field
    existed only have 6 fields on disk; zip() simply omits the key in that case.
    """
    values = dict(zip(TASK_FIELD_ORDER, fields))
    return Task(
        id=values["id"],
        title=values["title"],
        description=values["description"],
        completed=values["completed"] == COMPLETED_TRUE_VALUE,
        created_at=values["created_at"],
        updated_at=values["updated_at"],
        completed_at=values.get("completed_at", EMPTY_COMPLETED_AT_VALUE) or None,
    )
