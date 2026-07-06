# Tasks (frontend)

`RecurrencePicker.tsx` and `recurrenceApi.ts` live here (not in a separate frontend "recurrence"
domain) because recurrence is only ever edited inline as part of creating/editing a task, never
as its own page — `TaskForm.tsx` creates the `RecurringTaskTemplate` first (if any), then creates
the `Task` with the resulting `recurringTemplateId`. `TaskListPage.tsx` reads `useProjects` from
`app/projects` to populate the project picker — one of two sanctioned cross-domain hook imports
in this app (see `app/projects/CLAUDE.md` for the other), since a page (not a lower-level
component) is composing two features.

`TaskListPage.tsx` pairs the shared `Sidebar` (`core/design-system/components/Sidebar.tsx`,
grouped into "Recurring"/"Ad-hoc" by whether `recurringTemplateId` is set) with
`TaskDetailPane.tsx`. `subtaskApi.ts`/`useSubtasks.ts` follow the exact `taskApi.ts`/`useTasks.ts`
pattern; `SubtaskList.tsx` renders each subtask as "Complete"/"Skip" buttons that collapse into a
single "Undo" once one is set, each row prefixed with a decorative `└`/`├` connector (plain
`aria-hidden` characters, not routed through `EmojiIcon` — see
`core/design-system/CLAUDE.md`). `Task` itself now carries `isComplete`/`dueDate`/`scheduledAt`
directly — there is no separate per-day "entry" type; a recurring instance is an ordinary `Task`
row, see `app/journals/CLAUDE.md`.

`TaskDetailPane.tsx` is deliberately **not** one big `<form>` — `SubtaskList.tsx` has its own
inline `<form>` for adding a subtask, and nesting a `<form>` inside a `<form>` is invalid HTML
(browsers handle it inconsistently). Instead the pane is a plain wrapper `<div>` around three
`Card`s (title + subtasks; description + `NotesSection`; settings), and "Save changes" is a
plain button with an `onClick` handler rather than a form submit. `RecurrenceSettings.tsx` (shown
in the settings card only when `recurringTemplateId` is set) reads and edits the *owning*
`RecurringTaskTemplate`'s cadence via `useRecurringTaskTemplate`/`useUpdateRecurringTaskTemplate`
— a change there only affects instances generated after the save, never this task's own instance
retroactively. It reuses `RecurrencePicker` as-is for the edit form (its shape already matches
`CreateRecurringTaskTemplateInput`).

`TaskRow.tsx` is the shared "task as a checkbox + title" idiom, reused by the Today page's flat
lists (`app/journals/TodaysJournalPage.tsx`) and, via its exported `TaskTitle` piece, by
`TaskListPage.tsx`'s `Sidebar` usage (`renderLeading`/`renderItemLabel` — a checkbox can't nest
inside `Sidebar`'s selectable row button, so the checkbox and title render as separate siblings
there instead of through the combined `TaskRow` wrapper). A completed task's title is struck
through and muted — the same idiom `SubtaskList.tsx` uses for a resolved subtask.
