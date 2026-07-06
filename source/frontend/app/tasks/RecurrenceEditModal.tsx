import { useEffect, useState } from "react";

import { Button } from "../../core/design-system/components/Button";
import { ModalButton } from "../../core/design-system/components/ModalButton";
import { RecurrencePicker } from "./RecurrencePicker";
import type { CreateRecurringTaskTemplateInput, RecurringTaskTemplate } from "./recurrenceApi";
import {
  useRecurringTaskTemplate,
  useUpdateRecurringTaskTemplate,
} from "./useRecurringTaskTemplates";
import "./RecurrenceEditModal.css";

type RecurrenceEditModalProps = {
  templateId: string;
};

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

/** The task settings area's "Edit recurrence" action for an instance generated from a
 * RecurringTaskTemplate. Edits the template's cadence directly — the change only affects
 * instances generated after this save; this task's own instance is untouched.
 */
export function RecurrenceEditModal({ templateId }: RecurrenceEditModalProps) {
  const { data: template } = useRecurringTaskTemplate(templateId);

  return (
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
