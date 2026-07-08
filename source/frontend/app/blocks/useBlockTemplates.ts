// @manualReviewRequested: 2026-07-07
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { BLOCK_OCCURRENCES_QUERY_KEY } from "../calendar/useBlockOccurrences";
import { TASKS_QUERY_KEY } from "../tasks/useTasks";
import {
  type CreateBlockTemplateInput,
  type UpdateBlockTemplateInput,
  createBlockTemplate,
  deleteBlockTemplate,
  fetchBlockTemplate,
  fetchBlockTemplates,
  generateDefaultBlockTemplates,
  updateBlockTemplate,
} from "./blockApi";

/** The query key every block-template read/invalidation shares. */
export const BLOCK_TEMPLATES_QUERY_KEY = ["blockTemplates"];

/** Invalidated alongside BLOCK_TEMPLATES_QUERY_KEY by every mutation below, since creating/
 * editing/deleting a template also (re)generates or removes today's Block instance server-side
 * (see app/journals/today_engine.py) and changes what the calendar page projects for future days.
 */
function invalidateDownstreamQueries(queryClient: ReturnType<typeof useQueryClient>) {
  queryClient.invalidateQueries({ queryKey: TASKS_QUERY_KEY });
  queryClient.invalidateQueries({ queryKey: BLOCK_OCCURRENCES_QUERY_KEY });
}

/** Lists every block template — the weekly calendar config page's data. */
export function useBlockTemplates() {
  return useQuery({ queryKey: BLOCK_TEMPLATES_QUERY_KEY, queryFn: fetchBlockTemplates });
}

/** Reads a single block template. */
export function useBlockTemplate(templateId: string | null) {
  return useQuery({
    queryKey: [...BLOCK_TEMPLATES_QUERY_KEY, templateId],
    queryFn: () => fetchBlockTemplate(templateId as string),
    enabled: templateId !== null && templateId !== "",
  });
}

/** Creates a block template. The backend eagerly generates today's instance if it's due today. */
export function useCreateBlockTemplate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateBlockTemplateInput) => createBlockTemplate(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: BLOCK_TEMPLATES_QUERY_KEY });
      invalidateDownstreamQueries(queryClient);
    },
  });
}

/** Updates a block template's weekly schedule, task templates, or other fields. The backend also
 * syncs the edit onto today's already-generated Block instance if one exists.
 */
export function useUpdateBlockTemplate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      templateId,
      changes,
    }: {
      templateId: string;
      changes: UpdateBlockTemplateInput;
    }) => updateBlockTemplate(templateId, changes),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: BLOCK_TEMPLATES_QUERY_KEY });
      invalidateDownstreamQueries(queryClient);
    },
  });
}

/** Deletes a block template. Instances already generated from it are unaffected. */
export function useDeleteBlockTemplate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (templateId: string) => deleteBlockTemplate(templateId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: BLOCK_TEMPLATES_QUERY_KEY });
      invalidateDownstreamQueries(queryClient);
    },
  });
}

/** Creates the "Generate basic blocks" ADHD preset templates. */
export function useGenerateDefaultBlockTemplates() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => generateDefaultBlockTemplates(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: BLOCK_TEMPLATES_QUERY_KEY });
      invalidateDownstreamQueries(queryClient);
    },
  });
}
