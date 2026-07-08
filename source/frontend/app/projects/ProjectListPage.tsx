// @manualReviewRequested: 2026-07-06
import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import { Card } from "../../core/design-system/components/Card";
import { EmojiIcon } from "../../core/design-system/components/EmojiIcon";
import { MasterDetailLayout } from "../../core/design-system/components/MasterDetailLayout";
import { TextInput } from "../../core/design-system/components/TextInput";
import {
  TreeList,
  TreeRowButton,
  type TreeNode,
} from "../../core/design-system/components/TreeList";
import { useShortcut } from "../../core/utils/useShortcut";
import { ProjectCreateModal } from "./ProjectCreateModal";
import { ProjectDetailPane } from "./ProjectDetailPane";
import type { Project } from "./projectApi";
import { buildProjectTree, collectAncestorProjectIds } from "./projectTree";
import { useProjects } from "./useProjects";
import "./ProjectListPage.css";

/** Filters a project tree down to nodes matching the query, keeping any ancestor of a match so
 * the tree stays connected to its roots rather than showing orphaned matches.
 */
function filterProjectTree(nodes: TreeNode<Project>[], query: string): TreeNode<Project>[] {
  if (!query) return nodes;
  const loweredQuery = query.toLowerCase();
  const filtered: TreeNode<Project>[] = [];
  for (const node of nodes) {
    const filteredChildren = filterProjectTree(node.children, query);
    const matchesSelf = node.item.title.toLowerCase().includes(loweredQuery);
    if (matchesSelf || filteredChildren.length > 0) {
      filtered.push({ item: node.item, children: filteredChildren });
    }
  }
  return filtered;
}

/** Collects the id of every node that has children, so a search can force those nodes open
 * regardless of the sidebar's own expand/collapse state.
 */
function collectExpandableIds(nodes: TreeNode<Project>[]): string[] {
  return nodes.flatMap((node) =>
    node.children.length > 0
      ? [node.item.id, ...collectExpandableIds(node.children)]
      : collectExpandableIds(node.children),
  );
}

/** Lists every project as a nested, expandable tree in the sidebar (subprojects shown inline
 * beneath their parent, not just reachable by drilling in) with a detail pane for editing or
 * removing the selected one. New projects are created via ProjectCreateModal.
 */
export function ProjectListPage() {
  const { data: projects, isLoading } = useProjects();
  const location = useLocation();
  const navigate = useNavigate();

  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(
    () => (location.state as { projectId?: string } | null)?.projectId ?? null,
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  useShortcut({ key: "N", alt: true, shift: true }, () => setIsCreateModalOpen(true));

  useEffect(() => {
    if (location.state) {
      navigate(location.pathname, { replace: true, state: null });
    }
  }, [location.state, location.pathname, navigate]);

  useEffect(() => {
    if (!selectedProjectId || !projects) return;
    const ancestorIds = collectAncestorProjectIds(selectedProjectId, projects);
    if (ancestorIds.size > 0) {
      setExpandedIds((previous) => new Set([...previous, ...ancestorIds]));
    }
  }, [selectedProjectId, projects]);

  function toggleExpand(projectId: string) {
    setExpandedIds((previous) => {
      const next = new Set(previous);
      if (next.has(projectId)) next.delete(projectId);
      else next.add(projectId);
      return next;
    });
  }

  const visibleTree = useMemo(() => {
    const fullTree = buildProjectTree(projects ?? []);
    return filterProjectTree(fullTree, searchQuery);
  }, [projects, searchQuery]);

  const effectiveExpandedIds = searchQuery
    ? new Set([...expandedIds, ...collectExpandableIds(visibleTree)])
    : expandedIds;

  const selectedProject = projects?.find((project) => project.id === selectedProjectId) ?? null;

  return (
    <div className="cg-project-list-page">
      <h1>
        Projects <EmojiIcon symbol="📁" label="Projects" />
      </h1>
      <MasterDetailLayout
        list={
          <Card className="cg-sidebar">
            <TextInput
              className="cg-sidebar__search"
              type="search"
              placeholder="Search…"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              aria-label="Search"
            />
            <div className="cg-sidebar__create">
              <ProjectCreateModal
                onCreated={setSelectedProjectId}
                isOpen={isCreateModalOpen}
                onOpenChange={setIsCreateModalOpen}
              />
            </div>
            {visibleTree.length === 0 && (
              <p className="cg-sidebar__empty">
                {isLoading ? "Loading projects…" : "No projects yet."}
              </p>
            )}
            <TreeList
              nodes={visibleTree}
              getId={(project) => project.id}
              expandedIds={effectiveExpandedIds}
              onToggleExpand={toggleExpand}
              renderRow={(project) => (
                <TreeRowButton
                  isSelected={project.id === selectedProjectId}
                  onClick={() => setSelectedProjectId(project.id)}
                >
                  {project.title}
                </TreeRowButton>
              )}
            />
          </Card>
        }
        detail={
          selectedProject && (
            <ProjectDetailPane
              project={selectedProject}
              onSelectProject={setSelectedProjectId}
              onDeleted={() => setSelectedProjectId(null)}
            />
          )
        }
        onCloseDetail={() => setSelectedProjectId(null)}
      />
    </div>
  );
}
