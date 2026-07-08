// @manualReviewRequested: 2026-07-07
import type { Note } from "./noteApi";

/** Groups notes by their effectiveDate, oldest day first, each day's own notes oldest first too —
 * so the very last note rendered is the most recent note in the app. Shared by every notes view
 * that groups by day, so this rule lives in exactly one place.
 */
export function groupNotesByDate(notes: Note[]): { date: string; notes: Note[] }[] {
  const byDate = new Map<string, Note[]>();
  for (const note of notes) {
    const existing = byDate.get(note.effectiveDate) ?? [];
    existing.push(note);
    byDate.set(note.effectiveDate, existing);
  }
  const sortedDates = [...byDate.keys()].sort((a, b) => a.localeCompare(b));
  return sortedDates.map((date) => ({ date, notes: [...(byDate.get(date) ?? [])].reverse() }));
}
