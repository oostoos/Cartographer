import { afterEach, describe, expect, it, vi } from "vitest";

import { deleteJson, getJson, patchJson, postJson, putJson } from "./http-client";

function stubFetchResolving(body: unknown) {
  const mockFetch = vi.fn().mockResolvedValue({
    ok: true,
    status: 200,
    json: () => Promise.resolve(body),
  });
  vi.stubGlobal("fetch", mockFetch);
  return mockFetch;
}

describe("http-client", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("getJson prefixes the path with /api and unwraps the envelope's data", async () => {
    const mockFetch = stubFetchResolving({ success: true, data: { id: "1" } });

    const result = await getJson<{ id: string }>("/tasks/1");

    expect(result).toEqual({ id: "1" });
    expect(mockFetch).toHaveBeenCalledWith("/api/tasks/1", undefined);
  });

  it("postJson sends a JSON body with the correct method/headers and unwraps the response", async () => {
    const mockFetch = stubFetchResolving({ success: true, data: { id: "1" } });

    const result = await postJson<{ id: string }>("/tasks", { title: "Buy milk" });

    expect(result).toEqual({ id: "1" });
    expect(mockFetch).toHaveBeenCalledWith("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "Buy milk" }),
    });
  });

  it("patchJson sends a JSON body with the correct method/headers and unwraps the response", async () => {
    const mockFetch = stubFetchResolving({ success: true, data: { id: "1" } });

    const result = await patchJson<{ id: string }>("/tasks/1", { completed: true });

    expect(result).toEqual({ id: "1" });
    expect(mockFetch).toHaveBeenCalledWith("/api/tasks/1", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ completed: true }),
    });
  });

  it("putJson sends a JSON body with the correct method/headers and unwraps the response", async () => {
    const mockFetch = stubFetchResolving({ success: true, data: { display_name: "Austin" } });

    const result = await putJson<{ display_name: string }>("/profile", { display_name: "Austin" });

    expect(result).toEqual({ display_name: "Austin" });
    expect(mockFetch).toHaveBeenCalledWith("/api/profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ display_name: "Austin" }),
    });
  });

  it("deleteJson sends the correct method and unwraps the response", async () => {
    const mockFetch = stubFetchResolving({ success: true, data: { id: "1" } });

    const result = await deleteJson<{ id: string }>("/projects/1");

    expect(result).toEqual({ id: "1" });
    expect(mockFetch).toHaveBeenCalledWith("/api/projects/1", { method: "DELETE" });
  });
});
