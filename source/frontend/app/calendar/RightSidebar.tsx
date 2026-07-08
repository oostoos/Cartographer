// @manualReviewRequested: 2026-07-07
import { NoteComposer } from "../journals/NoteComposer";
import { NotesFeed } from "../journals/NotesFeed";
import "./RightSidebar.css";

/** The calendar page's right card sidebar: the unified notes feed, with the chat-prompt-style
 * composer pinned at the bottom so adding a note is always one type-and-submit away, no matter
 * what's selected elsewhere on the page.
 */
export function RightSidebar() {
  return (
    <div className="cg-right-sidebar">
      <div className="cg-right-sidebar__feed">
        <NotesFeed />
      </div>
      <div className="cg-right-sidebar__composer">
        <NoteComposer />
      </div>
    </div>
  );
}
