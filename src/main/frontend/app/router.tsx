import { Navigate, Route, Routes } from "react-router-dom";

import { ProfilePage } from "../profile/profile-page";
import { TaskDetailPanel } from "../tasks/task-detail-panel";
import { TasksPage } from "../tasks/tasks-page";
import { App } from "./app";

/** Cartographer's top-level route table. The caller supplies the Router (see entry.tsx). */
export function AppRoutes() {
  return (
    <Routes>
      <Route element={<App />}>
        <Route index element={<Navigate to="/tasks" replace />} />
        <Route path="tasks" element={<TasksPage />}>
          <Route path=":taskId" element={<TaskDetailPanel />} />
        </Route>
        <Route path="profile" element={<ProfilePage />} />
      </Route>
    </Routes>
  );
}
