App-specific business logic, grouped by functional area (not by file type).

- **`backend/`**: `app.py` (entrypoint, registers blueprints), `database/` (`task.py`/`profile.py` — business-facing wrappers around `src/common/backend/database`'s engine), `tasks/` and `profile/` (Flask blueprints + request schemas).
- **`frontend/`**: `app/` (routing, nav, app shell), `tasks/` and `profile/` (pages, API clients, hooks, types — one functional area per directory).
