# @manualReviewRequested: 2026-07-07
"""HTTP routes for the Today page — the screen the app opens to. Generating today's blocks
happens as a side effect of GET /api/today; see
app/journals/today_engine.ensure_todays_blocks_exist. Marking a task complete, or creating a new
one, goes through app/tasks/task_routes.py directly — the Today page reads the same Task records
everywhere else in the app does.
"""

from datetime import date

from flask import Blueprint, request

from core.auth.login_guard import login_required
from core.http.json_response import json_error, json_response
from core.utils import clock
from app.blocks import block
from app.journals import today_engine
from app.tasks import task
from app.tasks.task_routes import _build_subtask_count_index, serialize_task

today_blueprint = Blueprint("today", __name__, url_prefix="/api/today")


@today_blueprint.get("")
@login_required
def get_todays_view():
    """Returns today's blocks (each with its nested tasks and a scheduled-vs-allotted minutes
    readout) plus the dueTasks/backburnerTasks ad-hoc buckets, generating today's blocks first if
    they don't already exist.
    """
    view = today_engine.get_todays_view()
    subtask_count_index = _build_subtask_count_index(task.list_all())
    return json_response(
        {
            "date": clock.today().isoformat(),
            "blocks": [_serialize_today_block(entry, subtask_count_index) for entry in view["blocks"]],
            "dueTasks": [serialize_task(b, subtask_count_index) for b in view["due"]],
            "backburnerTasks": [serialize_task(b, subtask_count_index) for b in view["backburner"]],
        }
    )


@today_blueprint.get("/block-completion-calendar")
@login_required
def get_block_completion_calendar():
    """Returns, for every date in the given range, how many block-nested tasks were due that day
    and how many are complete — the data behind the Today page's block-completion calendar.

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
        counts_by_date = today_engine.get_block_completion_calendar(start_date, end_date)
    except ValueError as error:
        return json_error(str(error))
    return json_response(
        {
            "days": [
                {"date": day, "completed": counts["completed"], "total": counts["total"]}
                for day, counts in sorted(counts_by_date.items())
            ]
        }
    )


def _serialize_today_block(entry: dict, subtask_count_index: dict) -> dict:
    """Turns one of get_todays_view's {"block", "tasks", "scheduled_minutes"} entries into the
    JSON shape the Today page expects.
    """
    block_instance = entry["block"]
    return {
        "id": block.get_id(block=block_instance),
        "title": block.get_title(block=block_instance),
        "description": block.get_description(block=block_instance),
        "tags": block.get_tags(block=block_instance),
        "startTime": block.get_start_time(block=block_instance),
        "durationMinutes": block.get_duration_minutes(block=block_instance),
        "scheduledMinutes": entry["scheduled_minutes"],
        "tasks": [serialize_task(t, subtask_count_index) for t in entry["tasks"]],
    }
