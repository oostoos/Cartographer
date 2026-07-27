import { useCallback } from "react";

import { useAsyncResource } from "@lib-stack/hooks/use-async-resource";

import {
  deleteAllData as deleteAllDataRequest,
  fetchProfile,
  setDisplayName as setDisplayNameRequest,
} from "./profile-api";
import type { TProfile } from "./types";

export interface IUseProfileResult {
  profile: TProfile | null;
  isLoading: boolean;
  error: string | null;
  updateDisplayName: (displayName: string) => Promise<void>;
  deleteAllData: () => Promise<void>;
}

/** Loads the profile on mount and exposes actions to update the display name or wipe all data. */
export function useProfile(): IUseProfileResult {
  const {
    value: profile,
    setValue: setProfile,
    isLoading,
    error,
  } = useAsyncResource<TProfile | null>(fetchProfile, null, "Failed to load profile.");

  const updateDisplayName = useCallback(
    async (displayName: string) => {
      const updated = await setDisplayNameRequest(displayName);
      setProfile(updated);
    },
    [setProfile],
  );

  const deleteAllData = useCallback(async () => {
    await deleteAllDataRequest();
    const refreshed = await fetchProfile();
    setProfile(refreshed);
  }, [setProfile]);

  return { profile, isLoading, error, updateDisplayName, deleteAllData };
}
