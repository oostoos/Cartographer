# @manualReviewRequested: 2026-07-07
"""HTTP routes for creating, listing, updating, and deleting workspaces."""

from flask import Blueprint, request

from core.auth.login_guard import login_required
from core.http.json_response import json_response
from app.blocks import block_template
from app.journals import note
from app.projects import project
from app.tasks import task
from app.workspaces import workspace

workspace_blueprint = Blueprint("workspaces", __name__, url_prefix="/api/workspaces")


@workspace_blueprint.get("")
@login_required
def list_workspaces():
    """Lists every workspace."""
    return json_response([_serialize(block) for block in workspace.list_all()])


@workspace_blueprint.post("")
@login_required
def create_workspace():
    """Creates a workspace.

    Body: {"title": str, "description"?: str, "color"?: str}.
    """
    body = request.get_json(force=True, silent=True) or {}
    created = workspace.create(
        body.get("title", ""),
        description=body.get("description", ""),
        color=body.get("color", ""),
    )
    return json_response(_serialize(created), 201)


@workspace_blueprint.get("/<workspace_id>")
@login_required
def get_workspace(workspace_id):
    """Reads a single workspace."""
    return json_response(_serialize(workspace.load(workspace_id)))


@workspace_blueprint.patch("/<workspace_id>")
@login_required
def update_workspace(workspace_id):
    """Updates one or more of a workspace's fields.

    Body: any of {"title": str, "description": str, "color": str, "isArchived": bool}.
    """
    block = workspace.load(workspace_id)
    body = request.get_json(force=True, silent=True) or {}
    if "title" in body:
        workspace.set_title(body["title"], block=block)
    if "description" in body:
        workspace.set_description(body["description"], block=block)
    if "color" in body:
        workspace.set_color(body["color"], block=block)
    if "isArchived" in body:
        workspace.set_is_archived(bool(body["isArchived"]), block=block)
    workspace.save(block)
    return json_response(_serialize(block))


@workspace_blueprint.delete("/<workspace_id>")
@login_required
def delete_workspace(workspace_id):
    """Deletes a workspace and unassigns every task/project/note/block template that pointed to
    it — a workspace is a collection lens, not an owning parent, so deleting it never deletes
    what it was looking at.
    """
    _unassign_workspace(workspace_id)
    workspace.delete(workspace_id)
    return "", 204


def _serialize(block) -> dict:
    """Turns a Workspace record block into the JSON shape the frontend expects."""
    return {
        "id": workspace.get_id(block=block),
        "title": workspace.get_title(block=block),
        "description": workspace.get_description(block=block),
        "color": workspace.get_color(block=block),
        "isArchived": workspace.get_is_archived(block=block),
        "createdAt": workspace.get_created_at(block=block),
    }


# --- --- --- ---
# Internal helpers


def _unassign_workspace(workspace_id: str) -> None:
    """Clears workspace_id (back to unassigned) on every task, project, note, and block template
    currently pointing at workspace_id.
    """
    for owned_task in task.find(workspace_id=workspace_id):
        task.set_workspace_id("", block=owned_task)
        task.save(owned_task)
    for owned_project in project.find(workspace_id=workspace_id):
        project.set_workspace_id("", block=owned_project)
        project.save(owned_project)
    for owned_note in note.find(workspace_id=workspace_id):
        note.set_workspace_id("", block=owned_note)
        note.save(owned_note)
    for owned_template in block_template.find(workspace_id=workspace_id):
        block_template.set_workspace_id("", block=owned_template)
        block_template.save(owned_template)
