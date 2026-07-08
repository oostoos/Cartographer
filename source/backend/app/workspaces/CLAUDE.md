<!-- @manualReviewRequested: 2026-07-07 -->
# Workspaces (backend)

`workspace.py` is a flat (non-nested) object type — title/description/color/is_archived/
created_at, the same minimal shape `app/projects/project.py` uses, scaffolded via the
`new-db-object-type` skill. A workspace is a **collection lens, not an owning parent**: it's a
named grouping a user can look at ("School", "Work", "Training") that pulls together a related
set of tasks/projects/notes/block templates, not a hierarchy those items live inside the way a
`Task` lives inside its `Project`.

`Task`, `Project`, `Note`, and `BlockTemplate` each carry an optional `workspace_id` field (empty
string means unassigned) — the same plain-id reference pattern `Task.project_id` already uses (see
`core/storage/CLAUDE.md`; no cross-reference validation, same as every other reference field in
this app). A generated `Block` instance doesn't carry its own `workspace_id` — it traces back to
one via `template_id`, consistent with `block.py`'s existing "denormalized copy of *some* template
fields, not all of them" pattern.

`workspace_routes.py`'s `DELETE /api/workspaces/<id>` **unassigns rather than cascades**:
`_unassign_workspace` clears `workspace_id` back to `""` on every task/project/note/block template
that pointed at the deleted workspace, then deletes the workspace itself — nothing else is ever
deleted. This is the direct consequence of "lens, not owner": deleting the way you're looking at a
set of items should never destroy the items themselves. Contrast with
`app/projects/project_routes.py`'s `DELETE /api/projects/<id>`, which cascades (or reassigns to
another project) because a `Project` genuinely owns its tasks.

`color` is a plain string key into the frontend's fixed block-color palette
(`source/frontend/core/design-system/tokens.css`'s `--color-block-*` pairs, the same palette
`app/blocks/blockColor.ts` already indexes into for block templates) — no color-specific field
type exists in `core/storage/field_types.py`, so it's stored unencoded like any other short string.
