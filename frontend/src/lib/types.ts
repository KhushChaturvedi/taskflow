export type User = {
  id: string;
  email: string;
  name: string | null;
  avatar_url: string | null;
};

export type TaskStatus = "pending" | "completed";

export type Task = {
  id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  due_date: string | null;
  created_by: string;
  assigned_to: string | null;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
  creator: User;
  assignee: User | null;
};
