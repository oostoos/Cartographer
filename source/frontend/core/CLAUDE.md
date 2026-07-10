<!-- @manualReviewRequested: 2026-07-06 -->
# Frontend core

Infrastructure/plumbing only — no feature logic. Subdirectories:

- `design-system/` — tokens, `Button`/`Card`/`TextInput`/`TextArea`/`Checkbox`/`Select`/`Field`/
  `EmojiIcon`/`BasicIcon`/`DragHandle`/`MasterDetailLayout`/`CollapsibleCard`. See its own
  CLAUDE.md for the hard rules (tokens-only colors, `EmojiIcon`-only emoji, `BasicIcon`-only
  traced icons).
- `navigation/TopNavBar.tsx` — the top-mounted nav bar; `nav-links.ts` is the one place to add a
  new page's nav entry.
- `api/apiClient.ts` — the one place every fetch call goes through (JSON, cookies, error shape).
  Every feature's `*Api.ts` calls `apiGet`/`apiPost`/`apiPatch`/`apiDelete` from here rather than
  calling `fetch` directly.
- `utils/date.ts` — `todayIsoDate()`, the one place "what's today's date" is computed. Never use
  `new Date().toISOString().slice(0, 10)` directly — it returns the *UTC* date, which drifts a
  day off local "today" near midnight in most timezones, and the backend's own `clock.today()` is
  local-date-only (see `core/utils/clock.py`).
- `utils/useShortcut.ts` — the one reusable keyboard-shortcut primitive: every shortcut in the app
  is Alt+Shift+(some key), registered via this hook rather than a one-off `keydown` listener per
  page (e.g. `CalendarPage.tsx`/`ProjectListPage.tsx` both use it for Alt+Shift+N "new").
- `utils/number.ts` — `parseNonNegativeInt()`, the one place a numeric text input's raw string is
  coerced to a persisted value. Empty/invalid input becomes `0`, this app's "unset" convention for
  an optional numeric field — pair it with a `string`-typed local input buffer (not `number`) so
  the field can render genuinely empty while the user is typing, deferring coercion to onChange-
  commit/save rather than every keystroke.
- `app-shell/` — `main.tsx` (the actual entry point), `AppRoutes.tsx`, `RequireAuth.tsx`. This is
  the one place in `core/` allowed to import from `app/` — bootstrapping inherently needs to know
  about the login page and auth status.
