App-specific business logic, grouped by functional area (not by file type).

- **`backend/`**: `app.py` (entrypoint, registers blueprints), `database/` (`task.py`/`profile.py` — business-facing wrappers around `record_store.py`, which binds `paths.py`'s `DATA_ROOT` to `src/common/backend/database`'s page_store engine so callers never pass it), `tasks/` and `profile/` (Flask blueprints + request schemas).
  `paths.py` picks `DATA_ROOT` between `.data/prod` and `.data/test` based on
  the `CARTOGRAPHER_DATA_ENV` env var (defaults to `prod`); pytest tests
  bypass both via the `_use_tmp_data_root` autouse fixture in `conftest.py`,
  which redirects to a fresh `tmp_path` per test.
- **`frontend/`**: `app/` (routing, nav, app shell), `tasks/` and `profile/` (pages, API clients, hooks, types — one functional area per directory).
