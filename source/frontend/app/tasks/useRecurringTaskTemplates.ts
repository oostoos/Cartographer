// @manualReviewRequested: 2026-07-06
import { useMutation, useQuery } from "@tanstack/react-query";

import {
  type CreateRecurringTaskTemplateInput,
  type UpdateRecurringTaskTemplateInput,
  createRecurringTaskTemplate,
  fetchRecurringTaskTemplate,
  updateRecurringTaskTemplate,
} from "./recurrenceApi";

/** Creates a recurring task template. No query key to invalidate here — templates aren't listed
 * anywhere yet; the Today view picks up their generated Task instances on its own next read.
 */
export function useCreateRecurringTaskTemplate() {
  return useMutation({
    mutationFn: (input: CreateRecurringTaskTemplateInput) => createRecurringTaskTemplate(input),
  });
}

/** Reads a single recurring task template — the settings area's read-only recurrence summary
 * and "Edit recurrence" modal for a task generated from one.
 */
export function useRecurringTaskTemplate(templateId: string) {
  return useQuery({
    queryKey: ["recurringTaskTemplates", templateId],
    queryFn: () => fetchRecurringTaskTemplate(templateId),
    enabled: templateId !== "",
  });
}

/** Updates a recurring task template's cadence. Doesn't invalidate any task list — the change
 * only affects instances generated after this call, so nothing currently on screen is stale.
 */
export function useUpdateRecurringTaskTemplate() {
  return useMutation({
    mutationFn: ({
      templateId,
      changes,
    }: {
      templateId: string;
      changes: UpdateRecurringTaskTemplateInput;
    }) => updateRecurringTaskTemplate(templateId, changes),
  });
}
