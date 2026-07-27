import { getJson, postJson, putJson } from "@common/api/http-client";

import type { TProfile } from "./types";

/** Fetch the profile. */
export function fetchProfile(): Promise<TProfile> {
  return getJson<TProfile>("/profile");
}

/** Set the profile's display name. */
export function setDisplayName(displayName: string): Promise<TProfile> {
  return putJson<TProfile>("/profile", { display_name: displayName });
}

/** Delete every task and profile record. */
export function deleteAllData(): Promise<void> {
  return postJson<void>("/profile/delete-all-data", {});
}
