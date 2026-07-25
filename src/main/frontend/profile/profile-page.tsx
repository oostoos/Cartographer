import type { FormEvent } from "react";
import { useEffect, useState } from "react";

import { Button } from "@common/design-language/button";

import "./profile-page.css";

import { useProfile } from "./use-profile";

export function ProfilePage() {
  const { profile, isLoading, error, updateDisplayName, deleteAllData } = useProfile();

  const [displayName, setDisplayNameInput] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (profile) setDisplayNameInput(profile.display_name);
  }, [profile]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);
    try {
      await updateDisplayName(displayName);
    } finally {
      setIsSaving(false);
    }
  }

  async function handleConfirmDelete() {
    setIsDeleting(true);
    try {
      await deleteAllData();
      setIsConfirmingDelete(false);
    } finally {
      setIsDeleting(false);
    }
  }

  if (isLoading) {
    return (
      <main>
        <h1>Profile</h1>
        <p>Loading profile…</p>
      </main>
    );
  }

  if (error) {
    return (
      <main>
        <h1>Profile</h1>
        <p role="alert">{error}</p>
      </main>
    );
  }

  return (
    <main>
      <h1>Profile</h1>

      <form onSubmit={handleSubmit} className="profile-form">
        <label htmlFor="display-name">Display name</label>
        <input
          id="display-name"
          type="text"
          value={displayName}
          onChange={(event) => setDisplayNameInput(event.target.value)}
        />
        <Button type="submit" disabled={isSaving}>
          Save
        </Button>
      </form>

      <section className="profile-danger-zone">
        <h2>Danger zone</h2>
        {!isConfirmingDelete ? (
          <Button variant="danger" onClick={() => setIsConfirmingDelete(true)}>
            Delete all data
          </Button>
        ) : (
          <div className="profile-danger-zone-confirm">
            <p>This will permanently delete all tasks and profile data. Are you sure?</p>
            <div className="profile-danger-zone-actions">
              <Button variant="danger" onClick={handleConfirmDelete} disabled={isDeleting}>
                Yes, delete everything
              </Button>
              <Button
                variant="secondary"
                onClick={() => setIsConfirmingDelete(false)}
                disabled={isDeleting}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}
      </section>
    </main>
  );
}
