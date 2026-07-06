# @manualReviewRequested: 2026-07-06
"""HTTP routes for creating, listing, updating, and deleting projects."""

from flask import Blueprint, jsonify, request

from core.auth.login_guard import login_required
from app.projects import project
from app.tasks import subtask, task

project_blueprint = Blueprint("projects", __name__, url_prefix="/api/projects")


@project_blueprint.get("")
@login_required
def list_projects():
    """Lists every project."""
    return jsonify([_serialize(block) for block in project.list_all()])


@project_blueprint.post("")
@login_required
def create_project():
    """Creates a project.

    Body: {"title": str, "description"?: str, "parentProjectId"?: str}.
    """
    body = request.get_json(force=True, silent=True) or {}
    created = project.create(
        body.get("title", ""),
        description=body.get("description", ""),
        parent_project_id=body.get("parentProjectId", ""),
    )
    return jsonify(_serialize(created)), 201


@project_blueprint.get("/<project_id>")
@login_required
def get_project(project_id):
    """Reads a single project."""
    return jsonify(_serialize(project.load(project_id)))


@project_blueprint.patch("/<project_id>")
@login_required
def update_project(project_id):
    """Updates one or more of a project's fields.

    Body: any of {"title": str, "description": str, "parentProjectId": str, "isArchived": bool}.
    """
    block = project.load(project_id)
    body = request.get_json(force=True, silent=True) or {}
    if "title" in body:
        project.set_title(body["title"], block=block)
    if "description" in body:
        project.set_description(body["description"], block=block)
    if "parentProjectId" in body:
        project.set_parent_project_id(body["parentProjectId"], block=block)
    if "isArchived" in body:
        project.set_is_archived(bool(body["isArchived"]), block=block)
    project.save(block)
    return jsonify(_serialize(block))


@project_blueprint.delete("/<project_id>")
@login_required
def delete_project(project_id):
    """Deletes a project and, recursively, everything beneath it — its subprojects, and every
    task (with its subtasks) owned by this project or any of those subprojects.

    Body: {"moveChildrenToProjectId"?: str} — if given, only this project's *direct* tasks and
        direct subprojects are reassigned there instead, and this project alone is deleted;
        deeper descendants of a moved subproject are untouched, since they move along with it.
    """
    body = request.get_json(force=True, silent=True) or {}
    move_children_to_project_id = body.get("moveChildrenToProjectId")

    if move_children_to_project_id:
        _reassign_children(project_id, move_children_to_project_id)
        project.delete(project_id)
    else:
        _delete_project_recursively(project_id)

    return "", 204


def _serialize(block) -> dict:
    """Turns a Project record block into the JSON shape the frontend expects."""
    return {
        "id": project.get_id(block=block),
        "title": project.get_title(block=block),
        "description": project.get_description(block=block),
        "parentProjectId": project.get_parent_project_id(block=block),
        "isArchived": project.get_is_archived(block=block),
        "createdAt": project.get_created_at(block=block),
    }


# --- --- --- ---
# Internal helpers


def _reassign_children(project_id: str, target_project_id: str) -> None:
    """Reassigns a project's direct tasks and direct subprojects to another project."""
    for owned_task in task.find(project_id=project_id):
        task.set_project_id(target_project_id, block=owned_task)
        task.save(owned_task)
    for child_project in project.find(parent_project_id=project_id):
        project.set_parent_project_id(target_project_id, block=child_project)
        project.save(child_project)


def _delete_project_recursively(project_id: str) -> None:
    """Deletes every subproject beneath a project (depth-first, so descendants are removed
    before their parent), then the project's own tasks (and their subtasks), then the project
    itself.
    """
    for child_project in project.find(parent_project_id=project_id):
        _delete_project_recursively(project.get_id(block=child_project))
    for owned_task in task.find(project_id=project_id):
        owned_task_id = task.get_id(block=owned_task)
        subtask.delete_all_for_task(owned_task_id)
        task.delete(owned_task_id)
    project.delete(project_id)
