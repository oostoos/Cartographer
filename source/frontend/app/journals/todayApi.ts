import { apiGet } from "../../core/api/apiClient";
import type { Task } from "../tasks/taskApi";

export type TodayView = {
  date: string;
  recurringTasks: Task[];
  dueTasks: Task[];
  backburnerTasks: Task[];
};

/** Reads today's view — recurring tasks due today, ad-hoc tasks due or overdue, and ad-hoc tasks
 * with no due date (backburner) — generating today's recurring instances on the backend first if
 * they don't already exist.
 */
export function fetchTodaysView(): Promise<TodayView> {
  return apiGet<TodayView>("/api/today");
}
