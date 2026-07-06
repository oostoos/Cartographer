<!-- @manualReviewRequested: 2026-07-06 -->
# Journals (frontend)

`TodaysJournalPage.tsx` is the app's home page (route `/`) — the screen the app opens to. It reads
`useTodaysView` (wraps `GET /api/today`) and renders three sections — Recurring today / Due &
overdue / Backburner — each a small `TaskSection` over `TaskRow` (see `app/tasks/TaskRow.tsx`).
The three buckets are just `Task` records; there is no separate journal/entry type on the
frontend — a recurring instance is an ordinary `Task`. New tasks are created via
`TaskCreateModal` (`app/tasks/TaskCreateModal.tsx`), the same as every other page — there is no
longer a direct-`taskApi.createTask`-call exception here.

`JournalingCard.tsx` is the "write a journal entry" card mounted at the top of the Today page —
each submission becomes its own `Note` (`journalDate` set to today, no target) via
`useCreateNote` (`useNotes.ts`). `JournalPage.tsx` (the "Journal" tab, route `/journal`) reads
`useJournalEntries` (notes with no target, i.e. `?journalOnly=true`) and groups them by
`effectiveDate`, newest day first — the history view companion to the journaling card.

`NotesSection.tsx` is the collapsed "Notes" section embedded in a task/project's detail pane
(`targetType`/`targetId` set) — recent notes plus an "Add note" modal and a link to
`AllNotesPage.tsx` (route `/notes`, reachable only via that link, not the top nav — the
requirement asking for a nav tab was specifically the Journal tab). `AllNotesPage.tsx` reads
`useAllNotes` (every note, unfiltered) and, to label each attached note with the task/project it
belongs to, also reads `useTasks`/`useProjects` — a third sanctioned cross-domain hook usage
alongside the two documented in `app/tasks/CLAUDE.md`/`app/projects/CLAUDE.md`, needed here since
resolving a note's target title inherently spans domains.

Every notes query (`useJournalEntries`/`useNotesForTarget`/`useAllNotes`) is nested under one
shared `["notes"]` query-key prefix in `useNotes.ts`, so any note mutation invalidates all three
views in one `invalidateQueries` call rather than tracking each key individually.
