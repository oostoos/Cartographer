import { deleteJson, getJson, patchJson, postJson } from "@lib-stack/api/http-client";

import type { TGroup } from "./types";

// Mirrors src/backend/groups/schemas.py's GroupCreatePayload — keep in sync.
export type TGroupCreatePayload = {
  name: string;
};

// Mirrors src/backend/groups/schemas.py's GroupUpdatePayload — keep in sync.
export type TGroupUpdatePayload = {
  name?: string;
  color?: string;
};

// Mirrors src/backend/groups/schemas.py's GroupReorderPayload — keep in sync.
export type TGroupReorderPayload = {
  group_ids: string[];
};

/** Fetch every group. */
export function fetchGroups(): Promise<TGroup[]> {
  return getJson<TGroup[]>("/groups");
}

/** Create a new group. */
export function createGroup(payload: TGroupCreatePayload): Promise<TGroup> {
  return postJson<TGroup>("/groups", payload);
}

/** Update a group's name and/or color. */
export function updateGroup(groupId: string, payload: TGroupUpdatePayload): Promise<TGroup> {
  return patchJson<TGroup>(`/groups/${groupId}`, payload);
}

/** Reorder groups to match the given id sequence. Returns every group, freshly sorted. */
export function reorderGroups(groupIds: string[]): Promise<TGroup[]> {
  return patchJson<TGroup[]>("/groups/reorder", { group_ids: groupIds } satisfies TGroupReorderPayload);
}

/** Delete a group. Every task in it falls back to having no group. */
export function deleteGroup(groupId: string): Promise<{ id: string }> {
  return deleteJson<{ id: string }>(`/groups/${groupId}`);
}
