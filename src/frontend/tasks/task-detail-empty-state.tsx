import { Card } from "@lib-stack/design-language/card";

import "./task-detail-empty-state.css";

/** Placeholder shown in the task-detail column when no task is selected. */
export function TaskDetailEmptyState() {
  return (
    <Card>
      <p className="task-detail-empty-state">Select a task to see its details.</p>
    </Card>
  );
}
