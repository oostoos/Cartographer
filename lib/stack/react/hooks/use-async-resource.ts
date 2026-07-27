import { type Dispatch, type SetStateAction, useEffect, useState } from "react";

import { useLoadingState } from "./use-loading-state";

export interface IUseAsyncResourceResult<T> {
  value: T;
  setValue: Dispatch<SetStateAction<T>>;
  isLoading: boolean;
  error: string | null;
}

/**
 * Loads `initialValue` via `load` on mount, tracking isLoading/error around the fetch.
 *
 * `load` and `errorMessage` are only read on mount (and on unmount, to guard against
 * setting state after the component's gone) — matching the one-shot load-on-mount
 * behavior every current caller wants, rather than refetching on every render.
 */
export function useAsyncResource<T>(
  load: () => Promise<T>,
  initialValue: T,
  errorMessage: string,
): IUseAsyncResourceResult<T> {
  const [value, setValue] = useState<T>(initialValue);
  const [error, setError] = useState<string | null>(null);
  const { isLoading, withLoading } = useLoadingState(true);

  useEffect(() => {
    let isCancelled = false;

    async function runLoad() {
      setError(null);
      try {
        const loaded = await withLoading(load);
        if (!isCancelled) setValue(loaded);
      } catch {
        if (!isCancelled) setError(errorMessage);
      }
    }

    runLoad();
    return () => {
      isCancelled = true;
    };
  }, []);

  return { value, setValue, isLoading, error };
}
