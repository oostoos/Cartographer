"""Builds "today's view": generates a fresh Task instance for every RecurringTaskTemplate that
applies today, then buckets every task into what the Today page shows — recurring instances due
today, ad-hoc tasks due today or overdue, and ad-hoc tasks with no due date at all
("backburner"). There is no background scheduler — generation happens as a side effect of
GET /api/today, the same way journal rollover used to happen as a side effect of
GET /api/journals/today.

Recurring instances are not carried forward if left incomplete — a missed occurrence just
becomes ordinary task history once its day passes, rather than nagging as overdue. Overdue
tracking (item 7 of the original request) is scoped to ad-hoc tasks only.
"""

from core.storage.record_block import RecordBlock
from core.utils import clock
from app.recurrence import recurrence_engine, recurring_task_template
from app.tasks import subtask, task


def ensure_todays_recurring_tasks_exist() -> None:
    """Idempotently guarantees one Task instance exists for today for every active
    RecurringTaskTemplate that occurs today, stamping the instance with the template's
    title/description/project/tags, and copying the template's subtask_titles onto the new
    instance's own fresh Subtasks. Safe to call on every app load — a template that already has
    today's instance is skipped.
    """
    today = clock.today()
    for template in recurring_task_template.list_active():
        template_id = recurring_task_template.get_id(block=template)
        if not recurrence_engine.occurs_on(template, today):
            continue
        already_generated = task.find_one(recurring_template_id=template_id, due_date=today.isoformat())
        if already_generated is not None:
            continue
        _generate_instance(template, today)


def get_todays_view() -> dict[str, list[RecordBlock]]:
    """Ensures today's recurring instances exist, then buckets every non-archived task into the
    Today page's three sections.

    Returns: {"recurring": [...], "due": [...], "backburner": [...]} — "recurring" is every
        instance generated from a template for today (regardless of completion, so a user can see
        what they already finished); "due" is every ad-hoc (non-recurring), incomplete task with
        a due date today or in the past; "backburner" is every ad-hoc, incomplete task with no
        due date at all.
    """
    ensure_todays_recurring_tasks_exist()
    today = clock.today()

    recurring: list[RecordBlock] = []
    due: list[RecordBlock] = []
    backburner: list[RecordBlock] = []
    for block in task.list_all():
        if task.get_is_archived(block=block):
            continue
        if task.get_recurring_template_id(block=block) != "":
            if task.get_due_date(block=block) == today:
                recurring.append(block)
            continue
        if task.get_is_complete(block=block):
            continue
        due_date = task.get_due_date(block=block)
        if due_date is None:
            backburner.append(block)
        elif due_date <= today:
            due.append(block)
    return {"recurring": recurring, "due": due, "backburner": backburner}


# --- --- --- ---
# Internal helpers


def _generate_instance(template: RecordBlock, for_date) -> RecordBlock:
    """Stamps out one fresh Task instance from a template for a given date, copying its checklist
    of subtask titles onto the new instance's own fresh Subtasks.
    """
    created = task.create(
        recurring_task_template.get_title(block=template),
        description=recurring_task_template.get_description(block=template),
        project_id=recurring_task_template.get_project_id(block=template),
        recurring_template_id=recurring_task_template.get_id(block=template),
        tags=recurring_task_template.get_tags(block=template),
        due_date=for_date,
    )
    new_task_id = task.get_id(block=created)
    for subtask_title in recurring_task_template.get_subtask_titles(block=template):
        subtask.create(new_task_id, subtask_title)
    return created
