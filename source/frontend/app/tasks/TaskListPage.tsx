// @manualReviewRequested: 2026-07-06
import { useMemo, useState } from "react";

import { Checkbox } from "../../core/design-system/components/Checkbox";
import { EmojiIcon } from "../../core/design-system/components/EmojiIcon";
import { Sidebar, type SidebarGroup } from "../../core/design-system/components/Sidebar";
import { useProjects } from "../projects/useProjects";
import { TaskCreateModal } from "./TaskCreateModal";
import { TaskDetailPane } from "./TaskDetailPane";
import { TaskTitle } from "./TaskRow";
import type { Task } from "./taskApi";
import { useTasks, useUpdateTask } from "./useTasks";
import "./TaskListPage.css";

/** Lists every task in a sidebar (grouped into recurring/ad-hoc, searchable, each with a
 * tap-to-complete checkbox) with a detail pane for editing or removing the selected one. New
 * tasks are created via TaskCreateModal.
 */
export function TaskListPage() {
  const { data: tasks, isLoading } = useTasks();
  const { data: projects } = useProjects();
  const updateTask = useUpdateTask();

  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const groups: SidebarGroup<Task>[] = useMemo(() => {
    const filtered = (tasks ?? []).filter((task) =>
      task.title.toLowerCase().includes(searchQuery.toLowerCase()),
    );
    return [
      { label: "Recurring", items: filtered.filter((task) => task.recurringTemplateId !== "") },
      { label: "Ad-hoc", items: filtered.filter((task) => task.recurringTemplateId === "") },
    ];
  }, [tasks, searchQuery]);

  const selectedTask = tasks?.find((task) => task.id === selectedTaskId) ?? null;

  return (
    <div className="cg-task-list-page">
      <h1>
        Tasks <EmojiIcon symbol="✅" label="Tasks" />
      </h1>
      <div className="cg-task-list-page__body">
        <Sidebar
          groups={groups}
          getId={(task) => task.id}
          getLabel={(task) => task.title}
          selectedId={selectedTaskId}
          onSelect={setSelectedTaskId}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          createSlot={<TaskCreateModal onCreated={setSelectedTaskId} />}
          emptyMessage={isLoading ? "Loading tasks…" : "No tasks yet."}
          renderLeading={(task) => (
            <Checkbox
              checked={task.isComplete}
              onToggle={() =>
                updateTask.mutate({ taskId: task.id, changes: { isComplete: !task.isComplete } })
              }
              label={`Mark "${task.title}" ${task.isComplete ? "incomplete" : "complete"}`}
            />
          )}
          renderItemLabel={(task) => <TaskTitle task={task} />}
        />
        <div className="cg-task-list-page__detail">
          {selectedTask && (
            <TaskDetailPane
              task={selectedTask}
              projects={projects ?? []}
              onDeleted={() => setSelectedTaskId(null)}
            />
          )}
          {!selectedTask && (
            <p className="cg-task-list-page__empty-state">Select a task, or create a new one.</p>
          )}
        </div>
      </div>
    </div>
  );
}
