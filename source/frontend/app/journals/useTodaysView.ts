import { useQuery, useQueryClient } from "@tanstack/react-query";

import { fetchTodaysView } from "./todayApi";

/** The query key every today's-view read/invalidation shares. */
export const TODAYS_VIEW_QUERY_KEY = ["today"];

/** Reads today's view, cached and refetchable via TODAYS_VIEW_QUERY_KEY. */
export function useTodaysView() {
  return useQuery({ queryKey: TODAYS_VIEW_QUERY_KEY, queryFn: fetchTodaysView });
}

/** Returns a function that refreshes today's view — for callers (e.g. creating or completing a
 * task through app/tasks's own hooks) that need today's view to reflect the change.
 */
export function useInvalidateTodaysView() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: TODAYS_VIEW_QUERY_KEY });
}
