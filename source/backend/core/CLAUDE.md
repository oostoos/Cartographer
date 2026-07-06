# Backend core

Infrastructure/plumbing only — no feature logic. Subdirectories:

- `storage/` — the file-based database engine. See its own CLAUDE.md; every object module in
  `app/` builds on `record_store.py`'s primitives, never one-off file I/O.
- `config/settings.py` — the single documented registry of every `.env`-able setting. Adding a
  setting means adding it to `SETTINGS_REGISTRY` here, nowhere else.
- `auth/login_guard.py` — the `@login_required` decorator every feature blueprint (except auth
  and the health check) is wrapped in.
- `utils/` — `clock.today()` (the one mockable place "what day is it" is read) and `ids.new_id()`.
- `app_factory.py` — builds the Flask app: config, CORS, error-handler mapping, blueprint
  registration. `run.py` (one level up) is what actually starts it. VS Code debug wiring lives
  entirely in `.vscode/launch.json`, not here.
