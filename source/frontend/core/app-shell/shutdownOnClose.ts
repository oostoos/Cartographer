// @manualReviewRequested: 2026-07-06
const SHUTDOWN_PATH = "/api/shutdown";

/** Sends a shutdown beacon when the tab/window closes. `pagehide` (rather than `beforeunload`)
 * doesn't block the back/forward cache, and `sendBeacon` is guaranteed to attempt delivery
 * without waiting for a response — the page may already be gone by the time it would arrive.
 */
export function registerShutdownOnClose(): void {
  window.addEventListener("pagehide", () => {
    navigator.sendBeacon(SHUTDOWN_PATH);
  });
}
