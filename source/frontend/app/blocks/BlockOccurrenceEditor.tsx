// @manualReviewRequested: 2026-07-07
import { useState } from "react";

import { Button } from "../../core/design-system/components/Button";
import { CheckboxField } from "../../core/design-system/components/CheckboxField";
import { Field } from "../../core/design-system/components/Field";
import { Grid, type GridRow } from "../../core/design-system/components/Grid";
import { SetSelection } from "../../core/design-system/components/SetSelection";
import { TextInput } from "../../core/design-system/components/TextInput";
import {
  DAILY_SELECTOR,
  WEEKDAY_FULL_LABELS,
  describeSelector,
  describeShape,
  type BlockShape,
  type InstanceRow,
  type RecurrenceFrequency,
} from "./blockApi";
import "./BlockOccurrenceEditor.css";

const DEFAULT_START_TIME = "07:00";
const DEFAULT_DURATION_MINUTES = 30;
const DEFAULT_INTERVAL = 1;

const FREQUENCY_OPTIONS: { value: RecurrenceFrequency; label: string }[] = [
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
  { value: "yearly", label: "Yearly" },
];

const MODE_OPTIONS = [
  { value: "simple", label: "Simple" },
  { value: "advanced", label: "Advanced" },
];

const INTERVAL_UNIT_LABELS: Record<RecurrenceFrequency, string> = {
  daily: "day(s)",
  weekly: "week(s)",
  monthly: "month(s)",
  yearly: "year(s)",
};

function monthDaySelector(month: number, day: number): string {
  return `${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

type BlockOccurrenceEditorProps = {
  value: BlockShape | null;
  onChange: (value: BlockShape) => void;
  /** Used to flag a row whose durationMinutes can't (or might not) fit this block's own nested
   * tasks — see block_time_estimate.py's min/max sum on the backend.
   */
  taskTimeRange: { minMinutes: number; maxMinutes: number };
};

/** The block template's own occurrence editor: a daily/weekly/monthly/yearly pill row plus an
 * "every N" interval (simple mode), or the same frequency/interval with each selected unit's own
 * time slot broken out into a Grid (advanced mode) — the two modes share identical storage
 * (instanceRows), simple mode just keeps every row's time/duration in sync with one shared pair.
 * Replaces the old fixed weekly on/off grid (WeeklyScheduleEditor).
 */
export function BlockOccurrenceEditor({
  value,
  onChange,
  taskTimeRange,
}: BlockOccurrenceEditorProps) {
  const frequency = value?.frequency ?? "weekly";
  const interval = value?.interval ?? DEFAULT_INTERVAL;
  const isAdvanced = value?.isAdvanced ?? false;
  const instanceRows = value?.instanceRows ?? [];

  function commit(changes: Partial<BlockShape>) {
    onChange({ frequency, interval, isAdvanced, instanceRows, ...changes });
  }

  function setFrequency(nextFrequency: RecurrenceFrequency) {
    // A previous frequency's selectors (weekday/day-of-month/month-day) don't carry over.
    const initialRows = nextFrequency === "daily" ? [_defaultRow(DAILY_SELECTOR)] : [];
    onChange({ frequency: nextFrequency, interval, isAdvanced, instanceRows: initialRows });
  }

  function setRows(nextRows: InstanceRow[]) {
    commit({ instanceRows: nextRows });
  }

  function toggleWeekday(weekday: number) {
    const selector = String(weekday);
    const exists = instanceRows.some((row) => row.selector === selector);
    if (exists) {
      setRows(instanceRows.filter((row) => row.selector !== selector));
    } else {
      setRows([...instanceRows, _defaultRow(selector, instanceRows)]);
    }
  }

  function addRow(selector: string) {
    if (instanceRows.some((row) => row.selector === selector)) return;
    setRows([...instanceRows, _defaultRow(selector, instanceRows)]);
  }

  function removeRow(selector: string) {
    setRows(instanceRows.filter((row) => row.selector !== selector));
  }

  function updateRow(selector: string, changes: Partial<InstanceRow>) {
    setRows(instanceRows.map((row) => (row.selector === selector ? { ...row, ...changes } : row)));
  }

  const sharedStartTime = instanceRows[0]?.startTime ?? DEFAULT_START_TIME;
  const sharedDuration = instanceRows[0]?.durationMinutes ?? DEFAULT_DURATION_MINUTES;

  function setSharedTime(startTime: string) {
    setRows(instanceRows.map((row) => ({ ...row, startTime })));
  }
  function setSharedDuration(durationMinutes: number) {
    setRows(instanceRows.map((row) => ({ ...row, durationMinutes })));
  }

  const guaranteedOverload = instanceRows.some(
    (row) => row.durationMinutes > 0 && taskTimeRange.minMinutes > row.durationMinutes,
  );
  const possibleOverload =
    !guaranteedOverload &&
    instanceRows.some(
      (row) => row.durationMinutes > 0 && taskTimeRange.maxMinutes > row.durationMinutes,
    );

  return (
    <div className="cg-block-occurrence-editor">
      <SetSelection
        value={frequency}
        onChange={(next) => setFrequency(next as RecurrenceFrequency)}
        options={FREQUENCY_OPTIONS}
        aria-label="Frequency"
      />

      <Field label="Every">
        <TextInput
          type="number"
          min={1}
          value={interval}
          onChange={(event) => commit({ interval: Math.max(1, Number(event.target.value)) })}
        />
      </Field>
      <span className="cg-block-occurrence-editor__interval-unit">
        {INTERVAL_UNIT_LABELS[frequency]}
      </span>

      {frequency !== "daily" && (
        <SetSelection
          value={isAdvanced ? "advanced" : "simple"}
          onChange={(next) => commit({ isAdvanced: next === "advanced" })}
          options={MODE_OPTIONS}
          aria-label="Editing mode"
        />
      )}

      {frequency === "weekly" && (
        <fieldset className="cg-block-occurrence-editor__weekdays">
          <legend>On</legend>
          {WEEKDAY_FULL_LABELS.map((label, weekday) => (
            <CheckboxField
              key={label}
              label={label}
              checked={instanceRows.some((row) => row.selector === String(weekday))}
              onToggle={() => toggleWeekday(weekday)}
            />
          ))}
        </fieldset>
      )}

      {frequency === "monthly" && <AddDayOfMonthControl onAdd={(day) => addRow(String(day))} />}

      {frequency === "yearly" && (
        <AddMonthDayControl onAdd={(month, day) => addRow(monthDaySelector(month, day))} />
      )}

      <p className="cg-block-occurrence-editor__summary">
        {describeShape({ frequency, interval, isAdvanced, instanceRows })}
      </p>

      {!isAdvanced && (
        <div className="cg-block-occurrence-editor__shared-time">
          <Field label="Start time">
            <TextInput
              type="time"
              value={sharedStartTime}
              onChange={(event) => setSharedTime(event.target.value)}
            />
          </Field>
          <Field label="Duration">
            <TextInput
              type="number"
              min={5}
              step={5}
              value={sharedDuration}
              onChange={(event) => setSharedDuration(Number(event.target.value))}
            />
          </Field>
          <span className="cg-block-occurrence-editor__unit">min</span>
        </div>
      )}

      {isAdvanced && instanceRows.length > 0 && (
        <Grid<InstanceRow>
          rows={instanceRows.map((row): GridRow<InstanceRow> => ({
            key: row.selector,
            label: describeSelector(frequency, row.selector),
            value: row,
          }))}
          onRemoveRow={frequency === "weekly" ? undefined : (key) => removeRow(key)}
          onCopyRowToTargets={(sourceKey, targetKeys) => {
            const source = instanceRows.find((row) => row.selector === sourceKey);
            if (!source) return;
            setRows(
              instanceRows.map((row) =>
                targetKeys.includes(row.selector)
                  ? { ...row, startTime: source.startTime, durationMinutes: source.durationMinutes }
                  : row,
              ),
            );
          }}
          renderCell={(row) => (
            <>
              <TextInput
                type="time"
                value={row.value.startTime}
                onChange={(event) => updateRow(row.key, { startTime: event.target.value })}
                aria-label={`${row.label} start time`}
              />
              <TextInput
                type="number"
                min={5}
                step={5}
                value={row.value.durationMinutes}
                onChange={(event) =>
                  updateRow(row.key, { durationMinutes: Number(event.target.value) })
                }
                aria-label={`${row.label} duration in minutes`}
              />
              <span className="cg-block-occurrence-editor__unit">min</span>
            </>
          )}
        />
      )}

      {guaranteedOverload && (
        <p className="cg-block-occurrence-editor__warning cg-block-occurrence-editor__warning--guaranteed">
          Overloaded — at least {taskTimeRange.minMinutes} min of tasks won't fit every occurrence's
          duration
        </p>
      )}
      {possibleOverload && (
        <p className="cg-block-occurrence-editor__warning">
          Up to {taskTimeRange.maxMinutes} min of tasks possible — may not fit every occurrence
        </p>
      )}
    </div>
  );
}

function _defaultRow(selector: string, existingRows: InstanceRow[] = []): InstanceRow {
  return {
    selector,
    startTime: existingRows[0]?.startTime ?? DEFAULT_START_TIME,
    durationMinutes: existingRows[0]?.durationMinutes ?? DEFAULT_DURATION_MINUTES,
  };
}

function AddDayOfMonthControl({ onAdd }: { onAdd: (day: number) => void }) {
  const [day, setDay] = useState(1);
  return (
    <div className="cg-block-occurrence-editor__add-row">
      <Field label="Day of month">
        <TextInput
          type="number"
          min={1}
          max={31}
          value={day}
          onChange={(event) => setDay(Number(event.target.value))}
        />
      </Field>
      <Button
        type="button"
        variant="secondary"
        onClick={() => {
          if (day >= 1 && day <= 31) onAdd(day);
        }}
      >
        Add day
      </Button>
    </div>
  );
}

function AddMonthDayControl({ onAdd }: { onAdd: (month: number, day: number) => void }) {
  const [month, setMonth] = useState(1);
  const [day, setDay] = useState(1);
  return (
    <div className="cg-block-occurrence-editor__add-row">
      <Field label="Month">
        <TextInput
          type="number"
          min={1}
          max={12}
          value={month}
          onChange={(event) => setMonth(Number(event.target.value))}
        />
      </Field>
      <Field label="Day">
        <TextInput
          type="number"
          min={1}
          max={31}
          value={day}
          onChange={(event) => setDay(Number(event.target.value))}
        />
      </Field>
      <Button
        type="button"
        variant="secondary"
        onClick={() => {
          if (month >= 1 && month <= 12 && day >= 1 && day <= 31) onAdd(month, day);
        }}
      >
        Add date
      </Button>
    </div>
  );
}
