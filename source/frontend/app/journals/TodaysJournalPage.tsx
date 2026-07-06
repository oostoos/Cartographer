// @manualReviewRequested: 2026-07-06
import { Card } from "../../core/design-system/components/Card";
import { EmojiIcon } from "../../core/design-system/components/EmojiIcon";
import { TaskCreateModal } from "../tasks/TaskCreateModal";
import { TaskRow } from "../tasks/TaskRow";
import type { Task } from "../tasks/taskApi";
import { useUpdateTask } from "../tasks/useTasks";
import { JournalingCard } from "./JournalingCard";
import { useInvalidateTodaysView, useTodaysView } from "./useTodaysView";
import "./TodaysJournalPage.css";

type TaskSectionProps = {
  title: string;
  tasks: Task[];
  emptyMessage: string;
  onToggleComplete: (taskId: string, isComplete: boolean) => void;
};

function TaskSection({ title, tasks, emptyMessage, onToggleComplete }: TaskSectionProps) {
  return (
    <Card>
      <h2>{title}</h2>
      {tasks.length === 0 ? (
        <p>{emptyMessage}</p>
      ) : (
        tasks.map((task) => (
          <TaskRow
            key={task.id}
            task={task}
            onToggleComplete={(isComplete) => onToggleComplete(task.id, isComplete)}
          />
        ))
      )}
    </Card>
  );
}

/** The screen the app opens to: a journaling card front and center, then today's recurring
 * tasks, ad-hoc tasks due or overdue, and backburner tasks with no due date.
 */
export function TodaysJournalPage() {
  const { data: view, isLoading, isError } = useTodaysView();
  const updateTask = useUpdateTask();
  const invalidateTodaysView = useInvalidateTodaysView();

  if (isLoading) return <p>Loading today…</p>;
  if (isError || !view) return <p>Couldn't load today.</p>;

  function toggleComplete(taskId: string, isComplete: boolean) {
    updateTask.mutate({ taskId, changes: { isComplete } }, { onSuccess: invalidateTodaysView });
  }

  return (
    <div className="cg-todays-journal-page">
      <div className="cg-todays-journal-page__header">
        <h1>
          Today <EmojiIcon symbol="🗓️" label="Today" /> {view.date}
        </h1>
        <TaskCreateModal onCreated={invalidateTodaysView} />
      </div>

      <JournalingCard />

      <TaskSection
        title="Recurring today"
        tasks={view.recurringTasks}
        emptyMessage="No recurring tasks today."
        onToggleComplete={toggleComplete}
      />
      <TaskSection
        title="Due & overdue"
        tasks={view.dueTasks}
        emptyMessage="Nothing due."
        onToggleComplete={toggleComplete}
      />
      <TaskSection
        title="Backburner"
        tasks={view.backburnerTasks}
        emptyMessage="Backburner is empty."
        onToggleComplete={toggleComplete}
      />

      {updateTask.isError && (
        <p className="cg-todays-journal-page__error">{updateTask.error.message}</p>
      )}
    </div>
  );
}
