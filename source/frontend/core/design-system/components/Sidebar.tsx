import type { ReactNode } from "react";

import { Card } from "./Card";
import { TextInput } from "./TextInput";
import "./Sidebar.css";

export type SidebarGroup<T> = {
  label: string;
  items: T[];
};

type SidebarProps<T> = {
  groups: SidebarGroup<T>[];
  getId: (item: T) => string;
  getLabel: (item: T) => string;
  selectedId: string | null;
  onSelect: (id: string) => void;
  searchQuery: string;
  onSearchChange: (value: string) => void;
  /** Whatever renders the "create a new one" control — typically a ModalButton-based create
   * modal, so every page creates its objects through the same modal idiom.
   */
  createSlot: ReactNode;
  emptyMessage: string;
  /** Renders as a sibling *before* an item's selectable button (e.g. a per-row checkbox) —
   * never nested inside the button, since nesting one interactive element inside another isn't
   * valid markup. Omit for items with no such affordance.
   */
  renderLeading?: (item: T) => ReactNode;
  /** Replaces getLabel's plain text inside an item's button when richer content is needed (e.g.
   * a struck-through title for a completed item). Defaults to getLabel(item).
   */
  renderItemLabel?: (item: T) => ReactNode;
};

/** A generic search + create + grouped-list sidebar, shared by every page that pairs a list of
 * objects with a detail pane (Tasks, Projects). Filtering and grouping are the caller's job —
 * this component only displays whatever groups/items it's given.
 */
export function Sidebar<T>({
  groups,
  getId,
  getLabel,
  selectedId,
  onSelect,
  searchQuery,
  onSearchChange,
  createSlot,
  emptyMessage,
  renderLeading,
  renderItemLabel,
}: SidebarProps<T>) {
  const isEmpty = groups.every((group) => group.items.length === 0);
  const showGroupLabels = groups.length > 1;

  return (
    <Card className="cg-sidebar">
      <TextInput
        className="cg-sidebar__search"
        type="search"
        placeholder="Search…"
        value={searchQuery}
        onChange={(event) => onSearchChange(event.target.value)}
        aria-label="Search"
      />
      <div className="cg-sidebar__create">{createSlot}</div>
      {isEmpty && <p className="cg-sidebar__empty">{emptyMessage}</p>}
      {groups.map(
        (group) =>
          group.items.length > 0 && (
            <div className="cg-sidebar__group" key={group.label}>
              {showGroupLabels && <h2 className="cg-sidebar__group-label">{group.label}</h2>}
              <ul className="cg-sidebar__list">
                {group.items.map((item) => {
                  const id = getId(item);
                  const isSelected = id === selectedId;
                  return (
                    <li className="cg-sidebar__item-row" key={id}>
                      {renderLeading && (
                        <span className="cg-sidebar__item-leading">{renderLeading(item)}</span>
                      )}
                      <button
                        type="button"
                        className={`cg-sidebar__item${isSelected ? " cg-sidebar__item--selected" : ""}`}
                        onClick={() => onSelect(id)}
                      >
                        {renderItemLabel ? renderItemLabel(item) : getLabel(item)}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          ),
      )}
    </Card>
  );
}
