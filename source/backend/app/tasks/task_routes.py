# @manualReviewRequested: 2026-07-06
"""HTTP routes for creating, listing, updating, and deleting tasks."""

from datetime import date

from flask import Blueprint, request

from core.auth.login_guard import login_required
from core.http.json_response import json_error, json_response
from app.tasks import task

task_blueprint = Blueprint("tasks", __name__, url_prefix="/api/tasks")

JSON_VALUE_BY_DURATION_BUCKET = task.JSON_VALUE_BY_DURATION_BUCKET
_parse_duration_bucket = task.parse_duration_bucket


@task_blueprint.get("")
@login_required
def list_tasks():
    """Lists every task, optionally filtered to one project via ?projectId=, to one parent
    task's direct subtasks via ?parentTaskId=, or to one block's nested tasks via ?blockId=. If
    more than one is given, projectId wins, then parentTaskId.
    """
    project_id = request.args.get("projectId")
    parent_task_id = request.args.get("parentTaskId")
    block_id = request.args.get("blockId")
    if project_id:
        blocks = task.find(project_id=project_id)
    elif parent_task_id:
        blocks = task.find(parent_task_id=parent_task_id)
    elif block_id:
        blocks = task.find(block_id=block_id)
    else:
        blocks = task.list_all()
    # Built from every task regardless of the filter above, since a subtask's own project_id
    # doesn't mirror its parent's — a project-filtered scan alone would miss subtasks.
    subtask_count_index = _build_subtask_count_index(task.list_all())
    return json_response([serialize_task(block, subtask_count_index) for block in blocks])


@task_blueprint.post("")
@login_required
def create_task():
    """Creates a task.

    Body: {"title": str, "description"?: str, "projectId"?: str, "workspaceId"?: str,
        "blockId"?: str, "parentTaskId"?: str, "tags"?: [str], "dueDate"?: "YYYY-MM-DD",
        "scheduledAt"?: str, "isSkippable"?: bool, "durationBucket"?: str (one of
        DURATION_BUCKET_BY_JSON_VALUE's keys) | null, "estimatedMinutes"?: int}. A non-empty
        parentTaskId is rejected with a 400
        if the target parent is itself already a subtask (nesting is capped at a single level).
        order is never client-supplied — it's always computed server-side (see task.create).
    Raises (as a 400 response): ValueError if durationBucket is given and not recognized.
    """
    body = request.get_json(force=True, silent=True) or {}
    parent_task_id = body.get("parentTaskId", "")
    if parent_task_id and _is_nested_task(parent_task_id):
        return json_error("A subtask cannot itself have subtasks.")

    try:
        created = task.create(
            body.get("title", ""),
            description=body.get("description", ""),
            project_id=body.get("projectId", ""),
            workspace_id=body.get("workspaceId", ""),
            block_id=body.get("blockId", ""),
            parent_task_id=parent_task_id,
            tags=body.get("tags"),
            due_date=date.fromisoformat(body["dueDate"]) if body.get("dueDate") else None,
            scheduled_at=body.get("scheduledAt", ""),
            is_skippable=body["isSkippable"] if "isSkippable" in body else None,
            duration_bucket=_parse_duration_bucket(body.get("durationBucket")),
            estimated_minutes=body.get("estimatedMinutes", 0),
        )
    except ValueError as error:
        return json_error(str(error))
    return json_response(serialize_task(created), 201)


@task_blueprint.get("/<task_id>")
@login_required
def get_task(task_id):
    """Reads a single task."""
    return json_response(serialize_task(task.load(task_id)))


@task_blueprint.patch("/<task_id>")
@login_required
def update_task(task_id):
    """Updates one or more of a task's fields.

    Body: any of {"title": str, "description": str, "projectId": str, "workspaceId": str,
        "blockId": str, "parentTaskId": str, "isArchived": bool, "isSkippable": bool, "tags": [str],
        "dueDate": "YYYY-MM-DD" | None, "scheduledAt": str, "isComplete": bool, "isSkipped": bool,
        "order": int, "durationBucket": str (one of DURATION_BUCKET_BY_JSON_VALUE's keys) | None,
        "estimatedMinutes": int}. Setting isComplete to true is rejected with a 400 while any of
        the task's subtasks are neither complete nor skipped. isComplete and isSkipped are
        mutually exclusive — setting either one to true clears the other.
    Raises (as a 400 response): ValueError if durationBucket is given and not recognized.
    """
    block = task.load(task_id)
    body = request.get_json(force=True, silent=True) or {}
    if "title" in body:
        task.set_title(body["title"], block=block)
    if "description" in body:
        task.set_description(body["description"], block=block)
    if "projectId" in body:
        task.set_project_id(body["projectId"], block=block)
    if "workspaceId" in body:
        task.set_workspace_id(body["workspaceId"], block=block)
    if "blockId" in body:
        task.set_block_id(body["blockId"], block=block)
    if "estimatedMinutes" in body:
        task.set_estimated_minutes(int(body["estimatedMinutes"]), block=block)
    if "parentTaskId" in body:
        new_parent_task_id = body["parentTaskId"]
        if new_parent_task_id and _is_nested_task(new_parent_task_id):
            return json_error("A subtask cannot itself have subtasks.")
        task.set_parent_task_id(new_parent_task_id, block=block)
    if "isArchived" in body:
        task.set_is_archived(bool(body["isArchived"]), block=block)
    if "isSkippable" in body:
        task.set_is_skippable(bool(body["isSkippable"]), block=block)
    if "tags" in body:
        task.set_tags(body["tags"], block=block)
    if "dueDate" in body:
        task.set_due_date(date.fromisoformat(body["dueDate"]) if body["dueDate"] else None, block=block)
    if "scheduledAt" in body:
        task.set_scheduled_at(body["scheduledAt"], block=block)
    if "order" in body:
        task.set_order(int(body["order"]), block=block)
    if "durationBucket" in body:
        try:
            task.set_duration_bucket(_parse_duration_bucket(body["durationBucket"]), block=block)
        except ValueError as error:
            return json_error(str(error))

    if body.get("isComplete") is True and body.get("isSkipped") is True:
        return json_error("A task cannot be both complete and skipped.")
    if "isComplete" in body:
        is_complete = bool(body["isComplete"])
        if is_complete and _has_unresolved_subtasks(task_id):
            return json_error("All subtasks must be completed or skipped first.")
        task.set_is_complete(is_complete, block=block)
        if is_complete:
            task.set_is_skipped(False, block=block)
    if "isSkipped" in body:
        is_skipped = bool(body["isSkipped"])
        task.set_is_skipped(is_skipped, block=block)
        if is_skipped:
            task.set_is_complete(False, block=block)

    task.save(block)
    return json_response(serialize_task(block))


@task_blueprint.delete("/<task_id>")
@login_required
def delete_task(task_id):
    """Deletes a task and every one of its subtasks (nesting is capped at a single level, so this
    is a single non-recursive pass).
    """
    for subtask_block in task.find(parent_task_id=task_id):
        task.delete(task.get_id(block=subtask_block))
    task.delete(task_id)
    return "", 204


def serialize_task(block, subtask_count_index: dict[str, dict[str, int]] | None = None) -> dict:
    """Turns a Task record block into the JSON shape the frontend expects. Public (not
    underscore-prefixed) because app/journals/today_routes.py reuses it to serialize the same
    tasks in the Today view.

    Inputs: subtask_count_index, an optional {parentTaskId: {"completed", "total"}} map (see
        _build_subtask_count_index) letting a whole list response compute every row's subtask
        count in one pass instead of one task.find(parent_task_id=...) call per row. Omitted for
        single-task responses (create/get/update), which just get a null subtaskCount.
    """
    due_date = task.get_due_date(block=block)
    duration_bucket = task.get_duration_bucket(block=block)
    task_id = task.get_id(block=block)
    return {
        "id": task_id,
        "title": task.get_title(block=block),
        "description": task.get_description(block=block),
        "projectId": task.get_project_id(block=block),
        "workspaceId": task.get_workspace_id(block=block),
        "blockId": task.get_block_id(block=block),
        "parentTaskId": task.get_parent_task_id(block=block),
        "isArchived": task.get_is_archived(block=block),
        "isSkippable": task.get_is_skippable(block=block),
        "createdAt": task.get_created_at(block=block),
        "tags": task.get_tags(block=block),
        "dueDate": due_date.isoformat() if due_date else None,
        "scheduledAt": task.get_scheduled_at(block=block),
        "isComplete": task.get_is_complete(block=block),
        "isSkipped": task.get_is_skipped(block=block),
        "completedAt": task.get_completed_at(block=block),
        "order": task.get_order(block=block),
        "durationBucket": (
            JSON_VALUE_BY_DURATION_BUCKET[duration_bucket] if duration_bucket is not None else None
        ),
        "estimatedMinutes": task.get_estimated_minutes(block=block),
        "subtaskCount": (subtask_count_index.get(task_id) if subtask_count_index is not None else None),
    }


def _build_subtask_count_index(blocks) -> dict[str, dict[str, int]]:
    """Groups every given task by its parent_task_id in one pass, so a whole list response can
    look up each row's subtask progress in O(1) instead of one task.find(parent_task_id=...) call
    per row. "completed" counts only strictly-complete subtasks (a skipped one doesn't count
    toward the numerator, only the denominator), consistent with
    app/journals/today_engine.get_block_completion_calendar's definition.
    """
    blocks_by_parent_id: dict[str, list] = {}
    for block in blocks:
        parent_task_id = task.get_parent_task_id(block=block)
        if parent_task_id:
            blocks_by_parent_id.setdefault(parent_task_id, []).append(block)
    return {
        parent_task_id: {
            "completed": sum(1 for subtask in subtasks if task.get_is_complete(block=subtask)),
            "total": len(subtasks),
        }
        for parent_task_id, subtasks in blocks_by_parent_id.items()
    }


def _is_nested_task(task_id: str) -> bool:
    """True if the given task itself already has a non-empty parent_task_id — i.e. it's already a
    subtask, so it cannot also become a parent (nesting is capped at a single level).
    """
    candidate = task.load(task_id)
    return task.get_parent_task_id(block=candidate) != ""


def _has_unresolved_subtasks(task_id: str) -> bool:
    """Checks whether any of a task's subtasks are neither complete nor skipped."""
    return any(
        not task.get_is_complete(block=block) and not task.get_is_skipped(block=block)
        for block in task.find(parent_task_id=task_id)
    )
