import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, expect, it } from "vitest";

import { App } from "./app";

describe("App", () => {
  it("renders the persistent nav above the routed page content", () => {
    render(
      <MemoryRouter initialEntries={["/child"]}>
        <Routes>
          <Route element={<App />}>
            <Route path="child" element={<div data-testid="page-content">page content</div>} />
          </Route>
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText("Cartographer")).toBeInTheDocument();
    expect(screen.getByTestId("page-content")).toBeInTheDocument();
  });

  it("renders routed content inside the shared page container", () => {
    render(
      <MemoryRouter initialEntries={["/child"]}>
        <Routes>
          <Route element={<App />}>
            <Route path="child" element={<div data-testid="page-content">page content</div>} />
          </Route>
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByTestId("page-content").closest(".page-container")).not.toBeNull();
  });
});
