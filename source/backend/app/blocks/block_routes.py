# @manualReviewRequested: 2026-07-07
"""HTTP routes for reading block occurrences across a date range — the data behind the calendar
page's week/month views — and for editing exactly one occurrence directly, independent of its
template (see app/blocks/block_template_routes.py for editing a template's own shape, which every
*other* occurrence keeps following).
"""

from datetime import date

from flask import Blueprint, request

from core.auth.login_guard import login_required
from core.http.json_response import json_error, json_response
from core.storage.control_chars import raise_if_contains_control_characters
from core.storage.errors import RecordNotFoundError
from app.blocks import block, block_occurrences
from app.blocks.block_occurrences import PROJECTED_ID_PREFIX, BlockOccurrence
from app.journals import today_engine

block_blueprint = Blueprint("blocks", __name__, url_prefix="/api/blocks")


@block_blueprint.get("/occurrences")
@login_required
def get_occurrences():
    """Returns every block occurrence in the given date range — real generated instances for
    today and the past, projected (not-yet-generated) ones for future dates — ensuring today's
    real instances are generated first so a range spanning today reflects the latest templates.

    Query params: startDate, endDate — both required, "YYYY-MM-DD".
    Raises (as a 400 response): if either param is missing, isn't a valid date, or endDate is
        before startDate.
    """
    start_date_raw = request.args.get("startDate")
    end_date_raw = request.args.get("endDate")
    if not start_date_raw or not end_date_raw:
        return json_error("startDate and endDate are both required.")
    try:
        start_date = date.fromisoformat(start_date_raw)
        end_date = date.fromisoformat(end_date_raw)
        today_engine.ensure_todays_blocks_exist()
        occurrences = block_occurrences.get_occurrences(start_date, end_date)
    except ValueError as error:
        return json_error(str(error))
    return json_response({"occurrences": [_serialize(occurrence) for occurrence in occurrences]})


@block_blueprint.patch("/<occurrence_id>")
@login_required
def update_occurrence(occurrence_id):
    """Edits exactly one block occurrence, independent of its template — every other occurrence
    (past, future, or the template's own default shape) is unaffected.

    If occurrence_id is still a projected ("projected:{templateId}:{date}") id, materializes it
    into a real Block first (see today_engine.materialize_occurrence), copying the template's own
    shape as the starting point. Either way, the target instance's is_template_synced is then set
    False, so a later template edit never overwrites what's set here again (see
    today_engine.sync_future_blocks_with_template) — it stays exactly as set until edited again.

    Body: any of {"title": str, "description": str, "tags": [str], "startTime": "HH:MM",
        "durationMinutes": int}.
    Raises (as a 400 response): ValueError if occurrence_id's embedded date isn't valid, or
        durationMinutes isn't > 0. As a 404 response: if occurrence_id names a real block that
        doesn't exist, or a projected occurrence whose template doesn't exist.
    """
    body = request.get_json(force=True, silent=True) or {}
    try:
        instance = _resolve_instance(occurrence_id)
    except (ValueError, RecordNotFoundError) as error:
        return json_error(str(error), 404 if isinstance(error, RecordNotFoundError) else 400)

    try:
        if "title" in body:
            raise_if_contains_control_characters(body["title"])
            block.set_title(body["title"], block=instance)
        if "description" in body:
            raise_if_contains_control_characters(body["description"])
            block.set_description(body["description"], block=instance)
        if "tags" in body:
            block.set_tags(body["tags"], block=instance)
        if "startTime" in body:
            block.set_start_time(body["startTime"], block=instance)
        if "durationMinutes" in body:
            duration_minutes = int(body["durationMinutes"])
            if duration_minutes <= 0:
                raise ValueError(f"durationMinutes must be > 0, got {duration_minutes!r}.")
            block.set_duration_minutes(duration_minutes, block=instance)
    except ValueError as error:
        return json_error(str(error))

    block.set_is_template_synced(False, block=instance)
    block.save(instance)
    return json_response(_serialize_instance(instance))


def _resolve_instance(occurrence_id: str):
    """Loads the real Block behind occurrence_id, materializing it first if it's still a
    projected id.

    Raises: ValueError if a projected id's embedded date isn't valid "YYYY-MM-DD".
        RecordNotFoundError if occurrence_id names a real block, or a projected occurrence's
        template, that doesn't exist.
    """
    if not occurrence_id.startswith(f"{PROJECTED_ID_PREFIX}:"):
        return block.load(occurrence_id)
    _prefix, template_id, date_raw = occurrence_id.split(":", 2)
    return today_engine.materialize_occurrence(template_id, date.fromisoformat(date_raw))


def _serialize_instance(instance) -> dict:
    """Turns a real Block record into the same JSON shape _serialize's BlockOccurrence uses, so
    the frontend can treat a PATCH response identically to any other occurrence."""
    return {
        "id": block.get_id(block=instance),
        "templateId": block.get_template_id(block=instance),
        "date": block.get_date(block=instance).isoformat(),
        "title": block.get_title(block=instance),
        "description": block.get_description(block=instance),
        "tags": block.get_tags(block=instance),
        "startTime": block.get_start_time(block=instance),
        "durationMinutes": block.get_duration_minutes(block=instance),
        "isProjected": False,
    }


def _serialize(occurrence: BlockOccurrence) -> dict:
    """Turns a BlockOccurrence into the JSON shape the frontend expects."""
    return {
        "id": occurrence.id,
        "templateId": occurrence.template_id,
        "date": occurrence.occurrence_date.isoformat(),
        "title": occurrence.title,
        "description": occurrence.description,
        "tags": occurrence.tags,
        "startTime": occurrence.start_time,
        "durationMinutes": occurrence.duration_minutes,
        "isProjected": occurrence.is_projected,
    }
