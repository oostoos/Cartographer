// @manualReviewRequested: 2026-07-06
import { useQueryClient } from "@tanstack/react-query";
import { Navigate, Outlet, Route, Routes, useNavigate } from "react-router-dom";

import { logout } from "../../app/auth/authApi";
import { LoginPage } from "../../app/auth/LoginPage";
import { AUTH_STATUS_QUERY_KEY } from "../../app/auth/useAuthStatus";
import { AllNotesPage } from "../../app/journals/AllNotesPage";
import { JournalPage } from "../../app/journals/JournalPage";
import { TodaysJournalPage } from "../../app/journals/TodaysJournalPage";
import { ProjectListPage } from "../../app/projects/ProjectListPage";
import { SettingsPage } from "../../app/settings/SettingsPage";
import { TaskListPage } from "../../app/tasks/TaskListPage";
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

/** Every route in the app: the public login page, and everything else gated behind RequireAuth. */
export function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<RequireAuth />}>
        <Route element={<AuthenticatedLayout />}>
          <Route path="/" element={<TodaysJournalPage />} />
          <Route path="/tasks" element={<TaskListPage />} />
          <Route path="/projects" element={<ProjectListPage />} />
          <Route path="/journal" element={<JournalPage />} />
          <Route path="/notes" element={<AllNotesPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Route>
    </Routes>
  );
}
