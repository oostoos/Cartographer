import { type FormEvent, useState } from "react";

import { Button } from "../../core/design-system/components/Button";
import { EmojiIcon } from "../../core/design-system/components/EmojiIcon";
import { TextInput } from "../../core/design-system/components/TextInput";
import { useCreateSubtask, useDeleteSubtask, useSubtasks, useUpdateSubtask } from "./useSubtasks";
import "./SubtaskList.css";

type SubtaskListProps = {
  taskId: string;
};

/** A task's checklist: each subtask can be marked complete or skipped (either one collapses to
 * a single "Undo" action), plus an inline form to add another and a delete button per row.
 */
export function SubtaskList({ taskId }: SubtaskListProps) {
  const { data: subtasks, isLoading } = useSubtasks(taskId);
  const createSubtask = useCreateSubtask();
  const updateSubtask = useUpdateSubtask();
  const deleteSubtask = useDeleteSubtask();
  const [title, setTitle] = useState("");

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!title.trim()) return;
    createSubtask.mutate({ taskId, title });
    setTitle("");
  }

  return (
    <div className="cg-subtask-list">
      <h3>
        Subtasks <EmojiIcon symbol="🧩" label="Subtasks" />
      </h3>
      {isLoading && <p>Loading subtasks…</p>}
      {subtasks?.length === 0 && <p>No subtasks yet.</p>}
      {subtasks?.map((subtaskItem, index) => {
        const isResolved = subtaskItem.isComplete || subtaskItem.isSkipped;
        const isLast = index === subtasks.length - 1;
        return (
          <div className="cg-subtask-list__row" key={subtaskItem.id}>
            <span className="cg-subtask-list__label">
              <span className="cg-subtask-list__connector" aria-hidden="true">
                {isLast ? "└" : "├"}
              </span>
              <span className={isResolved ? "cg-subtask-list__title--resolved" : undefined}>
                {subtaskItem.title}
              </span>
            </span>
            <div className="cg-subtask-list__actions">
              {isResolved ? (
                <Button
                  variant="secondary"
                  onClick={() =>
                    updateSubtask.mutate({
                      subtaskId: subtaskItem.id,
                      changes: { isComplete: false, isSkipped: false },
                    })
                  }
                >
                  Undo
                </Button>
              ) : (
                <>
                  <Button
                    variant="primary"
                    onClick={() =>
                      updateSubtask.mutate({
                        subtaskId: subtaskItem.id,
                        changes: { isComplete: true },
                      })
                    }
                  >
                    Complete
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() =>
                      updateSubtask.mutate({
                        subtaskId: subtaskItem.id,
                        changes: { isSkipped: true },
                      })
                    }
                  >
                    Skip
                  </Button>
                </>
              )}
              <Button
                iconOnly
                variant="danger"
                onClick={() => deleteSubtask.mutate(subtaskItem.id)}
                aria-label={`Delete ${subtaskItem.title}`}
              >
                <EmojiIcon symbol="🗑️" label="Delete" />
              </Button>
            </div>
          </div>
        );
      })}
      <form className="cg-subtask-list__form" onSubmit={handleSubmit}>
        <TextInput
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="New subtask"
        />
        <Button type="submit">
          Add subtask <EmojiIcon symbol="➕" label="Add" />
        </Button>
      </form>
    </div>
  );
}
