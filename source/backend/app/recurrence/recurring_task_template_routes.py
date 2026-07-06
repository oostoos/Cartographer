# @manualReviewRequested: 2026-07-06
"""HTTP routes for creating, listing, updating, and deleting recurring task templates."""

from datetime import date

from flask import Blueprint, jsonify, request

from core.auth.login_guard import login_required
from app.recurrence import recurring_task_template

recurring_task_template_blueprint = Blueprint(
    "recurring_task_templates", __name__, url_prefix="/api/recurring-task-templates"
)


@recurring_task_template_blueprint.get("")
@login_required
def list_recurring_task_templates():
    """Lists every recurring task template."""
    return jsonify([_serialize(block) for block in recurring_task_template.list_all()])


@recurring_task_template_blueprint.post("")
@login_required
def create_recurring_task_template():
    """Creates a recurring task template.

    Body: {"title": str, "frequency": str, "startDate": "YYYY-MM-DD", "description"?: str,
        "projectId"?: str, "tags"?: [str], "subtaskTitles"?: [str], "interval"?: int,
        "endDate"?: "YYYY-MM-DD", "daysOfWeek"?: [int], "dayOfMonth"?: int, "monthOfYear"?: int}.
    Raises (as a 400 response): ValueError if frequency is not recognized.
    """
    body = request.get_json(force=True, silent=True) or {}
    try:
        created = recurring_task_template.create(
            body.get("title", ""),
            body["frequency"],
            start_date=date.fromisoformat(body["startDate"]),
            description=body.get("description", ""),
            project_id=body.get("projectId", ""),
            tags=body.get("tags"),
            subtask_titles=body.get("subtaskTitles"),
            interval=body.get("interval", recurring_task_template.DEFAULT_INTERVAL),
            end_date=date.fromisoformat(body["endDate"]) if body.get("endDate") else None,
            days_of_week=body.get("daysOfWeek"),
            day_of_month=body.get("dayOfMonth"),
            month_of_year=body.get("monthOfYear"),
        )
    except ValueError as error:
        return jsonify(error=str(error)), 400
    return jsonify(_serialize(created)), 201


@recurring_task_template_blueprint.get("/<recurring_template_id>")
@login_required
def get_recurring_task_template(recurring_template_id):
    """Reads a single recurring task template."""
    return jsonify(_serialize(recurring_task_template.load(recurring_template_id)))


@recurring_task_template_blueprint.patch("/<recurring_template_id>")
@login_required
def update_recurring_task_template(recurring_template_id):
    """Updates a recurring task template. Changes only affect instances generated after this
    call — already-generated Task instances are untouched.

    Body: any of {"title": str, "description": str, "projectId": str, "tags": [str],
        "subtaskTitles": [str], "isActive": bool, "frequency": str, "interval": int,
        "startDate": "YYYY-MM-DD", "endDate": "YYYY-MM-DD" | None, "daysOfWeek": [int],
        "dayOfMonth": int | None, "monthOfYear": int | None}.
    Raises (as a 400 response): ValueError if frequency is given and not recognized.
    """
    block = recurring_task_template.load(recurring_template_id)
    body = request.get_json(force=True, silent=True) or {}
    if "title" in body:
        recurring_task_template.set_title(body["title"], block=block)
    if "description" in body:
        recurring_task_template.set_description(body["description"], block=block)
    if "projectId" in body:
        recurring_task_template.set_project_id(body["projectId"], block=block)
    if "tags" in body:
        recurring_task_template.set_tags(body["tags"], block=block)
    if "subtaskTitles" in body:
        recurring_task_template.set_subtask_titles(body["subtaskTitles"], block=block)
    if "isActive" in body:
        recurring_task_template.set_is_active(bool(body["isActive"]), block=block)
    if "frequency" in body:
        try:
            recurring_task_template.set_frequency(body["frequency"], block=block)
        except ValueError as error:
            return jsonify(error=str(error)), 400
    if "interval" in body:
        recurring_task_template.set_interval(body["interval"], block=block)
    if "startDate" in body:
        recurring_task_template.set_start_date(date.fromisoformat(body["startDate"]), block=block)
    if "endDate" in body:
        recurring_task_template.set_end_date(
            date.fromisoformat(body["endDate"]) if body["endDate"] else None, block=block
        )
    if "daysOfWeek" in body:
        recurring_task_template.set_days_of_week(body["daysOfWeek"], block=block)
    if "dayOfMonth" in body:
        recurring_task_template.set_day_of_month(body["dayOfMonth"], block=block)
    if "monthOfYear" in body:
        recurring_task_template.set_month_of_year(body["monthOfYear"], block=block)
    recurring_task_template.save(block)
    return jsonify(_serialize(block))


@recurring_task_template_blueprint.delete("/<recurring_template_id>")
@login_required
def delete_recurring_task_template(recurring_template_id):
    """Deletes a recurring task template. Instances already generated from it are unaffected."""
    recurring_task_template.delete(recurring_template_id)
    return "", 204


def _serialize(block) -> dict:
    """Turns a RecurringTaskTemplate record block into the JSON shape the frontend expects."""
    end_date = recurring_task_template.get_end_date(block=block)
    return {
        "id": recurring_task_template.get_id(block=block),
        "title": recurring_task_template.get_title(block=block),
        "description": recurring_task_template.get_description(block=block),
        "projectId": recurring_task_template.get_project_id(block=block),
        "tags": recurring_task_template.get_tags(block=block),
        "subtaskTitles": recurring_task_template.get_subtask_titles(block=block),
        "frequency": recurring_task_template.get_frequency(block=block),
        "interval": recurring_task_template.get_interval(block=block),
        "startDate": recurring_task_template.get_start_date(block=block).isoformat(),
        "endDate": end_date.isoformat() if end_date else None,
        "daysOfWeek": recurring_task_template.get_days_of_week(block=block),
        "dayOfMonth": recurring_task_template.get_day_of_month(block=block),
        "monthOfYear": recurring_task_template.get_month_of_year(block=block),
        "isActive": recurring_task_template.get_is_active(block=block),
    }
