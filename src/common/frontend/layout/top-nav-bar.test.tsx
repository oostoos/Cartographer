import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";

import { TopNavBar } from "./top-nav-bar";

const LINKS = [
  { label: "Tasks", to: "/tasks" },
  { label: "Profile", to: "/profile" },
];

describe("TopNavBar", () => {
  it("renders the brand name and tagline", () => {
    render(
      <MemoryRouter>
        <TopNavBar brand="Cartographer" tagline="helping you map your life" links={LINKS} />
      </MemoryRouter>,
    );

    expect(screen.getByText("Cartographer")).toBeInTheDocument();
    expect(screen.getByText("helping you map your life")).toBeInTheDocument();
  });

  it("renders a link for every entry in links, pointing at the right path", () => {
    render(
      <MemoryRouter>
        <TopNavBar brand="Cartographer" tagline="helping you map your life" links={LINKS} />
      </MemoryRouter>,
    );

    expect(screen.getByRole("link", { name: "Tasks" })).toHaveAttribute("href", "/tasks");
    expect(screen.getByRole("link", { name: "Profile" })).toHaveAttribute("href", "/profile");
  });

  it("renders no nav links when given an empty list", () => {
    render(
      <MemoryRouter>
        <TopNavBar brand="Cartographer" tagline="helping you map your life" links={[]} />
      </MemoryRouter>,
    );

    expect(screen.queryAllByRole("link")).toHaveLength(1);
  });
});
