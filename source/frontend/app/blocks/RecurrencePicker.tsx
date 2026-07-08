// @manualReviewRequested: 2026-07-07
import { Checkbox } from "../../core/design-system/components/Checkbox";
import { Field } from "../../core/design-system/components/Field";
import { SetSelection } from "../../core/design-system/components/SetSelection";
import { TextInput } from "../../core/design-system/components/TextInput";
import { todayIsoDate } from "../../core/utils/date";
import { WEEKDAY_LABELS, type CadenceOverride, type RecurrenceFrequency } from "./blockApi";
import "./RecurrencePicker.css";

type RecurrencePickerProps = {
  value: CadenceOverride | null;
  onChange: (value: CadenceOverride | null) => void;
};

const NONE_OPTION_VALUE = "none";
const DEFAULT_INTERVAL = 1;

const FREQUENCY_PILL_OPTIONS = [
  { value: NONE_OPTION_VALUE, label: "Every time" },
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
  { value: "yearly", label: "Yearly" },
];

/** Lets the user describe a block-nested task's own cadence override — daily/weekly/monthly/
 * yearly, an every-X interval, specific weekdays, and a day-of-month/month-of-year — or leave it
 * as "every time" (the block's own occurrence is enough, no separate task-level cadence).
 */
export function RecurrencePicker({ value, onChange }: RecurrencePickerProps) {
  function handleFrequencyChange(rawFrequency: string) {
    if (rawFrequency === NONE_OPTION_VALUE) {
      onChange(null);
      return;
    }
    onChange({
      frequency: rawFrequency as RecurrenceFrequency,
      startDate: value?.startDate ?? todayIsoDate(),
      interval: value?.interval ?? DEFAULT_INTERVAL,
    });
  }

  function toggleWeekday(day: number) {
    if (!value) return;
    const daysOfWeek = value.daysOfWeek ?? [];
    const updatedDays = daysOfWeek.includes(day)
      ? daysOfWeek.filter((existingDay) => existingDay !== day)
      : [...daysOfWeek, day].sort((a, b) => a - b);
    onChange({ ...value, daysOfWeek: updatedDays });
  }

  return (
    <div className="cg-recurrence-picker">
      <Field label="Repeats">
        <SetSelection
          value={value?.frequency ?? NONE_OPTION_VALUE}
          onChange={handleFrequencyChange}
          options={FREQUENCY_PILL_OPTIONS}
        />
      </Field>

      {value && (
        <Field label="Every">
          <TextInput
            type="number"
            min={1}
            value={value.interval ?? DEFAULT_INTERVAL}
            onChange={(event) => onChange({ ...value, interval: Number(event.target.value) })}
          />
        </Field>
      )}

      {value?.frequency === "weekly" && (
        <fieldset className="cg-recurrence-picker__weekdays">
          <legend>On</legend>
          {WEEKDAY_LABELS.map((label, day) => (
            <span className="cg-recurrence-picker__weekday" key={label}>
              <Checkbox
                checked={(value.daysOfWeek ?? []).includes(day)}
                onToggle={() => toggleWeekday(day)}
                label={label}
              />
              <span aria-hidden="true">{label}</span>
            </span>
          ))}
        </fieldset>
      )}

      {(value?.frequency === "monthly" || value?.frequency === "yearly") && (
        <Field label="Day of month">
          <TextInput
            type="number"
            min={1}
            max={31}
            value={value.dayOfMonth ?? ""}
            onChange={(event) => onChange({ ...value, dayOfMonth: Number(event.target.value) })}
          />
        </Field>
      )}

      {value?.frequency === "yearly" && (
        <Field label="Month">
          <TextInput
            type="number"
            min={1}
            max={12}
            value={value.monthOfYear ?? ""}
            onChange={(event) => onChange({ ...value, monthOfYear: Number(event.target.value) })}
          />
        </Field>
      )}
    </div>
  );
}
