import { useCallback, useMemo } from "react";
import { Outlet, useMatch, useSearchParams } from "react-router-dom";

import {
  DndContext,
  type CollisionDetection,
  type DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  pointerWithin,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from "@dnd-kit/sortable";

import "./tasks-page.css";

import { GroupSidebar } from "../groups/group-sidebar";
import { useGroups } from "../groups/use-groups";
import { CompletedTasksSection } from "./completed-tasks-section";
import { computeDragOutcome } from "./compute-drag-outcome";
import { groupTasks } from "./group-tasks";
import { SortableTaskListItem } from "./sortable-task-list-item";
import { buildTaskFilterParam, filterTasksByGroup, parseTaskFilter } from "./task-filter";
import { TaskCreateForm } from "./task-create-form";
import { TaskDetailEmptyState } from "./task-detail-empty-state";
import { TaskListItem } from "./task-list-item";
import type { ITasksOutletContext } from "./tasks-outlet-context";
import type { TTask } from "./types";
import { useTasks } from "./use-tasks";

/** Prefers whatever droppable the pointer is literally over (so a small, distant drop target
 * like a group card registers reliably), falling back to nearest-center for in-list reordering
 * when the pointer isn't precisely over any droppable. */
const resolveDragCollisions: CollisionDetection = (args) => {
  const pointerCollisions = pointerWithin(args);
  return pointerCollisions.length > 0 ? pointerCollisions : closestCenter(args);
};

export function TasksPage() {
  const {
    tasks,
    isLoading,
    error,
    createTask,
    toggleTaskCompleted,
    applyTaskUpdate,
    reorderActiveTasks,
    assignTaskGroup,
    unassignTasksFromGroup,
    deleteTask,
  } = useTasks();
  const { groups, createGroup, renameGroup, reorderGroups, deleteGroup } = useGroups();

  const [searchParams, setSearchParams] = useSearchParams();
  const filter = useMemo(() => parseTaskFilter(searchParams), [searchParams]);
  const filteredTasks = useMemo(() => filterTasksByGroup(tasks, filter), [tasks, filter]);
  const grouped = useMemo(() => groupTasks(filteredTasks), [filteredTasks]);
  const groupsById = useMemo(() => new Map(groups.map((group) => [group.id, group])), [groups]);

  const taskIdMatch = useMatch("/tasks/:taskId");

  const activeTaskIds = useMemo(() => grouped.active.map((task) => task.id), [grouped.active]);
  const activeGroupIds = useMemo(() => groups.map((group) => group.id), [groups]);
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const outcome = computeDragOutcome(activeTaskIds, activeGroupIds, event);
      if (!outcome) return;
      if (outcome.type === "reorder-tasks") reorderActiveTasks(outcome.taskIds);
      else if (outcome.type === "reorder-groups") reorderGroups(outcome.groupIds);
      else assignTaskGroup(outcome.taskId, outcome.groupId);
    },
    [activeTaskIds, activeGroupIds, reorderActiveTasks, reorderGroups, assignTaskGroup],
  );

  function handleSelectFilter(nextFilter: typeof filter) {
    const value = buildTaskFilterParam(nextFilter);
    setSearchParams(value ? { group: value } : {});
  }

  async function handleCreateTask(title: string, description: string) {
    const groupId = filter.type === "group" ? filter.groupId : null;
    await createTask(title, description, groupId);
  }

  async function handleDeleteGroup(groupId: string) {
    const group = groupsById.get(groupId);
    if (!window.confirm(`Delete "${group?.name ?? "this group"}"? Its tasks will become unassigned.`)) {
      return;
    }
    await deleteGroup(groupId);
    unassignTasksFromGroup(groupId);
  }

  function getGroupName(groupId: string): string | null {
    return groupsById.get(groupId)?.name ?? null;
  }

  async function handleDeleteTask(task: TTask) {
    await deleteTask(task.id);
  }

  return (
    <div className="tasks-page">
      <h1>Tasks</h1>
      {isLoading && <p>Loading tasks…</p>}
      {error && <p role="alert">{error}</p>}
      <DndContext sensors={sensors} collisionDetection={resolveDragCollisions} onDragEnd={handleDragEnd}>
        <div className="tasks-layout">
          <div className="tasks-layout__sidebar-groups">
            <GroupSidebar
              groups={groups}
              tasks={tasks}
              activeFilter={filter}
              onSelectFilter={handleSelectFilter}
              onCreateGroup={createGroup}
              onRenameGroup={renameGroup}
              onDeleteGroup={handleDeleteGroup}
            />
          </div>

          <div className="tasks-layout__list">
            <div className="tasks-layout__list-header">
              <TaskCreateForm onCreate={handleCreateTask} />
            </div>
            <div className="tasks-layout__list-body">
              {!isLoading && !error && filteredTasks.length === 0 && (
                <p>No tasks yet. Add one above to get started.</p>
              )}
              {!isLoading && filteredTasks.length > 0 && (
                <>
                  <ul className="task-list">
                    <SortableContext items={activeTaskIds} strategy={verticalListSortingStrategy}>
                      {grouped.active.map((task) => (
                        <SortableTaskListItem
                          key={task.id}
                          task={task}
                          onToggleCompleted={(completed) => toggleTaskCompleted(task.id, completed)}
                          groupName={task.group_id ? getGroupName(task.group_id) : null}
                          onRemoveGroup={() => assignTaskGroup(task.id, null)}
                          onDelete={() => handleDeleteTask(task)}
                        />
                      ))}
                    </SortableContext>
                    {grouped.completedToday.map((task) => (
                      <li key={task.id}>
                        <TaskListItem
                          task={task}
                          onToggleCompleted={(completed) => toggleTaskCompleted(task.id, completed)}
                          groupName={task.group_id ? getGroupName(task.group_id) : null}
                          onRemoveGroup={() => assignTaskGroup(task.id, null)}
                          onDelete={() => handleDeleteTask(task)}
                        />
                      </li>
                    ))}
                  </ul>
                  <CompletedTasksSection
                    tasks={grouped.completedPrior}
                    onToggleCompleted={toggleTaskCompleted}
                    getGroupName={getGroupName}
                    onRemoveGroup={(taskId) => assignTaskGroup(taskId, null)}
                    onDelete={(taskId) => {
                      const task = grouped.completedPrior.find((candidate) => candidate.id === taskId);
                      if (task) handleDeleteTask(task);
                    }}
                  />
                </>
              )}
            </div>
          </div>

          <div className="tasks-layout__detail">
            {taskIdMatch ? (
              <Outlet
                context={{ tasks, onTaskUpdated: applyTaskUpdate, onTaskDeleted: deleteTask } satisfies ITasksOutletContext}
              />
            ) : (
              <TaskDetailEmptyState />
            )}
          </div>
        </div>
      </DndContext>
    </div>
  );
}
