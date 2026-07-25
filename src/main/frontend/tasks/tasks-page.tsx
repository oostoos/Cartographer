import { TaskCreateForm } from "./task-create-form";
import { TaskListItem } from "./task-list-item";
import { useTasks } from "./use-tasks";

export function TasksPage() {
  const { tasks, isLoading, error, createTask, toggleTaskCompleted } = useTasks();

  return (
    <main>
      <h1>Tasks</h1>
      <TaskCreateForm onCreate={createTask} />
      {isLoading && <p>Loading tasks…</p>}
      {error && <p role="alert">{error}</p>}
      {!isLoading && !error && tasks.length === 0 && (
        <p>No tasks yet. Add one above to get started.</p>
      )}
      {!isLoading && tasks.length > 0 && (
        <ul className="task-list">
          {tasks.map((task) => (
            <li key={task.id}>
              <TaskListItem
                task={task}
                onToggleCompleted={(completed) => toggleTaskCompleted(task.id, completed)}
              />
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
