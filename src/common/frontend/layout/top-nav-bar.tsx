import { Link } from "react-router-dom";

import "./top-nav-bar.css";

export interface ITopNavBarLink {
  label: string;
  to: string;
}

export interface ITopNavBarProps {
  brand: string;
  tagline: string;
  links: ITopNavBarLink[];
}

/** Persistent top navigation bar: brand + tagline on the left, nav links on the right. Presentational only. */
export function TopNavBar({ brand, tagline, links }: ITopNavBarProps) {
  return (
    <header className="top-nav-bar">
      <Link to="/" className="top-nav-bar__brand">
        <span className="top-nav-bar__brand-name">{brand}</span>
        <span className="top-nav-bar__tagline">{tagline}</span>
      </Link>
      <nav className="top-nav-bar__links">
        {links.map((link) => (
          <Link key={link.to} to={link.to} className="top-nav-bar__link">
            {link.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
