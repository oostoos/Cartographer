import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";

import { Nav } from "./nav";

describe("Nav", () => {
  it("renders the Cartographer brand and its Tasks/Profile links", () => {
    render(
      <MemoryRouter>
        <Nav />
      </MemoryRouter>,
    );

    expect(screen.getByText("Cartographer")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Tasks" })).toHaveAttribute("href", "/tasks");
    expect(screen.getByRole("link", { name: "Profile" })).toHaveAttribute("href", "/profile");
  });
});
