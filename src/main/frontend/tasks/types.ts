// Mirrors src/main/backend/database/models.py's Task dataclass — keep in sync.
export type TTask = {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
  order: number;
  group_id: string | null;
};
