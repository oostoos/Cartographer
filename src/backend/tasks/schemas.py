"""Request payload shapes for the /api/tasks routes, validated directly here.

Mirrored on the frontend by src/frontend/tasks/tasks-api.ts.
"""
from dataclasses import dataclass

from lib.language.python.validation.date_checks import isIsoDateString
from lib.language.python.validation.numeric_checks import isIntInRange, isMultipleOf
from lib.language.python.validation.type_checks import isDict, isInt, isList, isString
from src.backend.request_validation import (
    REQUEST_BODY_MUST_BE_JSON_OBJECT_ERROR,
    InvalidPayloadError,
)
from src.backend.tasks.task_field_bounds import (
    TASK_SCALE_MAXIMUM,
    TASK_SCALE_MINIMUM,
    TASK_TIME_ESTIMATE_STEP_MINUTES,
)

__all__ = [
    "InvalidPayloadError",
    "TaskCreatePayload",
    "TaskDueDatePayload",
    "TaskEnergyRequirementPayload",
    "TaskImpactPayload",
    "TaskReorderPayload",
    "TaskTimeEstimateMinutesPayload",
    "TaskUpdatePayload",
    "parseTaskCreatePayload",
    "parseTaskDueDatePayload",
    "parseTaskEnergyRequirementPayload",
    "parseTaskImpactPayload",
    "parseTaskReorderPayload",
    "parseTaskTimeEstimateMinutesPayload",
    "parseTaskUpdatePayload",
]

DESCRIPTION_MUST_BE_STRING_ERROR = "'description' must be a string"
DUE_DATE_MUST_BE_ISO_DATE_STRING_ERROR = "'due_date' must be a date string in YYYY-MM-DD format, or null"
TIME_ESTIMATE_MINUTES_INVALID_ERROR = (
    f"'time_estimate_minutes' must be a multiple of {TASK_TIME_ESTIMATE_STEP_MINUTES} "
    f"of at least {TASK_TIME_ESTIMATE_STEP_MINUTES}, or null"
)


@dataclass
class TaskCreatePayload:
    """Body shape for POST /api/tasks."""

    title: str
    description: str
    group_id: str | None


@dataclass
class TaskUpdatePayload:
    """Body shape for PATCH /api/tasks/<id>. Omitted fields are left unchanged."""

    title: str | None
    description: str | None


def parseTaskCreatePayload(data: object) -> TaskCreatePayload:
    """Parse and validate a task-create request body. Raises InvalidPayloadError if malformed."""
    if not isDict(data):
        raise InvalidPayloadError(REQUEST_BODY_MUST_BE_JSON_OBJECT_ERROR)

    title = data.get("title")
    if not isString(title):
        raise InvalidPayloadError("'title' is required and must be a string")

    description = data.get("description", "")
    if not isString(description):
        raise InvalidPayloadError(DESCRIPTION_MUST_BE_STRING_ERROR)

    group_id = data.get("group_id")
    if group_id is not None and not isString(group_id):
        raise InvalidPayloadError("'group_id' must be a string or null")

    return TaskCreatePayload(title=title, description=description, group_id=group_id)


def parseTaskUpdatePayload(data: object) -> TaskUpdatePayload:
    """Parse and validate a task-update request body. Raises InvalidPayloadError if malformed."""
    if not isDict(data):
        raise InvalidPayloadError(REQUEST_BODY_MUST_BE_JSON_OBJECT_ERROR)

    title = data.get("title")
    if title is not None and not isString(title):
        raise InvalidPayloadError("'title' must be a string")

    description = data.get("description")
    if description is not None and not isString(description):
        raise InvalidPayloadError(DESCRIPTION_MUST_BE_STRING_ERROR)

    return TaskUpdatePayload(title=title, description=description)


@dataclass
class TaskReorderPayload:
    """Body shape for PATCH /api/tasks/reorder."""

    task_ids: list[str]


def parseTaskReorderPayload(data: object) -> TaskReorderPayload:
    """Parse and validate a task-reorder request body. Raises InvalidPayloadError if malformed."""
    if not isDict(data):
        raise InvalidPayloadError(REQUEST_BODY_MUST_BE_JSON_OBJECT_ERROR)

    task_ids = data.get("task_ids")
    if not isList(task_ids) or not all(isString(task_id) for task_id in task_ids):
        raise InvalidPayloadError("'task_ids' is required and must be a list of strings")

    return TaskReorderPayload(task_ids=task_ids)


@dataclass
class TaskEnergyRequirementPayload:
    """Body shape for PATCH /api/tasks/<id>/energy."""

    energy_requirement: int | None


@dataclass
class TaskImpactPayload:
    """Body shape for PATCH /api/tasks/<id>/impact."""

    impact: int | None


@dataclass
class TaskDueDatePayload:
    """Body shape for PATCH /api/tasks/<id>/due-date."""

    due_date: str | None


@dataclass
class TaskTimeEstimateMinutesPayload:
    """Body shape for PATCH /api/tasks/<id>/time-estimate."""

    time_estimate_minutes: int | None


def _isValidScaleValue(value: object) -> bool:
    """True if value is None or an int within the 1-5 scale bounds."""
    if value is None:
        return True
    return isInt(value) and isIntInRange(value, TASK_SCALE_MINIMUM, TASK_SCALE_MAXIMUM)


def _buildScaleValueError(field_name: str) -> str:
    """Error message for a scale field (energy_requirement/impact) outside 1-5 or non-int."""
    return f"'{field_name}' must be an integer between {TASK_SCALE_MINIMUM} and {TASK_SCALE_MAXIMUM}, or null"


def parseTaskEnergyRequirementPayload(data: object) -> TaskEnergyRequirementPayload:
    """Parse and validate a task energy-requirement request body. Raises InvalidPayloadError if malformed."""
    if not isDict(data):
        raise InvalidPayloadError(REQUEST_BODY_MUST_BE_JSON_OBJECT_ERROR)

    energy_requirement = data.get("energy_requirement")
    if not _isValidScaleValue(energy_requirement):
        raise InvalidPayloadError(_buildScaleValueError("energy_requirement"))

    return TaskEnergyRequirementPayload(energy_requirement=energy_requirement)


def parseTaskImpactPayload(data: object) -> TaskImpactPayload:
    """Parse and validate a task impact request body. Raises InvalidPayloadError if malformed."""
    if not isDict(data):
        raise InvalidPayloadError(REQUEST_BODY_MUST_BE_JSON_OBJECT_ERROR)

    impact = data.get("impact")
    if not _isValidScaleValue(impact):
        raise InvalidPayloadError(_buildScaleValueError("impact"))

    return TaskImpactPayload(impact=impact)


def parseTaskDueDatePayload(data: object) -> TaskDueDatePayload:
    """Parse and validate a task due-date request body. Raises InvalidPayloadError if malformed."""
    if not isDict(data):
        raise InvalidPayloadError(REQUEST_BODY_MUST_BE_JSON_OBJECT_ERROR)

    due_date = data.get("due_date")
    if due_date is not None and not isIsoDateString(due_date):
        raise InvalidPayloadError(DUE_DATE_MUST_BE_ISO_DATE_STRING_ERROR)

    return TaskDueDatePayload(due_date=due_date)


def _isValidTimeEstimate(value: object) -> bool:
    """True if value is None or a positive int multiple of the 15-minute step."""
    if value is None:
        return True
    return (
        isInt(value)
        and value >= TASK_TIME_ESTIMATE_STEP_MINUTES
        and isMultipleOf(value, TASK_TIME_ESTIMATE_STEP_MINUTES)
    )


def parseTaskTimeEstimateMinutesPayload(data: object) -> TaskTimeEstimateMinutesPayload:
    """Parse and validate a task time-estimate request body. Raises InvalidPayloadError if malformed."""
    if not isDict(data):
        raise InvalidPayloadError(REQUEST_BODY_MUST_BE_JSON_OBJECT_ERROR)

    time_estimate_minutes = data.get("time_estimate_minutes")
    if not _isValidTimeEstimate(time_estimate_minutes):
        raise InvalidPayloadError(TIME_ESTIMATE_MINUTES_INVALID_ERROR)

    return TaskTimeEstimateMinutesPayload(time_estimate_minutes=time_estimate_minutes)
