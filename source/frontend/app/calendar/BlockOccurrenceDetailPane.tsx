import { useEffect, useState } from "react";

import { Button } from "../../core/design-system/components/Button";
import { Card } from "../../core/design-system/components/Card";
import { Field } from "../../core/design-system/components/Field";
import { TextArea } from "../../core/design-system/components/TextArea";
import { TextInput } from "../../core/design-system/components/TextInput";
import type { BlockOccurrence } from "./calendarApi";
import { useUpdateBlockOccurrence } from "./useBlockOccurrences";
import "./BlockOccurrenceDetailPane.css";

type BlockOccurrenceDetailPaneProps = {
  occurrence: BlockOccurrence;
  onClose: () => void;
  /** Opens the owning template's own editor (app/blocks/BlockDetailSidebar.tsx) instead — for
   * when a change should apply to the whole series, not just this one date.
   */
  onEditTemplate: (templateId: string) => void;
};

/** Edits exactly one calendar occurrence — title/description/start time/duration for this date
 * only. Saving here never touches the owning BlockTemplate's own shape, and (per PATCH
 * /api/blocks/<id> on the backend) marks this occurrence so a later template edit never overwrites
 * it again, even if it was still only a projected occurrence a moment ago. Opened by clicking an
 * occurrence directly on the calendar grid (CalendarWeekView.tsx) — selecting the template itself
 * from the left sidebar's Blocks card opens app/blocks/BlockDetailSidebar.tsx instead, for editing
 * the series as a whole.
 */
export function BlockOccurrenceDetailPane({
  occurrence,
  onClose,
  onEditTemplate,
}: BlockOccurrenceDetailPaneProps) {
  const updateOccurrence = useUpdateBlockOccurrence();

  const [title, setTitle] = useState(occurrence.title);
  const [description, setDescription] = useState(occurrence.description);
  const [startTime, setStartTime] = useState(occurrence.startTime);
  const [durationMinutes, setDurationMinutes] = useState(occurrence.durationMinutes);

  useEffect(() => {
    setTitle(occurrence.title);
    setDescription(occurrence.description);
    setStartTime(occurrence.startTime);
    setDurationMinutes(occurrence.durationMinutes);
  }, [occurrence]);

  const dateLabel = new Date(`${occurrence.date}T00:00:00`).toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  function handleSave() {
    updateOccurrence.mutate(
      {
        occurrenceId: occurrence.id,
        changes: { title, description, startTime, durationMinutes },
      },
      { onSuccess: onClose },
    );
  }

  return (
    <div className="cg-block-occurrence-detail-pane">
      <Card>
        <p className="cg-block-occurrence-detail-pane__date">{dateLabel}</p>
        <Field label="Title">
          <TextInput value={title} onChange={(event) => setTitle(event.target.value)} autoFocus />
        </Field>
        <Field label="Description">
          <TextArea
            rows={2}
            value={description}
            onChange={(event) => setDescription(event.target.value)}
          />
        </Field>
        <div className="cg-block-occurrence-detail-pane__time-fields">
          <Field label="Start time">
            <TextInput
              type="time"
              value={startTime}
              onChange={(event) => setStartTime(event.target.value)}
            />
          </Field>
          <Field label="Duration">
            <TextInput
              type="number"
              min={5}
              step={5}
              value={durationMinutes}
              onChange={(event) => setDurationMinutes(Number(event.target.value))}
            />
          </Field>
          <span className="cg-block-occurrence-detail-pane__unit">min</span>
        </div>
        <p className="cg-block-occurrence-detail-pane__note">
          Editing this date only — the block's overall schedule is unaffected.
        </p>
      </Card>

      <div className="cg-block-occurrence-detail-pane__actions">
        <Button onClick={handleSave} disabled={updateOccurrence.isPending || !title.trim()}>
          Save
        </Button>
        <Button variant="secondary" onClick={() => onEditTemplate(occurrence.templateId)}>
          Edit the whole block
        </Button>
      </div>
      {updateOccurrence.isError && (
        <p className="cg-block-occurrence-detail-pane__error">{updateOccurrence.error.message}</p>
      )}
    </div>
  );
}
