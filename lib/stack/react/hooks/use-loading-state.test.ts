import { act, renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { useLoadingState } from "./use-loading-state";

describe("useLoadingState", () => {
  it("defaults isLoading to false", () => {
    const { result } = renderHook(() => useLoadingState());

    expect(result.current.isLoading).toBe(false);
  });

  it("honors the given initial isLoading value", () => {
    const { result } = renderHook(() => useLoadingState(true));

    expect(result.current.isLoading).toBe(true);
  });

  it("withLoading sets isLoading true during the operation and false after it resolves", async () => {
    const { result } = renderHook(() => useLoadingState());
    let resolveOperation: () => void = () => {};
    const operation = () => new Promise<void>((resolve) => (resolveOperation = resolve));

    let pendingCall: Promise<void>;
    act(() => {
      pendingCall = result.current.withLoading(operation);
    });
    await waitFor(() => expect(result.current.isLoading).toBe(true));

    await act(async () => {
      resolveOperation();
      await pendingCall;
    });
    expect(result.current.isLoading).toBe(false);
  });

  it("withLoading resolves to the operation's return value", async () => {
    const { result } = renderHook(() => useLoadingState());

    let returned: string | undefined;
    await act(async () => {
      returned = await result.current.withLoading(async () => "value");
    });

    expect(returned).toBe("value");
  });

  it("withLoading sets isLoading false even when the operation throws", async () => {
    const { result } = renderHook(() => useLoadingState());

    await act(async () => {
      await expect(
        result.current.withLoading(async () => {
          throw new Error("boom");
        }),
      ).rejects.toThrow("boom");
    });

    expect(result.current.isLoading).toBe(false);
  });
});
