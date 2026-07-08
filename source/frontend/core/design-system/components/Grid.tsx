import { type ReactNode, useState } from "react";

import { BasicIcon } from "./BasicIcon";
import { Button } from "./Button";
import { Checkbox } from "./Checkbox";
import { Select } from "./Select";
import "./Grid.css";

export type GridRow<T> = {
  key: string;
  label: string;
  value: T;
};

type GridProps<T> = {
  rows: GridRow<T>[];
  /** Renders one row's own editable content (e.g. start-time/duration inputs) — Grid never
   * interprets what a row means, same philosophy as List/TreeList.
   */
  renderCell: (row: GridRow<T>) => ReactNode;
  /** Copies one row's value onto a chosen set of other rows — the caller decides what "copy"
   * means for its own value shape.
   */
  onCopyRowToTargets: (sourceKey: string, targetKeys: string[]) => void;
  /** Removes one row entirely — omit for a fixed-universe grid (e.g. every weekday always shown)
   * where rows can only be toggled off, never deleted outright.
   */
  onRemoveRow?: (key: string) => void;
  /** A plain-language summary of what every row together adds up to, shown above the grid. */
  summary?: string;
};

/** A compact multi-row editor for a small set of same-shaped items — built for
 * BlockOccurrenceEditor's "advanced" per-unit time slots, but domain-agnostic like List/TreeList.
 * Above the rows, a "copy from" affordance: pick a source row, check which other rows should
 * receive its value, then Apply — the cheapest way to fill in several similar rows without
 * hand-editing each one, without inventing per-row drag/popover interactions.
 */
export function Grid<T>({
  rows,
  renderCell,
  onCopyRowToTargets,
  onRemoveRow,
  summary,
}: GridProps<T>) {
  const [copySourceKey, setCopySourceKey] = useState<string>(rows[0]?.key ?? "");
  const [copyTargetKeys, setCopyTargetKeys] = useState<string[]>([]);

  const copySourceOptions = rows.map((row) => ({ value: row.key, label: row.label }));

  function toggleCopyTarget(key: string) {
    setCopyTargetKeys((previous) =>
      previous.includes(key) ? previous.filter((existing) => existing !== key) : [...previous, key],
    );
  }

  function applyCopy() {
    if (!copySourceKey || copyTargetKeys.length === 0) return;
    onCopyRowToTargets(
      copySourceKey,
      copyTargetKeys.filter((key) => key !== copySourceKey),
    );
    setCopyTargetKeys([]);
  }

  return (
    <div className="cg-grid">
      {summary && <p className="cg-grid__summary">{summary}</p>}
      {rows.length > 1 && (
        <div className="cg-grid__copy-bar">
          <Select
            value={copySourceKey}
            onChange={setCopySourceKey}
            options={copySourceOptions}
            aria-label="Copy settings from"
          />
          <span className="cg-grid__copy-bar-label">to selected rows</span>
          <Button
            type="button"
            variant="secondary"
            onClick={applyCopy}
            disabled={copyTargetKeys.length === 0}
          >
            Apply
          </Button>
        </div>
      )}
      <ul className="cg-grid__rows">
        {rows.map((row) => (
          <li className="cg-grid__row" key={row.key}>
            {rows.length > 1 && (
              <Checkbox
                checked={copyTargetKeys.includes(row.key)}
                onToggle={() => toggleCopyTarget(row.key)}
                label={`Select ${row.label} as a copy target`}
              />
            )}
            <span className="cg-grid__row-label">{row.label}</span>
            <span className="cg-grid__row-cell">{renderCell(row)}</span>
            {onRemoveRow && (
              <Button
                iconOnly
                variant="danger"
                onClick={() => onRemoveRow(row.key)}
                aria-label={`Remove ${row.label}`}
              >
                <BasicIcon name="trash" label="Remove" />
              </Button>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
