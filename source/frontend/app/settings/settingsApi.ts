// @manualReviewRequested: 2026-07-06
import { apiGet, apiPatch, apiPost } from "../../core/api/apiClient";

export type UserPreferences = {
  id: string;
  displayName: string;
  createdAt: string;
};

/** Reads the user's preferences, created with defaults on first use. */
export function fetchSettings(): Promise<UserPreferences> {
  return apiGet<UserPreferences>("/api/settings");
}

/** Updates one or more of the user's preferences. */
export function updateSettings(
  changes: Partial<{ displayName: string }>,
): Promise<UserPreferences> {
  return apiPatch<UserPreferences>("/api/settings", changes);
}

/** Permanently deletes every project, task, and journal entry, for a full local reset. */
export function purgeAllData(): Promise<void> {
  return apiPost<void>("/api/settings/purge-all-data");
}
