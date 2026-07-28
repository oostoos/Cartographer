import { useEffect, useState } from "react";
import { useLocation, useNavigate, useOutletContext, useParams } from "react-router-dom";

import { Button } from "@lib-stack/design-language/button";
import { Card } from "@lib-stack/design-language/card";
import { IconButton } from "@lib-stack/design-language/icon-button";
import { CloseIcon } from "@lib-stack/design-language/icons";
import { NumberStepper } from "@lib-stack/design-language/number-stepper";
import { SegmentedScale } from "@lib-stack/design-language/segmented-scale";

import "./task-detail-panel.css";

import { formatTimeEstimateLabel } from "./format-time-estimate-label";
import { TASK_SCALE_MAXIMUM, TASK_TIME_ESTIMATE_STEP_MINUTES } from "./task-field-bounds";
import { TaskDueDateField } from "./task-due-date-field";
import {
  fetchTask,
  setTaskCompleted,
  setTaskDueDate,
  setTaskEnergyRequirement,
  setTaskImpact,
  setTaskTimeEstimateMinutes,
  updateTask,
} from "./tasks-api";
import type { ITasksOutletContext } from "./tasks-outlet-context";
import type { TTask } from "./types";

/** Detail panel for the selected task: the Tasks page's persistent right-hand column. */
export function TaskDetailPanel() {
  const { taskId } = useParams<{ taskId: string }>();
  const { tasks, onTaskUpdated, onTaskDeleted } = useOutletContext<ITasksOutletContext>();
  const navigate = useNavigate();
  const location = useLocation();

  const [task, setTask] = useState<TTask | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editEnergyRequirement, setEditEnergyRequirement] = useState<number | null>(null);
  const [editImpact, setEditImpact] = useState<number | null>(null);
  const [editDueDate, setEditDueDate] = useState<string | null>(null);
  const [editTimeEstimateMinutes, setEditTimeEstimateMinutes] = useState<number | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    setIsEditing(false);
  }, [taskId]);

  useEffect(() => {
    if (!taskId) {
      setError("No task id provided.");
      setIsLoading(false);
      return;
    }

    const contextTask = tasks.find((candidate) => candidate.id === taskId);
    if (contextTask) {
      // Already loaded by the list — reuse it instead of an extra fetch. Only resync the edit
      // draft when not actively editing, so an in-progress edit isn't clobbered by an unrelated
      // list update (e.g. toggling a different task).
      setTask(contextTask);
      if (!isEditing) {
        setEditTitle(contextTask.title);
        setEditDescription(contextTask.description);
        setEditEnergyRequirement(contextTask.energy_requirement);
        setEditImpact(contextTask.impact);
        setEditDueDate(contextTask.due_date);
        setEditTimeEstimateMinutes(contextTask.time_estimate_minutes);
      }
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
        setEditEnergyRequirement(loaded.energy_requirement);
        setEditImpact(loaded.impact);
        setEditDueDate(loaded.due_date);
        setEditTimeEstimateMinutes(loaded.time_estimate_minutes);
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
  }, [taskId, tasks]);

  async function handleToggleCompleted(completed: boolean) {
    if (!task) return;
    const updated = await setTaskCompleted(task.id, completed);
    setTask(updated);
    onTaskUpdated(updated);
  }

  async function handleSave() {
    if (!task) return;
    const trimmedTitle = editTitle.trim();
    if (!trimmedTitle) return;

    setIsSaving(true);
    try {
      // Fired sequentially, not via Promise.all: each call is a full read-modify-write of the
      // whole task record, so concurrent PATCH calls for the same task risk one clobbering
      // another's change if their reads interleave. Awaiting each guarantees the next one's
      // read sees the prior write.
      let updated = await updateTask(task.id, {
        title: trimmedTitle,
        description: editDescription.trim(),
      });
      if (editEnergyRequirement !== task.energy_requirement) {
        updated = await setTaskEnergyRequirement(task.id, editEnergyRequirement);
      }
      if (editImpact !== task.impact) {
        updated = await setTaskImpact(task.id, editImpact);
      }
      if (editDueDate !== task.due_date) {
        updated = await setTaskDueDate(task.id, editDueDate);
      }
      if (editTimeEstimateMinutes !== task.time_estimate_minutes) {
        updated = await setTaskTimeEstimateMinutes(task.id, editTimeEstimateMinutes);
      }
      setTask(updated);
      onTaskUpdated(updated);
      setIsEditing(false);
    } finally {
      setIsSaving(false);
    }
  }

  function handleCancelEdit() {
    if (!task) return;
    setEditTitle(task.title);
    setEditDescription(task.description);
    setEditEnergyRequirement(task.energy_requirement);
    setEditImpact(task.impact);
    setEditDueDate(task.due_date);
    setEditTimeEstimateMinutes(task.time_estimate_minutes);
    setIsEditing(false);
  }

  async function handleDelete() {
    if (!task) return;

    setIsDeleting(true);
    try {
      await onTaskDeleted(task.id);
      navigate(`/tasks${location.search}`);
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <Card>
      <div className="task-detail-panel">
        {isLoading && <p>Loading task…</p>}
        {!isLoading && (error || !task) && <p role="alert">{error ?? "Task not found."}</p>}

        {!isLoading && task && (
          <>
            <input
              type="checkbox"
              checked={task.completed}
              onChange={(event) => handleToggleCompleted(event.target.checked)}
              aria-label={`Mark "${task.title}" as ${task.completed ? "not completed" : "completed"}`}
            />

            {isEditing ? (
              <div className="task-detail-edit">
                <input
                  type="text"
                  value={editTitle}
                  onChange={(event) => setEditTitle(event.target.value)}
                  aria-label="Task title"
                />
                <textarea
                  value={editDescription}
                  onChange={(event) => setEditDescription(event.target.value)}
                  aria-label="Task description"
                />
                <div className="task-detail-field">
                  <span className="task-detail-field__label">Energy requirement</span>
                  <SegmentedScale
                    segmentCount={TASK_SCALE_MAXIMUM}
                    value={editEnergyRequirement}
                    onChange={setEditEnergyRequirement}
                    aria-label="Energy requirement"
                  />
                  {editEnergyRequirement !== null && (
                    <IconButton
                      aria-label="Clear energy requirement"
                      onClick={() => setEditEnergyRequirement(null)}
                    >
                      <CloseIcon />
                    </IconButton>
                  )}
                </div>
                <div className="task-detail-field">
                  <span className="task-detail-field__label">Impact</span>
                  <SegmentedScale
                    segmentCount={TASK_SCALE_MAXIMUM}
                    value={editImpact}
                    onChange={setEditImpact}
                    aria-label="Impact"
                  />
                  {editImpact !== null && (
                    <IconButton aria-label="Clear impact" onClick={() => setEditImpact(null)}>
                      <CloseIcon />
                    </IconButton>
                  )}
                </div>
                <div className="task-detail-field">
                  <span className="task-detail-field__label">Due date</span>
                  <TaskDueDateField value={editDueDate} onChange={setEditDueDate} aria-label="Due date" />
                </div>
                <div className="task-detail-field">
                  <span className="task-detail-field__label">Time estimate</span>
                  <NumberStepper
                    value={editTimeEstimateMinutes}
                    step={TASK_TIME_ESTIMATE_STEP_MINUTES}
                    onChange={setEditTimeEstimateMinutes}
                    formatValue={formatTimeEstimateLabel}
                    aria-label="Time estimate"
                  />
                </div>
                <div className="task-detail-actions">
                  <Button onClick={handleSave} disabled={isSaving || !editTitle.trim()}>
                    Save
                  </Button>
                  <Button variant="secondary" onClick={handleCancelEdit} disabled={isSaving}>
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <div className="task-detail-view">
                <h2>{task.title}</h2>
                <p>{task.description || "No description"}</p>
                <div className="task-detail-actions">
                  <Button variant="secondary" onClick={() => setIsEditing(true)}>
                    Edit
                  </Button>
                  <Button variant="danger" onClick={handleDelete} disabled={isDeleting}>
                    Delete
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </Card>
  );
}
