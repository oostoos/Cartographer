// @manualReviewRequested: 2026-07-06
import { Navigate, Outlet } from "react-router-dom";

import { useAuthStatus } from "../../app/auth/useAuthStatus";

/** Gates every route nested under it behind an active login session, redirecting to /login
 * otherwise. This is the one place in core/ allowed to reach into app/ — bootstrapping the
 * authenticated shell inherently needs to know about auth.
 */
export function RequireAuth() {
  const { data, isLoading } = useAuthStatus();

  if (isLoading) return null;
  if (!data?.loggedIn) return <Navigate to="/login" replace />;
  return <Outlet />;
}
