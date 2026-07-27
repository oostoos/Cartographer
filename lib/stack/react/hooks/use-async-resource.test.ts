import { act, renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { useAsyncResource } from "./use-async-resource";

describe("useAsyncResource", () => {
  it("starts loading and resolves to the loaded value", async () => {
    const load = vi.fn().mockResolvedValue("loaded");

    const { result } = renderHook(() => useAsyncResource(load, "initial", "failed"));

    expect(result.current.isLoading).toBe(true);
    expect(result.current.value).toBe("initial");
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.value).toBe("loaded");
    expect(result.current.error).toBeNull();
  });

  it("sets the given error message when the load rejects", async () => {
    const load = vi.fn().mockRejectedValue(new Error("network error"));

    const { result } = renderHook(() => useAsyncResource(load, "initial", "Failed to load."));

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.error).toBe("Failed to load.");
    expect(result.current.value).toBe("initial");
  });

  it("setValue updates the value directly", async () => {
    const load = vi.fn().mockResolvedValue("loaded");

    const { result } = renderHook(() => useAsyncResource(load, "initial", "failed"));
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    act(() => {
      result.current.setValue("updated");
    });

    expect(result.current.value).toBe("updated");
  });

  it("only calls load once, on mount", async () => {
    const load = vi.fn().mockResolvedValue("loaded");

    const { rerender } = renderHook(() => useAsyncResource(load, "initial", "failed"));
    rerender();
    rerender();

    await waitFor(() => expect(load).toHaveBeenCalledTimes(1));
  });
});
