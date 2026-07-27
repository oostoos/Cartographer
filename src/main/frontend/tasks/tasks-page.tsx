import { useCallback, useMemo } from "react";
import { Outlet, useMatch, useSearchParams } from "react-router-dom";

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

import { ProjectSidebar } from "../projects/project-sidebar";
import { useProjects } from "../projects/use-projects";
import { CompletedTasksSection } from "./completed-tasks-section";
import { computeDragOutcome } from "./compute-drag-outcome";
import { groupTasks } from "./group-tasks";
import { SortableTaskListItem } from "./sortable-task-list-item";
import { buildTaskFilterParam, filterTasksByProject, parseTaskFilter } from "./task-filter";
import { TaskCreateForm } from "./task-create-form";
import { TaskDetailEmptyState } from "./task-detail-empty-state";
import { TaskListItem } from "./task-list-item";
import type { ITasksOutletContext } from "./tasks-outlet-context";
import { useTasks } from "./use-tasks";

export function TasksPage() {
  const {
    tasks,
    isLoading,
    error,
    createTask,
    toggleTaskCompleted,
    applyTaskUpdate,
    reorderActiveTasks,
    assignTaskProject,
    unassignTasksFromProject,
  } = useTasks();
  const { projects, createProject, deleteProject } = useProjects();

  const [searchParams, setSearchParams] = useSearchParams();
  const filter = useMemo(() => parseTaskFilter(searchParams), [searchParams]);
  const filteredTasks = useMemo(() => filterTasksByProject(tasks, filter), [tasks, filter]);
  const grouped = useMemo(() => groupTasks(filteredTasks), [filteredTasks]);
  const projectsById = useMemo(() => new Map(projects.map((project) => [project.id, project])), [projects]);

  const taskIdMatch = useMatch("/tasks/:taskId");

  const activeTaskIds = useMemo(() => grouped.active.map((task) => task.id), [grouped.active]);
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const outcome = computeDragOutcome(activeTaskIds, event);
      if (!outcome) return;
      if (outcome.type === "reorder") reorderActiveTasks(outcome.taskIds);
      else assignTaskProject(outcome.taskId, outcome.projectId);
    },
    [activeTaskIds, reorderActiveTasks, assignTaskProject],
  );

  function handleSelectFilter(nextFilter: typeof filter) {
    const value = buildTaskFilterParam(nextFilter);
    setSearchParams(value ? { project: value } : {});
  }

  async function handleCreateTask(title: string, description: string) {
    const projectId = filter.type === "project" ? filter.projectId : null;
    await createTask(title, description, projectId);
  }

  async function handleDeleteProject(projectId: string) {
    const project = projectsById.get(projectId);
    if (!window.confirm(`Delete "${project?.name ?? "this project"}"? Its tasks will become unassigned.`)) {
      return;
    }
    await deleteProject(projectId);
    unassignTasksFromProject(projectId);
  }

  function getProjectName(projectId: string): string | null {
    return projectsById.get(projectId)?.name ?? null;
  }

  return (
    <div className="tasks-page">
      <h1>Tasks</h1>
      {isLoading && <p>Loading tasks…</p>}
      {error && <p role="alert">{error}</p>}
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <div className="tasks-layout">
          <div className="tasks-layout__sidebar-projects">
            <ProjectSidebar
              projects={projects}
              tasks={tasks}
              activeFilter={filter}
              onSelectFilter={handleSelectFilter}
              onCreateProject={createProject}
              onDeleteProject={handleDeleteProject}
            />
          </div>

          <div className="tasks-layout__list">
            <TaskCreateForm onCreate={handleCreateTask} />
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
                        projectName={task.project_id ? getProjectName(task.project_id) : null}
                        onRemoveProject={() => assignTaskProject(task.id, null)}
                      />
                    ))}
                  </SortableContext>
                  {grouped.completedToday.map((task) => (
                    <li key={task.id}>
                      <TaskListItem
                        task={task}
                        onToggleCompleted={(completed) => toggleTaskCompleted(task.id, completed)}
                        projectName={task.project_id ? getProjectName(task.project_id) : null}
                        onRemoveProject={() => assignTaskProject(task.id, null)}
                      />
                    </li>
                  ))}
                </ul>
                <CompletedTasksSection
                  tasks={grouped.completedPrior}
                  onToggleCompleted={toggleTaskCompleted}
                  getProjectName={getProjectName}
                  onRemoveProject={(taskId) => assignTaskProject(taskId, null)}
                />
              </>
            )}
          </div>

          <div className="tasks-layout__detail">
            {taskIdMatch ? (
              <Outlet context={{ tasks, onTaskUpdated: applyTaskUpdate } satisfies ITasksOutletContext} />
            ) : (
              <TaskDetailEmptyState />
            )}
          </div>
        </div>
      </DndContext>
    </div>
  );
}
