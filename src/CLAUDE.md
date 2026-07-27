# src/

Cartographer's business logic, plus the thin, non-reusable glue that doesn't
belong in a `lib/stack` package (port config, brand colors/fonts). See
`.ajx/AustinsSweManifesto.md` ("Code organization" section). Anything
reusable across other repos on the same stack lives in `lib/stack/` instead
— see [lib/stack/CLAUDE.md](../lib/stack/CLAUDE.md).

Grouped by functional area, not by file type (no top-level "hooks" or
"utils" dumping grounds).

- **`backend/`**: `app.py` (entrypoint, registers blueprints), `config.py`
  (Cartographer's port env-var config), `database/` (`task.py`/`profile.py`/
  `group.py` — business-facing wrappers around `record_store.py`, which
  binds `paths.py`'s `DATA_ROOT` to `lib/stack/parchment`'s page_store engine
  so callers never pass it), `tasks/`, `profile/`, and `groups/` (Flask
  blueprints + request schemas).
  `paths.py` picks `DATA_ROOT` between `.data/prod` and `.data/test` based on
  the `CARTOGRAPHER_DATA_ENV` env var (defaults to `prod`); pytest tests
  bypass both via the `_use_tmp_data_root` autouse fixture in `conftest.py`,
  which redirects to a fresh `tmp_path` per test.
- **`frontend/`**: `entry.tsx` (mounts the app via `lib/stack/react`'s
  `mountReactApp`, loading `design/global.css` first), `design/` (Cartographer's
  actual brand tokens — `tokens.css`, `global.css`), `app/` (routing, nav, app
  shell), `tasks/`, `profile/`, and `groups/` (pages, API clients, hooks,
  types — one functional area per directory).
