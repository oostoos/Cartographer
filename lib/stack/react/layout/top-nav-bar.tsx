import type { ReactNode } from "react";
import { Link } from "react-router-dom";

import "./top-nav-bar.css";

export interface ITopNavBarLink {
  label: string;
  to: string;
}

export interface ITopNavBarProps {
  brand: string;
  links: ITopNavBarLink[];
  /** Optional content rendered on the right, e.g. a profile chip. */
  trailing?: ReactNode;
}

/** Persistent top navigation bar: brand on the left, centered nav links, optional trailing content on the right. Presentational only. */
export function TopNavBar({ brand, links, trailing }: ITopNavBarProps) {
  return (
    <header className="top-nav-bar">
      <div className="top-nav-bar__leading">
        <Link to="/" className="top-nav-bar__brand">
          <span className="top-nav-bar__brand-name">{brand}</span>
        </Link>
        <nav className="top-nav-bar__links">
          {links.map((link) => (
            <Link key={link.to} to={link.to} className="top-nav-bar__link">
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
      <div className="top-nav-bar__trailing">{trailing}</div>
    </header>
  );
}
