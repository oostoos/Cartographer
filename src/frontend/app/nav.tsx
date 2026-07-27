import { Link } from "react-router-dom";

import { InitialsChip } from "@common/design-language/initials-chip";
import { TopNavBar } from "@common/layout/top-nav-bar";
import type { ITopNavBarLink } from "@common/layout/top-nav-bar";
import { getInitials } from "@lib/index";

import { useProfile } from "../profile/use-profile";

const BRAND_NAME = "Cartographer";

const NAV_LINKS: ITopNavBarLink[] = [{ label: "Tasks", to: "/tasks" }];

/** Cartographer's persistent top navigation bar, wired with the app's brand, nav links, and profile chip. */
export function Nav() {
  const { profile } = useProfile();
  const initials = getInitials(profile?.display_name ?? "");

  return (
    <TopNavBar
      brand={BRAND_NAME}
      links={NAV_LINKS}
      trailing={
        <Link to="/profile" aria-label="Profile">
          <InitialsChip initials={initials} />
        </Link>
      }
    />
  );
}
