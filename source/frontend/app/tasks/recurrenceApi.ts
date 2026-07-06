import { apiGet, apiPatch, apiPost } from "../../core/api/apiClient";

export type RecurrenceFrequency = "daily" | "weekly" | "monthly" | "yearly";

/** Weekday labels indexed 0 (Monday) - 6 (Sunday), matching RecurrenceRule.daysOfWeek's numbering. */
export const WEEKDAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export type RecurringTaskTemplate = {
  id: string;
  title: string;
  description: string;
  projectId: string;
  tags: string[];
  subtaskTitles: string[];
  frequency: RecurrenceFrequency;
  interval: number;
  startDate: string;
  endDate: string | null;
  daysOfWeek: number[];
  dayOfMonth: number | null;
  monthOfYear: number | null;
  isActive: boolean;
};

export type CreateRecurringTaskTemplateInput = {
  title?: string;
  description?: string;
  projectId?: string;
  tags?: string[];
  subtaskTitles?: string[];
  frequency: RecurrenceFrequency;
  startDate: string;
  interval?: number;
  endDate?: string | null;
  daysOfWeek?: number[];
  dayOfMonth?: number | null;
  monthOfYear?: number | null;
};

export type UpdateRecurringTaskTemplateInput = Partial<CreateRecurringTaskTemplateInput> & {
  isActive?: boolean;
};

/** Creates a recurring task template a task instance is generated from via its
 * recurringTemplateId.
 */
export function createRecurringTaskTemplate(
  input: CreateRecurringTaskTemplateInput,
): Promise<RecurringTaskTemplate> {
  return apiPost<RecurringTaskTemplate>("/api/recurring-task-templates", input);
}

/** Reads a single recurring task template. */
export function fetchRecurringTaskTemplate(templateId: string): Promise<RecurringTaskTemplate> {
  return apiGet<RecurringTaskTemplate>(`/api/recurring-task-templates/${templateId}`);
}

/** Updates a recurring task template's cadence (or title/description/project/tags/subtasks).
 * Only affects instances generated after this call.
 */
export function updateRecurringTaskTemplate(
  templateId: string,
  changes: UpdateRecurringTaskTemplateInput,
): Promise<RecurringTaskTemplate> {
  return apiPatch<RecurringTaskTemplate>(`/api/recurring-task-templates/${templateId}`, changes);
}
