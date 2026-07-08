<!-- @manualReviewRequested: 2026-07-06 -->
# Projects (frontend)

`ProjectListPage.tsx` pairs a `Card`-wrapped `TreeList` (`core/design-system/components/TreeList.tsx`)
with `ProjectDetailPane.tsx` through the shared `MasterDetailLayout`
(`core/design-system/components/MasterDetailLayout.tsx` — see `core/design-system/CLAUDE.md`) —
every project, including subprojects nested and expandable beneath their parent, rather than only
top-level ones. `projectTree.ts`'s `buildProjectTree` turns the flat project list into the
`TreeNode<Project>[]` shape `TreeList` expects; `collectAncestorProjectIds` walks a project's
`parentProjectId` chain upward so the sidebar can auto-expand down to whichever project is
currently selected. The app has no ID-based routing anywhere, so `ProjectListPage`'s existing
`selectedProjectId` state still handles both top-level and nested selections identically via
`ProjectDetailPane`'s `onSelectProject` callback (used by its subproject rows and its breadcrumb
back to the parent) — drilling into `ProjectDetailPane` keeps working exactly as before and now
also drives the sidebar tree's expansion via the same state. `selectedProjectId` also seeds itself
from `location.state.projectId` on mount (then clears that state) — this is what lets another page
navigate here with a project pre-selected via `navigate("/projects", { state: { projectId } })`;
`app/calendar/CalendarPage.tsx` seeds its own selection the same way, via
`{ state: { selection } }`. This composes cleanly with
`MasterDetailLayout`'s own close (X) button: the breadcrumb/subproject rows only ever change
*which* project `onSelectProject` points at (still rendering split, with new detail content),
while the close button calls `onCloseDetail` → `setSelectedProjectId(null)`, a different action
that clears the selection entirely and returns to the centered, list-alone state.

Deleting a project with tasks and/or subprojects in it shows an inline confirmation offering to
move them to another project or cascade-delete them (mirroring `useDeleteProject`'s
`moveChildrenToProjectId` option) — see `useProjects()`. Both the parent-reassignment select and
the move-children-to select exclude the project's own descendants
(`ProjectDetailPane.collectDescendantIds`), since reassigning to a descendant would create a
cycle in the project tree — the backend itself does no such validation (no object type in this
app validates reference fields against real records), so this is purely a client-side safeguard.

`ProjectDetailPane.tsx` is a plain wrapper `<div>` around several `Card`s, not one big `<form>` —
same reasoning as `TaskDetailPane.tsx` (see `app/tasks/CLAUDE.md`): keeping "Save changes" a
plain button with an `onClick` handler avoids any future nested-`<form>` risk as more
sub-sections get added. It reads `useTasks` from `app/tasks` and renders the project's tasks
through `TaskList` (`app/tasks/TaskList.tsx`, `capabilities={{ allowEdit: true }}`) — the same
shared control every task list in the app uses — with `onSelectTask` navigating to `/` (the
calendar page) with `{ selection: { kind: "task", id } }` in router state, opening that task's
detail there. Alongside
`app/calendar/CalendarPage.tsx` reading `useProjects` to populate `TaskDetailPane`'s project
picker, this is the app's other sanctioned cross-domain hook import, for the same reason: a
page-level component composing two features.
