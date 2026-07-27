import { useCallback } from "react";

import { useAsyncResource } from "@common/hooks/use-async-resource";

import {
  createGroup as createGroupRequest,
  deleteGroup as deleteGroupRequest,
  fetchGroups,
  reorderGroups as reorderGroupsRequest,
  updateGroup as updateGroupRequest,
} from "./groups-api";
import type { TGroup } from "./types";

export interface IUseGroupsResult {
  groups: TGroup[];
  isLoading: boolean;
  error: string | null;
  createGroup: (name: string) => Promise<void>;
  renameGroup: (groupId: string, name: string) => Promise<void>;
  reorderGroups: (orderedGroupIds: string[]) => Promise<void>;
  deleteGroup: (groupId: string) => Promise<void>;
}

/** Loads the group list on mount and exposes create/rename/reorder/delete actions that keep it in sync. */
export function useGroups(): IUseGroupsResult {
  const {
    value: groups,
    setValue: setGroups,
    isLoading,
    error,
  } = useAsyncResource<TGroup[]>(fetchGroups, [], "Failed to load groups.");

  const createGroup = useCallback(
    async (name: string) => {
      const group = await createGroupRequest({ name });
      setGroups((current) => [...current, group]);
    },
    [setGroups],
  );

  const renameGroup = useCallback(
    async (groupId: string, name: string) => {
      const updated = await updateGroupRequest(groupId, { name });
      setGroups((current) => current.map((group) => (group.id === updated.id ? updated : group)));
    },
    [setGroups],
  );

  const reorderGroups = useCallback(
    async (orderedGroupIds: string[]) => {
      setGroups((current) => _applyGroupOrder(current, orderedGroupIds));
      const updated = await reorderGroupsRequest(orderedGroupIds);
      setGroups(updated);
    },
    [setGroups],
  );

  const deleteGroup = useCallback(
    async (groupId: string) => {
      await deleteGroupRequest(groupId);
      setGroups((current) => current.filter((group) => group.id !== groupId));
    },
    [setGroups],
  );

  return { groups, isLoading, error, createGroup, renameGroup, reorderGroups, deleteGroup };
}

/** Reorders `groups` to match `orderedGroupIds`. Used to reflect a drag-reorder locally before
 * the backend confirms it. Unknown ids are dropped. */
function _applyGroupOrder(groups: TGroup[], orderedGroupIds: string[]): TGroup[] {
  const groupsById = new Map(groups.map((group) => [group.id, group]));
  return orderedGroupIds
    .map((id) => groupsById.get(id))
    .filter((group): group is TGroup => group !== undefined);
}
