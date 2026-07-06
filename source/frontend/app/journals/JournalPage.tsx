import { Card } from "../../core/design-system/components/Card";
import { EmojiIcon } from "../../core/design-system/components/EmojiIcon";
import type { Note } from "./noteApi";
import { useJournalEntries } from "./useNotes";
import "./JournalPage.css";

function groupEntriesByDate(entries: Note[]): Map<string, Note[]> {
  const byDate = new Map<string, Note[]>();
  for (const entry of entries) {
    const existing = byDate.get(entry.effectiveDate) ?? [];
    existing.push(entry);
    byDate.set(entry.effectiveDate, existing);
  }
  return byDate;
}

/** The "Journal" tab: every daily journal entry (no task/project target), grouped by day,
 * newest day first — the history view companion to the Today page's journaling card.
 */
export function JournalPage() {
  const { data: entries, isLoading, isError } = useJournalEntries();

  if (isLoading) return <p>Loading journal…</p>;
  if (isError || !entries) return <p>Couldn't load the journal.</p>;

  const entriesByDate = groupEntriesByDate(entries);
  const sortedDates = [...entriesByDate.keys()].sort((a, b) => b.localeCompare(a));

  return (
    <div className="cg-journal-page">
      <h1>
        Journal <EmojiIcon symbol="📔" label="Journal" />
      </h1>
      {sortedDates.length === 0 && <p>No journal entries yet.</p>}
      {sortedDates.map((date) => (
        <Card key={date} className="cg-journal-page__day">
          <h2>{date}</h2>
          {entriesByDate.get(date)?.map((entry) => (
            <p key={entry.id} className="cg-journal-page__entry">
              {entry.content}
            </p>
          ))}
        </Card>
      ))}
    </div>
  );
}
