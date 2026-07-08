// @manualReviewRequested: 2026-07-07
import { useEffect, useMemo, useState } from "react";

import { CollapsibleCard } from "../../core/design-system/components/CollapsibleCard";
import { TreeList, TreeRowButton } from "../../core/design-system/components/TreeList";
import { ProjectCreateModal } from "../projects/ProjectCreateModal";
import type { Project } from "../projects/projectApi";
import { buildProjectTree, collectAncestorProjectIds } from "../projects/projectTree";

type ProjectsCardProps = {
  projects: Project[];
  isLoading: boolean;
  selectedProjectId: string | null;
  onSelectProject: (projectId: string) => void;
};

/** The calendar page's left-sidebar Projects section: every project as a nested, expandable tree
 * (mirroring ProjectListPage.tsx's own sidebar). Selecting one opens ProjectDetailPane in the
 * center pane — see app/calendar/CalendarPage.tsx. The full-page /projects route stays available
 * separately for dedicated browsing.
 */
export function ProjectsCard({
  projects,
  isLoading,
  selectedProjectId,
  onSelectProject,
}: ProjectsCardProps) {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!selectedProjectId) return;
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

  const tree = useMemo(() => buildProjectTree(projects), [projects]);

  return (
    <CollapsibleCard
      title="Projects"
      icon={{ symbol: "📁", label: "Projects" }}
      headerActions={<ProjectCreateModal onCreated={onSelectProject} />}
    >
      {tree.length === 0 ? (
        <p>{isLoading ? "Loading projects…" : "No projects yet."}</p>
      ) : (
        <TreeList
          nodes={tree}
          getId={(project) => project.id}
          expandedIds={expandedIds}
          onToggleExpand={toggleExpand}
          renderRow={(project) => (
            <TreeRowButton
              isSelected={project.id === selectedProjectId}
              onClick={() => onSelectProject(project.id)}
            >
              {project.title}
            </TreeRowButton>
          )}
        />
      )}
    </CollapsibleCard>
  );
}
