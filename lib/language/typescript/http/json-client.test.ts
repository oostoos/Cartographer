import { afterEach, describe, expect, it, vi } from "vitest";

import { stubFetchResolving } from "./fetch-stub";
import { requestJson } from "./json-client";

describe("requestJson", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("resolves with the parsed JSON body on a 2xx response", async () => {
    stubFetchResolving({ hello: "world" });

    const result = await requestJson<{ hello: string }>("/example");

    expect(result).toEqual({ hello: "world" });
  });

  it("rejects on a non-2xx response", async () => {
    stubFetchResolving({}, false, 500);

    await expect(requestJson("/example")).rejects.toThrow(/500/);
  });

  it("passes through the given options to fetch", async () => {
    const mockFetch = stubFetchResolving({});

    await requestJson("/example", { method: "POST" });

    expect(mockFetch).toHaveBeenCalledWith("/example", { method: "POST" });
  });
});
