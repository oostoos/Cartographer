// @manualReviewRequested: 2026-07-06
import { useMemo, useState } from "react";

import { EmojiIcon } from "../../core/design-system/components/EmojiIcon";
import { Sidebar, type SidebarGroup } from "../../core/design-system/components/Sidebar";
import { ProjectCreateModal } from "./ProjectCreateModal";
import { ProjectDetailPane } from "./ProjectDetailPane";
import type { Project } from "./projectApi";
import { useProjects } from "./useProjects";
import "./ProjectListPage.css";

const TOP_LEVEL_PARENT_VALUE = "";

/** Lists every top-level project in a searchable sidebar with a detail pane for editing or
 * removing the selected one. New projects are created via ProjectCreateModal; subprojects are
 * reached by drilling into a parent project's own detail pane.
 */
export function ProjectListPage() {
  const { data: projects, isLoading } = useProjects();

  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const groups: SidebarGroup<Project>[] = useMemo(() => {
    const filtered = (projects ?? []).filter(
      (project) =>
        project.parentProjectId === TOP_LEVEL_PARENT_VALUE &&
        project.title.toLowerCase().includes(searchQuery.toLowerCase()),
    );
    return [{ label: "Projects", items: filtered }];
  }, [projects, searchQuery]);

  const selectedProject = projects?.find((project) => project.id === selectedProjectId) ?? null;

  return (
    <div className="cg-project-list-page">
      <h1>
        Projects <EmojiIcon symbol="📁" label="Projects" />
      </h1>
      <div className="cg-project-list-page__body">
        <Sidebar
          groups={groups}
          getId={(project) => project.id}
          getLabel={(project) => project.title}
          selectedId={selectedProjectId}
          onSelect={setSelectedProjectId}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          createSlot={<ProjectCreateModal onCreated={setSelectedProjectId} />}
          emptyMessage={isLoading ? "Loading projects…" : "No projects yet."}
        />
        <div className="cg-project-list-page__detail">
          {selectedProject && (
            <ProjectDetailPane
              project={selectedProject}
              onSelectProject={setSelectedProjectId}
              onDeleted={() => setSelectedProjectId(null)}
            />
          )}
          {!selectedProject && (
            <p className="cg-project-list-page__empty-state">
              Select a project, or create a new one.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
