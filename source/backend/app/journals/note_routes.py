# @manualReviewRequested: 2026-07-06
"""HTTP routes for creating, listing, updating, and deleting notes — both freeform daily journal
entries (journalDate set, no target) and ad-hoc notes attached to a task or project (targetType/
targetId set together).
"""

from datetime import date

from flask import Blueprint, request

from core.auth.login_guard import login_required
from core.http.json_response import json_response
from app.journals import note

note_blueprint = Blueprint("notes", __name__, url_prefix="/api/notes")


@note_blueprint.get("")
@login_required
def list_notes():
    """Lists notes, newest-created-first.

    Query: targetType & targetId together (a task/project's attached notes), or journalOnly=true
        (pure journal entries — no target), or no params (every note, for a "view all notes"
        page).
    """
    target_type = request.args.get("targetType")
    target_id = request.args.get("targetId")
    if target_type and target_id:
        blocks = note.find(target_type=target_type, target_id=target_id)
    elif request.args.get("journalOnly") == "true":
        blocks = note.find(target_type=note.TARGET_TYPE_NONE)
    else:
        blocks = note.list_all()
    blocks.sort(key=lambda block: note.get_created_at(block=block), reverse=True)
    return json_response([_serialize(block) for block in blocks])


@note_blueprint.post("")
@login_required
def create_note():
    """Creates a note.

    Body: {"title"?: str, "content"?: str, "journalDate"?: "YYYY-MM-DD", "targetType"?: str,
        "targetId"?: str, "workspaceId"?: str}.
    Raises (as a 400 response): ValidationError if targetType/targetId are given without each
        other, or targetType isn't recognized.
    """
    body = request.get_json(force=True, silent=True) or {}
    created = note.create(
        title=body.get("title", ""),
        content=body.get("content", ""),
        journal_date=date.fromisoformat(body["journalDate"]) if body.get("journalDate") else None,
        target_type=body.get("targetType", ""),
        target_id=body.get("targetId", ""),
        workspace_id=body.get("workspaceId", ""),
    )
    return json_response(_serialize(created), 201)


@note_blueprint.get("/<note_id>")
@login_required
def get_note(note_id):
    """Reads a single note."""
    return json_response(_serialize(note.load(note_id)))


@note_blueprint.patch("/<note_id>")
@login_required
def update_note(note_id):
    """Updates one or more of a note's fields.

    Body: any of {"title": str, "content": str, "journalDate": "YYYY-MM-DD" | None,
        "targetType": str, "targetId": str, "workspaceId": str}. targetType/targetId are only
        ever applied together (each defaults to the note's current value if only one is given).
    """
    block = note.load(note_id)
    body = request.get_json(force=True, silent=True) or {}
    if "title" in body:
        note.set_title(body["title"], block=block)
    if "content" in body:
        note.set_content(body["content"], block=block)
    if "journalDate" in body:
        note.set_journal_date(
            date.fromisoformat(body["journalDate"]) if body["journalDate"] else None, block=block
        )
    if "workspaceId" in body:
        note.set_workspace_id(body["workspaceId"], block=block)
    if "targetType" in body or "targetId" in body:
        note.set_target(
            body.get("targetType", note.get_target_type(block=block)),
            body.get("targetId", note.get_target_id(block=block)),
            block=block,
        )
    note.save(block)
    return json_response(_serialize(block))


@note_blueprint.delete("/<note_id>")
@login_required
def delete_note(note_id):
    """Deletes a note."""
    note.delete(note_id)
    return "", 204


def _serialize(block) -> dict:
    """Turns a Note record block into the JSON shape the frontend expects, including a computed
    effectiveDate (journalDate if set, else the date portion of createdAt) so day-grouping logic
    doesn't need to duplicate that rule on the frontend.
    """
    journal_date = note.get_journal_date(block=block)
    created_at = note.get_created_at(block=block)
    effective_date = journal_date.isoformat() if journal_date else created_at[:10]
    return {
        "id": note.get_id(block=block),
        "title": note.get_title(block=block),
        "content": note.get_content(block=block),
        "journalDate": journal_date.isoformat() if journal_date else None,
        "targetType": note.get_target_type(block=block),
        "targetId": note.get_target_id(block=block),
        "workspaceId": note.get_workspace_id(block=block),
        "createdAt": created_at,
        "effectiveDate": effective_date,
    }
