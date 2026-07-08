// @manualReviewRequested: 2026-07-07
import { blockColorStrongVar } from "../blocks/blockColor";
import type { Task } from "../tasks/taskApi";
import type { BlockOccurrence } from "./calendarApi";
import { buildMonthGrid, toIsoDate } from "./calendarDate";
import "./CalendarMonthView.css";

const WEEKDAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
/** How many of a day's occurrences get their own colored dot before the rest collapse into a
 * "+N" overflow marker — keeps a busy day's cell from growing unbounded.
 */
const MAX_VISIBLE_DOTS_PER_DAY = 4;

function groupOccurrencesByDate(occurrences: BlockOccurrence[]): Map<string, BlockOccurrence[]> {
  const byDate = new Map<string, BlockOccurrence[]>();
  for (const occurrence of occurrences) {
    const bucket = byDate.get(occurrence.date) ?? [];
    bucket.push(occurrence);
    byDate.set(occurrence.date, bucket);
  }
  return byDate;
}

function countTasksByDate(tasks: Task[]): Map<string, number> {
  const countByDate = new Map<string, number>();
  for (const task of tasks) {
    const dateOnly = task.scheduledAt ? task.scheduledAt.split("T")[0] : task.dueDate;
    if (!dateOnly) continue;
    countByDate.set(dateOnly, (countByDate.get(dateOnly) ?? 0) + 1);
  }
  return countByDate;
}

type CalendarMonthViewProps = {
  year: number;
  month: number; // 0-indexed, matching Date
  occurrences: BlockOccurrence[];
  tasks: Task[];
  templateColorIndex: Map<string, number>;
  onSelectDay: (dateIso: string) => void;
};

/** The calendar's month view: a day-cell grid where each day shows a colored dot per block
 * occurrence that day (real or projected) plus a count of tasks due or scheduled that day.
 * Clicking a day switches to the week view anchored there, since a month cell is too small to
 * browse or open anything directly.
 */
export function CalendarMonthView({
  year,
  month,
  occurrences,
  tasks,
  templateColorIndex,
  onSelectDay,
}: CalendarMonthViewProps) {
  const occurrencesByDate = groupOccurrencesByDate(occurrences);
  const taskCountByDate = countTasksByDate(tasks);
  const grid = buildMonthGrid(year, month);
  const todayIso = toIsoDate(new Date());

  return (
    <div className="cg-calendar-month-view">
      <div className="cg-calendar-month-view__grid">
        {WEEKDAY_LABELS.map((label) => (
          <span key={label} className="cg-calendar-month-view__weekday">
            {label}
          </span>
        ))}
        {grid.map((dateIso, index) => {
          if (dateIso === null) {
            return <span key={index} className="cg-calendar-month-view__cell--empty" />;
          }
          const dayOccurrences = occurrencesByDate.get(dateIso) ?? [];
          const visibleDots = dayOccurrences.slice(0, MAX_VISIBLE_DOTS_PER_DAY);
          const overflowCount = dayOccurrences.length - visibleDots.length;
          const taskCount = taskCountByDate.get(dateIso) ?? 0;
          return (
            <button
              type="button"
              key={dateIso}
              className={
                dateIso === todayIso
                  ? "cg-calendar-month-view__cell cg-calendar-month-view__cell--today"
                  : "cg-calendar-month-view__cell"
              }
              onClick={() => onSelectDay(dateIso)}
            >
              <span className="cg-calendar-month-view__day-number">{Number(dateIso.slice(8))}</span>
              <span className="cg-calendar-month-view__dots">
                {visibleDots.map((occurrence) => (
                  <span
                    key={occurrence.id}
                    className="cg-calendar-month-view__dot"
                    style={{
                      backgroundColor: blockColorStrongVar(
                        templateColorIndex.get(occurrence.templateId) ?? 0,
                      ),
                    }}
                  />
                ))}
                {overflowCount > 0 && (
                  <span className="cg-calendar-month-view__dot-overflow">+{overflowCount}</span>
                )}
              </span>
              {taskCount > 0 && (
                <span className="cg-calendar-month-view__task-count">
                  {taskCount} task{taskCount === 1 ? "" : "s"}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
