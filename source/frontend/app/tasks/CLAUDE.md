<!-- @manualReviewRequested: 2026-07-07 -->
# Tasks (frontend)

Recurrence editing no longer lives here — it moved to `app/blocks/` entirely (see its own
CLAUDE.md), since a task no longer carries its own recurrence: it only ever recurs by being
nested inside a block template, edited from the calendar page's Blocks card
(`app/calendar/BlocksCard.tsx`, reusing `BlockDetailSidebar`). `TaskForm.tsx` is back to a plain
title + optional project form, with no recurrence branch; `TaskDetailPane.tsx` has no recurrence
card or "Promote to recurring…" action — a block-nested task never reaches this pane anyway, since
it's hidden from the calendar's Tasks card entirely (see below). `TaskDetailPane.tsx` takes its
`projects` list as a prop rather than reading `useProjects` itself — `app/calendar/CalendarPage.tsx`
(and `ProjectListPage.tsx`, for its own detail pane) reads `useProjects` once and passes it down,
one of the app's sanctioned cross-domain hook reads (see `app/projects/CLAUDE.md` for the other),
since a page-level component composing two features is the deliberate exception, not a
lower-level component reaching across domains on its own.

`TaskList.tsx` is the one task-row-rendering control every task list in the app builds on —
Complete/Skip/Delete/click-to-edit are each independently opt-in via a `capabilities` prop
(`allowComplete`/`allowDelete`/`allowEdit`; Skip is always driven per-row by `task.isSkippable`
regardless of `capabilities`, matching how every task list already shows Skip independently of
navigation), so `TasksCard.tsx`, `SubtaskList.tsx`, and `ProjectDetailPane.tsx` each show only the
actions that make sense for them while sharing one implementation. It wraps the generic `List`
component (`core/design-system/components/List.tsx`) and owns its own complete/skip/delete
mutations (`useUpdateTask`/`useDeleteTask`) internally, so callers never wire that plumbing
themselves — a caller only ever hands it a `tasks` array plus which capabilities/`newItemLine`/
`completedGroup` it wants. `TaskList` never shows a static "no tasks yet" message alongside a
`newItemLine` — the always-present quick-add row is itself the empty state; an `emptyMessage` prop
only applies when there's no `newItemLine` at all (e.g. `ProjectDetailPane.tsx`'s task list, which
creates only via the header's `TaskCreateModal`, no inline quick-add).

A subtask is an ordinary `Task` with `parentTaskId` set to its owning task's id — there is no
separate `Subtask` object type or API surface; `useChildTasks(parentTaskId)`
(`useTasks.ts`) fetches one task's direct subtasks via `GET /api/tasks?parentTaskId=`, the same
`taskApi.ts`/`useTasks.ts` every other task list goes through. Nesting is capped at a single
level (a subtask can never itself gain subtasks), enforced by the backend, not the frontend.
`SubtaskList.tsx` renders its checklist via `TaskList` (`capabilities={{ allowDelete: true,
allowEdit: false }}`, since a subtask never navigates anywhere on click) with drag-and-drop
reordering (each drag PATCHes the moved subtasks' `order`, scoped to siblings sharing the same
`parentTaskId` — see the backend's `task.py`) and a `newItemLine` in place of a separate "Add
subtask" button: typing a title at the always-present bottom row and pressing Enter creates the
subtask and clears/refocuses the same input, so several can be added back-to-back without
re-clicking anything. Since `SubtaskList` owns its own reorder state (`useReorderableList`) and
passes a `reorderable` config through to `TaskList`, it also passes a matching `groupKey` so
`List` treats the same group as the sortable one.

`isSkippable` defaults to `true` for a block-nested task or a subtask (unless a `BlockTaskTemplate`
overrides it to `false` for a keystone habit — see `app/blocks/CLAUDE.md`), `false` for a plain
ad-hoc top-level task (see the backend's `task.create`), and is user-editable afterward via a
`CheckboxField` in `TaskDetailPane.tsx`'s Settings card — except for a subtask, which is always
skippable and never shows that toggle. Wherever a top-level task's Complete checkbox already
appears (the calendar page's `TasksCard.tsx` sidebar rows), an icon-only Skip button appears
alongside it whenever `isSkippable` is true, mirroring `SubtaskList.tsx`'s own Complete/Skip
idiom — `CalendarWeekView.tsx`'s scheduled-task chips are compact and show only `TaskTitle`,
since clicking one opens the full `TaskDetailPane` where every action is available.

`TaskDetailPane.tsx` is deliberately **not** one big `<form>` — its "Save changes" is a plain
button with an `onClick` handler rather than a form submit, since the pane is a plain wrapper
`<div>` around three `Card`s (title + subtasks; description + `NotesSection`; settings).

`TaskRow.tsx` is the shared "task as a checkbox + title" idiom and, via its exported `TaskTitle`
piece, is reused by `TaskList.tsx` (and so, transitively, `TasksCard.tsx`/`SubtaskList.tsx`/
`ProjectDetailPane.tsx`) and `CalendarWeekView.tsx`'s chips directly (`renderLeading` for the
checkbox, `renderTrailing` for the exported `TaskSkipButton` — both render as siblings of the
selectable row button, never nested inside it, so the Skip control reliably lands to the right of
the title everywhere it appears). `TaskTitle` gives a completed
task's title a struck-through, muted style and a skipped task's title an italic, muted style with
no strikethrough — deliberately different from each other, so "done" and "set aside" don't read
the same. It also appends a subtask-progress badge ("(2/4)", strictly-complete count over total)
whenever `task.subtaskCount` is non-null with `total > 0` (computed server-side, see
`task_routes._build_subtask_count_index`), and a completed-at label (`taskFormat.ts`'s
`formatCompletedAt` — the time if completed today, the date otherwise) once complete. An archived
task's title is also tagged with a 🗄️ `EmojiIcon` badge in `TaskTitle` — rendered unconditionally,
since an archived task never reaches the calendar's grid (`app/calendar/CalendarPage.tsx` filters
`isArchived` tasks out before handing them to `CalendarWeekView`/`CalendarMonthView`, the spiritual
successor to `today_engine`'s old due/backburner exclusion), so in practice the badge only ever
shows up on the calendar's `TasksCard.tsx` sidebar and a project's task list, which are the only
places `isArchived` isn't otherwise reflected in the UI (see `TaskDetailPane.tsx`'s Archived
`CheckboxField`, whose `title` tooltip clarifies that it only hides the task from the calendar,
not from these lists). A completed task, unlike an archived one, still reaches the calendar
grid — it renders there via the same struck-through/muted `TaskTitle` styling as everywhere else.

`TasksCard.tsx` (`app/calendar/TasksCard.tsx`) is the calendar page's left-sidebar Tasks section —
the closest thing to the old `TaskListPage.tsx`, though simpler: a `TaskList` with
`completedGroup` set, an active group with a `newItemLine` quick-add row (title-only; the full
`TaskCreateModal` "New task" button in the card's header stays alongside it for description/
project/due-date creation) and a collapsed "Completed" group sorted by `completedAt` descending.
Unlike the old page, it has no drag-to-reorder (a deliberate scope cut, see `app/calendar/CLAUDE.md`)
and isn't paired with
`TaskDetailPane.tsx` via `MasterDetailLayout` — selecting a task instead swaps the calendar page's
own center pane over to `TaskDetailPane`, no split-panel animation. Block-nested tasks don't
appear in this card at all — same treatment as subtasks — they only ever show nested under their
block in the calendar page's `BlocksCard.tsx` sidebar, for today only (see `app/blocks/CLAUDE.md`/
`app/calendar/CLAUDE.md`).
