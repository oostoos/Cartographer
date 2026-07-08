// @manualReviewRequested: 2026-07-06
import { BasicIcon } from "../../core/design-system/components/BasicIcon";
import { ModalButton } from "../../core/design-system/components/ModalButton";
import { useProjects } from "../projects/useProjects";
import { useWorkspaces } from "../workspaces/useWorkspaces";
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
  /** Forwarded to ModalButton so a caller (e.g. an Alt+Shift+N shortcut) can open this modal
   * externally instead of only via its own trigger button — omit to keep the default,
   * self-contained open/close state.
   */
  isOpen?: boolean;
  onOpenChange?: (isOpen: boolean) => void;
};

/** The standard "New task" trigger + modal. Reused by the top-level Tasks page and by a
 * project's detail pane so both surfaces create tasks through the exact same control.
 */
export function TaskCreateModal({
  initialProjectId,
  onCreated,
  className,
  isOpen,
  onOpenChange,
}: TaskCreateModalProps) {
  const { data: projects } = useProjects();
  const { data: workspaces } = useWorkspaces();
  const createTask = useCreateTask();

  return (
    <ModalButton
      label="New task"
      icon={<BasicIcon name="plus" label="New task" />}
      iconOnly
      className={className}
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      renderContent={(close) => (
        <TaskForm
          projects={projects ?? []}
          workspaces={workspaces ?? []}
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
