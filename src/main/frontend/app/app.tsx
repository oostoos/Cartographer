import { Outlet } from "react-router-dom";

import { PageContainer } from "@common/layout/page-container";

import { Nav } from "./nav";

/** App shell: the persistent nav bar plus whatever the current route renders, centered in a shared page container. */
export function App() {
  return (
    <>
      <Nav />
      <PageContainer>
        <Outlet />
      </PageContainer>
    </>
  );
}
