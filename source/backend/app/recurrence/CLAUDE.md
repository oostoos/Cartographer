<!-- @manualReviewRequested: 2026-07-06 -->
# Recurrence (backend)

`recurring_task_template.py` is the object type — both the cadence fields (frequency/interval/
start-end dates/days-of-week/day-of-month/month-of-year/is_active) and the task-shape fields
(title/description/project_id/tags/subtask_titles) stamped onto every `Task` instance it
generates (see `app/journals/today_engine.py`). `recurrence_engine.py` is the pure date math
(`occurs_on`, `generate_occurrences`) that reads a template's cadence fields — keep new recurrence
logic in the engine, not scattered into the object module or into `today_engine.py`.

Editing a template only affects instances generated after the edit — already-generated `Task`
rows are untouched, and deleting a template doesn't cascade to them either; they just become
ordinary standalone historical tasks once generation stops.

Deliberate scope cut: "Nth weekday of month" (e.g. "2nd Tuesday") isn't supported — see the
comment at the top of `recurring_task_template.py`. Date math uses `datetime.date` exclusively,
never timezone-aware datetimes — don't introduce one, it's what makes DST a non-issue here.
