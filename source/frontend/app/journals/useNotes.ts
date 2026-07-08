// @manualReviewRequested: 2026-07-06
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  type CreateNoteInput,
  createNote,
  deleteNote,
  fetchAllNotes,
  fetchNotesForTarget,
  updateNote,
} from "./noteApi";

/** The shared prefix every notes query key is nested under, so any note mutation can invalidate
 * every view (a target's notes, "all notes") with one invalidateQueries call — TanStack Query
 * matches query keys by prefix.
 */
const NOTES_QUERY_KEY = ["notes"];

/** Reads every note attached to one task or project. options.enabled defaults to true; pass
 * false to skip fetching (e.g. AllNotesPage calls this and useAllNotes unconditionally, per the
 * Rules of Hooks, but only wants one of the two to actually fetch).
 */
export function useNotesForTarget(
  targetType: string,
  targetId: string,
  options?: { enabled?: boolean },
) {
  return useQuery({
    queryKey: [...NOTES_QUERY_KEY, "target", targetType, targetId],
    queryFn: () => fetchNotesForTarget(targetType, targetId),
    enabled: options?.enabled ?? true,
  });
}

/** Reads every note in the app, for the unscoped "view all notes" page. See useNotesForTarget's
 * doc for why options.enabled exists.
 */
export function useAllNotes(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: [...NOTES_QUERY_KEY, "all"],
    queryFn: fetchAllNotes,
    enabled: options?.enabled ?? true,
  });
}

/** Creates a note, then refreshes every notes view. */
export function useCreateNote() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateNoteInput) => createNote(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: NOTES_QUERY_KEY }),
  });
}

/** Updates a note's fields, then refreshes every notes view. */
export function useUpdateNote() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ noteId, changes }: { noteId: string; changes: Partial<CreateNoteInput> }) =>
      updateNote(noteId, changes),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: NOTES_QUERY_KEY }),
  });
}

/** Deletes a note, then refreshes every notes view. */
export function useDeleteNote() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (noteId: string) => deleteNote(noteId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: NOTES_QUERY_KEY }),
  });
}
