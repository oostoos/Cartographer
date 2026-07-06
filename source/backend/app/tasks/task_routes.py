"""HTTP routes for creating, listing, updating, and deleting tasks."""

from datetime import date

from flask import Blueprint, jsonify, request

from core.auth.login_guard import login_required
from app.tasks import subtask, task

task_blueprint = Blueprint("tasks", __name__, url_prefix="/api/tasks")


@task_blueprint.get("")
@login_required
def list_tasks():
    """Lists every task, optionally filtered to one project via ?projectId=."""
    project_id = request.args.get("projectId")
    blocks = task.find(project_id=project_id) if project_id else task.list_all()
    return jsonify([serialize_task(block) for block in blocks])


@task_blueprint.post("")
@login_required
def create_task():
    """Creates a task.

    Body: {"title": str, "description"?: str, "projectId"?: str, "recurringTemplateId"?: str,
        "tags"?: [str], "dueDate"?: "YYYY-MM-DD", "scheduledAt"?: str}.
    """
    body = request.get_json(force=True, silent=True) or {}
    created = task.create(
        body.get("title", ""),
        description=body.get("description", ""),
        project_id=body.get("projectId", ""),
        recurring_template_id=body.get("recurringTemplateId", ""),
        tags=body.get("tags"),
        due_date=date.fromisoformat(body["dueDate"]) if body.get("dueDate") else None,
        scheduled_at=body.get("scheduledAt", ""),
    )
    return jsonify(serialize_task(created)), 201


@task_blueprint.get("/<task_id>")
@login_required
def get_task(task_id):
    """Reads a single task."""
    return jsonify(serialize_task(task.load(task_id)))


@task_blueprint.patch("/<task_id>")
@login_required
def update_task(task_id):
    """Updates one or more of a task's fields.

    Body: any of {"title": str, "description": str, "projectId": str, "recurringTemplateId": str,
        "isArchived": bool, "tags": [str], "dueDate": "YYYY-MM-DD" | None, "scheduledAt": str,
        "isComplete": bool}. Setting isComplete to true is rejected with a 400 while any of the
        task's subtasks are neither complete nor skipped.
    """
    block = task.load(task_id)
    body = request.get_json(force=True, silent=True) or {}
    if "title" in body:
        task.set_title(body["title"], block=block)
    if "description" in body:
        task.set_description(body["description"], block=block)
    if "projectId" in body:
        task.set_project_id(body["projectId"], block=block)
    if "recurringTemplateId" in body:
        task.set_recurring_template_id(body["recurringTemplateId"], block=block)
    if "isArchived" in body:
        task.set_is_archived(bool(body["isArchived"]), block=block)
    if "tags" in body:
        task.set_tags(body["tags"], block=block)
    if "dueDate" in body:
        task.set_due_date(date.fromisoformat(body["dueDate"]) if body["dueDate"] else None, block=block)
    if "scheduledAt" in body:
        task.set_scheduled_at(body["scheduledAt"], block=block)
    if "isComplete" in body:
        is_complete = bool(body["isComplete"])
        if is_complete and _has_unresolved_subtasks(task_id):
            return jsonify(error="All subtasks must be completed or skipped first."), 400
        task.set_is_complete(is_complete, block=block)
    task.save(block)
    return jsonify(serialize_task(block))


@task_blueprint.delete("/<task_id>")
@login_required
def delete_task(task_id):
    """Deletes a task and every one of its subtasks."""
    subtask.delete_all_for_task(task_id)
    task.delete(task_id)
    return "", 204


def serialize_task(block) -> dict:
    """Turns a Task record block into the JSON shape the frontend expects. Public (not
    underscore-prefixed) because app/journals/today_routes.py reuses it to serialize the same
    tasks in the Today view.
    """
    due_date = task.get_due_date(block=block)
    return {
        "id": task.get_id(block=block),
        "title": task.get_title(block=block),
        "description": task.get_description(block=block),
        "projectId": task.get_project_id(block=block),
        "recurringTemplateId": task.get_recurring_template_id(block=block),
        "isArchived": task.get_is_archived(block=block),
        "createdAt": task.get_created_at(block=block),
        "tags": task.get_tags(block=block),
        "dueDate": due_date.isoformat() if due_date else None,
        "scheduledAt": task.get_scheduled_at(block=block),
        "isComplete": task.get_is_complete(block=block),
        "completedAt": task.get_completed_at(block=block),
    }


def _has_unresolved_subtasks(task_id: str) -> bool:
    """Checks whether any of a task's subtasks are neither complete nor skipped."""
    return any(
        not subtask.get_is_complete(block=block) and not subtask.get_is_skipped(block=block)
        for block in subtask.find(task_id=task_id)
    )
