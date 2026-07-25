import { TopNavBar } from "@common/layout/top-nav-bar";
import type { ITopNavBarLink } from "@common/layout/top-nav-bar";

const BRAND_NAME = "Cartographer";
const TAGLINE = "helping you map your life";

const NAV_LINKS: ITopNavBarLink[] = [
  { label: "Tasks", to: "/tasks" },
  { label: "Profile", to: "/profile" },
];

/** Cartographer's persistent top navigation bar, wired with the app's brand and nav links. */
export function Nav() {
  return <TopNavBar brand={BRAND_NAME} tagline={TAGLINE} links={NAV_LINKS} />;
}
