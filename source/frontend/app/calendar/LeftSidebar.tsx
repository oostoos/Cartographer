// @manualReviewRequested: 2026-07-07
import type { BlockTemplate } from "../blocks/blockApi";
import type { Project } from "../projects/projectApi";
import type { Task } from "../tasks/taskApi";
import type { BlockOccurrence } from "./calendarApi";
import { BlocksCard } from "./BlocksCard";
import { ProjectsCard } from "./ProjectsCard";
import { TasksCard } from "./TasksCard";
import "./LeftSidebar.css";

type LeftSidebarProps = {
  templates: BlockTemplate[];
  templatesLoading: boolean;
  templateColorIndex: Map<string, number>;
  selectedTemplateId: string | null;
  onSelectTemplate: (templateId: string) => void;
  onCreateTemplate: () => void;
  tasks: Task[];
  tasksLoading: boolean;
  selectedTaskId: string | null;
  onSelectTask: (taskId: string) => void;
  /** Today's own real block occurrences, independent of whichever range the calendar grid is
   * currently showing — BlocksCard nests today's tasks under each block regardless of navigation.
   */
  todaysOccurrences: BlockOccurrence[];
  projects: Project[];
  projectsLoading: boolean;
  selectedProjectId: string | null;
  onSelectProject: (projectId: string) => void;
};

/** The calendar page's left card sidebar: Blocks, Tasks, and Projects, each its own independently
 * collapsible card (CollapsibleCard) so a user can tuck away whichever they don't need right now.
 * Selecting any item opens its detail in the center pane instead of navigating to another page —
 * see app/calendar/CalendarPage.tsx.
 */
export function LeftSidebar({
  templates,
  templatesLoading,
  templateColorIndex,
  selectedTemplateId,
  onSelectTemplate,
  onCreateTemplate,
  tasks,
  tasksLoading,
  selectedTaskId,
  onSelectTask,
  todaysOccurrences,
  projects,
  projectsLoading,
  selectedProjectId,
  onSelectProject,
}: LeftSidebarProps) {
  return (
    <div className="cg-left-sidebar">
      <BlocksCard
        templates={templates}
        isLoading={templatesLoading}
        templateColorIndex={templateColorIndex}
        selectedTemplateId={selectedTemplateId}
        onSelectTemplate={onSelectTemplate}
        onCreateTemplate={onCreateTemplate}
        tasks={tasks}
        todaysOccurrences={todaysOccurrences}
      />
      <TasksCard
        tasks={tasks}
        isLoading={tasksLoading}
        selectedTaskId={selectedTaskId}
        onSelectTask={onSelectTask}
      />
      <ProjectsCard
        projects={projects}
        isLoading={projectsLoading}
        selectedProjectId={selectedProjectId}
        onSelectProject={onSelectProject}
      />
    </div>
  );
}
