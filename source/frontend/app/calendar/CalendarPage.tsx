// @manualReviewRequested: 2026-07-07
import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import { BasicIcon } from "../../core/design-system/components/BasicIcon";
import { Button } from "../../core/design-system/components/Button";
import { SetSelection } from "../../core/design-system/components/SetSelection";
import type { BlockTemplate } from "../blocks/blockApi";
import { BlockDetailSidebar } from "../blocks/BlockDetailSidebar";
import { useBlockTemplates } from "../blocks/useBlockTemplates";
import { ProjectDetailPane } from "../projects/ProjectDetailPane";
import { useProjects } from "../projects/useProjects";
import { TaskDetailPane } from "../tasks/TaskDetailPane";
import type { Task } from "../tasks/taskApi";
import { useTasks } from "../tasks/useTasks";
import { BlockOccurrenceDetailPane } from "./BlockOccurrenceDetailPane";
import { CalendarMonthView } from "./CalendarMonthView";
import { CalendarWeekView } from "./CalendarWeekView";
import { addDays, parseIsoDate, shiftMonth, startOfWeek, toIsoDate } from "./calendarDate";
import { LeftSidebar } from "./LeftSidebar";
import { RightSidebar } from "./RightSidebar";
import { useBlockOccurrences } from "./useBlockOccurrences";
import "./CalendarPage.css";

type ViewMode = "week" | "month";

export type CalendarSelection =
  | { kind: "task"; id: string }
  | { kind: "project"; id: string }
  | { kind: "block-template"; id: string }
  | { kind: "creating-block-template" }
  | { kind: "block-occurrence"; id: string };

type LocationState = { selection?: CalendarSelection } | null;

const VIEW_MODE_OPTIONS = [
  { value: "week", label: "Week" },
  { value: "month", label: "Month" },
];

/** Maps every block template's id to its stable position in the (server-ordered) template list —
 * the one color assignment CalendarWeekView, CalendarMonthView, and BlocksCard all share, so a
 * block reads as the same color everywhere it appears (see app/blocks/blockColor.ts).
 */
function buildTemplateColorIndex(templates: BlockTemplate[]): Map<string, number> {
  return new Map(templates.map((template, index) => [template.id, index]));
}

/** Maps a real block occurrence's id to how many of its nested tasks are strictly complete versus
 * how many exist in total — the data behind CalendarWeekView's per-occurrence completion marker.
 * Built from the raw, unfiltered task list (unlike calendarTasks) since it needs exactly the
 * block-nested tasks calendarTasks excludes. A still-projected occurrence's synthetic id never
 * appears as any task's blockId, so it's simply absent from the result.
 */
function buildBlockCompletionByOccurrenceId(
  tasks: Task[],
): Map<string, { completed: number; total: number }> {
  const countsByOccurrenceId = new Map<string, { completed: number; total: number }>();
  for (const task of tasks) {
    if (task.blockId === "" || task.isArchived) continue;
    const counts = countsByOccurrenceId.get(task.blockId) ?? { completed: 0, total: 0 };
    counts.total += 1;
    if (task.isComplete) counts.completed += 1;
    countsByOccurrenceId.set(task.blockId, counts);
  }
  return countsByOccurrenceId;
}

/** The app's home page (route "/"): a calendar-centered hub. Left sidebar: Blocks/Tasks/Projects,
 * each an independently collapsible card (app/calendar/LeftSidebar.tsx). Right sidebar: the
 * unified notes feed plus its always-available composer (app/calendar/RightSidebar.tsx). Center:
 * the calendar itself (week or month view), which swaps out for a task's, project's, or block
 * template's own detail pane once one is selected from either sidebar or the calendar grid —
 * selecting something never navigates to another page, it opens right here.
 */
export function CalendarPage() {
  const location = useLocation();
  const navigate = useNavigate();

  const [viewMode, setViewMode] = useState<ViewMode>("week");
  const [anchorIso, setAnchorIso] = useState(() => toIsoDate(new Date()));
  const [selection, setSelection] = useState<CalendarSelection | null>(
    () => (location.state as LocationState)?.selection ?? null,
  );

  useEffect(() => {
    if (location.state) {
      navigate(location.pathname, { replace: true, state: null });
    }
  }, [location.state, location.pathname, navigate]);

  const { data: templates, isLoading: templatesLoading } = useBlockTemplates();
  const { data: tasks, isLoading: tasksLoading } = useTasks();
  const { data: projects, isLoading: projectsLoading } = useProjects();

  const templateColorIndex = useMemo(() => buildTemplateColorIndex(templates ?? []), [templates]);
  /** Archived tasks stay out of the calendar grid itself — they're still fully browsable from
   * the left sidebar's Tasks card, which shows every ad-hoc task regardless of the flag.
   * Completed tasks, unlike archived ones, do appear here: they render struck-through and muted
   * via TaskTitle's resolutionClass (app/tasks/TaskRow.tsx), since completion is a display state,
   * not a calendar-visibility concept. Block-nested tasks are excluded too — they show nested
   * under their block in the left sidebar's Blocks card (today only) instead, with a completion
   * marker on their block's own occurrence box (see blockCompletionByOccurrenceId below).
   */
  const calendarTasks = useMemo(
    () => (tasks ?? []).filter((task) => !task.isArchived && task.blockId === ""),
    [tasks],
  );
  const blockCompletionByOccurrenceId = useMemo(
    () => buildBlockCompletionByOccurrenceId(tasks ?? []),
    [tasks],
  );

  const anchorDate = parseIsoDate(anchorIso);
  const weekStartIso = startOfWeek(anchorIso);
  const rangeStart =
    viewMode === "week"
      ? weekStartIso
      : toIsoDate(new Date(anchorDate.getFullYear(), anchorDate.getMonth(), 1));
  const rangeEnd =
    viewMode === "week"
      ? addDays(weekStartIso, 6)
      : toIsoDate(new Date(anchorDate.getFullYear(), anchorDate.getMonth() + 1, 0));

  const { data: occurrences, isLoading: occurrencesLoading } = useBlockOccurrences(
    rangeStart,
    rangeEnd,
  );
  /** Today's own real occurrences, fetched independently of whichever range the grid is currently
   * showing — the left sidebar's Blocks card nests today's tasks under each block regardless of
   * calendar navigation, so it needs today's data even when the visible week/month doesn't include
   * it.
   */
  const todayIso = toIsoDate(new Date());
  const { data: todaysOccurrences } = useBlockOccurrences(todayIso, todayIso);

  function goToPrevious() {
    setAnchorIso((previous) =>
      viewMode === "week" ? addDays(previous, -7) : shiftMonth(previous, -1),
    );
  }
  function goToNext() {
    setAnchorIso((previous) =>
      viewMode === "week" ? addDays(previous, 7) : shiftMonth(previous, 1),
    );
  }
  function goToToday() {
    setAnchorIso(toIsoDate(new Date()));
  }

  const rangeLabel =
    viewMode === "week"
      ? `${parseIsoDate(weekStartIso).toLocaleDateString(undefined, { month: "short", day: "numeric" })} – ${parseIsoDate(
          addDays(weekStartIso, 6),
        ).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}`
      : anchorDate.toLocaleDateString(undefined, { month: "long", year: "numeric" });

  const selectedTask =
    selection?.kind === "task"
      ? ((tasks ?? []).find((task) => task.id === selection.id) ?? null)
      : null;
  const selectedProject =
    selection?.kind === "project"
      ? ((projects ?? []).find((project) => project.id === selection.id) ?? null)
      : null;
  const selectedTemplate =
    selection?.kind === "block-template"
      ? ((templates ?? []).find((template) => template.id === selection.id) ?? null)
      : null;
  const isCreatingBlockTemplate = selection?.kind === "creating-block-template";
  const selectedOccurrence =
    selection?.kind === "block-occurrence"
      ? ((occurrences ?? []).find((occurrence) => occurrence.id === selection.id) ?? null)
      : null;

  function closeSelection() {
    setSelection(null);
  }

  return (
    <div className="cg-calendar-page">
      <LeftSidebar
        templates={templates ?? []}
        templatesLoading={templatesLoading}
        templateColorIndex={templateColorIndex}
        selectedTemplateId={selection?.kind === "block-template" ? selection.id : null}
        onSelectTemplate={(id) => setSelection({ kind: "block-template", id })}
        onCreateTemplate={() => setSelection({ kind: "creating-block-template" })}
        tasks={tasks ?? []}
        tasksLoading={tasksLoading}
        selectedTaskId={selection?.kind === "task" ? selection.id : null}
        onSelectTask={(id) => setSelection({ kind: "task", id })}
        todaysOccurrences={todaysOccurrences ?? []}
        projects={projects ?? []}
        projectsLoading={projectsLoading}
        selectedProjectId={selection?.kind === "project" ? selection.id : null}
        onSelectProject={(id) => setSelection({ kind: "project", id })}
      />

      <div className="cg-calendar-page__center">
        {selection ? (
          <div className="cg-calendar-page__detail">
            <button type="button" className="cg-calendar-page__back" onClick={closeSelection}>
              <BasicIcon name="chevron-left" label="Back to calendar" /> Back to calendar
            </button>
            {selectedTask && (
              <TaskDetailPane
                task={selectedTask}
                projects={projects ?? []}
                onDeleted={closeSelection}
              />
            )}
            {selectedProject && (
              <ProjectDetailPane
                project={selectedProject}
                onSelectProject={(id) => setSelection({ kind: "project", id })}
                onDeleted={closeSelection}
              />
            )}
            {(selectedTemplate || isCreatingBlockTemplate) && (
              <BlockDetailSidebar template={selectedTemplate} onClose={closeSelection} />
            )}
            {selectedOccurrence && (
              <BlockOccurrenceDetailPane
                occurrence={selectedOccurrence}
                onClose={closeSelection}
                onEditTemplate={(templateId) =>
                  setSelection({ kind: "block-template", id: templateId })
                }
              />
            )}
          </div>
        ) : (
          <>
            <div className="cg-calendar-page__toolbar">
              <div className="cg-calendar-page__nav">
                <Button iconOnly variant="secondary" onClick={goToPrevious} aria-label="Previous">
                  <BasicIcon name="chevron-left" label="Previous" />
                </Button>
                <span className="cg-calendar-page__range-label">{rangeLabel}</span>
                <Button iconOnly variant="secondary" onClick={goToNext} aria-label="Next">
                  <BasicIcon name="chevron-right" label="Next" />
                </Button>
                <Button variant="secondary" onClick={goToToday}>
                  Today
                </Button>
              </div>
              <div className="cg-calendar-page__actions">
                <SetSelection
                  value={viewMode}
                  onChange={(value) => setViewMode(value as ViewMode)}
                  options={VIEW_MODE_OPTIONS}
                  aria-label="Calendar view"
                />
              </div>
            </div>
            {occurrencesLoading && <p>Loading calendar…</p>}
            {viewMode === "week" ? (
              <CalendarWeekView
                weekStartIso={weekStartIso}
                occurrences={occurrences ?? []}
                tasks={calendarTasks}
                templateColorIndex={templateColorIndex}
                blockCompletionByOccurrenceId={blockCompletionByOccurrenceId}
                onSelectOccurrence={(occurrence) =>
                  setSelection({ kind: "block-occurrence", id: occurrence.id })
                }
                onSelectTask={(id) => setSelection({ kind: "task", id })}
              />
            ) : (
              <CalendarMonthView
                year={anchorDate.getFullYear()}
                month={anchorDate.getMonth()}
                occurrences={occurrences ?? []}
                tasks={calendarTasks}
                templateColorIndex={templateColorIndex}
                onSelectDay={(dateIso) => {
                  setAnchorIso(dateIso);
                  setViewMode("week");
                }}
              />
            )}
          </>
        )}
      </div>

      <RightSidebar />
    </div>
  );
}
