import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import * as profileApi from "./profile-api";
import { useProfile } from "./use-profile";
import type { TProfile } from "./types";

const PROFILE: TProfile = { display_name: "Austin" };

describe("useProfile", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("loads the profile on mount", async () => {
    vi.spyOn(profileApi, "fetchProfile").mockResolvedValue(PROFILE);

    const { result } = renderHook(() => useProfile());

    expect(result.current.isLoading).toBe(true);
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.profile).toEqual(PROFILE);
    expect(result.current.error).toBeNull();
  });

  it("sets an error message when loading fails", async () => {
    vi.spyOn(profileApi, "fetchProfile").mockRejectedValue(new Error("network error"));

    const { result } = renderHook(() => useProfile());

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.error).toBe("Failed to load profile.");
  });

  it("updateDisplayName updates the profile state", async () => {
    vi.spyOn(profileApi, "fetchProfile").mockResolvedValue(PROFILE);
    vi.spyOn(profileApi, "setDisplayName").mockResolvedValue({ display_name: "Jamie" });

    const { result } = renderHook(() => useProfile());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      await result.current.updateDisplayName("Jamie");
    });

    expect(result.current.profile?.display_name).toBe("Jamie");
  });

  it("deleteAllData calls the delete request, then reloads the profile", async () => {
    vi.spyOn(profileApi, "fetchProfile")
      .mockResolvedValueOnce(PROFILE)
      .mockResolvedValueOnce({ display_name: "Explorer" });
    const deleteSpy = vi.spyOn(profileApi, "deleteAllData").mockResolvedValue(undefined);

    const { result } = renderHook(() => useProfile());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      await result.current.deleteAllData();
    });

    expect(deleteSpy).toHaveBeenCalled();
    expect(result.current.profile?.display_name).toBe("Explorer");
  });
});
