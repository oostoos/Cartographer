<!-- @manualReviewRequested: 2026-07-07 -->
# Journals (backend)

`today_engine.py` builds "today's view" — `ensure_todays_blocks_exist()` stamps out a fresh
`Block` instance (see `app/blocks/block.py`) for every active `BlockTemplate`
(`app/blocks/block_template.py`) whose current segment says today occurs (see
`app/blocks/block_template_segment.py`), then stamps a `Task` (see `app/tasks/task.py`) for every
one of that block's nested `BlockTaskTemplate`s due today (every one with no cadence override,
plus any whose override `recurrence_engine.occurs_on` says fires today). `get_todays_view()` returns
`{blocks, due, backburner}` for `GET /api/today` (`today_routes.py`) — `blocks` is every Block
generated for today (sorted by start time), each carrying its nested tasks and the sum of their
`estimatedMinutes` (`scheduled_minutes`, compared against the block's own `duration_minutes` on
the frontend to flag an overloaded day); `due`/`backburner` are the ad-hoc (non-block, non-
subtask) buckets, unchanged from before. There is no scheduler in this app — see root CLAUDE.md;
generation happens as a side effect of that one GET request, and also eagerly whenever a new
`BlockTemplate` is created (`POST /api/block-templates` calls `ensure_todays_blocks_exist()`
directly, so a template due today shows up immediately without waiting for a Today-page visit).
The check-then-create for a given template+day is serialized by a lock (`_hold_generation_lock`,
built on `core/storage/file_lock.hold_write_lock`) so two near-simultaneous callers — two tabs, a
dev-mode double effect, a flaky retry — can't both pass the "no instance yet" check and each
create their own duplicate.

Editing a `BlockTemplate` (`PATCH /api/block-templates/<id>`) calls
`sync_future_blocks_with_template` right after saving, so *today's and every already-materialized
future* `Block` generated from it picks up the edit immediately instead of waiting for each
instance's own day to regenerate. It only overwrites each instance's config fields
(title/description/tags/that instance's own governing start_time/duration_minutes, recomputed per
instance's own date since different dates can be governed by different segments) — and only when
that instance is still `is_template_synced`; one a user has edited directly (see
`app/blocks/CLAUDE.md`'s `PATCH /api/blocks/<id>`) is left exactly as set — and only ever *adds*
nested tasks for task templates due on that instance's own date that the Block doesn't already
have one of — it never touches an existing nested task's own recorded state
(`is_complete`/`completed_at`/`is_skipped`/`due_date`) and never removes one. Blocks from any
earlier day are historical and are never touched by a template edit.
`materialize_occurrence(template_id, for_date)` is the same generation logic used on demand for a
*future* date, the first step of overriding one occurrence before its own day arrives.

Blocks are not carried forward: at most one instance is generated per template per day, and a
missed day's instance is never mutated forward — it just becomes ordinary task history once its
day has passed. "Due or overdue" tracking (`get_todays_view`'s `due` bucket) only applies to
ad-hoc (non-block) tasks.

`note.py` is a single `Note` type serving two different UI surfaces: a daily journal entry
(`journal_date` set, no target — the journaling card on the Today page and the Journal tab) and
an ad-hoc note attached to a task or project (`target_type`/`target_id` set together, never just
one — enforced by `note.set_target`, the only way to change either field). `note_routes.py`
(`GET /api/notes`) supports `?targetType=&targetId=` (one object's attached notes),
`?journalOnly=true` (pure journal entries), or no params (every note, for a "view all notes"
page) — each serialized note includes a computed `effectiveDate` (`journalDate` if set, else the
date part of `createdAt`) so frontend day-grouping doesn't need to duplicate that rule.
