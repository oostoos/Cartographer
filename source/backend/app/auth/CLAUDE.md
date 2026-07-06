<!-- @manualReviewRequested: 2026-07-06 -->
# Auth (backend)

Single local user, session-cookie based. `auth_routes.py` exposes `POST /api/auth/login`,
`POST /api/auth/logout`, `GET /api/auth/status` — none of them gated by `@login_required` (that
would be circular). The password hash and username come from `.env` via
`core/config/settings.py` (`ADMIN_USERNAME`, `ADMIN_PASSWORD_HASH`), so login doesn't depend on
the storage layer being healthy. The actual gate other blueprints use is
`core/auth/login_guard.login_required`, not anything in this directory.

`ADMIN_PASSWORD_DEV_OVERRIDE` (optional, plaintext) is accepted as an alternate password in
`login()`, but only while `FLASK_DEBUG` is on — it exists so the real password can be changed
locally without regenerating `ADMIN_PASSWORD_HASH` each time.
