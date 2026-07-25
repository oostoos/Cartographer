import { useCallback, useState } from "react";

export interface IUseLoadingStateResult {
  isLoading: boolean;
  withLoading: <T>(operation: () => Promise<T>) => Promise<T>;
}

/** Tracks a boolean isLoading flag around any async operation. No knowledge of what the operation does. */
export function useLoadingState(initialIsLoading = false): IUseLoadingStateResult {
  const [isLoading, setIsLoading] = useState(initialIsLoading);

  const withLoading = useCallback(async <T>(operation: () => Promise<T>): Promise<T> => {
    setIsLoading(true);
    try {
      return await operation();
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { isLoading, withLoading };
}
