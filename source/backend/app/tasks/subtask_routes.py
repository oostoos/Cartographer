"""HTTP routes for creating, listing, updating, and deleting subtasks."""

from flask import Blueprint, jsonify, request

from core.auth.login_guard import login_required
from app.tasks import subtask

subtask_blueprint = Blueprint("subtasks", __name__, url_prefix="/api/subtasks")


@subtask_blueprint.get("")
@login_required
def list_subtasks():
    """Lists every subtask belonging to one task, oldest first.

    Query: taskId, required — subtasks have no meaning outside of a task.
    """
    task_id = request.args.get("taskId")
    blocks = subtask.find(task_id=task_id) if task_id else []
    blocks.sort(key=lambda block: subtask.get_created_at(block=block))
    return jsonify([_serialize(block) for block in blocks])


@subtask_blueprint.post("")
@login_required
def create_subtask():
    """Creates a subtask.

    Body: {"taskId": str, "title": str}.
    """
    body = request.get_json(force=True, silent=True) or {}
    created = subtask.create(body.get("taskId", ""), body.get("title", ""))
    return jsonify(_serialize(created)), 201


@subtask_blueprint.get("/<subtask_id>")
@login_required
def get_subtask(subtask_id):
    """Reads a single subtask."""
    return jsonify(_serialize(subtask.load(subtask_id)))


@subtask_blueprint.patch("/<subtask_id>")
@login_required
def update_subtask(subtask_id):
    """Updates one or more of a subtask's fields.

    Body: any of {"title": str, "isComplete": bool, "isSkipped": bool}. Setting isComplete to
        true clears isSkipped (and vice versa) so a subtask is never both at once.
    """
    block = subtask.load(subtask_id)
    body = request.get_json(force=True, silent=True) or {}
    if "title" in body:
        subtask.set_title(body["title"], block=block)
    if body.get("isComplete") is True:
        subtask.set_is_complete(True, block=block)
        subtask.set_is_skipped(False, block=block)
    elif body.get("isSkipped") is True:
        subtask.set_is_skipped(True, block=block)
        subtask.set_is_complete(False, block=block)
    else:
        if "isComplete" in body:
            subtask.set_is_complete(bool(body["isComplete"]), block=block)
        if "isSkipped" in body:
            subtask.set_is_skipped(bool(body["isSkipped"]), block=block)
    subtask.save(block)
    return jsonify(_serialize(block))


@subtask_blueprint.delete("/<subtask_id>")
@login_required
def delete_subtask(subtask_id):
    """Deletes a subtask."""
    subtask.delete(subtask_id)
    return "", 204


def _serialize(block) -> dict:
    """Turns a Subtask record block into the JSON shape the frontend expects."""
    return {
        "id": subtask.get_id(block=block),
        "taskId": subtask.get_task_id(block=block),
        "title": subtask.get_title(block=block),
        "isComplete": subtask.get_is_complete(block=block),
        "isSkipped": subtask.get_is_skipped(block=block),
        "createdAt": subtask.get_created_at(block=block),
    }
