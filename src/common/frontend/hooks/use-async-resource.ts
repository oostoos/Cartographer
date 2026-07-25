import { type Dispatch, type SetStateAction, useEffect, useState } from "react";

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
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isCancelled = false;

    async function runLoad() {
      setIsLoading(true);
      setError(null);
      try {
        const loaded = await load();
        if (!isCancelled) setValue(loaded);
      } catch {
        if (!isCancelled) setError(errorMessage);
      } finally {
        if (!isCancelled) setIsLoading(false);
      }
    }

    runLoad();
    return () => {
      isCancelled = true;
    };
  }, []);

  return { value, setValue, isLoading, error };
}
