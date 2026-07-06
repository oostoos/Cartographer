import { NavLink } from "react-router-dom";

import { Button } from "../design-system/components/Button";
import { EmojiIcon } from "../design-system/components/EmojiIcon";
import { NAV_LINKS } from "./nav-links";
import "./TopNavBar.css";

type TopNavBarProps = {
  onLogout: () => void;
};

/** The top-mounted navigation bar shown on every authenticated page. */
export function TopNavBar({ onLogout }: TopNavBarProps) {
  return (
    <nav className="cg-top-nav">
      <span className="cg-top-nav__brand">
        Cartographer <EmojiIcon symbol="🧭" label="Cartographer" />
      </span>
      <div className="cg-top-nav__links">
        {NAV_LINKS.map((link) => (
          <NavLink
            key={link.path}
            to={link.path}
            end={link.path === "/"}
            className={({ isActive }) =>
              isActive ? "cg-top-nav__link cg-top-nav__link--active" : "cg-top-nav__link"
            }
          >
            {link.label} <EmojiIcon symbol={link.emoji} label={link.label} />
          </NavLink>
        ))}
      </div>
      <Button variant="secondary" emphasis="solid" onClick={onLogout}>
        Log out <EmojiIcon symbol="🚪" label="Log out" />
      </Button>
    </nav>
  );
}
