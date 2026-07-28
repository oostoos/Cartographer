import { useEffect, useState } from "react";
import { useOutletContext, useParams } from "react-router-dom";

import { Card } from "@lib-stack/design-language/card";

import "./task-detail-panel.css";

import { TaskDueDateField } from "./task-due-date-field";
import { TaskScalePill } from "./task-scale-pill";
import { TaskTimeEstimatePill } from "./task-time-estimate-pill";
import {
  fetchTask,
  setTaskDueDate,
  setTaskEnergyRequirement,
  setTaskImpact,
  setTaskTimeEstimateMinutes,
  updateTask,
} from "./tasks-api";
import type { ITasksOutletContext } from "./tasks-outlet-context";
import type { TTask } from "./types";

/** Detail panel for the selected task: the Tasks page's persistent right-hand column.
 * Every field here is always editable and commits immediately — title/description save on
 * blur, everything else saves on interaction. There's no separate edit mode. */
export function TaskDetailPanel() {
  const { taskId } = useParams<{ taskId: string }>();
  const { tasks, onTaskUpdated } = useOutletContext<ITasksOutletContext>();

  const [task, setTask] = useState<TTask | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [isTitleFocused, setIsTitleFocused] = useState(false);
  const [isDescriptionFocused, setIsDescriptionFocused] = useState(false);

  useEffect(() => {
    if (!taskId) {
      setError("No task id provided.");
      setIsLoading(false);
      return;
    }

    const contextTask = tasks.find((candidate) => candidate.id === taskId);
    if (contextTask) {
      // Already loaded by the list — reuse it instead of an extra fetch. Only resync a text
      // draft when its field isn't focused, so an in-progress keystroke isn't clobbered by an
      // unrelated list update (e.g. toggling a different task, or this task's own immediate
      // commit of a different field).
      setTask(contextTask);
      if (!isTitleFocused) setEditTitle(contextTask.title);
      if (!isDescriptionFocused) setEditDescription(contextTask.description);
      setIsLoading(false);
      setError(null);
      return;
    }

    let isCancelled = false;

    async function loadTask() {
      setIsLoading(true);
      setError(null);
      try {
        const loaded = await fetchTask(taskId as string);
        if (isCancelled) return;
        setTask(loaded);
        setEditTitle(loaded.title);
        setEditDescription(loaded.description);
      } catch {
        if (!isCancelled) setError("Task not found.");
      } finally {
        if (!isCancelled) setIsLoading(false);
      }
    }

    loadTask();
    return () => {
      isCancelled = true;
    };
  }, [taskId, tasks, isTitleFocused, isDescriptionFocused]);

  async function handleTitleBlur() {
    setIsTitleFocused(false);
    if (!task) return;
    const trimmedTitle = editTitle.trim();
    if (!trimmedTitle) {
      setEditTitle(task.title);
      return;
    }
    if (trimmedTitle === task.title) return;
    const updated = await updateTask(task.id, { title: trimmedTitle });
    setTask(updated);
    setEditTitle(updated.title);
    onTaskUpdated(updated);
  }

  async function handleDescriptionBlur() {
    setIsDescriptionFocused(false);
    if (!task) return;
    const trimmedDescription = editDescription.trim();
    if (trimmedDescription === task.description) return;
    const updated = await updateTask(task.id, { description: trimmedDescription });
    setTask(updated);
    setEditDescription(updated.description);
    onTaskUpdated(updated);
  }

  async function handleSetEnergyRequirement(value: number | null) {
    if (!task) return;
    const updated = await setTaskEnergyRequirement(task.id, value);
    setTask(updated);
    onTaskUpdated(updated);
  }

  async function handleSetImpact(value: number | null) {
    if (!task) return;
    const updated = await setTaskImpact(task.id, value);
    setTask(updated);
    onTaskUpdated(updated);
  }

  async function handleSetDueDate(value: string | null) {
    if (!task) return;
    const updated = await setTaskDueDate(task.id, value);
    setTask(updated);
    onTaskUpdated(updated);
  }

  async function handleSetTimeEstimateMinutes(value: number | null) {
    if (!task) return;
    const updated = await setTaskTimeEstimateMinutes(task.id, value);
    setTask(updated);
    onTaskUpdated(updated);
  }

  return (
    <Card>
      <div className="task-detail-panel">
        {isLoading && <p>Loading task…</p>}
        {!isLoading && (error || !task) && <p role="alert">{error ?? "Task not found."}</p>}

        {!isLoading && task && (
          <div className="task-detail-form">
            <input
              type="text"
              className="task-detail-title-input"
              value={editTitle}
              onChange={(event) => setEditTitle(event.target.value)}
              onFocus={() => setIsTitleFocused(true)}
              onBlur={handleTitleBlur}
              aria-label="Edit task title"
            />
            <textarea
              value={editDescription}
              onChange={(event) => setEditDescription(event.target.value)}
              onFocus={() => setIsDescriptionFocused(true)}
              onBlur={handleDescriptionBlur}
              aria-label="Edit task description"
            />
            <div className="task-detail-field">
              <TaskScalePill
                label="Energy requirement"
                value={task.energy_requirement}
                onChange={handleSetEnergyRequirement}
              />
            </div>
            <div className="task-detail-field">
              <TaskScalePill label="Impact" value={task.impact} onChange={handleSetImpact} />
            </div>
            <div className="task-detail-field">
              <span className="task-detail-field__label">Due date</span>
              <TaskDueDateField value={task.due_date} onChange={handleSetDueDate} aria-label="Due date" />
            </div>
            <div className="task-detail-field">
              <span className="task-detail-field__label">Time estimate</span>
              <TaskTimeEstimatePill
                value={task.time_estimate_minutes}
                onChange={handleSetTimeEstimateMinutes}
              />
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
