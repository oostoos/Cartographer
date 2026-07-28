import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, expect, it } from "vitest";

import { App } from "./app";

/** Renders `App` with a single child route at `routePath`, navigated to `initialEntry`. Every
 * test below only varies the route path and starting location, so this factors out the shared
 * MemoryRouter/Routes scaffolding. */
function renderAppWithChildRoute(routePath: string, initialEntry: string) {
  render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <Routes>
        <Route element={<App />}>
          <Route path={routePath} element={<div data-testid="page-content">page content</div>} />
        </Route>
      </Routes>
    </MemoryRouter>,
  );
}

describe("App", () => {
  it("renders the persistent nav above the routed page content", () => {
    renderAppWithChildRoute("child", "/child");

    expect(screen.getByText("Cartographer")).toBeInTheDocument();
    expect(screen.getByTestId("page-content")).toBeInTheDocument();
  });

  it("renders routed content inside the shared page container", () => {
    renderAppWithChildRoute("child", "/child");

    expect(screen.getByTestId("page-content").closest(".page-container")).not.toBeNull();
  });

  it("does not apply the full-width container on a non-tasks route", () => {
    renderAppWithChildRoute("child", "/child");

    expect(screen.getByTestId("page-content").closest(".page-container")).not.toHaveClass(
      "page-container--full-width",
    );
  });

  it("applies the full-width container on a /tasks route", () => {
    renderAppWithChildRoute("tasks", "/tasks");

    expect(screen.getByTestId("page-content").closest(".page-container")).toHaveClass(
      "page-container--full-width",
    );
  });
});
