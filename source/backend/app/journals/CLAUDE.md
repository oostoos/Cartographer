<!-- @manualReviewRequested: 2026-07-06 -->
# Journals (backend)

`today_engine.py` builds "today's view" of tasks — `ensure_todays_recurring_tasks_exist()` stamps
out a fresh `Task` instance (see `app/tasks/task.py`) for every active `RecurringTaskTemplate`
(`app/recurrence/recurring_task_template.py`) that occurs today, and `get_todays_view()` buckets
every non-archived task into `{recurring, due, backburner}` for `GET /api/today`
(`today_routes.py`). There is no scheduler in this app — see root CLAUDE.md; generation happens as
a side effect of that one GET request.

There is no more `DailyJournal`/`TaskEntry` — a task is a task everywhere, recurring-generated or
not (see `app/tasks/CLAUDE.md`). Recurring misses are not carried forward: at most one instance is
generated per template per day, and a missed day's instance is never mutated forward — it just
becomes ordinary task history once its due date has passed. "Due or overdue" tracking
(`get_todays_view`'s `due` bucket) only applies to ad-hoc (non-recurring) tasks.

`note.py` is a single `Note` type serving two different UI surfaces: a daily journal entry
(`journal_date` set, no target — the journaling card on the Today page and the Journal tab) and
an ad-hoc note attached to a task or project (`target_type`/`target_id` set together, never just
one — enforced by `note.set_target`, the only way to change either field). `note_routes.py`
(`GET /api/notes`) supports `?targetType=&targetId=` (one object's attached notes),
`?journalOnly=true` (pure journal entries), or no params (every note, for a "view all notes"
page) — each serialized note includes a computed `effectiveDate` (`journalDate` if set, else the
date part of `createdAt`) so frontend day-grouping doesn't need to duplicate that rule.
