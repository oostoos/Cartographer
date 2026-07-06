import { afterEach, describe, expect, it, vi } from "vitest";

import { registerShutdownOnClose } from "./shutdownOnClose";

describe("registerShutdownOnClose", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("sends a shutdown beacon when the page is hidden on unload", () => {
    const sendBeacon = vi.fn();
    vi.stubGlobal("navigator", { sendBeacon });

    registerShutdownOnClose();
    window.dispatchEvent(new Event("pagehide"));

    expect(sendBeacon).toHaveBeenCalledWith("/api/shutdown");
  });
});
