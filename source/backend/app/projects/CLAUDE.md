<!-- @manualReviewRequested: 2026-07-06 -->
# Projects (backend)

`project.py` is a grouping object type that tasks can optionally belong to (`Task.project_id`)
and that can itself belong to another project as a subproject, to arbitrary nesting depth, via
`parent_project_id` (empty means top-level) — the same plain-id reference pattern
`Task.project_id` already uses. It also carries an optional `workspace_id` (empty means
unassigned — a cross-cutting collection tag, unrelated to `parent_project_id`'s hierarchy; see
`app/workspaces/CLAUDE.md`). `project_routes.py` is standard CRUD, same shape as `task_routes.py`.

Deleting a project (`DELETE /api/projects/<id>`) recursively deletes everything beneath it —
every subproject, and every task (with its subtasks) owned by this project or any of those
subprojects — unless the request body includes `{"moveChildrenToProjectId": str}`, in which case
only this project's *direct* tasks and direct subprojects are reassigned there instead, and only
this project itself is deleted. A moved subproject's own descendants are untouched — they move
along with it. See `project_routes._delete_project_recursively`/`_reassign_children`. Contrast
with a workspace's own delete, which unassigns rather than cascades — a project genuinely owns its
tasks, a workspace merely collects a view of items it doesn't own (see `app/workspaces/CLAUDE.md`).
