<!-- @manualReviewRequested: 2026-07-07 -->
# Blocks (backend)

Owns four object/value types, replacing the old `recurrence` domain's `RecurringTaskTemplate`
entirely:

- `block_template.py` — a recurring block of time (title/description/tags, an ordered `segments`
  list of `BlockTemplateSegment`s — see `block_template_segment.py` — plus optional overall
  `start_date`/`end_date` series bounds, independent of the segments' own shapes). `order` is only
  a same-time tiebreaker on the Today page; the block editor has no manual list ordering of its
  own.
- `block_template_segment.py` — a value type (not its own object type/route) embedded in a
  template's `segments` field. Each `BlockTemplateSegment` is one **effective-dated** occurrence
  shape: a `Frequency` (daily/weekly/monthly/yearly), an "every N" `interval`, and a set of
  `InstanceRow`s — one per selectable unit the frequency exposes (a weekday for weekly, a
  day-of-month for monthly, a month+day for yearly; daily always has exactly one implicit row). A
  unit with no row is off, the same meaning the old `weekly_schedule`'s per-day `is_active=False`
  carried. `is_advanced` is a pure frontend-form hint (simple mode writes every generated row with
  the same time; advanced mode lets each row have its own) — storage and occurrence math never
  branch on it. `segment_effective_on(segments, date)` picks whichever segment governs a date (the
  latest `effective_from` that isn't after it); `upsert_effective_today` is how an ordinary sidebar
  edit is applied — it appends a new segment effective from today (or overwrites an already-today
  segment, so several edits in one day don't stack), leaving every earlier segment, and therefore
  every already-generated or projected occurrence before today, untouched. Occurrence math itself
  is entirely delegated to `app/recurrence/recurrence_engine.occurs_on`, called once per instance
  row with that row's selector translated into whichever cadence field the frequency needs — the
  same math `block_task_template.py`'s own per-task override already used, with nothing duplicated.
- `block_task_template.py` — one task nested inside a block template: title, `is_skippable`,
  `estimated_minutes`, `order` (scoped to its `block_template_id`), and an *optional* recurrence
  override (`frequency`/`interval`/`start_date`/`end_date`/`days_of_week`/`day_of_month`/
  `month_of_year`). `frequency = None` means "every time the block occurs" — the common case. A
  set `frequency` requires `start_date` too (same pairing `recurring_task_template.py` used to
  require) and is checked via `app/recurrence/recurrence_engine.occurs_on`, layered on top of
  whichever days the block itself occurs — e.g. within one "Morning Routine" block, "take
  vitamins" can be every time while "change razor blade" is weekly and "deep clean shower" is
  monthly.
- `block.py` — the generated instance: system-generated for every day up to and including today
  (see `app/journals/today_engine.py`'s `ensure_todays_blocks_exist`), plus on-demand for a future
  date the moment a user overrides that one occurrence directly (`PATCH /api/blocks/<id>`, see
  `block_routes.py` and `today_engine.materialize_occurrence`). Its title/description/tags/
  start_time/duration_minutes/order are copied from the template (and whichever segment/instance
  row governs its date) at generation time. `is_template_synced` (default `True`) tracks whether
  this instance should still pick up the template's later edits — a direct instance edit sets it
  `False`, and from then on `sync_future_blocks_with_template` leaves that instance alone forever
  (until it's edited again), regardless of what the template says. A `Block` is never itself
  completed or archived — only the `Task`s nested inside it (via `Task.block_id`, see
  `app/tasks/CLAUDE.md`) are.

`block_time_estimate.py` computes a block template's possible total task time as a static
min–max sum (not a calendar simulation): `min_minutes` sums only the task templates with no
cadence override (guaranteed every time the block occurs), `max_minutes` sums all of them. This
is what the block editor sidebar shows next to the configured duration, flagging guaranteed
overload (`min_minutes` exceeds it) or possible overload (only `max_minutes` does).

`block_template_routes.py` (`/api/block-templates`) saves a block template and its full ordered
set of task templates together as one whole form — every create/update wholesale-replaces the
existing `BlockTaskTemplate` set from the payload (validated fully before any deletion happens, so
a bad entry never leaves a half-replaced task list). A template's own occurrence travels over the
wire as one `"shape"` object (`{frequency, interval, isAdvanced, instanceRows}`) — never the raw
segment history — representing whichever segment is effective *today*; saving a `"shape"` always
means "apply this from today onward" (`block_template.upsert_shape_effective_today`), so the
frontend never needs to know segment history exists at all. `POST .../generate-defaults`
(`default_block_templates.py`) creates a starter set of ADHD-oriented presets — small discrete
tasks, self-care anchoring, non-skippable keystone habits, and a daily "anti-snowball" chore
reset — safe to call repeatedly with no de-duplication, since it's a one-time starting point the
user immediately customizes.

Block templates have no separate historical/list browsing page — they're edited from the calendar
page's left sidebar (`source/frontend/app/calendar/BlocksCard.tsx`) and its detail panel (reusing
`source/frontend/app/blocks/BlockDetailSidebar.tsx`).

`block_occurrences.py` computes occurrences across a date range for the calendar page — the data
behind `GET /api/blocks/occurrences` (`block_routes.py`). For any date <= today in range it
returns the real generated `Block` instance if one exists; for any date after today, it returns a
real instance too if that one occurrence has already been materialized by a direct edit, or
otherwise computes a projected (not persisted) occurrence directly from each active template's
segments via `block_schedule.shape_for_date`, tagged `is_projected=True` with a synthetic
`projected:{template_id}:{date}` id (`PROJECTED_ID_PREFIX`) — a block is otherwise never generated
ahead of its day (see `app/journals/today_engine.py`). The route calls
`today_engine.ensure_todays_blocks_exist()` first so a range spanning today reflects the latest
templates, the same generate-as-a-side-effect-of-viewing pattern `GET /api/today` uses.

`block_routes.py` also exposes `PATCH /api/blocks/<occurrence_id>` — editing exactly one
occurrence, independent of its template. `occurrence_id` may be a real `Block` id or a still-
projected `projected:{templateId}:{date}` id; the route materializes the latter first (via
`today_engine.materialize_occurrence`, copying the template's current shape as the starting point)
before applying the edit and setting `is_template_synced=False`.
