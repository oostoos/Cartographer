// @manualReviewRequested: 2026-07-06
import { useQuery } from "@tanstack/react-query";

import { fetchAuthStatus } from "./authApi";

/** The query key every auth-status read/invalidation shares. */
export const AUTH_STATUS_QUERY_KEY = ["auth", "status"];

/** Reads whether anyone is currently logged in, cached and refetchable via AUTH_STATUS_QUERY_KEY. */
export function useAuthStatus() {
  return useQuery({ queryKey: AUTH_STATUS_QUERY_KEY, queryFn: fetchAuthStatus });
}
