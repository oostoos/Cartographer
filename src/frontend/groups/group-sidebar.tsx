import { useState } from "react";

import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";

import { Button } from "@lib-stack/design-language/button";
import { PlusIcon } from "@lib-stack/design-language/icons";
import { Modal } from "@lib-stack/design-language/modal";

import "./group-sidebar.css";

import type { TTaskFilter } from "../tasks/task-filter";
import type { TTask } from "../tasks/types";
import { computeGroupTaskCounts } from "./compute-group-task-counts";
import { GroupCard } from "./group-card";
import { GroupCreateForm } from "./group-create-form";
import type { TGroup } from "./types";

export interface IGroupSidebarProps {
  groups: TGroup[];
  tasks: TTask[];
  activeFilter: TTaskFilter;
  onSelectFilter: (filter: TTaskFilter) => void;
  onCreateGroup: (name: string) => Promise<void>;
  onRenameGroup: (groupId: string, name: string) => Promise<void>;
  onDeleteGroup: (groupId: string) => void;
}

/** Left sidebar of the Tasks page: filter buttons plus the list of groups. */
export function GroupSidebar({
  groups,
  tasks,
  activeFilter,
  onSelectFilter,
  onCreateGroup,
  onRenameGroup,
  onDeleteGroup,
}: IGroupSidebarProps) {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const groupIds = groups.map((group) => group.id);

  async function handleCreate(name: string) {
    await onCreateGroup(name);
    setIsCreateModalOpen(false);
  }

  return (
    <div className="group-sidebar">
      <div className="group-sidebar__filters">
        <Button
          type="button"
          variant={activeFilter.type === "all" ? "primary" : "secondary"}
          onClick={() => onSelectFilter({ type: "all" })}
        >
          All tasks
        </Button>
        <Button
          type="button"
          variant={activeFilter.type === "no-group" ? "primary" : "secondary"}
          onClick={() => onSelectFilter({ type: "no-group" })}
        >
          No group
        </Button>
        <Button type="button" variant="secondary" onClick={() => setIsCreateModalOpen(true)}>
          <PlusIcon /> New group
        </Button>
      </div>

      <Modal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} title="New group">
        <GroupCreateForm onCreate={handleCreate} />
      </Modal>

      <SortableContext items={groupIds} strategy={verticalListSortingStrategy}>
        <ul className="group-sidebar__list">
          {groups.map((group) => {
            const counts = computeGroupTaskCounts(tasks, group.id);
            return (
              <li key={group.id}>
                <GroupCard
                  group={group}
                  completedCount={counts.completed}
                  totalCount={counts.total}
                  isActive={activeFilter.type === "group" && activeFilter.groupId === group.id}
                  onSelect={() => onSelectFilter({ type: "group", groupId: group.id })}
                  onRename={(name) => onRenameGroup(group.id, name)}
                  onDelete={() => onDeleteGroup(group.id)}
                />
              </li>
            );
          })}
        </ul>
      </SortableContext>
    </div>
  );
}
