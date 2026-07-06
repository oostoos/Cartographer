<!-- @manualReviewRequested: 2026-07-06 -->
# Projects (frontend)

`ProjectListPage.tsx` pairs the shared `Sidebar` (`core/design-system/components/Sidebar.tsx`,
showing top-level projects only — `parentProjectId === ""`) with `ProjectDetailPane.tsx`.
Subprojects are reached by drilling into a parent's detail pane, not through the sidebar or a
dedicated route — the app has no ID-based routing anywhere, so `ProjectListPage`'s existing
`selectedProjectId` state handles both top-level and nested selections identically via
`ProjectDetailPane`'s `onSelectProject` callback (used by its subproject rows and its breadcrumb
back to the parent).

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
sub-sections get added. It reads `useTasks` from `app/tasks` to show/count the project's tasks —
alongside `TaskListPage.tsx` reading `useProjects` from here, this is the app's other sanctioned
cross-domain hook import, for the same reason: a page-level component composing two features.
