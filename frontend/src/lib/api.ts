import { clearSession, getToken } from "./auth";
import { Task, User } from "./types";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();

  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  const data = await res.json().catch(() => ({}));

  if (res.status === 401) {
    clearSession();
  }

  if (!res.ok) {
    throw new Error(data.error || "Something went wrong");
  }

  return data as T;
}

export function loginWithGoogle(credential: string) {
  return request<{ token: string; user: User }>("/auth/google", {
    method: "POST",
    body: JSON.stringify({ credential }),
  });
}

export function getUsers() {
  return request<{ users: User[] }>("/users");
}

export type TaskView = "all" | "created" | "assigned";

export function getTasks(view: TaskView = "all") {
  return request<{ tasks: Task[] }>(`/tasks?view=${view}`);
}

export type NewTask = {
  title: string;
  description?: string;
  due_date?: string;
  assigned_to?: string;
};

export function createTask(task: NewTask) {
  return request<{ task: Task }>("/tasks", {
    method: "POST",
    body: JSON.stringify(task),
  });
}

export function assignTask(taskId: string, userId: string) {
  return request<{ task: Task }>(`/tasks/${taskId}/assign`, {
    method: "PATCH",
    body: JSON.stringify({ assigned_to: userId }),
  });
}

export function completeTask(taskId: string) {
  return request<{ task: Task }>(`/tasks/${taskId}/complete`, {
    method: "PATCH",
  });
}

export function deleteTask(taskId: string) {
  return request<{ message: string }>(`/tasks/${taskId}`, {
    method: "DELETE",
  });
}
