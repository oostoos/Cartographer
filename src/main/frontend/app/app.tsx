import { Outlet } from "react-router-dom";

import { Nav } from "./nav";

/** App shell: the persistent nav bar plus whatever the current route renders. */
export function App() {
  return (
    <>
      <Nav />
      <Outlet />
    </>
  );
}
