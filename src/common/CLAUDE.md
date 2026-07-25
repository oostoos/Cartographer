Stack-specific shared logic — code that isn't business/app logic but is specific to the chosen stack (Flask + React/Vite), reusable across whatever `src/main` apps might exist.

- **`backend/`**: `app_factory.py` (bare Flask app + JSON error handling), `config.py` (shared `.env` config), `responses.py` (success/error envelope helpers), `database/` (the flat-file storage *engine* — `ids.py`, `page_store.py`, `list_store.py` — knows this app's `.page` storage format, not any business schema).
- **`frontend/`**: `bootstrap/` (mounts the React root), `design-language/` (design tokens, global styles, `Card`/`Button`), `layout/` (`TopNavBar`), `api/` (`http-client.ts`, the `/api`-prefixed fetch wrapper), `hooks/` (`useAsyncResource`, the shared load-on-mount + isLoading/error hook).
