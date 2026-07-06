<!-- @manualReviewRequested: 2026-07-06 -->
# Frontend app

Feature code, one directory per domain — `auth`, `tasks`, `projects`, `journals`, `settings` —
mirroring the backend's `app/` domains (recurrence is folded into `tasks/` on the frontend since
it's only ever edited inline via `RecurrencePicker`, not as its own page). Each domain colocates
its page component(s), hooks (`use*.ts`), and `*Api.ts` fetch functions — no global `hooks/` or
`api/` dump.

State/data-fetching convention: every domain's `use*.ts` wraps TanStack Query
(`useQuery`/`useMutation`), reading from and invalidating one shared query key constant (e.g.
`TASKS_QUERY_KEY`). Components call a domain's `*Api.ts` functions only from inside a `use*.ts`
hook — there is no direct-call exception anywhere; `TodaysJournalPage`'s task creation goes
through `TaskCreateModal`/`useCreateTask` like every other create flow.
