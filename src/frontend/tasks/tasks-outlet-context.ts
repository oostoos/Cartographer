import type { TTask } from "./types";

export interface ITasksOutletContext {
  tasks: TTask[];
  onTaskUpdated: (task: TTask) => void;
}
