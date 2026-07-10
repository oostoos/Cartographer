// @manualReviewRequested: 2026-07-07
import { useMemo } from "react";

import { CollapsibleCard } from "../../core/design-system/components/CollapsibleCard";
import { TaskCreateModal } from "../tasks/TaskCreateModal";
import { TaskList } from "../tasks/TaskList";
import type { Task } from "../tasks/taskApi";
import { useCreateTask } from "../tasks/useTasks";

/** An ad-hoc top-level task is the only kind this card lists — block-nested tasks show under
 * their block in the Blocks card sidebar instead, and subtasks show nested under their parent
 * task's own detail pane, matching TaskListPage's identical filtering (see app/tasks/CLAUDE.md).
 */
function isAdHocTask(task: Task): boolean {
  return task.blockId === "" && task.projectId === "" && task.parentTaskId === "";
}

type TasksCardProps = {
  tasks: Task[];
  isLoading: boolean;
  selectedTaskId: string | null;
  onSelectTask: (taskId: string) => void;
};

/** The calendar page's left-sidebar Tasks section: every ad-hoc task, active ones quick-addable
 * inline, completed ones tucked into a collapsed group. Selecting one opens TaskDetailPane in the
 * center pane — see app/calendar/CalendarPage.tsx.
 */
export function TasksCard({ tasks, isLoading, selectedTaskId, onSelectTask }: TasksCardProps) {
  const createTask = useCreateTask();

  const adHocTasks = useMemo(() => tasks.filter(isAdHocTask), [tasks]);

  return (
    <CollapsibleCard
      title="Tasks"
      icon={{ symbol: "✅", label: "Tasks" }}
      headerActions={<TaskCreateModal onCreated={onSelectTask} />}
    >
      <TaskList
        tasks={adHocTasks}
        isLoading={isLoading}
        selectedTaskId={selectedTaskId}
        onSelectTask={onSelectTask}
        capabilities={{ allowDelete: false }}
        newItemLine={{
          placeholder: "Enter a task…",
          ariaLabel: "New ad-hoc task title",
          onCreateItem: (title) => createTask.mutate({ title }),
        }}
        completedGroup
      />
    </CollapsibleCard>
  );
}
