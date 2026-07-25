App-specific business logic, grouped by functional area (not by file type).

- **`backend/`**: `app.py` (entrypoint, registers blueprints), `database/` (`task.py`/`profile.py` — business-facing wrappers around `record_store.py`, which binds `paths.py`'s `DATA_ROOT` to `src/common/backend/database`'s page_store engine so callers never pass it), `tasks/` and `profile/` (Flask blueprints + request schemas).
- **`frontend/`**: `app/` (routing, nav, app shell), `tasks/` and `profile/` (pages, API clients, hooks, types — one functional area per directory).
