<!-- @manualReviewRequested: 2026-07-07 -->
# Workspaces (frontend)

A workspace is a **collection lens, not an owning parent** — a named grouping ("School", "Work",
"Training") that pulls together a related set of tasks/projects/notes/block templates, not a
hierarchy they live inside. `workspaceApi.ts`/`useWorkspaces.ts` follow the exact same shape every
other domain's does (mirrors `app/projects/projectApi.ts`/`useProjects.ts`).

`WorkspaceListPage.tsx` (route `/workspaces`) pairs a flat `List` (no `TreeList` — a workspace has
no nesting concept, unlike a project) with `WorkspaceDetailPane.tsx` through the shared
`MasterDetailLayout`, the same shell `ProjectListPage.tsx` uses. `WorkspaceCreateModal.tsx` is
icon-only to match every other create button (Task/Project/Block).

`WorkspaceDetailPane.tsx` aggregates the selected workspace's tasks/projects/notes/block templates
by **client-side filtering the app's already-fetched lists** (`useTasks`/`useProjects`/
`useAllNotes`/`useBlockTemplates`, each already a sanctioned cross-domain read elsewhere in the
app) rather than adding a `?workspaceId=` query param to four separate backend routes — the
datasets are small (single local user) and every one of those hooks' data is already fetched
app-wide on most pages, so an extra server round-trip isn't buying real performance, just
complexity. Its task list reuses `app/tasks/TaskList.tsx` like every other task list in the app.
Deleting a workspace (`useDeleteWorkspace`) only ever unassigns these items (`workspaceId` cleared
back to `""`) — never deletes them, consistent with the backend's own `_unassign_workspace` (see
`app/workspaces/CLAUDE.md` on the backend).

`WorkspaceColorPicker.tsx` is a small dedicated swatch-grid control, not built on `SetSelection` —
that control has no way to paint each pill a different color, and a 6-swatch picker is too small
and one-off a need to justify extending `SetSelection`'s API for it. It picks a key into the same
fixed block-color palette `app/blocks/blockColor.ts` already indexes into for block templates
(`tokens.css`'s `--color-block-*` pairs), just user-chosen here instead of assigned by list
position.

A workspace picker (`Select`, "No workspace" sentinel value — the same pattern
`app/tasks/TaskForm.tsx`'s existing Project picker already used) is wired into the four
domains that carry a `workspaceId` field: `TaskForm.tsx` (via `TaskCreateModal.tsx`),
`ProjectCreateModal.tsx`, `app/blocks/BlockDetailSidebar.tsx`, and `NoteComposer.tsx`. Each of
those reads `useWorkspaces()` directly — a lower-level component reaching across domains, the same
precedent `TaskCreateModal.tsx` already set by reading `useProjects()` there.
