import { todayIsoDate } from "../../core/utils/date";
import {
  WEEKDAY_LABELS,
  type CreateRecurringTaskTemplateInput,
  type RecurrenceFrequency,
} from "./recurrenceApi";
import "./RecurrencePicker.css";

type RecurrencePickerProps = {
  value: CreateRecurringTaskTemplateInput | null;
  onChange: (value: CreateRecurringTaskTemplateInput | null) => void;
};

const NONE_OPTION_VALUE = "none";
const DEFAULT_INTERVAL = 1;

const FREQUENCY_OPTIONS: { value: RecurrenceFrequency; label: string }[] = [
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
  { value: "yearly", label: "Yearly" },
];

/** Lets the user describe a task's recurrence — daily/weekly/monthly/yearly, an every-X
 * interval, specific weekdays, and a day-of-month/month-of-year — or leave it as a one-off task.
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
      <label>
        Repeats
        <select
          value={value?.frequency ?? NONE_OPTION_VALUE}
          onChange={(event) => handleFrequencyChange(event.target.value)}
        >
          <option value={NONE_OPTION_VALUE}>Doesn't repeat</option>
          {FREQUENCY_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>

      {value && (
        <label>
          Every
          <input
            type="number"
            min={1}
            value={value.interval ?? DEFAULT_INTERVAL}
            onChange={(event) => onChange({ ...value, interval: Number(event.target.value) })}
          />
        </label>
      )}

      {value?.frequency === "weekly" && (
        <fieldset className="cg-recurrence-picker__weekdays">
          <legend>On</legend>
          {WEEKDAY_LABELS.map((label, day) => (
            <label key={label}>
              <input
                type="checkbox"
                checked={(value.daysOfWeek ?? []).includes(day)}
                onChange={() => toggleWeekday(day)}
              />
              {label}
            </label>
          ))}
        </fieldset>
      )}

      {(value?.frequency === "monthly" || value?.frequency === "yearly") && (
        <label>
          Day of month
          <input
            type="number"
            min={1}
            max={31}
            value={value.dayOfMonth ?? ""}
            onChange={(event) => onChange({ ...value, dayOfMonth: Number(event.target.value) })}
          />
        </label>
      )}

      {value?.frequency === "yearly" && (
        <label>
          Month
          <input
            type="number"
            min={1}
            max={12}
            value={value.monthOfYear ?? ""}
            onChange={(event) => onChange({ ...value, monthOfYear: Number(event.target.value) })}
          />
        </label>
      )}
    </div>
  );
}
