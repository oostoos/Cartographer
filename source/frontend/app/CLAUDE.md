<!-- @manualReviewRequested: 2026-07-07 -->
# Frontend app

Feature code, one directory per domain — `auth`, `tasks`, `projects`, `blocks`, `journals`,
`calendar`, `settings`, `workspaces` — mirroring the backend's `app/` domains (`calendar` has no
backend counterpart of its own; it's a frontend-only composition layer over `blocks`/`tasks`/
`projects`/`journals`, backed by the blocks domain's `GET /api/blocks/occurrences`). Each domain
colocates its page component(s), hooks (`use*.ts`), and `*Api.ts` fetch functions — no global
`hooks/` or `api/` dump.

State/data-fetching convention: every domain's `use*.ts` wraps TanStack Query
(`useQuery`/`useMutation`), reading from and invalidating one shared query key constant (e.g.
`TASKS_QUERY_KEY`). Components call a domain's `*Api.ts` functions only from inside a `use*.ts`
hook — there is no direct-call exception anywhere; task creation from the calendar page's sidebar
or toolbar goes through `TaskCreateModal`/`useCreateTask` like every other create flow.

`calendar` is the app's home page (`CalendarPage.tsx`, route `/`) and is unusually cross-domain by
design — it composes `blocks`, `tasks`, `projects`, and `journals` components directly rather than
owning its own data model, since its whole point is to be the one hub everything else opens from.
See `app/calendar/CLAUDE.md`.
