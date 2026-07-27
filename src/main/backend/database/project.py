"""Project records: business-facing wrapper around the common page_store engine."""
from lib.python.collections.dict_utils import buildDictFromKeysAndValues
from lib.python.date.utc_timestamp import currentUtcIsoTimestamp
from src.common.backend.database.ids import generateRecordId
from src.main.backend.database.models import Project
from src.main.backend.database.record_store import (
    deleteRecord,
    listRecordIds,
    readRecord,
    writeRecord,
)
from src.main.backend.database.task import unassignTasksFromProject

PROJECT_OBJECT_TYPE = "project"
PROJECT_FIELD_ORDER = ["id", "name", "created_at", "updated_at", "order"]


class EmptyProjectNameError(ValueError):
    """Raised when creating a project with a blank name."""


def createProject(name: str) -> Project:
    """Create and persist a new project. Raises EmptyProjectNameError if name is blank."""
    _requireNonEmptyName(name)
    now = currentUtcIsoTimestamp()
    project = Project(
        id=generateRecordId(),
        name=name,
        created_at=now,
        updated_at=now,
        order=_nextProjectOrder(),
    )
    writeRecord(PROJECT_OBJECT_TYPE, project.id, _encodeProject(project))
    return project


def getProject(project_id: str) -> Project | None:
    """Fetch a project by id, or None if no project with that id exists."""
    fields = readRecord(PROJECT_OBJECT_TYPE, project_id)
    if fields is None:
        return None
    return _decodeProject(fields)


def getAllProjects() -> list[Project]:
    """Fetch every project, ordered by its persisted position (ascending)."""
    projects = []
    for project_id in listRecordIds(PROJECT_OBJECT_TYPE):
        project = getProject(project_id)
        if project is not None:
            projects.append(project)
    projects.sort(key=lambda project: project.order)
    return projects


def deleteProject(project_id: str) -> bool:
    """Delete a project, unassigning every task in it first. Returns False if it doesn't exist."""
    project = getProject(project_id)
    if project is None:
        return False
    unassignTasksFromProject(project_id)
    deleteRecord(PROJECT_OBJECT_TYPE, project_id)
    return True


def _requireNonEmptyName(name: str) -> None:
    """Raise EmptyProjectNameError if name is blank (empty or whitespace-only)."""
    if not name.strip():
        raise EmptyProjectNameError("Project name must not be empty")


def _nextProjectOrder() -> float:
    """The order value a newly created project should get: one past the current highest."""
    existing_orders = [project.order for project in getAllProjects()]
    return max(existing_orders, default=-1.0) + 1


def _encodeProject(project: Project) -> list[str]:
    """Encode a Project into the field list page_store expects, in PROJECT_FIELD_ORDER."""
    values = {
        "id": project.id,
        "name": project.name,
        "created_at": project.created_at,
        "updated_at": project.updated_at,
        "order": str(project.order),
    }
    return [values[field] for field in PROJECT_FIELD_ORDER]


def _decodeProject(fields: list[str]) -> Project:
    """Decode a page_store field list (in PROJECT_FIELD_ORDER) back into a Project."""
    values = buildDictFromKeysAndValues(PROJECT_FIELD_ORDER, fields)
    return Project(
        id=values["id"],
        name=values["name"],
        created_at=values["created_at"],
        updated_at=values["updated_at"],
        order=float(values.get("order") or 0.0),
    )
