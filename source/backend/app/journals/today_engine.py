# @manualReviewRequested: 2026-07-07
"""Builds "today's view": generates a fresh Block instance for every BlockTemplate that occurs
today (per whichever segment governs today — see app/blocks/block_schedule.py), stamping a Task
for each of its nested BlockTaskTemplates that's due today (every one with no cadence override,
plus any with an override recurrence_engine.occurs_on says fires today), then buckets every task
into what the Today page shows — blocks (each with its nested tasks and today's
scheduled-vs-allotted minutes), ad-hoc tasks due today or overdue, and ad-hoc tasks with no due
date at all ("backburner"). There is no background scheduler — generation happens as a side effect
of GET /api/today, the same way journal rollover used to happen as a side effect of
GET /api/journals/today. Creating a block template (POST /api/block-templates) also eagerly
triggers generation, so a template due today shows up immediately without waiting for a
Today-page visit — see app/blocks/block_template_routes.py.

Blocks are not carried forward if left incomplete — a missed occurrence just becomes ordinary
task history once its day passes, rather than nagging as overdue. Overdue tracking is scoped to
ad-hoc tasks only.

Editing a template (app/blocks/block_template_routes.py's PATCH) calls
sync_future_blocks_with_template so today's and every already-materialized future Block picks up
the edit immediately rather than waiting for tomorrow's fresh generation — see that function's own
docstring for exactly which fields sync and which are left alone (and materialize_occurrence for
the equivalent on-demand path a future occurrence takes when it's edited directly, before its own
day arrives — see PATCH /api/blocks/<id>, app/blocks/block_routes.py).
"""

from collections import Counter
from datetime import date, timedelta

from core.storage import record_store
from core.storage.file_lock import hold_write_lock
from core.storage.record_block import RecordBlock
from core.utils import clock
from app.blocks import block, block_schedule, block_task_template, block_template
from app.recurrence import recurrence_engine
from app.tasks import task


def get_block_completion_calendar(start_date: date, end_date: date) -> dict[str, dict[str, int]]:
    """Reports, for every date in [start_date, end_date] inclusive, how many block-nested Tasks
    were due that day and how many of those are strictly complete — the data behind the Today
    page's block-completion calendar.

    Returns: {"YYYY-MM-DD": {"completed": int, "total": int}, ...} — every date in the range is
        present, even ones with no block-nested tasks at all ({"completed": 0, "total": 0}).
        "completed" counts only strictly is_complete tasks, not skipped ones — a skipped day
        isn't a completion, consistent with app/tasks/task_routes._build_subtask_count_index's
        own definition of "completed."
    Raises: ValueError if end_date is before start_date.
    """
    if end_date < start_date:
        raise ValueError(f"end_date ({end_date}) must not be before start_date ({start_date}).")

    counts_by_date: dict[str, dict[str, int]] = {}
    current_date = start_date
    while current_date <= end_date:
        counts_by_date[current_date.isoformat()] = {"completed": 0, "total": 0}
        current_date += timedelta(days=1)

    for task_block in task.list_all():
        if task.get_block_id(block=task_block) == "":
            continue
        due_date = task.get_due_date(block=task_block)
        key = due_date.isoformat() if due_date else None
        if key is None or key not in counts_by_date:
            continue
        counts_by_date[key]["total"] += 1
        if task.get_is_complete(block=task_block):
            counts_by_date[key]["completed"] += 1

    return counts_by_date


def ensure_todays_blocks_exist() -> None:
    """Idempotently guarantees one Block instance exists for today for every active
    BlockTemplate that occurs today (per its weekly_schedule), stamping a Task for each of its
    nested BlockTaskTemplates that's due today. Safe to call on every app load — a template that
    already has today's instance is skipped.

    Notes: the check-then-create for a given template+day is serialized by a lock (see
        _hold_generation_lock) so two near-simultaneous callers (two tabs, a dev-mode double
        effect, a flaky retry) can't both pass the "no instance yet" check and each create one.
    """
    today = clock.today()
    for template in block_template.list_active():
        template_id = block_template.get_id(block=template)
        if not block_schedule.occurs_on(template, today):
            continue
        with _hold_generation_lock(template_id, today):
            already_generated = block.find_one(template_id=template_id, date=today.isoformat())
            if already_generated is not None:
                continue
            _generate_block_instance(template, today)


def sync_future_blocks_with_template(template_id: str) -> None:
    """Propagates a BlockTemplate's just-saved settings onto today's and every already-materialized
    future Block generated from it, so an edit takes effect immediately instead of waiting for
    each instance's own day to regenerate.

    Overwrites each instance's config fields — title, description, tags, and that instance's own
    governing start_time/duration_minutes from the template's segments (recomputed per instance's
    own date, since different dates can be governed by different segments/instance rows) — but
    only when the instance is still is_template_synced; an instance a user has directly edited (see
    PATCH /api/blocks/<id>) keeps exactly what they set, even once the template it came from
    changes later. Never touches any nested task's own recorded state
    (is_complete/completed_at/is_skipped/due_date) either way. Instances dated before today are
    historical and are never touched, synced or not.

    Nested tasks only ever gain new Task entries for task templates due on their own instance's
    date that the Block doesn't already have one of (matched by title, as a multiset so duplicate
    titles are handled correctly) — an existing task is never removed, whatever its title or
    completion state, even if its task template was since dropped or its cadence override no
    longer fires that day. This backfill runs for every instance from today onward regardless of
    is_template_synced, same as the config-field sync's own asymmetry.

    Inputs: template_id, the BlockTemplate that was just edited.
    Notes: a no-op if the template has no Block generated for today or any future date yet.
    """
    today = clock.today()
    template = block_template.load(template_id)
    instances = [
        instance
        for instance in block.find(template_id=template_id)
        if block.get_date(block=instance) >= today
    ]

    for instance in instances:
        instance_date = block.get_date(block=instance)
        if block.get_is_template_synced(block=instance):
            shape = block_schedule.shape_for_date(template, instance_date)
            if shape is not None:
                block.set_title(block_template.get_title(block=template), block=instance)
                block.set_description(block_template.get_description(block=template), block=instance)
                block.set_tags(block_template.get_tags(block=template), block=instance)
                block.set_start_time(shape.start_time, block=instance)
                block.set_duration_minutes(shape.duration_minutes, block=instance)
                block.save(instance)

        _add_missing_block_tasks(template, instance, instance_date)


def materialize_occurrence(template_id: str, for_date: date) -> RecordBlock:
    """Turns a still-projected future occurrence into a real, persisted Block instance, stamped
    from its template exactly like an ordinary day's generation would — used as the first step of
    editing one calendar occurrence directly (see PATCH /api/blocks/<id>, app/blocks/block_routes.py),
    so there's a real record to attach that edit to.

    Inputs: template_id, for_date, the same identifying pair a projected "projected:{template_id}:
        {date}" id already encodes (see app/blocks/block_occurrences.py).
    Returns: the existing instance unchanged if one already exists for this template+date;
        otherwise a freshly generated one, exactly as _generate_block_instance would produce.
    """
    existing = block.find_one(template_id=template_id, date=for_date.isoformat())
    if existing is not None:
        return existing
    template = block_template.load(template_id)
    return _generate_block_instance(template, for_date)


def get_todays_view() -> dict[str, list]:
    """Ensures today's blocks exist, then buckets every non-archived task into the Today page's
    sections.

    Returns: {"blocks": [{"block": Block, "tasks": [Task, ...], "scheduled_minutes": int}, ...],
        "due": [...], "backburner": [...]} — "blocks" is every Block generated for today (sorted
        by start_time, then order as a same-time tiebreaker), each with its nested tasks (sorted
        by their own order) and the sum of their estimated_minutes; "due" is every ad-hoc
        (non-block, non-subtask), incomplete task with a due date today or in the past;
        "backburner" is every ad-hoc, incomplete task with no due date at all.
    """
    ensure_todays_blocks_exist()
    today = clock.today()

    todays_blocks = [b for b in block.list_all() if block.get_date(block=b) == today]
    todays_blocks.sort(key=lambda b: (block.get_start_time(block=b), block.get_order(block=b)))

    blocks_view = []
    for block_instance in todays_blocks:
        block_id = block.get_id(block=block_instance)
        nested_tasks = task.find(block_id=block_id)
        nested_tasks.sort(key=lambda t: task.get_order(block=t))
        blocks_view.append(
            {
                "block": block_instance,
                "tasks": nested_tasks,
                "scheduled_minutes": sum(task.get_estimated_minutes(block=t) for t in nested_tasks),
            }
        )

    due: list[RecordBlock] = []
    backburner: list[RecordBlock] = []
    for task_block in task.list_all():
        if task.get_is_archived(block=task_block):
            continue
        if task.get_parent_task_id(block=task_block) != "":
            continue  # subtasks only ever show nested under their parent, never as their own row
        if task.get_block_id(block=task_block) != "":
            continue  # block-nested tasks only ever show nested under their block
        if task.get_is_complete(block=task_block):
            continue
        due_date = task.get_due_date(block=task_block)
        if due_date is None:
            backburner.append(task_block)
        elif due_date <= today:
            due.append(task_block)
    return {"blocks": blocks_view, "due": due, "backburner": backburner}


# --- --- --- ---
# Internal helpers


def _tasks_due_today(template: RecordBlock, for_date: date) -> list[RecordBlock]:
    """Returns every BlockTaskTemplate belonging to template that's due on for_date: every one
    with no cadence override (frequency is None, meaning "every time the block occurs"), plus any
    with an override that recurrence_engine.occurs_on says fires on for_date.
    """
    template_id = block_template.get_id(block=template)
    due = []
    for task_template in block_task_template.find_for_block_template(template_id):
        frequency = block_task_template.get_frequency(block=task_template)
        if frequency is None or recurrence_engine.occurs_on(
            frequency=frequency,
            interval=block_task_template.get_interval(block=task_template),
            start_date=block_task_template.get_start_date(block=task_template),
            end_date=block_task_template.get_end_date(block=task_template),
            days_of_week=block_task_template.get_days_of_week(block=task_template),
            day_of_month=block_task_template.get_day_of_month(block=task_template),
            month_of_year=block_task_template.get_month_of_year(block=task_template),
            target_date=for_date,
        ):
            due.append(task_template)
    return due


def _generate_block_instance(template: RecordBlock, for_date: date) -> RecordBlock:
    """Stamps out one fresh Block instance from a template for a given date (using whichever
    segment/instance row governs that date — see block_schedule.shape_for_date), then stamps a
    Task for every nested BlockTaskTemplate due that day (see _tasks_due_today).

    Raises: ValueError if the template doesn't actually occur on for_date — every caller is
        expected to have already confirmed block_schedule.occurs_on(template, for_date) first.
    """
    shape = block_schedule.shape_for_date(template, for_date)
    if shape is None:
        raise ValueError(
            f"BlockTemplate {block_template.get_id(block=template)!r} doesn't occur on {for_date}."
        )
    created = block.create(
        block_template.get_id(block=template),
        for_date,
        block_template.get_title(block=template),
        shape.start_time,
        shape.duration_minutes,
        description=block_template.get_description(block=template),
        tags=block_template.get_tags(block=template),
        order=block_template.get_order(block=template),
    )
    block_id = block.get_id(block=created)
    for task_template in _tasks_due_today(template, for_date):
        task.create(
            block_task_template.get_title(block=task_template),
            block_id=block_id,
            due_date=for_date,
            is_skippable=block_task_template.get_is_skippable(block=task_template),
            estimated_minutes=block_task_template.get_estimated_minutes(block=task_template),
        )
    return created


def _hold_generation_lock(template_id: str, for_date: date):
    """Returns a context manager serializing generation for one template+day, so two racing
    callers can't both pass ensure_todays_blocks_exist's "no instance yet" check before either has
    created one. Reuses the storage layer's own file-lock primitive (see
    core/storage/file_lock.py) keyed to a path scoped to this template+day — no Block record is
    ever written there, it's purely a lock key two callers can contend on.
    """
    lock_path = record_store.object_type_directory(block.OBJECT_TYPE) / (
        f"generate-{template_id}-{for_date.isoformat()}{record_store.RECORD_FILE_EXTENSION}"
    )
    return hold_write_lock(lock_path)


def _add_missing_block_tasks(template: RecordBlock, instance: RecordBlock, for_date: date) -> None:
    """Creates a Task under instance for every task template due on for_date (see
    _tasks_due_today) whose title isn't already represented among instance's existing nested
    tasks (matched by title, as a multiset via Counter so duplicate titles are handled correctly)
    — never removes an existing task.
    """
    block_id = block.get_id(block=instance)
    existing_titles = Counter(task.get_title(block=t) for t in task.find(block_id=block_id))
    wanted = _tasks_due_today(template, for_date)
    wanted_titles = Counter(block_task_template.get_title(block=t) for t in wanted)
    missing_titles = wanted_titles - existing_titles
    if not missing_titles:
        return
    templates_by_title: dict[str, RecordBlock] = {}
    for task_template in wanted:
        templates_by_title.setdefault(block_task_template.get_title(block=task_template), task_template)
    for title, count in missing_titles.items():
        task_template = templates_by_title[title]
        for _ in range(count):
            task.create(
                title,
                block_id=block_id,
                due_date=for_date,
                is_skippable=block_task_template.get_is_skippable(block=task_template),
                estimated_minutes=block_task_template.get_estimated_minutes(block=task_template),
            )
