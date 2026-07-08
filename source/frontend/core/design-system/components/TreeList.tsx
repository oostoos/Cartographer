// @manualReviewRequested: 2026-07-06
import type { CSSProperties, ReactNode } from "react";

import { EmojiIcon } from "./EmojiIcon";
import "./TreeList.css";

export type TreeNode<T> = {
  item: T;
  children: TreeNode<T>[];
};

type TreeRowButtonProps = {
  children: ReactNode;
  /** Highlights this row as the current selection — ignored when isHeader is true. */
  isSelected?: boolean;
  /** Renders as inert `<span>` text (e.g. a group heading row) rather than a clickable button. */
  isHeader?: boolean;
  onClick?: () => void;
};

/** The row label idiom every `renderRow` caller needs — a selectable button (optionally
 * highlighted) or, for a non-interactive header row, plain text — so pages don't each rebuild the
 * same className logic inline.
 */
export function TreeRowButton({ children, isSelected, isHeader, onClick }: TreeRowButtonProps) {
  const classes = [
    "cg-tree-list__label",
    isSelected ? "cg-tree-list__label--selected" : "",
    isHeader ? "cg-tree-list__label--header" : "",
  ]
    .filter(Boolean)
    .join(" ");
  if (isHeader) return <span className={classes}>{children}</span>;
  return (
    <button type="button" className={classes} onClick={onClick}>
      {children}
    </button>
  );
}

type TreeListProps<T> = {
  nodes: TreeNode<T>[];
  getId: (item: T) => string;
  expandedIds: Set<string>;
  onToggleExpand: (id: string) => void;
  /** Renders a node's own row content — whatever a Sidebar item row would show (leading
   * checkbox, label, selection). Structure (indentation, recursion, the expand/collapse toggle
   * itself) is handled here; content and behavior are entirely up to this render prop.
   */
  renderRow: (item: T, options: { hasChildren: boolean; isExpanded: boolean }) => ReactNode;
  depth?: number;
};

/** A generic, depth-agnostic expand/collapse tree list, shared by any page that needs to render
 * a self-referential hierarchy (projects nested under projects, tasks grouped under the projects
 * they belong to). Domain-agnostic, same philosophy as Sidebar: this component only handles
 * structure, never what a row means.
 */
export function TreeList<T>({
  nodes,
  getId,
  expandedIds,
  onToggleExpand,
  renderRow,
  depth = 0,
}: TreeListProps<T>) {
  return (
    <ul className="cg-tree-list" style={{ "--cg-tree-depth": depth } as CSSProperties}>
      {nodes.map((node) => {
        const id = getId(node.item);
        const hasChildren = node.children.length > 0;
        const isExpanded = expandedIds.has(id);
        return (
          <li className="cg-tree-list__node" key={id}>
            <div className="cg-tree-list__row">
              {hasChildren ? (
                <button
                  type="button"
                  className="cg-tree-list__toggle"
                  aria-label={isExpanded ? "Collapse" : "Expand"}
                  onClick={() => onToggleExpand(id)}
                >
                  <EmojiIcon
                    symbol={isExpanded ? "▾" : "▸"}
                    label={isExpanded ? "Collapse" : "Expand"}
                  />
                </button>
              ) : (
                // Reserves the toggle's width even when this node has no children, so every
                // row's label starts at the same x position regardless of whether a sibling
                // happens to be expandable.
                <span
                  className="cg-tree-list__toggle cg-tree-list__toggle--placeholder"
                  aria-hidden="true"
                />
              )}
              {renderRow(node.item, { hasChildren, isExpanded })}
            </div>
            {hasChildren && isExpanded && (
              <TreeList
                nodes={node.children}
                getId={getId}
                expandedIds={expandedIds}
                onToggleExpand={onToggleExpand}
                renderRow={renderRow}
                depth={depth + 1}
              />
            )}
          </li>
        );
      })}
    </ul>
  );
}
