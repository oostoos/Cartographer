<!-- @manualReviewRequested: 2026-07-07 -->
# Journals (frontend)

Notes and journaling are one and the same thing now, not two separate surfaces — every `Note`
(`journalDate` set for a plain entry, or `targetType`/`targetId` set for one attached to a task or
project; see the backend's `app/journals/note.py`) shows up in one unified feed. There is no more
Today page, Journal tab, or "view all notes" page as their own routes — see
`app/calendar/CalendarPage.tsx`, the app's home page, which hosts what those used to cover.

`NotesFeed.tsx` is the unified feed, styled like a chat history: every note in the app
(`useAllNotes`) renders as its own `Card`, oldest first both across days and within a day, so the
newest note always lands just above the composer pinned below this feed — the grouping itself
still comes from the shared `groupNotesByDate` (`noteGrouping.ts` — the one place that
day-grouping rule lives, so `NotesFeed` and any other day-grouped notes view share it instead of
each re-deriving it; the backend's `GET /api/notes` still returns notes newest-created-first,
`groupNotesByDate` is what reverses that into oldest-first for this feed), but each group renders
as a lightweight date separator (`noteFormat.ts`'s `formatDateSeparator` — "Today"/"Yesterday"/a
short date) instead of a `Card` heading, so a day never repeats on every one of its notes, only
once when the feed reaches it. The feed owns its own scrolling (`overflow-y: auto` on
`.cg-notes-feed` itself, not its `RightSidebar` wrapper) and scrolls itself to the bottom on mount
and whenever the note list changes, so the newest note is always in view next to the composer.
Each note's card shows its time-of-day (`noteFormat.ts`'s `formatNoteTime`, reading the
`createdAt` timestamp every `Note` already carries) alongside its task/project target label, if
any (reading `useTasks`/`useProjects` — a sanctioned cross-domain read, same reasoning as
`app/tasks/CLAUDE.md`/`app/projects/CLAUDE.md`'s own cases); a plain journal entry isn't labeled.
Mounted in the calendar page's right sidebar (`app/calendar/RightSidebar.tsx`).

`NoteComposer.tsx` is the chat-prompt-style "type and send" box pinned at the bottom of that same
sidebar, always available regardless of what's selected elsewhere on the page: an optional title
plus content, submitted as a plain journal-dated note (`journalDate` = today, no target) via
`useCreateNote`, either by clicking Add or by Ctrl/Cmd+Enter in the content field. Replaces the old
`JournalingCard`.

`NotesSection.tsx` is unchanged in spirit — the collapsed "Notes" section embedded in a task/
project's detail pane (`targetType`/`targetId` set), showing that one target's few most recent
notes plus an "Add note" modal — except it no longer links out to a "view all notes" page (that
page is gone; the full history is always one glance away in the right sidebar instead).

Every notes query (`useAllNotes`/`useNotesForTarget`) is nested under one shared `["notes"]`
query-key prefix in `useNotes.ts`, so any note mutation invalidates every view in one
`invalidateQueries` call rather than tracking each key individually.
