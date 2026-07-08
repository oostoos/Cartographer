// @manualReviewRequested: 2026-07-07
import { BasicIcon } from "../../core/design-system/components/BasicIcon";
import { Button } from "../../core/design-system/components/Button";
import { CollapsibleCard } from "../../core/design-system/components/CollapsibleCard";
import { List } from "../../core/design-system/components/List";
import type { BlockTemplate } from "../blocks/blockApi";
import { blockColorStrongVar } from "../blocks/blockColor";
import { useGenerateDefaultBlockTemplates } from "../blocks/useBlockTemplates";
import "./BlocksCard.css";

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
};

/** The calendar page's left-sidebar Blocks section: every block template, colored consistently
 * with how its occurrences render on the calendar. Selecting one, or "+ New block", opens
 * BlockDetailSidebar in the center pane — see app/calendar/CalendarPage.tsx.
 */
export function BlocksCard({
  templates,
  isLoading,
  templateColorIndex,
  selectedTemplateId,
  onSelectTemplate,
  onCreateTemplate,
}: BlocksCardProps) {
  const generateDefaults = useGenerateDefaultBlockTemplates();

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
      <List
        groups={[{ key: "blocks", items: templates }]}
        getId={(template) => template.id}
        getLabel={(template) => template.title}
        renderLeading={(template) => (
          <span
            className="cg-blocks-card__dot"
            style={{
              backgroundColor: blockColorStrongVar(templateColorIndex.get(template.id) ?? 0),
            }}
          />
        )}
        selectedId={selectedTemplateId}
        onSelect={onSelectTemplate}
        emptyMessage={isLoading ? "Loading blocks…" : "No blocks yet."}
      />
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
