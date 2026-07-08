// @manualReviewRequested: 2026-07-06
import { renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { useShortcut } from "./useShortcut";

function dispatchKeyDown(options: Partial<KeyboardEventInit> & { key: string }) {
  document.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, ...options }));
}

describe("useShortcut", () => {
  it("calls the callback when the exact Alt+Shift+key combination is pressed", () => {
    const callback = vi.fn();
    renderHook(() => useShortcut({ key: "N", alt: true, shift: true }, callback));

    dispatchKeyDown({ key: "n", altKey: true, shiftKey: true });
    expect(callback).toHaveBeenCalledTimes(1);
  });

  it("does not call the callback when a modifier is missing", () => {
    const callback = vi.fn();
    renderHook(() => useShortcut({ key: "N", alt: true, shift: true }, callback));

    dispatchKeyDown({ key: "n", altKey: true, shiftKey: false });
    dispatchKeyDown({ key: "n", altKey: false, shiftKey: true });
    expect(callback).not.toHaveBeenCalled();
  });

  it("does not call the callback for a different key", () => {
    const callback = vi.fn();
    renderHook(() => useShortcut({ key: "N", alt: true, shift: true }, callback));

    dispatchKeyDown({ key: "p", altKey: true, shiftKey: true });
    expect(callback).not.toHaveBeenCalled();
  });

  it("removes its listener on unmount", () => {
    const callback = vi.fn();
    const { unmount } = renderHook(() =>
      useShortcut({ key: "N", alt: true, shift: true }, callback),
    );
    unmount();

    dispatchKeyDown({ key: "n", altKey: true, shiftKey: true });
    expect(callback).not.toHaveBeenCalled();
  });
});
