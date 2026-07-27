import { Outlet, useMatch } from "react-router-dom";

import { PageContainer } from "@lib-stack/layout/page-container";

import "./app.css";

import { Nav } from "./nav";

/** App shell: the persistent nav bar plus whatever the current route renders, centered in a shared page container.
 * The Tasks page's multi-column layout gets the full viewport width instead of the usual centered column. */
export function App() {
  const isTasksRoute = Boolean(useMatch("/tasks/*"));

  return (
    <div className="app-shell">
      <Nav />
      <PageContainer fullWidth={isTasksRoute}>
        <Outlet />
      </PageContainer>
    </div>
  );
}
