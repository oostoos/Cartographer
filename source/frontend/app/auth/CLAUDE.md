# Auth (frontend)

`LoginPage.tsx` is the only public route (see `core/app-shell/AppRoutes.tsx`). `useAuthStatus.ts`
wraps `GET /api/auth/status`, cached under `AUTH_STATUS_QUERY_KEY` — `RequireAuth.tsx` reads this
same hook to decide whether to redirect to `/login`. After login/logout, invalidate
`AUTH_STATUS_QUERY_KEY` (don't just navigate) so `RequireAuth` re-evaluates.
