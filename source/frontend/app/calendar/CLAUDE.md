<!-- @manualReviewRequested: 2026-07-07 -->
# Calendar (frontend)

`CalendarPage.tsx` (route `/`) is the app's home page and the hub everything else opens from: a
left card sidebar (`LeftSidebar.tsx` — `BlocksCard`/`TasksCard`/`ProjectsCard`, each an
independently collapsible `CollapsibleCard`), a center pane that's either the calendar itself
(week or month view) or a selected task's/project's/block template's/block occurrence's own detail
pane, and a right card sidebar (`RightSidebar.tsx`) holding the unified notes feed and its composer
(both from `app/journals/`, see its own CLAUDE.md). Selecting anything — a sidebar row, a calendar
occurrence, a task chip — never navigates to another route; it sets `CalendarPage`'s own
`selection` state (`{kind: "task"|"project"|"block-template"|"creating-block-template"|
"block-occurrence", id}`), which swaps the center pane's content in place. `block-template` (from
the left sidebar's Blocks card, or "+ New Block") opens `app/blocks/BlockDetailSidebar.tsx` — the
whole series' own shape; `block-occurrence` (from clicking one occurrence on the calendar grid)
opens `BlockOccurrenceDetailPane.tsx` instead — that one date alone, independent of the template
(see `app/blocks/CLAUDE.md` for why these are two separate edit scopes, not one form). A
"← Back to calendar" button clears the selection. Other pages that need to open something here
from elsewhere (e.g. `ProjectDetailPane.tsx`'s task rows) `navigate("/", { state: { selection } })`,
mirroring the `location.state` seeding pattern `ProjectListPage.tsx` already used for its own
selection.

Retired in favor of this page: the old `/tasks`, `/blocks`, `/journal`, and `/notes` routes and
their page components (`TaskListPage`, `BlockTemplatesPage`/`BlockWeekGrid`, `JournalPage`,
`AllNotesPage`, `JournalingCard`, `TodaysJournalPage`, `BlockCompletionCalendar`) — their
functionality now lives in this page's sidebars, center detail panel, and notes feed instead.
`TaskDetailPane`/`ProjectDetailPane`/`BlockDetailSidebar` (owned by their own domains) are reused
here as the center pane's detail content; `BlockOccurrenceDetailPane.tsx` lives in this domain
instead, since it operates on a `BlockOccurrence` (a calendar-domain type — `calendarApi.ts`), not
a `BlockTemplate`. The `/projects` route stays as its own
dedicated full page (see `app/projects/CLAUDE.md`) for deliberate deep browsing, alongside the
calendar's own condensed Projects card.

`calendarApi.ts`/`useBlockOccurrences.ts` read `GET /api/blocks/occurrences` (backend:
`app/blocks/block_routes.py`) — real generated `Block` instances for today, the past, and any
future date already materialized by a direct edit; occurrences projected live from each active
template's current segment for every other future date (`isProjected: true`, never persisted).
`useUpdateBlockOccurrence` (`useBlockOccurrences.ts`) is `PATCH /api/blocks/<id>` — editing one
occurrence directly, materializing it first if it's still projected (the backend handles that; the
frontend just sends the id it already has, real or `projected:...`), then invalidating every
occurrences query so the calendar picks up the edit immediately. `calendarDate.ts` is the one place
week/month grid math lives (Monday-start week dates, a month's padded grid, hour-of-day
positioning) — both `CalendarWeekView.tsx` and `CalendarMonthView.tsx` build on it instead of each
hand-rolling their own, which the old `BlockWeekGrid`/`BlockCompletionCalendar` used to do
independently.

A template's color (`app/blocks/blockColor.ts`) is assigned once in `CalendarPage.tsx`
(`buildTemplateColorIndex`, by the template's position in its list) and passed down to
`BlocksCard`, `CalendarWeekView`, and `CalendarMonthView` so a block reads as the same color
everywhere it appears, rather than each component computing its own index.

`CalendarWeekView.tsx` positions block occurrences by `startTime`/`durationMinutes` (same
percentage-of-grid math the old `BlockWeekGrid` used) and scheduled tasks (`Task.scheduledAt`'s
time-of-day, given a fixed short display duration since a task carries no duration of its own) on
the same 5 AM–11 PM grid; a task with only a `dueDate` (no precise time) renders as an all-day
chip in a strip above the timed grid instead. `CalendarMonthView.tsx` shows each day as a cell
with one colored dot per occurrence (capped, with a "+N" overflow) and a task count; clicking a
day switches to the week view anchored there, since a month cell is too small to browse or open
anything directly.

Deliberate scope cut: the left sidebar's `TasksCard` lists ad-hoc tasks but, unlike the old
`TaskListPage`, doesn't support drag-to-reorder — a compact sidebar card wasn't judged worth the
added drag-and-drop complexity for a first cut; a task's `order` field still exists and is still
respected everywhere it's read, just not editable from here.
