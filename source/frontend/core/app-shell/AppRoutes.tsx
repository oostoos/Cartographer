// @manualReviewRequested: 2026-07-06
import { useQueryClient } from "@tanstack/react-query";
import { Navigate, Outlet, Route, Routes, useNavigate } from "react-router-dom";

import { logout } from "../../app/auth/authApi";
import { LoginPage } from "../../app/auth/LoginPage";
import { AUTH_STATUS_QUERY_KEY } from "../../app/auth/useAuthStatus";
import { CalendarPage } from "../../app/calendar/CalendarPage";
import { ProjectListPage } from "../../app/projects/ProjectListPage";
import { SettingsPage } from "../../app/settings/SettingsPage";
import { WorkspaceListPage } from "../../app/workspaces/WorkspaceListPage";
import { TopNavBar } from "../navigation/TopNavBar";
import { RequireAuth } from "./RequireAuth";

/** The nav bar plus page content shown once someone is logged in. */
function AuthenticatedLayout() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  async function handleLogout() {
    await logout();
    await queryClient.invalidateQueries({ queryKey: AUTH_STATUS_QUERY_KEY });
    navigate("/login");
  }

  return (
    <>
      <TopNavBar onLogout={handleLogout} />
      <main className="cg-page-content">
        <Outlet />
      </main>
    </>
  );
}

/** Every route in the app: the public login page, and everything else gated behind RequireAuth.
 * The calendar page (see app/calendar/CalendarPage.tsx) is the app's home — Tasks, Blocks,
 * Journal, and "all notes" no longer have their own routes, having been absorbed into its
 * sidebars, center detail panel, and right-sidebar notes feed. Projects keeps its own full page
 * for dedicated browsing, alongside the calendar's own Projects sidebar card.
 */
export function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<RequireAuth />}>
        <Route element={<AuthenticatedLayout />}>
          <Route path="/" element={<CalendarPage />} />
          <Route path="/projects" element={<ProjectListPage />} />
          <Route path="/workspaces" element={<WorkspaceListPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Route>
    </Routes>
  );
}
