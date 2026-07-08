# @manualReviewRequested: 2026-07-07
"""HTTP routes for creating, listing, updating, and deleting block templates — a block's own
occurrence shape plus its full ordered set of nested task templates are saved together as one
whole form: the existing set of BlockTaskTemplates is wholesale-replaced from the payload on every
create/update, the same pattern the old recurring-task-template feature used for its flat
subtaskTitles list, just one level richer here.

A template's own occurrence ("shape") is effective-dated (see app/blocks/block_template_segment.py)
— every create/update that includes a "shape" appends (or, for a same-day repeat edit, overwrites)
a segment effective from today, leaving every earlier segment exactly as it was. The frontend never
sends or reads segment history directly: it only ever edits "the shape starting today," and GET
responses only ever surface that one currently-effective shape (see _serialize_shape) — anything
before today stays server-side bookkeeping only.
"""

from datetime import date

from flask import Blueprint, request

from core.auth.login_guard import login_required
from core.http.json_response import json_error, json_response
from core.storage.control_chars import raise_if_contains_control_characters
from core.utils import clock
from app.blocks import (
    block_task_template,
    block_template,
    block_template_segment,
    block_time_estimate,
    default_block_templates,
)
from app.blocks.block_template_segment import InstanceRow
from app.journals import today_engine
from app.recurrence.frequency import DEFAULT_INTERVAL, Frequency

block_template_blueprint = Blueprint("block_templates", __name__, url_prefix="/api/block-templates")

FREQUENCY_BY_JSON_VALUE = {
    "daily": Frequency.DAILY,
    "weekly": Frequency.WEEKLY,
    "monthly": Frequency.MONTHLY,
    "yearly": Frequency.YEARLY,
}
JSON_VALUE_BY_FREQUENCY = {member: raw for raw, member in FREQUENCY_BY_JSON_VALUE.items()}


def _parse_frequency(raw_frequency: str) -> Frequency:
    """Parses a JSON frequency string into a Frequency member.

    Raises: ValueError if raw_frequency isn't "daily"/"weekly"/"monthly"/"yearly".
    """
    try:
        return FREQUENCY_BY_JSON_VALUE[raw_frequency]
    except KeyError:
        raise ValueError(
            f"frequency must be one of {list(FREQUENCY_BY_JSON_VALUE)}, got {raw_frequency!r}."
        ) from None


@block_template_blueprint.get("")
@login_required
def list_block_templates():
    """Lists every block template, ordered by its manual sort position (a same-time tiebreaker —
    see block_template.get_order).
    """
    blocks = block_template.list_all()
    blocks.sort(key=lambda template: block_template.get_order(block=template))
    return json_response([_serialize(template) for template in blocks])


@block_template_blueprint.post("")
@login_required
def create_block_template():
    """Creates a block template (and its nested task templates), then eagerly generates today's
    instance if it's due today so it shows up immediately without waiting for a Today-page visit.

    Body: {"title": str, "description"?: str, "tags"?: [str], "startDate"?: "YYYY-MM-DD" | null,
        "endDate"?: "YYYY-MM-DD" | null, "shape"?: _SHAPE_SHAPE, "workspaceId"?: str,
        "taskTemplates"?: [_TASK_TEMPLATE_SHAPE]}. order is never client-supplied. See
        _parse_shape for _SHAPE_SHAPE.
    Raises (as a 400 response): ValueError if shape is invalid, or any task template entry is
        invalid (see _parse_task_template_payloads).
    """
    body = request.get_json(force=True, silent=True) or {}
    try:
        task_payloads = _parse_task_template_payloads(body.get("taskTemplates", []))
        segments = [_build_segment(body["shape"], clock.today())] if "shape" in body else []
        created = block_template.create(
            body.get("title", ""),
            description=body.get("description", ""),
            tags=body.get("tags"),
            segments=segments,
            start_date=date.fromisoformat(body["startDate"]) if body.get("startDate") else None,
            end_date=date.fromisoformat(body["endDate"]) if body.get("endDate") else None,
            workspace_id=body.get("workspaceId", ""),
        )
    except ValueError as error:
        return json_error(str(error))
    template_id = block_template.get_id(block=created)
    for order, payload in enumerate(task_payloads):
        block_task_template.create(block_template_id=template_id, order=order, **payload)
    today_engine.ensure_todays_blocks_exist()
    return json_response(_serialize(created), 201)


@block_template_blueprint.get("/<block_template_id>")
@login_required
def get_block_template(block_template_id):
    """Reads a single block template."""
    return json_response(_serialize(block_template.load(block_template_id)))


@block_template_blueprint.patch("/<block_template_id>")
@login_required
def update_block_template(block_template_id):
    """Updates a block template, then syncs the edit onto today's and every already-materialized
    future instance (see today_engine.sync_future_blocks_with_template) — only a still
    is_template_synced instance's config fields change; its nested tasks' own recorded state is
    never touched, and an instance a user has directly overridden (see PATCH /api/blocks/<id>) is
    left alone entirely.

    Body: any of {"title": str, "description": str, "tags": [str], "isActive": bool,
        "startDate": "YYYY-MM-DD" | None, "endDate": "YYYY-MM-DD" | None, "order": int,
        "shape": _SHAPE_SHAPE, "workspaceId": str, "taskTemplates": [_TASK_TEMPLATE_SHAPE]}.
        shape, if given, applies from today onward (see
        block_template.upsert_shape_effective_today) — every date before today keeps whichever
        shape already governed it. taskTemplates, if given, wholesale-replaces the current set.
    Raises (as a 400 response): ValueError if shape or any task template entry is invalid.
    """
    template = block_template.load(block_template_id)
    body = request.get_json(force=True, silent=True) or {}
    try:
        task_payloads = (
            _parse_task_template_payloads(body["taskTemplates"]) if "taskTemplates" in body else None
        )
        new_segment = _build_segment(body["shape"], clock.today()) if "shape" in body else None
    except ValueError as error:
        return json_error(str(error))

    if "title" in body:
        block_template.set_title(body["title"], block=template)
    if "description" in body:
        block_template.set_description(body["description"], block=template)
    if "tags" in body:
        block_template.set_tags(body["tags"], block=template)
    if "isActive" in body:
        block_template.set_is_active(bool(body["isActive"]), block=template)
    if "startDate" in body:
        block_template.set_start_date(
            date.fromisoformat(body["startDate"]) if body["startDate"] else None, block=template
        )
    if "endDate" in body:
        block_template.set_end_date(
            date.fromisoformat(body["endDate"]) if body["endDate"] else None, block=template
        )
    if "order" in body:
        block_template.set_order(int(body["order"]), block=template)
    if "workspaceId" in body:
        block_template.set_workspace_id(body["workspaceId"], block=template)
    if new_segment is not None:
        block_template.upsert_shape_effective_today(
            new_segment.effective_from,
            new_segment.frequency,
            new_segment.interval,
            new_segment.is_advanced,
            new_segment.instance_rows,
            block=template,
        )
    block_template.save(template)

    if task_payloads is not None:
        block_task_template.delete_all_for_block_template(block_template_id)
        for order, payload in enumerate(task_payloads):
            block_task_template.create(block_template_id=block_template_id, order=order, **payload)

    today_engine.sync_future_blocks_with_template(block_template_id)
    return json_response(_serialize(block_template.load(block_template_id)))


@block_template_blueprint.delete("/<block_template_id>")
@login_required
def delete_block_template(block_template_id):
    """Deletes a block template and its nested task templates. Block instances already generated
    from it are unaffected.
    """
    block_task_template.delete_all_for_block_template(block_template_id)
    block_template.delete(block_template_id)
    return "", 204


@block_template_blueprint.post("/generate-defaults")
@login_required
def generate_default_block_templates():
    """Creates the "Generate basic blocks" ADHD preset templates (see
    app/blocks/default_block_templates.py), then eagerly generates today's instances for any that
    are due today.
    """
    created = default_block_templates.create_default_block_templates()
    today_engine.ensure_todays_blocks_exist()
    return json_response([_serialize(template) for template in created], 201)


# --- --- --- ---
# Parsing and serialization


def _build_segment(raw_shape: dict, effective_from: date) -> "block_template_segment.BlockTemplateSegment":
    """Parses the JSON shape object into a BlockTemplateSegment effective from effective_from.

    Body shape (_SHAPE_SHAPE): {"frequency": "daily"|"weekly"|"monthly"|"yearly", "interval"?: int,
        "isAdvanced"?: bool, "instanceRows": [{"selector": str, "startTime": "HH:MM",
        "durationMinutes": int}]}.
    Raises: ValueError if frequency isn't recognized, or any instance row is invalid (surfaced by
        block_template_segment.upsert_effective_today, not re-checked here).
    """
    frequency = _parse_frequency(raw_shape["frequency"])
    instance_rows = [
        InstanceRow(row["selector"], row.get("startTime", ""), int(row.get("durationMinutes", 0)))
        for row in raw_shape.get("instanceRows", [])
    ]
    interval = raw_shape.get("interval", DEFAULT_INTERVAL)
    is_advanced = bool(raw_shape.get("isAdvanced", False))
    # upsert_effective_today does the real validation (interval > 0, every row's format) — reused
    # here against an empty starting list purely to build (and validate) one standalone segment.
    return block_template_segment.upsert_effective_today(
        [], effective_from, frequency, interval, is_advanced, instance_rows
    )[0]


def _parse_task_template_payloads(raw_task_templates: list[dict]) -> list[dict]:
    """Parses the JSON taskTemplates array into kwargs dicts ready for block_task_template.create,
    validating every entry upfront (before any destructive delete-and-recreate happens in the
    calling route) so a bad entry never leaves a block template with a half-replaced task list.

    Body shape per entry: {"title": str, "isSkippable"?: bool, "estimatedMinutes"?: int,
        "frequency"?: "daily"|"weekly"|"monthly"|"yearly"|null, "interval"?: int,
        "startDate"?: "YYYY-MM-DD", "endDate"?: "YYYY-MM-DD"|null, "daysOfWeek"?: [int],
        "dayOfMonth"?: int, "monthOfYear"?: int}.
    Raises: ValueError if any entry's title contains a reserved control character, estimatedMinutes
        isn't > 0, frequency isn't recognized, or frequency is given without startDate.
    """
    payloads = []
    for raw in raw_task_templates:
        title = raw.get("title", "")
        raise_if_contains_control_characters(title)
        estimated_minutes = raw.get("estimatedMinutes", 5)
        if estimated_minutes <= 0:
            raise ValueError(f"estimatedMinutes must be > 0, got {estimated_minutes!r}.")
        frequency = _parse_frequency(raw["frequency"]) if raw.get("frequency") else None
        start_date = date.fromisoformat(raw["startDate"]) if raw.get("startDate") else None
        if frequency is not None and start_date is None:
            raise ValueError("startDate is required when a task template's frequency is set.")
        payloads.append(
            {
                "title": title,
                "is_skippable": raw.get("isSkippable", True),
                "estimated_minutes": estimated_minutes,
                "frequency": frequency,
                "interval": raw.get("interval", DEFAULT_INTERVAL),
                "start_date": start_date,
                "end_date": date.fromisoformat(raw["endDate"]) if raw.get("endDate") else None,
                "days_of_week": raw.get("daysOfWeek"),
                "day_of_month": raw.get("dayOfMonth"),
                "month_of_year": raw.get("monthOfYear"),
            }
        )
    return payloads


def _serialize(template) -> dict:
    """Turns a BlockTemplate record block into the JSON shape the frontend expects, including its
    nested task templates and computed task time range."""
    start_date = block_template.get_start_date(block=template)
    end_date = block_template.get_end_date(block=template)
    template_id = block_template.get_id(block=template)
    task_templates = block_task_template.find_for_block_template(template_id)
    task_time_range = block_time_estimate.compute_task_time_range(task_templates)
    return {
        "id": template_id,
        "title": block_template.get_title(block=template),
        "description": block_template.get_description(block=template),
        "tags": block_template.get_tags(block=template),
        "workspaceId": block_template.get_workspace_id(block=template),
        "isActive": block_template.get_is_active(block=template),
        "order": block_template.get_order(block=template),
        "startDate": start_date.isoformat() if start_date else None,
        "endDate": end_date.isoformat() if end_date else None,
        "shape": _serialize_shape(block_template.shape_effective_on(clock.today(), block=template)),
        "taskTemplates": [_serialize_task_template(t) for t in task_templates],
        "taskTimeRange": {
            "minMinutes": task_time_range.min_minutes,
            "maxMinutes": task_time_range.max_minutes,
        },
    }


def _serialize_shape(segment) -> dict | None:
    """Turns the segment currently effective today into the JSON shape the frontend edits — see
    _build_segment for the same shape parsed back on save. Returns None if the template has no
    configured shape yet.
    """
    if segment is None:
        return None
    return {
        "frequency": JSON_VALUE_BY_FREQUENCY[segment.frequency],
        "interval": segment.interval,
        "isAdvanced": segment.is_advanced,
        "instanceRows": [
            {"selector": row.selector, "startTime": row.start_time, "durationMinutes": row.duration_minutes}
            for row in segment.instance_rows
        ],
    }


def _serialize_task_template(template) -> dict:
    """Turns a BlockTaskTemplate record block into the JSON shape the frontend expects."""
    frequency = block_task_template.get_frequency(block=template)
    start_date = block_task_template.get_start_date(block=template)
    end_date = block_task_template.get_end_date(block=template)
    return {
        "id": block_task_template.get_id(block=template),
        "title": block_task_template.get_title(block=template),
        "isSkippable": block_task_template.get_is_skippable(block=template),
        "estimatedMinutes": block_task_template.get_estimated_minutes(block=template),
        "order": block_task_template.get_order(block=template),
        "frequency": JSON_VALUE_BY_FREQUENCY[frequency] if frequency is not None else None,
        "interval": block_task_template.get_interval(block=template),
        "startDate": start_date.isoformat() if start_date else None,
        "endDate": end_date.isoformat() if end_date else None,
        "daysOfWeek": block_task_template.get_days_of_week(block=template),
        "dayOfMonth": block_task_template.get_day_of_month(block=template),
        "monthOfYear": block_task_template.get_month_of_year(block=template),
    }
