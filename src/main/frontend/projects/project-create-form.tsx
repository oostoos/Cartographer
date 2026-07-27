import type { FormEvent } from "react";
import { useState } from "react";

import { Button } from "@common/design-language/button";

import "./project-create-form.css";

export interface IProjectCreateFormProps {
  onCreate: (name: string) => Promise<void>;
}

/** Small form for creating a new project: a single required name field. */
export function ProjectCreateForm({ onCreate }: IProjectCreateFormProps) {
  const [name, setName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName) return;

    setIsSubmitting(true);
    try {
      await onCreate(trimmedName);
      setName("");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="project-create-form">
      <input
        type="text"
        name="name"
        placeholder="Project name..."
        value={name}
        onChange={(event) => setName(event.target.value)}
        aria-label="Project name"
      />
      <Button type="submit" disabled={isSubmitting || !name.trim()}>
        Create
      </Button>
    </form>
  );
}
