// Mirrors src/main/backend/database/models.py's Project dataclass — keep in sync.
export type TProject = {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
  order: number;
};
