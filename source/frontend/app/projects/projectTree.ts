// @manualReviewRequested: 2026-07-06
import type { TreeNode } from "../../core/design-system/components/TreeList";
import type { Project } from "./projectApi";

const TOP_LEVEL_PARENT_VALUE = "";

/** Builds a project's full subtree (subprojects recursively) from the flat project list, rooted
 * at parentId (top-level projects when omitted). Used by ProjectListPage's sidebar tree and, via
 * app/tasks/TaskListPage.tsx's own tree-building, the Tasks sidebar's Projects section — one of
 * the app's sanctioned cross-domain imports (see app/tasks/CLAUDE.md).
 */
export function buildProjectTree(
  projects: Project[],
  parentId: string = TOP_LEVEL_PARENT_VALUE,
): TreeNode<Project>[] {
  return projects
    .filter((project) => project.parentProjectId === parentId)
    .map((project) => ({ item: project, children: buildProjectTree(projects, project.id) }));
}

/** Walks a project's parentProjectId chain upward and returns every ancestor's id, so a tree
 * sidebar can auto-expand down to whichever project is currently selected.
 */
export function collectAncestorProjectIds(projectId: string, projects: Project[]): Set<string> {
  const ancestorIds = new Set<string>();
  let current = projects.find((project) => project.id === projectId);
  while (current && current.parentProjectId !== TOP_LEVEL_PARENT_VALUE) {
    ancestorIds.add(current.parentProjectId);
    current = projects.find((project) => project.id === current!.parentProjectId);
  }
  return ancestorIds;
}
