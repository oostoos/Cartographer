// Mirrors src/main/backend/database/models.py's Group dataclass — keep in sync.
export type TGroup = {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
  order: number;
};
