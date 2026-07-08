<!-- @manualReviewRequested: 2026-07-07 -->
# Blocks (frontend)

Replaces the old `RecurringTaskListPage`/`recurrenceApi` feature entirely — recurrence is no
longer a task-level concept, it's a block-level one. `blockApi.ts` mirrors the backend's
`BlockTemplate`/`BlockTaskTemplate` shapes: `shape` (a `BlockShape` — `frequency`/`interval`/
`isAdvanced`/`instanceRows`, always the segment currently effective *today*, never the full
effective-dated history the backend keeps — see `app/blocks/CLAUDE.md` on the backend); `taskTemplates`
(each with its own `estimatedMinutes`, `isSkippable`, and an optional cadence override);
`taskTimeRange` (the computed min–max possible total task time). `useBlockTemplates.ts` wraps it
in TanStack Query the same way every other domain does — create/update/delete/generate-defaults
all invalidate `TASKS_QUERY_KEY` and `app/calendar/useBlockOccurrences.ts`'s
`BLOCK_OCCURRENCES_QUERY_KEY` too (a deliberate cross-domain import from `app/calendar`, since a
block template mutation eagerly (re)generates or removes today's `Block` server-side and changes
what the calendar projects for future days).

There is no more dedicated `/blocks` page or `BlockWeekGrid` — a block template's occurrences now
render directly on the real calendar (`app/calendar/CalendarWeekView.tsx`/`CalendarMonthView.tsx`,
backed by `GET /api/blocks/occurrences`, see `app/blocks/CLAUDE.md` on the backend), and templates
themselves are browsed from the calendar page's left-sidebar `BlocksCard.tsx`. Selecting a
template there, or "+ New Block", opens `BlockDetailSidebar` in the calendar page's center pane
(`app/calendar/CalendarPage.tsx`) — editing the template's own shape there always applies "from
today onward" (see below), never touching an already-generated or projected occurrence before
today. Clicking one of its *occurrences* on the calendar grid instead opens
`app/calendar/BlockOccurrenceDetailPane.tsx` — editing that one date alone, independent of the
template — since these are two different edit scopes (the whole series vs. one date), not one
form. There is still no drag-to-create/resize on the calendar grid itself. Coloring stays
consistent across `BlocksCard`, `CalendarWeekView`, and `CalendarMonthView` via one shared
`templateColorIndex` map built once in `CalendarPage.tsx`, so a block reads as the same color
everywhere rather than each view computing its own index into `blockColor.ts`'s small fixed
palette (`tokens.css`'s `--color-block-*` pairs).

`BlockDetailSidebar.tsx` holds everything about one template behind one Save: title/description,
`BlockOccurrenceEditor` (the template's own occurrence shape editor — see below), and an ordered
checklist of task templates — each with a title, a minutes estimate, a "Skippable" toggle, and a
per-row cadence editor (`RecurrencePicker`, reused here for a *task's* cadence override rather
than a block's own occurrence). Saving replaces the template's full task-template set wholesale,
matching the backend's own whole-form-save contract (`block_template_routes.py`); the `shape`
field, if changed, is sent as just "the new shape" — the frontend never constructs or displays
segment history, that bookkeeping is entirely the backend route's job
(`block_template.upsert_shape_effective_today`).

`BlockOccurrenceEditor.tsx` is the template's own occurrence editor: a daily/weekly/monthly/yearly
pill row (`SetSelection`) plus an "every N" interval, then either **simple mode** (the common
case — for weekly, checkboxes pick which weekdays; for monthly/yearly, an "Add day"/"Add date"
control appends a single unit; every selected unit shares one start-time/duration pair) or
**advanced mode** (a `Grid`, one row per selected unit with its own start-time/duration, plus the
Grid's built-in "copy one row's settings to selected others" bulk action) — toggled via a second
`SetSelection` pill row, hidden for daily (which has no selectable sub-unit, so it's always just
one shared time/duration pair). Both modes write to the exact same `instanceRows` shape; simple
mode is just "every row happens to share one value," so switching modes never loses data. A plain-
language summary (`blockApi.ts`'s `describeShape`) renders above the controls either way. Replaces
the old fixed per-weekday on/off grid (`WeeklyScheduleEditor`, retired) — its useful "apply to
all/weekdays/weekend" quick-fill idiom didn't carry over 1:1 (the new weekday checkboxes already
cover "which days," and `Grid`'s copy-to-selected-rows action covers "same time as this one"), so
there's no direct replacement for that specific one-click shortcut. Live overload warnings are
computed the same way as before, just against `instanceRows` instead of 7 fixed weekday slots.

`RecurrencePicker.tsx` moved here from `app/tasks/` (dropping its old `timeOfDay` field, which no
task-cadence override needs — that concept now lives entirely in a block's own occurrence shape)
since cadence editing only ever applies to a block-nested task now, never to a task directly or to
a block itself. Its frequency selector is a `SetSelection` pill row (matching
`BlockOccurrenceEditor`'s own frequency control) rather than a `Select` dropdown — note that
wrapping a multi-pill `SetSelection` in `Field` makes every pill's accessible name fold together
(a `<label>` can only implicitly associate with one control), so a test targeting one pill should
query by its visible text, not `getByRole("radio", {name})` — see `RecurrencePicker.test.tsx`.

Deliberate scope cut: no tags-editing UI in `BlockDetailSidebar` — no task-domain UI edits `tags`
today either (see `app/tasks/CLAUDE.md`), so this doesn't introduce a new, isolated pattern for
just this one form.
