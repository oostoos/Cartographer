import { useCallback, useEffect, useState } from "react";

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
  const [profile, setProfile] = useState<TProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isCancelled = false;

    async function loadProfile() {
      setIsLoading(true);
      setError(null);
      try {
        const loaded = await fetchProfile();
        if (!isCancelled) setProfile(loaded);
      } catch {
        if (!isCancelled) setError("Failed to load profile.");
      } finally {
        if (!isCancelled) setIsLoading(false);
      }
    }

    loadProfile();
    return () => {
      isCancelled = true;
    };
  }, []);

  const updateDisplayName = useCallback(async (displayName: string) => {
    const updated = await setDisplayNameRequest(displayName);
    setProfile(updated);
  }, []);

  const deleteAllData = useCallback(async () => {
    await deleteAllDataRequest();
    const refreshed = await fetchProfile();
    setProfile(refreshed);
  }, []);

  return { profile, isLoading, error, updateDisplayName, deleteAllData };
}
