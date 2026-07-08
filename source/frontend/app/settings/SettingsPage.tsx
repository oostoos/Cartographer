// @manualReviewRequested: 2026-07-06
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { type FormEvent, useEffect, useState } from "react";

import { Button } from "../../core/design-system/components/Button";
import { Card } from "../../core/design-system/components/Card";
import { EmojiIcon } from "../../core/design-system/components/EmojiIcon";
import { Field } from "../../core/design-system/components/Field";
import { TextInput } from "../../core/design-system/components/TextInput";
import { fetchSettings, purgeAllData, updateSettings } from "./settingsApi";
import "./SettingsPage.css";

const SETTINGS_QUERY_KEY = ["settings"];

/** Lets the user view and change their display name. */
export function SettingsPage() {
  const queryClient = useQueryClient();
  const { data: settings, isLoading } = useQuery({
    queryKey: SETTINGS_QUERY_KEY,
    queryFn: fetchSettings,
  });
  const saveSettings = useMutation({
    mutationFn: updateSettings,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: SETTINGS_QUERY_KEY }),
  });
  const purgeData = useMutation({
    mutationFn: purgeAllData,
    onSuccess: () => window.location.reload(),
  });

  const [displayName, setDisplayName] = useState("");
  const [isConfirmingPurge, setIsConfirmingPurge] = useState(false);

  useEffect(() => {
    if (settings) setDisplayName(settings.displayName);
  }, [settings]);

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    saveSettings.mutate({ displayName });
  }

  if (isLoading) return <p>Loading settings…</p>;

  return (
    <div className="cg-settings-page">
      <h1>
        Settings <EmojiIcon symbol="⚙️" label="Settings" />
      </h1>
      <Card>
        <form onSubmit={handleSubmit}>
          <Field label="Display name">
            <TextInput
              value={displayName}
              onChange={(event) => setDisplayName(event.target.value)}
            />
          </Field>
          <Button type="submit">Save</Button>
        </form>
      </Card>
      <Card className="cg-settings-page__danger-zone">
        <h2>
          Danger zone <EmojiIcon symbol="⚠️" label="Danger zone" />
        </h2>
        {isConfirmingPurge ? (
          <>
            <p>
              This will permanently delete every project, task, and journal entry. This cannot be
              undone.
            </p>
            <div className="cg-settings-page__danger-zone-actions">
              <Button variant="danger" onClick={() => purgeData.mutate()}>
                {purgeData.isPending ? "Deleting…" : "Yes, delete everything"}
              </Button>
              <Button variant="secondary" onClick={() => setIsConfirmingPurge(false)}>
                Cancel
              </Button>
            </div>
          </>
        ) : (
          <Button variant="danger" onClick={() => setIsConfirmingPurge(true)}>
            Delete all data
          </Button>
        )}
      </Card>
    </div>
  );
}
