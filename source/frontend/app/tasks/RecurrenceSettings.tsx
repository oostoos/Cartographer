// @manualReviewRequested: 2026-07-06
import { useEffect, useState } from "react";

import { Button } from "../../core/design-system/components/Button";
import { ModalButton } from "../../core/design-system/components/ModalButton";
import { RecurrencePicker } from "./RecurrencePicker";
import {
  WEEKDAY_LABELS,
  type CreateRecurringTaskTemplateInput,
  type RecurringTaskTemplate,
} from "./recurrenceApi";
import {
  useRecurringTaskTemplate,
  useUpdateRecurringTaskTemplate,
} from "./useRecurringTaskTemplates";
import "./RecurrenceSettings.css";

type RecurrenceSettingsProps = {
  templateId: string;
};

function describeRecurrence(template: RecurringTaskTemplate): string {
  if (!template.isActive) return "Recurrence paused";
  const every = template.interval > 1 ? `every ${template.interval} ` : "";
  if (template.frequency === "daily") return `Repeats ${every}${every ? "days" : "daily"}`;
  if (template.frequency === "weekly") {
    const days = template.daysOfWeek.map((day) => WEEKDAY_LABELS[day]).join(", ");
    return `Repeats ${every}${every ? "weeks" : "weekly"}${days ? ` on ${days}` : ""}`;
  }
  if (template.frequency === "monthly") return `Repeats ${every}${every ? "months" : "monthly"}`;
  return `Repeats ${every}${every ? "years" : "yearly"}`;
}

function templateToPickerValue(template: RecurringTaskTemplate): CreateRecurringTaskTemplateInput {
  return {
    frequency: template.frequency,
    startDate: template.startDate,
    interval: template.interval,
    endDate: template.endDate,
    daysOfWeek: template.daysOfWeek,
    dayOfMonth: template.dayOfMonth,
    monthOfYear: template.monthOfYear,
  };
}

/** The task settings area's recurrence summary plus its "Edit recurrence" action, for an
 * instance generated from a RecurringTaskTemplate. Editing changes the template's cadence
 * directly — the change only affects instances generated after this save; this task's own
 * instance is untouched.
 */
export function RecurrenceSettings({ templateId }: RecurrenceSettingsProps) {
  const { data: template } = useRecurringTaskTemplate(templateId);

  return (
    <div className="cg-recurrence-settings">
      <span className="cg-recurrence-settings__summary">
        {template ? describeRecurrence(template) : "Loading recurrence…"}
      </span>
      <ModalButton
        label="Edit recurrence"
        icon={{ symbol: "🔁", label: "Edit recurrence" }}
        renderContent={(close) =>
          template ? (
            <RecurrenceEditForm templateId={templateId} template={template} onSaved={close} />
          ) : (
            <p>Loading…</p>
          )
        }
      />
    </div>
  );
}

type RecurrenceEditFormProps = {
  templateId: string;
  template: RecurringTaskTemplate;
  onSaved: () => void;
};

function RecurrenceEditForm({ templateId, template, onSaved }: RecurrenceEditFormProps) {
  const updateTemplate = useUpdateRecurringTaskTemplate();
  const [value, setValue] = useState<CreateRecurringTaskTemplateInput | null>(
    template.isActive ? templateToPickerValue(template) : null,
  );

  useEffect(() => {
    setValue(template.isActive ? templateToPickerValue(template) : null);
  }, [template]);

  function handleSave() {
    const changes = value ? { ...value, isActive: true } : { isActive: false };
    updateTemplate.mutate({ templateId, changes }, { onSuccess: onSaved });
  }

  return (
    <div className="cg-recurrence-edit-form">
      <RecurrencePicker value={value} onChange={setValue} />
      <Button onClick={handleSave}>Save recurrence</Button>
      {updateTemplate.isError && (
        <p className="cg-recurrence-edit-form__error">{updateTemplate.error.message}</p>
      )}
    </div>
  );
}
