import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

import { Button } from "@common/design-language/button";

import "./task-detail-page.css";

import { fetchTask, setTaskCompleted, updateTask } from "./tasks-api";
import type { TTask } from "./types";

export function TaskDetailPage() {
  const { taskId } = useParams<{ taskId: string }>();

  const [task, setTask] = useState<TTask | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!taskId) {
      setError("No task id provided.");
      setIsLoading(false);
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
  }, [taskId]);

  async function handleToggleCompleted(completed: boolean) {
    if (!task) return;
    const updated = await setTaskCompleted(task.id, completed);
    setTask(updated);
  }

  async function handleSave() {
    if (!task) return;
    const trimmedTitle = editTitle.trim();
    if (!trimmedTitle) return;

    setIsSaving(true);
    try {
      const updated = await updateTask(task.id, {
        title: trimmedTitle,
        description: editDescription.trim(),
      });
      setTask(updated);
      setIsEditing(false);
    } finally {
      setIsSaving(false);
    }
  }

  function handleCancelEdit() {
    if (!task) return;
    setEditTitle(task.title);
    setEditDescription(task.description);
    setIsEditing(false);
  }

  if (isLoading) {
    return (
      <main>
        <h1>Task detail</h1>
        <p>Loading task…</p>
      </main>
    );
  }

  if (error || !task) {
    return (
      <main>
        <h1>Task detail</h1>
        <p role="alert">{error ?? "Task not found."}</p>
      </main>
    );
  }

  return (
    <main>
      <h1>Task detail</h1>
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
          </div>
        </div>
      )}
    </main>
  );
}
