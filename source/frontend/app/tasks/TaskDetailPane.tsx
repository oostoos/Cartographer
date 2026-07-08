// @manualReviewRequested: 2026-07-06
import { useEffect, useState } from "react";

import { BasicIcon } from "../../core/design-system/components/BasicIcon";
import { Button } from "../../core/design-system/components/Button";
import { Card } from "../../core/design-system/components/Card";
import { CheckboxField } from "../../core/design-system/components/CheckboxField";
import { EmojiIcon } from "../../core/design-system/components/EmojiIcon";
import { Field } from "../../core/design-system/components/Field";
import { Select } from "../../core/design-system/components/Select";
import { SetSelection } from "../../core/design-system/components/SetSelection";
import { TextArea } from "../../core/design-system/components/TextArea";
import { TextInput } from "../../core/design-system/components/TextInput";
import { NotesSection } from "../journals/NotesSection";
import type { Project } from "../projects/projectApi";
import { SubtaskList } from "./SubtaskList";
import type { DurationBucket, Task } from "./taskApi";
import { useDeleteTask, useUpdateTask } from "./useTasks";
import "./TaskDetailPane.css";

const NO_PROJECT_VALUE = "";
const NO_DURATION_BUCKET_VALUE = "";

const DURATION_BUCKET_OPTIONS: { value: DurationBucket; label: string }[] = [
  { value: "under_5_min", label: "Under 5 min" },
  { value: "5_to_10_min", label: "5-10 min" },
  { value: "10_to_30_min", label: "10-30 min" },
  { value: "30_to_60_min", label: "30-60 min" },
  { value: "over_60_min", label: "1 hr+" },
];

const DURATION_BUCKET_SELECT_OPTIONS = [
  { value: NO_DURATION_BUCKET_VALUE, label: "No estimate" },
  ...DURATION_BUCKET_OPTIONS,
];

type TaskDetailPaneProps = {
  task: Task;
  projects: Project[];
  onDeleted: () => void;
};

/** Shows and edits one task: a large title with its subtasks nested beneath it, a small
 * description-plus-notes section, and a settings area (project, due date, schedule, archived)
 * ending in Save changes / Delete task. Recurrence is no longer a per-task concept — a task only
 * ever recurs by being nested inside a block template (see app/blocks/CLAUDE.md), and a
 * block-nested task never reaches this pane (it's hidden from the Tasks page entirely, like a
 * subtask).
 */
export function TaskDetailPane({ task, projects, onDeleted }: TaskDetailPaneProps) {
  const updateTask = useUpdateTask();
  const deleteTask = useDeleteTask();

  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description);
  const [projectId, setProjectId] = useState(task.projectId);
  const [dueDate, setDueDate] = useState(task.dueDate ?? "");
  const [scheduledAt, setScheduledAt] = useState(task.scheduledAt);
  const [isArchived, setIsArchived] = useState(task.isArchived);
  const [isSkippable, setIsSkippable] = useState(task.isSkippable);
  const [durationBucket, setDurationBucket] = useState(task.durationBucket);

  useEffect(() => {
    setTitle(task.title);
    setDescription(task.description);
    setProjectId(task.projectId);
    setDueDate(task.dueDate ?? "");
    setScheduledAt(task.scheduledAt);
    setIsArchived(task.isArchived);
    setIsSkippable(task.isSkippable);
    setDurationBucket(task.durationBucket);
  }, [task]);

  function handleSave() {
    updateTask.mutate({
      taskId: task.id,
      changes: {
        title,
        description,
        projectId,
        dueDate: dueDate || null,
        scheduledAt,
        isArchived,
        isSkippable,
        durationBucket,
      },
    });
  }

  function handleDelete() {
    deleteTask.mutate(task.id, { onSuccess: onDeleted });
  }

  return (
    <div className="cg-task-detail-pane">
      <Card>
        <TextInput
          className="cg-task-detail-pane__title"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          aria-label="Title"
        />
        <SubtaskList taskId={task.id} />
      </Card>

      <Card>
        <Field label="Description">
          <TextArea
            rows={3}
            value={description}
            onChange={(event) => setDescription(event.target.value)}
          />
        </Field>
        <NotesSection targetType="Task" targetId={task.id} />
      </Card>

      <Card>
        <h3>
          Settings <EmojiIcon symbol="⚙️" label="Settings" />
        </h3>
        <Field label="Project">
          <Select
            value={projectId}
            onChange={setProjectId}
            options={[
              { value: NO_PROJECT_VALUE, label: "No project" },
              ...projects.map((project) => ({ value: project.id, label: project.title })),
            ]}
          />
        </Field>
        <Field label="Due date">
          <TextInput
            type="date"
            value={dueDate}
            onChange={(event) => setDueDate(event.target.value)}
          />
        </Field>
        <Field label="Scheduled for">
          <TextInput
            type="datetime-local"
            value={scheduledAt}
            onChange={(event) => setScheduledAt(event.target.value)}
          />
        </Field>
        <Field label="Duration">
          <SetSelection
            value={durationBucket ?? NO_DURATION_BUCKET_VALUE}
            onChange={(value) =>
              setDurationBucket(
                value === NO_DURATION_BUCKET_VALUE ? null : (value as DurationBucket),
              )
            }
            options={DURATION_BUCKET_SELECT_OPTIONS}
          />
        </Field>
        <p className="cg-task-detail-pane__meta">
          Created {new Date(task.createdAt).toLocaleDateString()}
        </p>
        <CheckboxField
          label="Archived"
          title="Only hides this task from the Today page."
          checked={isArchived}
          onToggle={() => setIsArchived(!isArchived)}
        />
        <CheckboxField
          label="Skippable"
          checked={isSkippable}
          onToggle={() => setIsSkippable(!isSkippable)}
        />
        <div className="cg-task-detail-pane__actions">
          <Button type="button" onClick={handleSave}>
            Save changes
          </Button>
          <Button type="button" variant="danger" onClick={handleDelete}>
            Delete task <BasicIcon name="trash" label="Delete" />
          </Button>
        </div>
      </Card>
    </div>
  );
}
