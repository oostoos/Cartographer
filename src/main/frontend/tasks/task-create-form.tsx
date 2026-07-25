import type { FormEvent } from "react";
import { useState } from "react";

import { Button } from "@common/design-language/button";

import "./task-create-form.css";

export interface ITaskCreateFormProps {
  onCreate: (title: string, description: string) => Promise<void>;
}

/** Form for creating a new task: a required title and an optional description. */
export function TaskCreateForm({ onCreate }: ITaskCreateFormProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmedTitle = title.trim();
    if (!trimmedTitle) return;

    setIsSubmitting(true);
    try {
      await onCreate(trimmedTitle, description.trim());
      setTitle("");
      setDescription("");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="task-create-form">
      <input
        type="text"
        name="title"
        placeholder="Add a task..."
        value={title}
        onChange={(event) => setTitle(event.target.value)}
        aria-label="Task title"
      />
      <input
        type="text"
        name="description"
        placeholder="Description (optional)"
        value={description}
        onChange={(event) => setDescription(event.target.value)}
        aria-label="Task description"
      />
      <Button type="submit" disabled={isSubmitting || !title.trim()}>
        Add task
      </Button>
    </form>
  );
}
