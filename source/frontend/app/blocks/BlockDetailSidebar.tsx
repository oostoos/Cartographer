// @manualReviewRequested: 2026-07-07
import { useEffect, useState } from "react";

import { BasicIcon } from "../../core/design-system/components/BasicIcon";
import { Button } from "../../core/design-system/components/Button";
import { Card } from "../../core/design-system/components/Card";
import { CheckboxField } from "../../core/design-system/components/CheckboxField";
import { Field } from "../../core/design-system/components/Field";
import { Select } from "../../core/design-system/components/Select";
import { TextArea } from "../../core/design-system/components/TextArea";
import { TextInput } from "../../core/design-system/components/TextInput";
import { todayIsoDate } from "../../core/utils/date";
import { parseNonNegativeInt } from "../../core/utils/number";
import { useWorkspaces } from "../workspaces/useWorkspaces";
import { BlockOccurrenceEditor } from "./BlockOccurrenceEditor";
import { RecurrencePicker } from "./RecurrencePicker";
import {
  describeTaskCadence,
  type BlockShape,
  type BlockTaskTemplate,
  type BlockTemplate,
  type CadenceOverride,
} from "./blockApi";
import {
  useCreateBlockTemplate,
  useDeleteBlockTemplate,
  useUpdateBlockTemplate,
} from "./useBlockTemplates";
import "./BlockDetailSidebar.css";

const DEFAULT_ESTIMATED_MINUTES = 5;

/** A task template row's editable state, plus a stable local key (its server id once saved, or a
 * freshly generated one for a not-yet-saved row) so React doesn't lose input focus/state when
 * rows are added or removed elsewhere in the list. estimatedMinutes is kept as text (not a
 * number) so the field can render genuinely empty while being cleared/retyped — coerced via
 * parseNonNegativeInt (core/utils/number.ts) only where a number is actually needed.
 */
type EditableTaskTemplate = {
  key: string;
  title: string;
  isSkippable: boolean;
  estimatedMinutes: string;
  cadence: CadenceOverride | null;
};

function newLocalKey(): string {
  return `draft-${Math.random().toString(36).slice(2)}`;
}

function toEditable(taskTemplate: BlockTaskTemplate): EditableTaskTemplate {
  return {
    key: taskTemplate.id,
    title: taskTemplate.title,
    isSkippable: taskTemplate.isSkippable,
    estimatedMinutes: String(taskTemplate.estimatedMinutes),
    cadence: taskTemplate.frequency
      ? {
          frequency: taskTemplate.frequency,
          startDate: taskTemplate.startDate ?? todayIsoDate(),
          interval: taskTemplate.interval,
          endDate: taskTemplate.endDate,
          daysOfWeek: taskTemplate.daysOfWeek,
          dayOfMonth: taskTemplate.dayOfMonth,
          monthOfYear: taskTemplate.monthOfYear,
        }
      : null,
  };
}

/** Computes the same min/max task time range the backend does, live, from the in-progress edit
 * state — so the overload warnings in BlockOccurrenceEditor update as rows are added/edited,
 * without waiting for a round-trip.
 */
function computeLiveTaskTimeRange(tasks: EditableTaskTemplate[]): {
  minMinutes: number;
  maxMinutes: number;
} {
  const minMinutes = tasks
    .filter((task) => task.cadence === null)
    .reduce((sum, task) => sum + parseNonNegativeInt(task.estimatedMinutes), 0);
  const maxMinutes = tasks.reduce(
    (sum, task) => sum + parseNonNegativeInt(task.estimatedMinutes),
    0,
  );
  return { minMinutes, maxMinutes };
}

type BlockDetailSidebarProps = {
  /** null means "create a new block template" rather than editing an existing one. */
  template: BlockTemplate | null;
  onClose: () => void;
};

/** The block template editor — opened in the calendar page's center pane (app/calendar/
 * CalendarPage.tsx) by selecting a template from the left sidebar's Blocks card, or "+ New Block"
 * (create). Clicking one of its occurrences on the calendar grid instead opens
 * BlockOccurrenceDetailPane, for editing that one occurrence alone. Holds everything about the
 * template itself: title/description, its own occurrence shape (BlockOccurrenceEditor — saving
 * here always applies "from today onward," never touching already-generated or projected
 * occurrences before today), and its ordered checklist of nested task templates (each with its
 * own time estimate, skippability, and optional cadence override via RecurrencePicker) — all
 * saved together behind one Save.
 */
export function BlockDetailSidebar({ template, onClose }: BlockDetailSidebarProps) {
  const createTemplate = useCreateBlockTemplate();
  const updateTemplate = useUpdateBlockTemplate();
  const deleteTemplate = useDeleteBlockTemplate();
  const { data: workspaces } = useWorkspaces();

  const [title, setTitle] = useState(template?.title ?? "");
  const [description, setDescription] = useState(template?.description ?? "");
  const [workspaceId, setWorkspaceId] = useState(template?.workspaceId ?? "");
  const [shape, setShape] = useState<BlockShape | null>(template?.shape ?? null);
  const [tasks, setTasks] = useState<EditableTaskTemplate[]>(
    (template?.taskTemplates ?? []).map(toEditable),
  );
  const [draftTaskTitle, setDraftTaskTitle] = useState("");

  useEffect(() => {
    setTitle(template?.title ?? "");
    setDescription(template?.description ?? "");
    setWorkspaceId(template?.workspaceId ?? "");
    setShape(template?.shape ?? null);
    setTasks((template?.taskTemplates ?? []).map(toEditable));
  }, [template]);

  const isSaving = createTemplate.isPending || updateTemplate.isPending;
  const saveError = createTemplate.error ?? updateTemplate.error;
  const liveTaskTimeRange = computeLiveTaskTimeRange(tasks);

  function updateTask(key: string, changes: Partial<EditableTaskTemplate>) {
    setTasks((previous) =>
      previous.map((task) => (task.key === key ? { ...task, ...changes } : task)),
    );
  }

  function removeTask(key: string) {
    setTasks((previous) => previous.filter((task) => task.key !== key));
  }

  function addDraftTask() {
    const trimmedTitle = draftTaskTitle.trim();
    if (!trimmedTitle) return;
    setTasks((previous) => [
      ...previous,
      {
        key: newLocalKey(),
        title: trimmedTitle,
        isSkippable: true,
        estimatedMinutes: String(DEFAULT_ESTIMATED_MINUTES),
        cadence: null,
      },
    ]);
    setDraftTaskTitle("");
  }

  function handleSave() {
    const payload = {
      title,
      description,
      workspaceId,
      ...(shape ? { shape } : {}),
      taskTemplates: tasks.map((task) => ({
        title: task.title,
        isSkippable: task.isSkippable,
        estimatedMinutes: parseNonNegativeInt(task.estimatedMinutes),
        frequency: task.cadence?.frequency ?? null,
        interval: task.cadence?.interval,
        startDate: task.cadence?.startDate,
        endDate: task.cadence?.endDate,
        daysOfWeek: task.cadence?.daysOfWeek,
        dayOfMonth: task.cadence?.dayOfMonth,
        monthOfYear: task.cadence?.monthOfYear,
      })),
    };
    if (template) {
      updateTemplate.mutate({ templateId: template.id, changes: payload }, { onSuccess: onClose });
    } else {
      createTemplate.mutate(payload, { onSuccess: onClose });
    }
  }

  function handleDelete() {
    if (!template) return;
    deleteTemplate.mutate(template.id, { onSuccess: onClose });
  }

  return (
    <div className="cg-block-detail-sidebar">
      <Card>
        <Field label="Title">
          <TextInput value={title} onChange={(event) => setTitle(event.target.value)} autoFocus />
        </Field>
        {(workspaces?.length ?? 0) > 0 && (
          <Field label="Workspace">
            <Select
              value={workspaceId}
              onChange={setWorkspaceId}
              options={[
                { value: "", label: "No workspace" },
                ...(workspaces ?? []).map((workspace) => ({
                  value: workspace.id,
                  label: workspace.title,
                })),
              ]}
            />
          </Field>
        )}
        <Field label="Description">
          <TextArea
            rows={2}
            value={description}
            onChange={(event) => setDescription(event.target.value)}
          />
        </Field>
      </Card>

      <Card>
        <h3>Occurrence</h3>
        <BlockOccurrenceEditor
          value={shape}
          onChange={setShape}
          taskTimeRange={liveTaskTimeRange}
        />
      </Card>

      <Card>
        <h3>Tasks</h3>
        <p className="cg-block-detail-sidebar__task-time-range">
          Tasks: {liveTaskTimeRange.minMinutes}
          {liveTaskTimeRange.maxMinutes !== liveTaskTimeRange.minMinutes &&
            `–${liveTaskTimeRange.maxMinutes}`}{" "}
          min
        </p>
        <ul className="cg-block-detail-sidebar__tasks">
          {tasks.map((task) => (
            <li className="cg-block-detail-sidebar__task" key={task.key}>
              <div className="cg-block-detail-sidebar__task-main">
                <TextInput
                  value={task.title}
                  onChange={(event) => updateTask(task.key, { title: event.target.value })}
                  aria-label="Task title"
                />
                <TextInput
                  type="number"
                  min={0}
                  value={task.estimatedMinutes}
                  onChange={(event) =>
                    updateTask(task.key, { estimatedMinutes: event.target.value })
                  }
                  aria-label={`${task.title || "Task"} estimated minutes`}
                />
                <span className="cg-block-detail-sidebar__unit">min</span>
                <Button
                  iconOnly
                  variant="danger"
                  onClick={() => removeTask(task.key)}
                  aria-label={`Delete "${task.title}"`}
                >
                  <BasicIcon name="trash" label="Delete" />
                </Button>
              </div>
              <CheckboxField
                label="Skippable"
                checked={task.isSkippable}
                onToggle={() => updateTask(task.key, { isSkippable: !task.isSkippable })}
              />
              <div className="cg-block-detail-sidebar__cadence">
                <span className="cg-block-detail-sidebar__cadence-summary">
                  {describeTaskCadence(task.cadence)}
                </span>
                <RecurrencePicker
                  value={task.cadence}
                  onChange={(cadence) => updateTask(task.key, { cadence })}
                />
              </div>
            </li>
          ))}
        </ul>
        <div className="cg-block-detail-sidebar__add-task">
          <TextInput
            value={draftTaskTitle}
            onChange={(event) => setDraftTaskTitle(event.target.value)}
            onKeyDown={(event) => {
              if (event.key !== "Enter") return;
              event.preventDefault();
              addDraftTask();
            }}
            placeholder="New task title"
            aria-label="New task title"
          />
          <Button type="button" onClick={addDraftTask}>
            Add task <BasicIcon name="plus" label="Add" />
          </Button>
        </div>
      </Card>

      <div className="cg-block-detail-sidebar__actions">
        <Button onClick={handleSave} disabled={isSaving || !title.trim()}>
          Save
        </Button>
        {template && (
          <Button variant="danger" onClick={handleDelete}>
            Delete block <BasicIcon name="trash" label="Delete" />
          </Button>
        )}
      </div>
      {saveError && <p className="cg-block-detail-sidebar__error">{saveError.message}</p>}
    </div>
  );
}
