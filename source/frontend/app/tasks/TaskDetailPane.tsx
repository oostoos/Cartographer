import { useEffect, useState } from "react";

import { Button } from "../../core/design-system/components/Button";
import { Card } from "../../core/design-system/components/Card";
import { Checkbox } from "../../core/design-system/components/Checkbox";
import { EmojiIcon } from "../../core/design-system/components/EmojiIcon";
import { TextArea } from "../../core/design-system/components/TextArea";
import { TextInput } from "../../core/design-system/components/TextInput";
import { NotesSection } from "../journals/NotesSection";
import type { Project } from "../projects/projectApi";
import { RecurrenceSettings } from "./RecurrenceSettings";
import { SubtaskList } from "./SubtaskList";
import type { Task } from "./taskApi";
import { useDeleteTask, useUpdateTask } from "./useTasks";
import "./TaskDetailPane.css";

const NO_PROJECT_VALUE = "";

type TaskDetailPaneProps = {
  task: Task;
  projects: Project[];
  onDeleted: () => void;
};

/** Shows and edits one task: a large title with its subtasks nested beneath it, a small
 * description-plus-notes section, and a settings area (project, due date, schedule, recurrence,
 * archived) ending in Save changes / Delete task.
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

  useEffect(() => {
    setTitle(task.title);
    setDescription(task.description);
    setProjectId(task.projectId);
    setDueDate(task.dueDate ?? "");
    setScheduledAt(task.scheduledAt);
    setIsArchived(task.isArchived);
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
        <label className="cg-task-detail-pane__field">
          Description
          <TextArea
            rows={3}
            value={description}
            onChange={(event) => setDescription(event.target.value)}
          />
        </label>
        <NotesSection targetType="Task" targetId={task.id} />
      </Card>

      <Card>
        <h3>
          Settings <EmojiIcon symbol="⚙️" label="Settings" />
        </h3>
        <label className="cg-task-detail-pane__field">
          Project
          <select value={projectId} onChange={(event) => setProjectId(event.target.value)}>
            <option value={NO_PROJECT_VALUE}>No project</option>
            {projects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.title}
              </option>
            ))}
          </select>
        </label>
        <label className="cg-task-detail-pane__field">
          Due date
          <input type="date" value={dueDate} onChange={(event) => setDueDate(event.target.value)} />
        </label>
        <label className="cg-task-detail-pane__field">
          Scheduled for
          <input
            type="datetime-local"
            value={scheduledAt}
            onChange={(event) => setScheduledAt(event.target.value)}
          />
        </label>
        {task.recurringTemplateId && <RecurrenceSettings templateId={task.recurringTemplateId} />}
        <p className="cg-task-detail-pane__meta">
          {task.recurringTemplateId ? "Recurring" : "One-off"} · Created{" "}
          {new Date(task.createdAt).toLocaleDateString()}
        </p>
        <Checkbox
          checked={isArchived}
          onToggle={() => setIsArchived(!isArchived)}
          label="Archived"
        />
        <div className="cg-task-detail-pane__actions">
          <Button type="button" onClick={handleSave}>
            Save changes
          </Button>
          <Button type="button" variant="danger" onClick={handleDelete}>
            Delete task <EmojiIcon symbol="🗑️" label="Delete" />
          </Button>
        </div>
      </Card>
    </div>
  );
}
