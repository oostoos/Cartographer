import { useCallback, useMemo } from "react";
import { Outlet, useMatch } from "react-router-dom";

import {
  DndContext,
  type DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from "@dnd-kit/sortable";

import "./tasks-page.css";

import { CompletedTasksSection } from "./completed-tasks-section";
import { computeReorderedTaskIds } from "./compute-reordered-task-ids";
import { groupTasks } from "./group-tasks";
import { SortableTaskListItem } from "./sortable-task-list-item";
import { TaskCreateForm } from "./task-create-form";
import { TaskListItem } from "./task-list-item";
import type { ITasksOutletContext } from "./tasks-outlet-context";
import { useTasks } from "./use-tasks";

export function TasksPage() {
  const { tasks, isLoading, error, createTask, toggleTaskCompleted, applyTaskUpdate, reorderActiveTasks } =
    useTasks();
  const grouped = useMemo(() => groupTasks(tasks), [tasks]);
  const isDetailOpen = Boolean(useMatch("/tasks/:taskId"));

  const activeTaskIds = useMemo(() => grouped.active.map((task) => task.id), [grouped.active]);
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const newOrder = computeReorderedTaskIds(activeTaskIds, event);
      if (newOrder) reorderActiveTasks(newOrder);
    },
    [activeTaskIds, reorderActiveTasks],
  );

  return (
    <div className="tasks-page">
      <h1>Tasks</h1>
      <TaskCreateForm onCreate={createTask} />
      {isLoading && <p>Loading tasks…</p>}
      {error && <p role="alert">{error}</p>}
      {!isLoading && !error && tasks.length === 0 && (
        <p>No tasks yet. Add one above to get started.</p>
      )}
      {!isLoading && tasks.length > 0 && (
        <div className={`tasks-layout${isDetailOpen ? " tasks-layout--detail-open" : ""}`}>
          <div className="tasks-layout__list">
            <ul className="task-list">
              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <SortableContext items={activeTaskIds} strategy={verticalListSortingStrategy}>
                  {grouped.active.map((task) => (
                    <SortableTaskListItem
                      key={task.id}
                      task={task}
                      onToggleCompleted={(completed) => toggleTaskCompleted(task.id, completed)}
                    />
                  ))}
                </SortableContext>
              </DndContext>
              {grouped.completedToday.map((task) => (
                <li key={task.id}>
                  <TaskListItem
                    task={task}
                    onToggleCompleted={(completed) => toggleTaskCompleted(task.id, completed)}
                  />
                </li>
              ))}
            </ul>
            <CompletedTasksSection
              tasks={grouped.completedPrior}
              onToggleCompleted={toggleTaskCompleted}
            />
          </div>
          <div className="tasks-layout__detail">
            <Outlet context={{ tasks, onTaskUpdated: applyTaskUpdate } satisfies ITasksOutletContext} />
          </div>
        </div>
      )}
    </div>
  );
}
