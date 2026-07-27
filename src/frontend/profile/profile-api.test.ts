import { afterEach, describe, expect, it, vi } from "vitest";

import * as httpClient from "@lib-stack/api/http-client";

import { deleteAllData, fetchProfile, setDisplayName } from "./profile-api";

describe("profile-api", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("fetchProfile calls GET /profile", async () => {
    const spy = vi.spyOn(httpClient, "getJson").mockResolvedValue({ display_name: "Austin" });

    await fetchProfile();

    expect(spy).toHaveBeenCalledWith("/profile");
  });

  it("setDisplayName calls PUT /profile with display_name", async () => {
    const spy = vi.spyOn(httpClient, "putJson").mockResolvedValue({ display_name: "Austin" });

    await setDisplayName("Austin");

    expect(spy).toHaveBeenCalledWith("/profile", { display_name: "Austin" });
  });

  it("deleteAllData calls POST /profile/delete-all-data", async () => {
    const spy = vi.spyOn(httpClient, "postJson").mockResolvedValue(undefined);

    await deleteAllData();

    expect(spy).toHaveBeenCalledWith("/profile/delete-all-data", {});
  });
});
