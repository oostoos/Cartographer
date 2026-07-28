import { useCallback } from "react";

import { useAsyncResource } from "@lib-stack/hooks/use-async-resource";

import {
  createTask as createTaskRequest,
  deleteTask as deleteTaskRequest,
  fetchTasks,
  reorderTasks as reorderTasksRequest,
  setTaskCompleted as setTaskCompletedRequest,
  setTaskDueDate as setTaskDueDateRequest,
  setTaskEnergyRequirement as setTaskEnergyRequirementRequest,
  setTaskGroup as setTaskGroupRequest,
  setTaskImpact as setTaskImpactRequest,
  setTaskTimeEstimateMinutes as setTaskTimeEstimateMinutesRequest,
} from "./tasks-api";
import type { TTask } from "./types";

export interface IUseTasksResult {
  tasks: TTask[];
  isLoading: boolean;
  error: string | null;
  createTask: (title: string, description: string, groupId?: string | null) => Promise<void>;
  toggleTaskCompleted: (taskId: string, completed: boolean) => Promise<void>;
  applyTaskUpdate: (updated: TTask) => void;
  reorderActiveTasks: (orderedActiveTaskIds: string[]) => Promise<void>;
  assignTaskGroup: (taskId: string, groupId: string | null) => Promise<void>;
  unassignTasksFromGroup: (groupId: string) => void;
  setTaskEnergyRequirement: (taskId: string, energyRequirement: number | null) => Promise<void>;
  setTaskImpact: (taskId: string, impact: number | null) => Promise<void>;
  setTaskDueDate: (taskId: string, dueDate: string | null) => Promise<void>;
  setTaskTimeEstimateMinutes: (taskId: string, timeEstimateMinutes: number | null) => Promise<void>;
  deleteTask: (taskId: string) => Promise<void>;
}

/** Loads the task list on mount and exposes create/toggle actions that keep it in sync. */
export function useTasks(): IUseTasksResult {
  const {
    value: tasks,
    setValue: setTasks,
    isLoading,
    error,
  } = useAsyncResource<TTask[]>(fetchTasks, [], "Failed to load tasks.");

  const createTask = useCallback(
    async (title: string, description: string, groupId: string | null = null) => {
      const task = await createTaskRequest({ title, description, group_id: groupId });
      setTasks((current) => [...current, task]);
    },
    [setTasks],
  );

  const applyTaskUpdate = useCallback(
    (updated: TTask) => {
      setTasks((current) => current.map((task) => (task.id === updated.id ? updated : task)));
    },
    [setTasks],
  );

  const toggleTaskCompleted = useCallback(
    async (taskId: string, completed: boolean) => {
      const updated = await setTaskCompletedRequest(taskId, completed);
      applyTaskUpdate(updated);
    },
    [applyTaskUpdate],
  );

  const reorderActiveTasks = useCallback(
    async (orderedActiveTaskIds: string[]) => {
      setTasks((current) => _applyActiveTaskOrder(current, orderedActiveTaskIds));
      const updated = await reorderTasksRequest(orderedActiveTaskIds);
      setTasks(updated);
    },
    [setTasks],
  );

  const assignTaskGroup = useCallback(
    async (taskId: string, groupId: string | null) => {
      const updated = await setTaskGroupRequest(taskId, groupId);
      applyTaskUpdate(updated);
    },
    [applyTaskUpdate],
  );

  const unassignTasksFromGroup = useCallback(
    (groupId: string) => {
      setTasks((current) =>
        current.map((task) => (task.group_id === groupId ? { ...task, group_id: null } : task)),
      );
    },
    [setTasks],
  );

  const setTaskEnergyRequirement = useCallback(
    async (taskId: string, energyRequirement: number | null) => {
      const updated = await setTaskEnergyRequirementRequest(taskId, energyRequirement);
      applyTaskUpdate(updated);
    },
    [applyTaskUpdate],
  );

  const setTaskImpact = useCallback(
    async (taskId: string, impact: number | null) => {
      const updated = await setTaskImpactRequest(taskId, impact);
      applyTaskUpdate(updated);
    },
    [applyTaskUpdate],
  );

  const setTaskDueDate = useCallback(
    async (taskId: string, dueDate: string | null) => {
      const updated = await setTaskDueDateRequest(taskId, dueDate);
      applyTaskUpdate(updated);
    },
    [applyTaskUpdate],
  );

  const setTaskTimeEstimateMinutes = useCallback(
    async (taskId: string, timeEstimateMinutes: number | null) => {
      const updated = await setTaskTimeEstimateMinutesRequest(taskId, timeEstimateMinutes);
      applyTaskUpdate(updated);
    },
    [applyTaskUpdate],
  );

  const deleteTask = useCallback(
    async (taskId: string) => {
      await deleteTaskRequest(taskId);
      setTasks((current) => current.filter((task) => task.id !== taskId));
    },
    [setTasks],
  );

  return {
    tasks,
    isLoading,
    error,
    createTask,
    toggleTaskCompleted,
    applyTaskUpdate,
    reorderActiveTasks,
    assignTaskGroup,
    unassignTasksFromGroup,
    setTaskEnergyRequirement,
    setTaskImpact,
    setTaskDueDate,
    setTaskTimeEstimateMinutes,
    deleteTask,
  };
}

/** Reorders `tasks` so the (still-active) tasks in `orderedActiveTaskIds` come first, in that
 * sequence, followed by the completed tasks unchanged. Used to reflect a drag-reorder locally
 * before the backend confirms it. Unknown ids are dropped. */
function _applyActiveTaskOrder(tasks: TTask[], orderedActiveTaskIds: string[]): TTask[] {
  const tasksById = new Map(tasks.map((task) => [task.id, task]));
  const reorderedActive = orderedActiveTaskIds
    .map((id) => tasksById.get(id))
    .filter((task): task is TTask => task !== undefined);
  const completed = tasks.filter((task) => task.completed);
  return [...reorderedActive, ...completed];
}
