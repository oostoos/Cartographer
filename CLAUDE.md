# Cartographer

A daily-tracking and project-management app for people with ADHD, built to grow into a general
personal assistant. Single local user, runs on their own machine.

**Stack**: Vite + React + TypeScript frontend, Flask backend, and a hand-built file-based database
(no SQL, no embedded DB engine) — see `source/backend/core/storage/CLAUDE.md` for the format.

**Layout**: `source/{frontend,backend}/{core,app}`. `core/` is infrastructure/plumbing; `app/` is
feature code, grouped by domain (`tasks`, `journals`, `recurrence`, `projects`, `auth`, `settings`)
— never grouped by technical role (no global `hooks/`, `routes/`, or `components/` dumps). Every
subdirectory has its own short `CLAUDE.md` — read it before working there.

**Style rules that apply everywhere**:
- Plain, jargon-free naming. Top-level functions read like sentences; gnarly logic lives in small
  well-named helpers underneath.
- Every function/class/constant gets a one-to-a-few-line doc comment: what it does, its inputs and
  outputs, and any errors it directly raises. No comments explaining the obvious.
- Named constants over hard-coded literals, everywhere.
- Reuse or extend an existing library/helper before writing a new one. Reuse a pattern before
  inventing a variant.
- Database access follows the `record_id=` / `block=` convention documented in
  `source/backend/core/storage/CLAUDE.md` — never one-off file I/O.
- Adding a new database object type? Use the `new-db-object-type` skill rather than hand-rolling it,
  so every object type stays structurally identical.

**Visual style** (frontend): light theme, pastels/warm neutrals/blues/greens, Georgia font
throughout, top-mounted nav bar, emojis via the `EmojiIcon` component in place of icons.

**Secrets**: live only in `.env` (gitignored), never hard-coded. `source/backend/core/config/settings.py`
is the single documented registry of every setting `.env` can hold.
