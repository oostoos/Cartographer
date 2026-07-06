// @manualReviewRequested: 2026-07-06
/** Every top-nav destination in one place, so adding a page means editing exactly this list. */
export type NavLink = {
  path: string;
  label: string;
  emoji: string;
};

export const NAV_LINKS: NavLink[] = [
  { path: "/", label: "Today", emoji: "🗓️" },
  { path: "/tasks", label: "Tasks", emoji: "✅" },
  { path: "/projects", label: "Projects", emoji: "📁" },
  { path: "/journal", label: "Journal", emoji: "📔" },
  { path: "/settings", label: "Settings", emoji: "⚙️" },
];
