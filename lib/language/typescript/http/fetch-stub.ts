import { vi } from "vitest";

/**
 * Stub the global `fetch` to resolve with a given JSON body, generic across any test that
 * exercises code built on `fetch` (this library's `requestJson` and anything layered on it).
 *
 * Shared so http-consuming tests across the codebase don't each redefine the same stub —
 * call `vi.unstubAllGlobals()` in the test's `afterEach` to undo it.
 */
export function stubFetchResolving(body: unknown, ok = true, status = 200) {
  const mockFetch = vi.fn().mockResolvedValue({
    ok,
    status,
    json: () => Promise.resolve(body),
  });
  vi.stubGlobal("fetch", mockFetch);
  return mockFetch;
}
