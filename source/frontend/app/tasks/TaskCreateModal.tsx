// @manualReviewRequested: 2026-07-06
import { ModalButton } from "../../core/design-system/components/ModalButton";
import { useProjects } from "../projects/useProjects";
import { TaskForm } from "./TaskForm";
import { useCreateTask } from "./useTasks";

type TaskCreateModalProps = {
  /** When given, the new task is created directly in this project, and the form locks the
   * project field rather than leaving it editable — used for "new task" inside a project's own
   * detail pane.
   */
  initialProjectId?: string;
  onCreated?: (taskId: string) => void;
  className?: string;
};

/** The standard "New task" trigger + modal. Reused by the top-level Tasks page and by a
 * project's detail pane so both surfaces create tasks through the exact same control.
 */
export function TaskCreateModal({ initialProjectId, onCreated, className }: TaskCreateModalProps) {
  const { data: projects } = useProjects();
  const createTask = useCreateTask();

  return (
    <ModalButton
      label="New task"
      icon={{ symbol: "➕", label: "New task" }}
      className={className}
      renderContent={(close) => (
        <TaskForm
          projects={projects ?? []}
          initialProjectId={initialProjectId}
          onCreate={(input) =>
            createTask.mutate(input, {
              onSuccess: (created) => {
                onCreated?.(created.id);
                close();
              },
            })
          }
        />
      )}
    />
  );
}
