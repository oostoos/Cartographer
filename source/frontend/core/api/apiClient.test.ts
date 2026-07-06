// @manualReviewRequested: 2026-07-06
import { afterEach, describe, expect, it, vi } from "vitest";

import { ApiError, apiDelete, apiGet, apiPatch, apiPost } from "./apiClient";

function mockFetchOnce(response: Partial<Response> & { json?: () => Promise<unknown> }) {
  const fetchMock = vi.fn().mockResolvedValue(response as Response);
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

describe("apiClient", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("apiGet parses a successful JSON response", async () => {
    mockFetchOnce({ ok: true, status: 200, json: async () => ({ title: "Buy milk" }) });
    const result = await apiGet<{ title: string }>("/api/tasks/1");
    expect(result).toEqual({ title: "Buy milk" });
  });

  it("apiPost sends the given body as JSON", async () => {
    const fetchMock = mockFetchOnce({ ok: true, status: 201, json: async () => ({ id: "1" }) });
    await apiPost("/api/tasks", { title: "Buy milk" });
    const [, options] = fetchMock.mock.calls[0];
    expect(options.method).toBe("POST");
    expect(options.body).toBe(JSON.stringify({ title: "Buy milk" }));
  });

  it("apiPatch sends the given body as JSON", async () => {
    const fetchMock = mockFetchOnce({ ok: true, status: 200, json: async () => ({ id: "1" }) });
    await apiPatch("/api/tasks/1", { title: "Updated" });
    const [, options] = fetchMock.mock.calls[0];
    expect(options.method).toBe("PATCH");
  });

  it("apiDelete resolves without a body on 204", async () => {
    mockFetchOnce({ ok: true, status: 204 });
    await expect(apiDelete("/api/tasks/1")).resolves.toBeUndefined();
  });

  it("throws an ApiError with the server's error message on a non-ok response", async () => {
    mockFetchOnce({ ok: false, status: 404, json: async () => ({ error: "Not found" }) });
    await expect(apiGet("/api/tasks/missing")).rejects.toMatchObject(
      new ApiError("Not found", 404),
    );
  });
});
