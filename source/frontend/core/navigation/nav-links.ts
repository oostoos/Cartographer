// @manualReviewRequested: 2026-07-06
/** Every top-nav destination in one place, so adding a page means editing exactly this list. */
export type NavLink = {
  path: string;
  label: string;
  emoji: string;
};

export const NAV_LINKS: NavLink[] = [
  { path: "/", label: "Calendar", emoji: "🗓️" },
  { path: "/projects", label: "Projects", emoji: "📁" },
  { path: "/workspaces", label: "Workspaces", emoji: "🗂️" },
  { path: "/settings", label: "Settings", emoji: "⚙️" },
];
