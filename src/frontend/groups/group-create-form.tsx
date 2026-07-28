import type { FormEvent } from "react";
import { useState } from "react";

import { Button } from "@lib-stack/design-language/button";

import "./group-create-form.css";

export interface IGroupCreateFormProps {
  onCreate: (name: string) => Promise<void>;
}

/** Small form for creating a new group: a single required name field. */
export function GroupCreateForm({ onCreate }: IGroupCreateFormProps) {
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
    <form onSubmit={handleSubmit} className="group-create-form">
      <input
        type="text"
        name="name"
        placeholder="Group name..."
        value={name}
        onChange={(event) => setName(event.target.value)}
        aria-label="Group name"
        autoFocus
      />
      <Button type="submit" variant="additive" disabled={isSubmitting || !name.trim()}>
        Create
      </Button>
    </form>
  );
}
