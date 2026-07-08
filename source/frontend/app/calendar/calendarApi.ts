// @manualReviewRequested: 2026-07-07
import { apiGet, apiPatch } from "../../core/api/apiClient";

export type BlockOccurrence = {
  id: string;
  templateId: string;
  date: string;
  title: string;
  description: string;
  tags: string[];
  startTime: string;
  durationMinutes: number;
  /** True for a future date with no Block generated yet — computed live from its template's
   * current segment rather than read from a stored record. See app/blocks/CLAUDE.md (backend).
   */
  isProjected: boolean;
};

export type UpdateBlockOccurrenceInput = Partial<{
  title: string;
  description: string;
  tags: string[];
  startTime: string;
  durationMinutes: number;
}>;

/** Reads every block occurrence (real or projected) in [startDate, endDate], both "YYYY-MM-DD". */
export function fetchBlockOccurrences(
  startDate: string,
  endDate: string,
): Promise<BlockOccurrence[]> {
  const query = `startDate=${encodeURIComponent(startDate)}&endDate=${encodeURIComponent(endDate)}`;
  return apiGet<{ occurrences: BlockOccurrence[] }>(`/api/blocks/occurrences?${query}`).then(
    (response) => response.occurrences,
  );
}

/** Edits one calendar occurrence directly, independent of its template — the backend materializes
 * it first if occurrenceId is still a projected ("projected:{templateId}:{date}") id, then marks
 * it as no longer template-synced so a later template edit never overwrites it again. See
 * app/blocks/block_routes.py's PATCH /api/blocks/<id>.
 */
export function updateBlockOccurrence(
  occurrenceId: string,
  changes: UpdateBlockOccurrenceInput,
): Promise<BlockOccurrence> {
  return apiPatch<BlockOccurrence>(`/api/blocks/${encodeURIComponent(occurrenceId)}`, changes);
}
