// @manualReviewRequested: 2026-07-09
import { useState } from "react";

import { BasicIcon } from "../../core/design-system/components/BasicIcon";
import { Button } from "../../core/design-system/components/Button";
import { CollapsibleCard } from "../../core/design-system/components/CollapsibleCard";
import { EmojiIcon } from "../../core/design-system/components/EmojiIcon";
import type { BlockTemplate } from "../blocks/blockApi";
import { blockColorStrongVar } from "../blocks/blockColor";
import { useGenerateDefaultBlockTemplates } from "../blocks/useBlockTemplates";
import { TaskList } from "../tasks/TaskList";
import type { Task } from "../tasks/taskApi";
import type { BlockOccurrence } from "./calendarApi";
import "./BlocksCard.css";

/** Maps each active template to today's own real occurrence, if it has one — a template with no
 * entry here simply isn't scheduled today.
 */
function buildOccurrenceByTemplateId(occurrences: BlockOccurrence[]): Map<string, BlockOccurrence> {
  const occurrenceByTemplateId = new Map<string, BlockOccurrence>();
  for (const occurrence of occurrences) {
    occurrenceByTemplateId.set(occurrence.templateId, occurrence);
  }
  return occurrenceByTemplateId;
}

/** Buckets every non-archived, block-nested task by the real Block instance it belongs to. */
function buildTasksByBlockId(tasks: Task[]): Map<string, Task[]> {
  const tasksByBlockId = new Map<string, Task[]>();
  for (const task of tasks) {
    if (task.blockId === "" || task.isArchived) continue;
    const bucket = tasksByBlockId.get(task.blockId) ?? [];
    bucket.push(task);
    tasksByBlockId.set(task.blockId, bucket);
  }
  return tasksByBlockId;
}

type BlockRowProps = {
  template: BlockTemplate;
  colorIndex: number;
  nestedTasks: Task[];
  isSelected: boolean;
  onSelect: () => void;
};

/** One block template's row: its own selectable title (opens BlockDetailSidebar), plus — only
 * when it has an occurrence today — a "▾/▸" toggle revealing today's nested tasks underneath,
 * collapsible independently of every other block's row and of the whole BlocksCard itself.
 * Defaults expanded so today's action items are visible without an extra click. The toggle, dot,
 * and title button are three siblings (never nested inside one another), and the nested TaskList
 * is a sibling block below the header — never inside the title button — so no control ends up
 * nested inside another interactive element.
 */
function BlockRow({ template, colorIndex, nestedTasks, isSelected, onSelect }: BlockRowProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const hasNestedTasks = nestedTasks.length > 0;

  return (
    <li className="cg-blocks-card__row">
      <div className="cg-blocks-card__row-header">
        {hasNestedTasks ? (
          <button
            type="button"
            className="cg-blocks-card__toggle"
            aria-expanded={isExpanded}
            onClick={() => setIsExpanded((previous) => !previous)}
          >
            <EmojiIcon symbol={isExpanded ? "▾" : "▸"} label={isExpanded ? "Collapse" : "Expand"} />
          </button>
        ) : (
          <span className="cg-blocks-card__toggle-placeholder" aria-hidden="true" />
        )}
        <span
          className="cg-blocks-card__dot"
          style={{ backgroundColor: blockColorStrongVar(colorIndex) }}
        />
        <button
          type="button"
          className={
            isSelected
              ? "cg-blocks-card__title-button cg-blocks-card__title-button--selected"
              : "cg-blocks-card__title-button"
          }
          onClick={onSelect}
        >
          {template.title}
        </button>
      </div>
      {hasNestedTasks && isExpanded && (
        <div className="cg-blocks-card__nested">
          <TaskList tasks={nestedTasks} capabilities={{ allowComplete: true, allowEdit: false }} />
        </div>
      )}
    </li>
  );
}

type BlocksCardProps = {
  templates: BlockTemplate[];
  isLoading: boolean;
  /** Maps a template's id to its stable position in the template list — the same index
   * CalendarWeekView/CalendarMonthView color occurrences by, so a block reads as the same color
   * everywhere it appears.
   */
  templateColorIndex: Map<string, number>;
  selectedTemplateId: string | null;
  onSelectTemplate: (templateId: string) => void;
  onCreateTemplate: () => void;
  /** Every task in the app — filtered down to each block's own nested, non-archived tasks here. */
  tasks: Task[];
  /** Today's own real block occurrences, independent of whichever range the calendar grid is
   * currently showing — a block's nested tasks nest under it here for today regardless of
   * navigation elsewhere on the page.
   */
  todaysOccurrences: BlockOccurrence[];
};

/** The calendar page's left-sidebar Blocks section: every block template, colored consistently
 * with how its occurrences render on the calendar, each with today's nested tasks (if it occurs
 * today) collapsible underneath it. Selecting a template's title, or "+ New block", opens
 * BlockDetailSidebar in the center pane — see app/calendar/CalendarPage.tsx. Block-nested tasks no
 * longer appear anywhere on the calendar grid itself; only a completion marker on the occurrence's
 * own box does (see app/calendar/CalendarWeekView.tsx).
 */
export function BlocksCard({
  templates,
  isLoading,
  templateColorIndex,
  selectedTemplateId,
  onSelectTemplate,
  onCreateTemplate,
  tasks,
  todaysOccurrences,
}: BlocksCardProps) {
  const generateDefaults = useGenerateDefaultBlockTemplates();

  const occurrenceByTemplateId = buildOccurrenceByTemplateId(todaysOccurrences);
  const tasksByBlockId = buildTasksByBlockId(tasks);

  return (
    <CollapsibleCard
      title="Blocks"
      icon={{ symbol: "🧩", label: "Blocks" }}
      headerActions={
        <Button iconOnly onClick={onCreateTemplate} aria-label="New block">
          <BasicIcon name="plus" label="New block" />
        </Button>
      }
    >
      {templates.length === 0 ? (
        <p className="cg-blocks-card__empty">{isLoading ? "Loading blocks…" : "No blocks yet."}</p>
      ) : (
        <ul className="cg-blocks-card__list">
          {templates.map((template) => {
            const occurrence = occurrenceByTemplateId.get(template.id);
            const nestedTasks = occurrence ? (tasksByBlockId.get(occurrence.id) ?? []) : [];
            return (
              <BlockRow
                key={template.id}
                template={template}
                colorIndex={templateColorIndex.get(template.id) ?? 0}
                nestedTasks={nestedTasks}
                isSelected={template.id === selectedTemplateId}
                onSelect={() => onSelectTemplate(template.id)}
              />
            );
          })}
        </ul>
      )}
      {templates.length === 0 && !isLoading && (
        <Button
          variant="secondary"
          onClick={() => generateDefaults.mutate()}
          disabled={generateDefaults.isPending}
        >
          Generate basic blocks
        </Button>
      )}
    </CollapsibleCard>
  );
}
