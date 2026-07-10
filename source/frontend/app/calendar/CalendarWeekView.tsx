// @manualReviewRequested: 2026-07-07
import type { CSSProperties } from "react";

import { blockColorStrongVar, blockColorVar } from "../blocks/blockColor";
import { TaskTitle } from "../tasks/TaskRow";
import type { Task } from "../tasks/taskApi";
import type { BlockOccurrence } from "./calendarApi";
import { buildWeekDates, formatHour, timeToMinutes, toIsoDate } from "./calendarDate";
import "./CalendarWeekView.css";

const GRID_START_MINUTES = 5 * 60; // 5 AM
const GRID_END_MINUTES = 23 * 60; // 11 PM
const GRID_RANGE_MINUTES = GRID_END_MINUTES - GRID_START_MINUTES;
const HOUR_MARKS = Array.from({ length: 19 }, (_, index) => 5 + index); // 5..23
const MIN_EVENT_HEIGHT_PERCENT = 3;
/** How tall a scheduled task's chip renders on the grid — tasks carry no duration of their own
 * (unlike a block occurrence), so every one gets the same short, fixed visual height.
 */
const SCHEDULED_TASK_DISPLAY_MINUTES = 30;

const WEEKDAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function positionStyle(startTime: string, durationMinutes: number): CSSProperties {
  const start = timeToMinutes(startTime);
  const top = ((start - GRID_START_MINUTES) / GRID_RANGE_MINUTES) * 100;
  const height = Math.max((durationMinutes / GRID_RANGE_MINUTES) * 100, MIN_EVENT_HEIGHT_PERCENT);
  return { top: `${top}%`, height: `${height}%` };
}

function occurrenceStyle(occurrence: BlockOccurrence, colorIndex: number): CSSProperties {
  return {
    ...positionStyle(occurrence.startTime, occurrence.durationMinutes),
    background: blockColorVar(colorIndex),
    borderColor: blockColorStrongVar(colorIndex),
    color: blockColorStrongVar(colorIndex),
  };
}

type TimedTask = { task: Task; time: string };

/** Buckets tasks by the date they belong to, split into those with a precise scheduledAt
 * time-of-day (positioned on the timed grid) and those with only a dueDate (rendered as an
 * all-day chip instead) — computed once per render rather than re-derived per day column.
 */
function bucketTasksByDate(tasks: Task[]): {
  timedByDate: Map<string, TimedTask[]>;
  allDayByDate: Map<string, Task[]>;
} {
  const timedByDate = new Map<string, TimedTask[]>();
  const allDayByDate = new Map<string, Task[]>();
  for (const task of tasks) {
    if (task.scheduledAt) {
      const [dateOnly, time] = task.scheduledAt.split("T");
      const bucket = timedByDate.get(dateOnly) ?? [];
      bucket.push({ task, time });
      timedByDate.set(dateOnly, bucket);
    } else if (task.dueDate) {
      const bucket = allDayByDate.get(task.dueDate) ?? [];
      bucket.push(task);
      allDayByDate.set(task.dueDate, bucket);
    }
  }
  return { timedByDate, allDayByDate };
}

type CalendarWeekViewProps = {
  weekStartIso: string;
  occurrences: BlockOccurrence[];
  tasks: Task[];
  templateColorIndex: Map<string, number>;
  /** Maps a real occurrence's id to its nested tasks' completed/total counts — drives the small
   * "X/Y" corner marker on that occurrence's own box. A still-projected occurrence has no entry
   * here (its synthetic id never appears as any task's blockId), so it renders no marker.
   */
  blockCompletionByOccurrenceId: Map<string, { completed: number; total: number }>;
  /** Clicking one occurrence opens its own BlockOccurrenceDetailPane (editing that one date only)
   * — a template's own shape is instead edited from the left sidebar's Blocks card.
   */
  onSelectOccurrence: (occurrence: BlockOccurrence) => void;
  onSelectTask: (taskId: string) => void;
};

/** The calendar's week view: a 7-column, hour-gridded canvas (5 AM-11 PM) with one positioned
 * event per block occurrence (real or projected, colored consistently per template via
 * app/blocks/blockColor.ts) plus every scheduled task, positioned the same way at its
 * scheduledAt time-of-day. A task with only a dueDate (no precise time) renders as an all-day
 * chip in a strip above the timed grid instead of being positioned within it. Block-nested tasks
 * never reach this component at all (the caller excludes them) — they show nested under their
 * block in the left sidebar's Blocks card instead, and each occurrence's own box shows a small
 * completed/total marker in its corner in place of listing them here.
 */
export function CalendarWeekView({
  weekStartIso,
  occurrences,
  tasks,
  templateColorIndex,
  blockCompletionByOccurrenceId,
  onSelectOccurrence,
  onSelectTask,
}: CalendarWeekViewProps) {
  const weekDates = buildWeekDates(weekStartIso);
  const todayIso = toIsoDate(new Date());
  const { timedByDate, allDayByDate } = bucketTasksByDate(tasks);

  return (
    <div className="cg-calendar-week-view">
      <div className="cg-calendar-week-view__header">
        <span className="cg-calendar-week-view__gutter" />
        {weekDates.map((dateIso, index) => (
          <span
            key={dateIso}
            className={
              dateIso === todayIso
                ? "cg-calendar-week-view__day-label cg-calendar-week-view__day-label--today"
                : "cg-calendar-week-view__day-label"
            }
          >
            {WEEKDAY_LABELS[index]} {Number(dateIso.slice(8))}
          </span>
        ))}
      </div>
      <div className="cg-calendar-week-view__all-day-row">
        <span className="cg-calendar-week-view__gutter">
          <span className="cg-calendar-week-view__gutter-label">All-day</span>
        </span>
        {weekDates.map((dateIso) => (
          <div className="cg-calendar-week-view__all-day-cell" key={dateIso}>
            {(allDayByDate.get(dateIso) ?? []).map((task) => (
              <button
                type="button"
                key={task.id}
                className="cg-calendar-week-view__all-day-chip"
                onClick={() => onSelectTask(task.id)}
              >
                <TaskTitle task={task} />
              </button>
            ))}
          </div>
        ))}
      </div>
      <div className="cg-calendar-week-view__body">
        {HOUR_MARKS.map((hour) => (
          <span
            key={hour}
            className="cg-calendar-week-view__hour-line"
            style={{ top: `${((hour * 60 - GRID_START_MINUTES) / GRID_RANGE_MINUTES) * 100}%` }}
            aria-hidden="true"
          />
        ))}
        <div className="cg-calendar-week-view__gutter">
          {HOUR_MARKS.map((hour) => (
            <span
              key={hour}
              className="cg-calendar-week-view__hour-mark"
              style={{ top: `${((hour * 60 - GRID_START_MINUTES) / GRID_RANGE_MINUTES) * 100}%` }}
            >
              {formatHour(hour)}
            </span>
          ))}
        </div>
        {weekDates.map((dateIso) => (
          <div className="cg-calendar-week-view__day-column" key={dateIso}>
            {occurrences
              .filter((occurrence) => occurrence.date === dateIso)
              .map((occurrence) => {
                const completion = blockCompletionByOccurrenceId.get(occurrence.id);
                return (
                  <button
                    type="button"
                    key={occurrence.id}
                    className={
                      occurrence.isProjected
                        ? "cg-calendar-week-view__event cg-calendar-week-view__event--projected"
                        : "cg-calendar-week-view__event"
                    }
                    style={occurrenceStyle(
                      occurrence,
                      templateColorIndex.get(occurrence.templateId) ?? 0,
                    )}
                    onClick={() => onSelectOccurrence(occurrence)}
                  >
                    <span className="cg-calendar-week-view__event-title">{occurrence.title}</span>
                    <span className="cg-calendar-week-view__event-time">
                      {occurrence.startTime}
                    </span>
                    {completion && completion.total > 0 && (
                      <span className="cg-calendar-week-view__event-completion">
                        {completion.completed}/{completion.total}
                      </span>
                    )}
                  </button>
                );
              })}
            {(timedByDate.get(dateIso) ?? []).map(({ task, time }) => (
              <button
                type="button"
                key={task.id}
                className="cg-calendar-week-view__task-chip"
                style={positionStyle(time, SCHEDULED_TASK_DISPLAY_MINUTES)}
                onClick={() => onSelectTask(task.id)}
              >
                <TaskTitle task={task} />
              </button>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
