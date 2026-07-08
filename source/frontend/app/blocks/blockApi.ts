// @manualReviewRequested: 2026-07-07
import { apiDelete, apiGet, apiPatch, apiPost } from "../../core/api/apiClient";
import type { Task } from "../tasks/taskApi";

export type RecurrenceFrequency = "daily" | "weekly" | "monthly" | "yearly";

/** Weekday labels indexed 0 (Monday) - 6 (Sunday), matching a weekly InstanceRow's own selector
 * numbering and a BlockTaskTemplate's daysOfWeek numbering.
 */
export const WEEKDAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
export const WEEKDAY_FULL_LABELS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

/** One selectable unit's own time slot within a block template's shape. selector's format depends
 * on the owning shape's frequency: "daily" for daily, "0".."6" (Monday=0) for weekly, "1".."31"
 * for monthly, "MM-DD" for yearly. A unit with no row is off.
 */
export type InstanceRow = {
  selector: string;
  startTime: string;
  durationMinutes: number;
};

/** The sentinel selector a daily shape's single instance row always uses. */
export const DAILY_SELECTOR = "daily";

/** A block template's own occurrence shape — daily/weekly/monthly/yearly, an "every N" interval,
 * and a set of instance rows. isAdvanced is a pure editing-mode hint (simple mode writes every
 * generated row with the same startTime/durationMinutes; advanced mode lets each row have its
 * own) — the backend never branches on it, only BlockOccurrenceEditor does.
 */
export type BlockShape = {
  frequency: RecurrenceFrequency;
  interval: number;
  isAdvanced: boolean;
  instanceRows: InstanceRow[];
};

export type BlockTaskTemplate = {
  id: string;
  title: string;
  isSkippable: boolean;
  estimatedMinutes: number;
  order: number;
  /** null means "every time the block occurs" — the common case; a set cadence layers on top of
   * whichever days the block itself occurs.
   */
  frequency: RecurrenceFrequency | null;
  interval: number;
  startDate: string | null;
  endDate: string | null;
  daysOfWeek: number[];
  dayOfMonth: number | null;
  monthOfYear: number | null;
};

/** The shape RecurrencePicker.tsx edits — a task template's cadence override, with frequency and
 * startDate required together (whenever a cadence is set at all) and everything else optional.
 * A null CadenceOverride (rather than this type) means "every time the block occurs."
 */
export type CadenceOverride = {
  frequency: RecurrenceFrequency;
  startDate: string;
  interval?: number;
  endDate?: string | null;
  daysOfWeek?: number[];
  dayOfMonth?: number | null;
  monthOfYear?: number | null;
};

export type BlockTaskTemplateInput = {
  title: string;
  isSkippable?: boolean;
  estimatedMinutes?: number;
  frequency?: RecurrenceFrequency | null;
  interval?: number;
  startDate?: string | null;
  endDate?: string | null;
  daysOfWeek?: number[];
  dayOfMonth?: number | null;
  monthOfYear?: number | null;
};

export type BlockTemplate = {
  id: string;
  title: string;
  description: string;
  tags: string[];
  workspaceId: string;
  isActive: boolean;
  order: number;
  startDate: string | null;
  endDate: string | null;
  /** The shape currently effective (as of today) — never the full effective-dated history, which
   * is server-side bookkeeping only. null means no shape has been configured yet (never occurs).
   */
  shape: BlockShape | null;
  taskTemplates: BlockTaskTemplate[];
  /** The smallest-to-largest possible total task time across the shape's instance rows — see
   * describeTaskTimeRange.
   */
  taskTimeRange: { minMinutes: number; maxMinutes: number };
};

export type CreateBlockTemplateInput = {
  title: string;
  description?: string;
  tags?: string[];
  workspaceId?: string;
  startDate?: string | null;
  endDate?: string | null;
  /** Applied "from today onward" server-side — see block_template.upsert_shape_effective_today
   * on the backend. Never send prior shape history; there is none to send.
   */
  shape?: BlockShape;
  taskTemplates?: BlockTaskTemplateInput[];
};

export type UpdateBlockTemplateInput = Partial<CreateBlockTemplateInput> & {
  isActive?: boolean;
  order?: number;
};

export type TodayBlock = {
  id: string;
  title: string;
  description: string;
  tags: string[];
  startTime: string;
  durationMinutes: number;
  scheduledMinutes: number;
  tasks: Task[];
};

/** Lists every block template. */
export function fetchBlockTemplates(): Promise<BlockTemplate[]> {
  return apiGet<BlockTemplate[]>("/api/block-templates");
}

/** Creates a block template (and its nested task templates). The backend eagerly generates
 * today's instance if it's due today.
 */
export function createBlockTemplate(input: CreateBlockTemplateInput): Promise<BlockTemplate> {
  return apiPost<BlockTemplate>("/api/block-templates", input);
}

/** Reads a single block template. */
export function fetchBlockTemplate(templateId: string): Promise<BlockTemplate> {
  return apiGet<BlockTemplate>(`/api/block-templates/${templateId}`);
}

/** Updates a block template. shape, if given, applies from today onward (see
 * block_template.upsert_shape_effective_today on the backend); taskTemplates, if given,
 * wholesale-replaces the current set.
 */
export function updateBlockTemplate(
  templateId: string,
  changes: UpdateBlockTemplateInput,
): Promise<BlockTemplate> {
  return apiPatch<BlockTemplate>(`/api/block-templates/${templateId}`, changes);
}

/** Deletes a block template (and its task templates). Instances already generated are unaffected. */
export function deleteBlockTemplate(templateId: string): Promise<void> {
  return apiDelete(`/api/block-templates/${templateId}`);
}

/** Creates the "Generate basic blocks" ADHD preset templates. */
export function generateDefaultBlockTemplates(): Promise<BlockTemplate[]> {
  return apiPost<BlockTemplate[]>("/api/block-templates/generate-defaults", {});
}

/** A short human-readable summary of a task template's cadence override (e.g. "Every time",
 * "Weekly on Mon, Wed", "Monthly"). Takes just the cadence fields (not a full BlockTaskTemplate)
 * so it works equally for an already-saved task template and a not-yet-saved draft row.
 */
export function describeTaskCadence(cadence: CadenceOverride | null): string {
  if (!cadence) return "Every time";
  const interval = cadence.interval ?? 1;
  const every = interval > 1 ? `every ${interval} ` : "";
  if (cadence.frequency === "daily") return `Repeats ${every}${every ? "days" : "daily"}`;
  if (cadence.frequency === "weekly") {
    const days = (cadence.daysOfWeek ?? []).map((day) => WEEKDAY_LABELS[day]).join(", ");
    return `Repeats ${every}${every ? "weeks" : "weekly"}${days ? ` on ${days}` : ""}`;
  }
  if (cadence.frequency === "monthly") return `Repeats ${every}${every ? "months" : "monthly"}`;
  return `Repeats ${every}${every ? "years" : "yearly"}`;
}

/** Formats one instance row's selector as a short human-readable unit label — "Mon", "the 15th",
 * "Mar 15" — for the occurrence editor's plain-language summary and Grid row labels.
 */
export function describeSelector(frequency: RecurrenceFrequency, selector: string): string {
  if (frequency === "weekly") return WEEKDAY_LABELS[Number(selector)] ?? selector;
  if (frequency === "monthly") return `the ${selector}${_ordinalSuffix(Number(selector))}`;
  if (frequency === "yearly") {
    const [month, day] = selector.split("-").map(Number);
    const monthLabel = new Date(2000, month - 1, 1).toLocaleDateString(undefined, {
      month: "short",
    });
    return `${monthLabel} ${day}`;
  }
  return selector;
}

function _ordinalSuffix(day: number): string {
  if (day % 10 === 1 && day !== 11) return "st";
  if (day % 10 === 2 && day !== 12) return "nd";
  if (day % 10 === 3 && day !== 13) return "rd";
  return "th";
}

/** A short human-readable summary of a block template's own occurrence shape (e.g. "Every day",
 * "Weekly on Mon, Wed, Fri", "Every 2 months on the 1st and the 15th") — the plain-language
 * description shown above BlockOccurrenceEditor and, in advanced mode, above its Grid.
 */
export function describeShape(shape: BlockShape | null): string {
  if (!shape || shape.instanceRows.length === 0) return "Not configured yet — never occurs";
  const interval = shape.interval;
  const every = interval > 1 ? `every ${interval} ` : "";
  if (shape.frequency === "daily") return `Repeats ${every}${every ? "days" : "every day"}`;
  const units = shape.instanceRows
    .map((row) => describeSelector(shape.frequency, row.selector))
    .join(", ");
  if (shape.frequency === "weekly") {
    return `Repeats ${every}${every ? "weeks" : "weekly"} on ${units}`;
  }
  if (shape.frequency === "monthly") {
    return `Repeats ${every}${every ? "months" : "monthly"} on ${units}`;
  }
  return `Repeats ${every}${every ? "years" : "yearly"} on ${units}`;
}
