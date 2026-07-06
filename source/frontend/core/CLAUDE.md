# Frontend core

Infrastructure/plumbing only — no feature logic. Subdirectories:

- `design-system/` — tokens, `Button`/`Card`/`TextInput`/`Checkbox`/`EmojiIcon`. See its own
  CLAUDE.md for the two hard rules (tokens-only colors, `EmojiIcon`-only emoji).
- `navigation/TopNavBar.tsx` — the top-mounted nav bar; `nav-links.ts` is the one place to add a
  new page's nav entry.
- `api/apiClient.ts` — the one place every fetch call goes through (JSON, cookies, error shape).
  Every feature's `*Api.ts` calls `apiGet`/`apiPost`/`apiPatch`/`apiDelete` from here rather than
  calling `fetch` directly.
- `utils/date.ts` — `todayIsoDate()`, the one place "what's today's date" is computed. Never use
  `new Date().toISOString().slice(0, 10)` directly — it returns the *UTC* date, which drifts a
  day off local "today" near midnight in most timezones, and the backend's own `clock.today()` is
  local-date-only (see `core/utils/clock.py`).
- `app-shell/` — `main.tsx` (the actual entry point), `AppRoutes.tsx`, `RequireAuth.tsx`. This is
  the one place in `core/` allowed to import from `app/` — bootstrapping inherently needs to know
  about the login page and auth status.
