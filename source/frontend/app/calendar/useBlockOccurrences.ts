// @manualReviewRequested: 2026-07-07
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  type UpdateBlockOccurrenceInput,
  fetchBlockOccurrences,
  updateBlockOccurrence,
} from "./calendarApi";

/** The query key every block-occurrences read shares — block-template mutations
 * (app/blocks/useBlockTemplates.ts) invalidate this whole prefix so the calendar picks up
 * schedule edits immediately.
 */
export const BLOCK_OCCURRENCES_QUERY_KEY = ["blockOccurrences"];

/** Reads every block occurrence (real or projected) in [startDate, endDate], both "YYYY-MM-DD" —
 * the calendar page's week/month views.
 */
export function useBlockOccurrences(startDate: string, endDate: string) {
  return useQuery({
    queryKey: [...BLOCK_OCCURRENCES_QUERY_KEY, startDate, endDate],
    queryFn: () => fetchBlockOccurrences(startDate, endDate),
  });
}

/** Edits one calendar occurrence directly (materializing it first if it's still projected), then
 * refreshes every occurrences query so the edit shows up immediately.
 */
export function useUpdateBlockOccurrence() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      occurrenceId,
      changes,
    }: {
      occurrenceId: string;
      changes: UpdateBlockOccurrenceInput;
    }) => updateBlockOccurrence(occurrenceId, changes),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: BLOCK_OCCURRENCES_QUERY_KEY }),
  });
}
