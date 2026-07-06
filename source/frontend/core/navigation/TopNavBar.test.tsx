import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";

import { NAV_LINKS } from "./nav-links";
import { TopNavBar } from "./TopNavBar";

describe("TopNavBar", () => {
  it("renders every configured nav link", () => {
    render(
      <MemoryRouter>
        <TopNavBar onLogout={vi.fn()} />
      </MemoryRouter>,
    );
    for (const link of NAV_LINKS) {
      expect(screen.getByRole("link", { name: new RegExp(link.label) })).toBeInTheDocument();
    }
  });

  it("calls onLogout when the log out button is clicked", async () => {
    const onLogout = vi.fn();
    render(
      <MemoryRouter>
        <TopNavBar onLogout={onLogout} />
      </MemoryRouter>,
    );
    await userEvent.click(screen.getByRole("button", { name: /log out/i }));
    expect(onLogout).toHaveBeenCalledOnce();
  });
});
