import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import * as groupsApi from "./groups-api";
import { GROUP_COLOR_PALETTE } from "./group-color-palette";
import { useGroups } from "./use-groups";
import type { TGroup } from "./types";

const GROUP: TGroup = {
  id: "1",
  name: "Home renovation",
  created_at: "2026-01-01T00:00:00Z",
  updated_at: "2026-01-01T00:00:00Z",
  color: GROUP_COLOR_PALETTE[0],
  order: 0,
};

describe("useGroups", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("loads groups on mount", async () => {
    vi.spyOn(groupsApi, "fetchGroups").mockResolvedValue([GROUP]);

    const { result } = renderHook(() => useGroups());

    expect(result.current.isLoading).toBe(true);
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.groups).toEqual([GROUP]);
    expect(result.current.error).toBeNull();
  });

  it("sets an error message when loading groups fails", async () => {
    vi.spyOn(groupsApi, "fetchGroups").mockRejectedValue(new Error("network error"));

    const { result } = renderHook(() => useGroups());

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.error).toBe("Failed to load groups.");
    expect(result.current.groups).toEqual([]);
  });

  it("createGroup appends the newly created group to state", async () => {
    vi.spyOn(groupsApi, "fetchGroups").mockResolvedValue([]);
    vi.spyOn(groupsApi, "createGroup").mockResolvedValue(GROUP);

    const { result } = renderHook(() => useGroups());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      await result.current.createGroup("Home renovation");
    });

    expect(result.current.groups).toEqual([GROUP]);
  });

  it("setGroupColor replaces the group with the updated (recolored) version", async () => {
    vi.spyOn(groupsApi, "fetchGroups").mockResolvedValue([GROUP]);
    vi.spyOn(groupsApi, "updateGroup").mockResolvedValue({ ...GROUP, color: GROUP_COLOR_PALETTE[3] });

    const { result } = renderHook(() => useGroups());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      await result.current.setGroupColor(GROUP.id, GROUP_COLOR_PALETTE[3]);
    });

    expect(result.current.groups[0].color).toBe(GROUP_COLOR_PALETTE[3]);
  });

  it("deleteGroup removes the group from state", async () => {
    vi.spyOn(groupsApi, "fetchGroups").mockResolvedValue([GROUP]);
    vi.spyOn(groupsApi, "deleteGroup").mockResolvedValue({ id: GROUP.id });

    const { result } = renderHook(() => useGroups());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      await result.current.deleteGroup(GROUP.id);
    });

    expect(result.current.groups).toEqual([]);
  });
});
