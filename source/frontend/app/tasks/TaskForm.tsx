import { type FormEvent, useState } from "react";

import { Button } from "../../core/design-system/components/Button";
import { EmojiIcon } from "../../core/design-system/components/EmojiIcon";
import { TextInput } from "../../core/design-system/components/TextInput";
import { RecurrencePicker } from "./RecurrencePicker";
import type { CreateRecurringTaskTemplateInput } from "./recurrenceApi";
import type { CreateTaskInput } from "./taskApi";
import { useCreateRecurringTaskTemplate } from "./useRecurringTaskTemplates";
import "./TaskForm.css";

type ProjectOption = {
  id: string;
  title: string;
};

type TaskFormProps = {
  projects: ProjectOption[];
  /** When given, the task is created directly in this project and the project field is hidden
   * rather than left editable — used when creating a task from within a project's own detail
   * pane.
   */
  initialProjectId?: string;
  onCreate: (input: CreateTaskInput) => void;
};

const NO_PROJECT_VALUE = "";

/** The form for adding a new task, including its optional project and recurrence. */
export function TaskForm({ projects, initialProjectId, onCreate }: TaskFormProps) {
  const isProjectLocked = initialProjectId !== undefined;
  const [title, setTitle] = useState("");
  const [projectId, setProjectId] = useState(initialProjectId ?? NO_PROJECT_VALUE);
  const [recurrence, setRecurrence] = useState<CreateRecurringTaskTemplateInput | null>(null);
  const createRecurringTaskTemplate = useCreateRecurringTaskTemplate();

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!title.trim()) return;

    const recurringTemplateId = recurrence
      ? (await createRecurringTaskTemplate.mutateAsync({ ...recurrence, title, projectId })).id
      : "";
    onCreate({ title, projectId, recurringTemplateId });

    setTitle("");
    setProjectId(initialProjectId ?? NO_PROJECT_VALUE);
    setRecurrence(null);
  }

  return (
    <form className="cg-task-form" onSubmit={handleSubmit}>
      <label className="cg-task-form__field">
        Title
        <TextInput value={title} onChange={(event) => setTitle(event.target.value)} autoFocus />
      </label>

      {!isProjectLocked && projects.length > 0 && (
        <label className="cg-task-form__field">
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
      )}

      <RecurrencePicker value={recurrence} onChange={setRecurrence} />

      <Button type="submit">
        Add task <EmojiIcon symbol="➕" label="Add" />
      </Button>
    </form>
  );
}
