# @manualReviewRequested: 2026-07-06
"""HTTP routes for the Today page — the screen the app opens to. Generating today's recurring
task instances happens as a side effect of GET /api/today; see
app/journals/today_engine.ensure_todays_recurring_tasks_exist. Marking a task complete, or
creating a new one, goes through app/tasks/task_routes.py directly — the Today page reads the
same Task records everywhere else in the app does.
"""

from flask import Blueprint, jsonify

from core.auth.login_guard import login_required
from core.utils import clock
from app.journals import today_engine
from app.tasks.task_routes import serialize_task

today_blueprint = Blueprint("today", __name__, url_prefix="/api/today")


@today_blueprint.get("")
@login_required
def get_todays_view():
    """Returns today's three task buckets (recurringTasks/dueTasks/backburnerTasks), generating
    today's recurring instances first if they don't already exist.
    """
    view = today_engine.get_todays_view()
    return jsonify(
        {
            "date": clock.today().isoformat(),
            "recurringTasks": [serialize_task(block) for block in view["recurring"]],
            "dueTasks": [serialize_task(block) for block in view["due"]],
            "backburnerTasks": [serialize_task(block) for block in view["backburner"]],
        }
    )
