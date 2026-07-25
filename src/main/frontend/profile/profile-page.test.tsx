import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import * as profileApi from "./profile-api";
import { ProfilePage } from "./profile-page";
import type { TProfile } from "./types";

const PROFILE: TProfile = { display_name: "Austin" };

describe("ProfilePage", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders the Profile heading and the loaded display name", async () => {
    vi.spyOn(profileApi, "fetchProfile").mockResolvedValue(PROFILE);

    render(<ProfilePage />);

    expect(screen.getByRole("heading", { name: "Profile" })).toBeInTheDocument();
    await waitFor(() => expect(screen.getByLabelText("Display name")).toHaveValue("Austin"));
  });

  it("renders an error message when loading fails", async () => {
    vi.spyOn(profileApi, "fetchProfile").mockRejectedValue(new Error("network error"));

    render(<ProfilePage />);

    await waitFor(() => expect(screen.getByRole("alert")).toBeInTheDocument());
  });

  it("saves an edited display name", async () => {
    vi.spyOn(profileApi, "fetchProfile").mockResolvedValue(PROFILE);
    const setDisplayNameSpy = vi
      .spyOn(profileApi, "setDisplayName")
      .mockResolvedValue({ display_name: "Jamie" });

    render(<ProfilePage />);
    await waitFor(() => expect(screen.getByLabelText("Display name")).toHaveValue("Austin"));

    fireEvent.change(screen.getByLabelText("Display name"), { target: { value: "Jamie" } });
    fireEvent.click(screen.getByRole("button", { name: "Save" }));

    await waitFor(() => expect(setDisplayNameSpy).toHaveBeenCalledWith("Jamie"));
  });

  it("requires a confirm step before deleting all data", async () => {
    vi.spyOn(profileApi, "fetchProfile").mockResolvedValue(PROFILE);
    const deleteSpy = vi.spyOn(profileApi, "deleteAllData").mockResolvedValue(undefined);

    render(<ProfilePage />);
    await waitFor(() => expect(screen.getByLabelText("Display name")).toHaveValue("Austin"));

    fireEvent.click(screen.getByRole("button", { name: "Delete all data" }));

    expect(deleteSpy).not.toHaveBeenCalled();
    expect(screen.getByText(/permanently delete/)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Yes, delete everything" }));

    await waitFor(() => expect(deleteSpy).toHaveBeenCalled());
  });

  it("cancel dismisses the confirm step without deleting", async () => {
    vi.spyOn(profileApi, "fetchProfile").mockResolvedValue(PROFILE);
    const deleteSpy = vi.spyOn(profileApi, "deleteAllData");

    render(<ProfilePage />);
    await waitFor(() => expect(screen.getByLabelText("Display name")).toHaveValue("Austin"));

    fireEvent.click(screen.getByRole("button", { name: "Delete all data" }));
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));

    expect(screen.queryByText(/permanently delete/)).not.toBeInTheDocument();
    expect(deleteSpy).not.toHaveBeenCalled();
  });
});
