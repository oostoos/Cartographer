// @manualReviewRequested: 2026-07-06
import { DndContext, closestCenter, type DragEndEvent, type SensorDescriptor } from "@dnd-kit/core";
import { SortableContext, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { type KeyboardEvent, type ReactNode, useRef, useState } from "react";

import { DragHandle } from "./DragHandle";
import { EmojiIcon } from "./EmojiIcon";
import { TextInput } from "./TextInput";
import "./List.css";

export type ListGroup<T> = {
  key: string;
  /** Omitted, or there's only one group total, ⇒ no header renders (mirrors Sidebar's previous
   * showGroupLabels rule).
   */
  label?: string;
  items: T[];
  /** Renders this group collapsed behind a "Label (n)" toggle instead of always-expanded. The
   * expanded/collapsed state is owned internally (uncontrolled) — nothing today needs to force a
   * particular group open from outside.
   */
  collapsible?: { defaultExpanded?: boolean; summaryLabel: (count: number) => string };
  /** An always-present trailing input row for quick-adding an item to this group by typing a
   * title and pressing Enter — the input clears and stays focused afterward, so several items
   * can be added back-to-back without re-clicking anything.
   */
  newItemLine?: { placeholder: string; onCreateItem: (text: string) => void; ariaLabel?: string };
};

export type ListReorderConfig = {
  /** Which group's items are drag-and-drop reorderable — only one group at a time in practice. */
  groupKey: string;
  itemIds: string[];
  sensors: SensorDescriptor<object>[];
  onDragEnd: (event: DragEndEvent) => void;
};

type ListProps<T> = {
  groups: ListGroup<T>[];
  getId: (item: T) => string;
  getLabel: (item: T) => string;
  /** Replaces getLabel's plain text with richer content (e.g. a struck-through title, or a
   * multi-line note body) — defaults to getLabel(item) when omitted.
   */
  renderItemLabel?: (item: T) => ReactNode;
  selectedId?: string | null;
  /** Omit entirely for a list with no concept of selection (e.g. a notes feed) — rows render as
   * inert content instead of a clickable button.
   */
  onSelect?: (id: string) => void;
  /** Renders as a sibling *before* an item's row content (e.g. a checkbox) — never nested inside
   * the selectable button, since nesting one interactive element inside another isn't valid
   * markup.
   */
  renderLeading?: (item: T) => ReactNode;
  /** Renders as a sibling *after* an item's row content (e.g. Skip/Delete buttons) — same
   * never-nested reasoning as renderLeading.
   */
  renderTrailing?: (item: T) => ReactNode;
  emptyMessage?: string;
  reorderable?: ListReorderConfig;
};

type RowContentProps<T> = {
  item: T;
  id: string;
  getLabel: (item: T) => string;
  renderItemLabel?: (item: T) => ReactNode;
  renderLeading?: (item: T) => ReactNode;
  renderTrailing?: (item: T) => ReactNode;
  selectedId?: string | null;
  onSelect?: (id: string) => void;
};

/** One row's leading/label/trailing content, as three DOM siblings (never nested inside one
 * another) — the same accessibility-driven shape Sidebar always used.
 */
function RowContent<T>({
  item,
  id,
  getLabel,
  renderItemLabel,
  renderLeading,
  renderTrailing,
  selectedId,
  onSelect,
}: RowContentProps<T>) {
  const label = renderItemLabel ? renderItemLabel(item) : getLabel(item);
  const isSelected = id === selectedId;
  return (
    <>
      {renderLeading && <span className="cg-list__item-leading">{renderLeading(item)}</span>}
      {onSelect ? (
        <button
          type="button"
          className={`cg-list__item cg-list__item--button${
            isSelected ? " cg-list__item--selected" : ""
          }`}
          onClick={() => onSelect(id)}
        >
          {label}
        </button>
      ) : (
        <span className="cg-list__item">{label}</span>
      )}
      {renderTrailing && <span className="cg-list__item-trailing">{renderTrailing(item)}</span>}
    </>
  );
}

function SortableListRow({ id, children }: { id: string; children: ReactNode }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id });
  const style = { transform: CSS.Transform.toString(transform), transition };
  return (
    <li className="cg-list__row" ref={setNodeRef} style={style}>
      <DragHandle {...attributes} {...listeners} />
      {children}
    </li>
  );
}

type NewItemLineRowProps = {
  config: NonNullable<ListGroup<unknown>["newItemLine"]>;
};

/** The bottom-of-group quick-add input: typing a title and pressing Enter creates it and clears
 * (and refocuses) the same input, so the "create line" stays put for the next item.
 */
function NewItemLineRow({ config }: NewItemLineRowProps) {
  const [draftTitle, setDraftTitle] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  function commitDraft() {
    const trimmedTitle = draftTitle.trim();
    if (trimmedTitle) config.onCreateItem(trimmedTitle);
    setDraftTitle("");
    inputRef.current?.focus();
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key !== "Enter") return;
    event.preventDefault();
    commitDraft();
  }

  return (
    <li className="cg-list__row cg-list__row--draft">
      <TextInput
        ref={inputRef}
        value={draftTitle}
        onChange={(event) => setDraftTitle(event.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={config.placeholder}
        aria-label={config.ariaLabel ?? config.placeholder}
      />
    </li>
  );
}

type ListGroupSectionProps<T> = Omit<ListProps<T>, "groups" | "emptyMessage"> & {
  group: ListGroup<T>;
  showLabel: boolean;
};

function ListGroupSection<T>({
  group,
  getId,
  getLabel,
  renderItemLabel,
  selectedId,
  onSelect,
  renderLeading,
  renderTrailing,
  showLabel,
  reorderable,
}: ListGroupSectionProps<T>) {
  const [isExpanded, setIsExpanded] = useState(group.collapsible?.defaultExpanded ?? false);
  const isThisGroupReorderable = reorderable?.groupKey === group.key;

  const rows =
    (!group.collapsible || isExpanded) &&
    group.items.map((item) => {
      const id = getId(item);
      const rowContent = (
        <RowContent
          item={item}
          id={id}
          getLabel={getLabel}
          renderItemLabel={renderItemLabel}
          renderLeading={renderLeading}
          renderTrailing={renderTrailing}
          selectedId={selectedId}
          onSelect={onSelect}
        />
      );
      return isThisGroupReorderable ? (
        <SortableListRow key={id} id={id}>
          {rowContent}
        </SortableListRow>
      ) : (
        <li className="cg-list__row" key={id}>
          {rowContent}
        </li>
      );
    });

  const listContent = (
    <ul className="cg-list__list">
      {rows}
      {group.newItemLine && <NewItemLineRow config={group.newItemLine} />}
    </ul>
  );

  return (
    <div className="cg-list__group">
      {group.collapsible ? (
        <button
          type="button"
          className="cg-list__collapse-toggle"
          aria-expanded={isExpanded}
          onClick={() => setIsExpanded((previous) => !previous)}
        >
          <EmojiIcon symbol={isExpanded ? "▾" : "▸"} label={isExpanded ? "Collapse" : "Expand"} />
          {group.collapsible.summaryLabel(group.items.length)}
        </button>
      ) : (
        showLabel && group.label && <h2 className="cg-list__group-label">{group.label}</h2>
      )}
      {isThisGroupReorderable && reorderable ? (
        <DndContext
          sensors={reorderable.sensors}
          collisionDetection={closestCenter}
          onDragEnd={reorderable.onDragEnd}
        >
          <SortableContext items={reorderable.itemIds} strategy={verticalListSortingStrategy}>
            {listContent}
          </SortableContext>
        </DndContext>
      ) : (
        listContent
      )}
    </div>
  );
}

/** The one list-row primitive used everywhere the app shows a flat (non-hierarchical) collection
 * of items — a notes feed, a project's tasks, a task's subtasks, the Tasks page's sidebar groups.
 * Handles grouping, an optional per-group collapse toggle,
 * optional drag-and-drop reordering of one group (see useReorderableList for the accompanying
 * optimistic-state hook), and an optional inline "type to create" row — but never what a row
 * means, same philosophy as the Sidebar/TreeList components it replaces. See
 * core/design-system/CLAUDE.md. `TreeList` stays a separate component for genuinely hierarchical
 * data (self-nesting projects) — this component is for flat groups only.
 */
export function List<T>({
  groups,
  getId,
  getLabel,
  renderItemLabel,
  selectedId,
  onSelect,
  renderLeading,
  renderTrailing,
  emptyMessage,
  reorderable,
}: ListProps<T>) {
  const isEmpty = groups.every((group) => group.items.length === 0);
  const showLabel = groups.length > 1;

  return (
    <div className="cg-list">
      {isEmpty && emptyMessage && <p className="cg-list__empty">{emptyMessage}</p>}
      {groups.map(
        (group) =>
          (group.items.length > 0 || group.newItemLine) && (
            <ListGroupSection
              key={group.key}
              group={group}
              getId={getId}
              getLabel={getLabel}
              renderItemLabel={renderItemLabel}
              selectedId={selectedId}
              onSelect={onSelect}
              renderLeading={renderLeading}
              renderTrailing={renderTrailing}
              showLabel={showLabel}
              reorderable={reorderable}
            />
          ),
      )}
    </div>
  );
}
