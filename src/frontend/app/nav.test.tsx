import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";

import * as profileApi from "../profile/profile-api";
import { Nav } from "./nav";

describe("Nav", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders the Cartographer brand, the Tasks link, and a profile chip linking to /profile", async () => {
    vi.spyOn(profileApi, "fetchProfile").mockResolvedValue({ display_name: "Austin Shank" });

    render(
      <MemoryRouter>
        <Nav />
      </MemoryRouter>,
    );

    expect(screen.getByText("Cartographer")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Tasks" })).toHaveAttribute("href", "/tasks");
    expect(screen.getByRole("link", { name: "Profile" })).toHaveAttribute("href", "/profile");
    await waitFor(() => expect(screen.getByText("AS")).toBeInTheDocument());
  });
});
