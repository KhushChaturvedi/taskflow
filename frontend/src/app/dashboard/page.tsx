"use client";

import { googleLogout } from "@react-oauth/google";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import Avatar from "@/components/Avatar";
import CreateTaskModal from "@/components/CreateTaskModal";
import TaskCard from "@/components/TaskCard";
import { getTasks, getUsers, TaskView } from "@/lib/api";
import { clearSession, getToken, getUser } from "@/lib/auth";
import { Task, TaskStatus, User } from "@/lib/types";

type StatusFilter = "all" | TaskStatus;

const tabs: { value: TaskView; label: string }[] = [
  { value: "all", label: "All tasks" },
  { value: "assigned", label: "Assigned to me" },
  { value: "created", label: "Created by me" },
];

export default function DashboardPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [view, setView] = useState<TaskView>("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showCreate, setShowCreate] = useState(false);

  useEffect(() => {
    const user = getUser();
    if (!getToken() || !user) {
      router.replace("/");
      return;
    }
    setCurrentUser(user);
    getUsers()
      .then((res) => setUsers(res.users))
      .catch(() => setUsers([]));
  }, [router]);

  const loadTasks = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const { tasks } = await getTasks(view);
      setTasks(tasks);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load tasks");
      if (!getToken()) router.replace("/");
    } finally {
      setLoading(false);
    }
  }, [view, router]);

  useEffect(() => {
    if (currentUser) loadTasks();
  }, [currentUser, loadTasks]);

  function handleLogout() {
    googleLogout();
    clearSession();
    router.replace("/");
  }

  function handleCreated() {
    setShowCreate(false);
    loadTasks();
  }

  function handleUpdated(updated: Task) {
    setTasks((prev) =>
      prev.map((task) => (task.id === updated.id ? updated : task)),
    );
  }

  function handleDeleted(taskId: string) {
    setTasks((prev) => prev.filter((task) => task.id !== taskId));
  }

  if (!currentUser) return null;

  const today = new Date().toISOString().split("T")[0];
  const pendingCount = tasks.filter((task) => task.status === "pending").length;
  const completedCount = tasks.filter(
    (task) => task.status === "completed",
  ).length;
  const overdueCount = tasks.filter(
    (task) =>
      task.status === "pending" && task.due_date && task.due_date < today,
  ).length;

  const visibleTasks =
    statusFilter === "all"
      ? tasks
      : tasks.filter((task) => task.status === statusFilter);

  const stats = [
    { label: "Total", value: tasks.length, color: "text-slate-900" },
    { label: "Pending", value: pendingCount, color: "text-amber-600" },
    { label: "Completed", value: completedCount, color: "text-emerald-600" },
    { label: "Overdue", value: overdueCount, color: "text-red-600" },
  ];

  const firstName = (currentUser.name || currentUser.email).split(" ")[0];

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
          <div className="flex items-center gap-2 text-lg font-semibold text-indigo-600">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-sm text-white">
              ✓
            </span>
            TaskFlow
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-medium">{currentUser.name}</p>
              <p className="text-xs text-slate-500">{currentUser.email}</p>
            </div>
            <Avatar user={currentUser} size="md" />
            <button
              onClick={handleLogout}
              className="rounded-lg px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-100"
            >
              Log out
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Hi {firstName} 👋</h1>
            <p className="mt-1 text-sm text-slate-500">
              Here's what's on your plate.
            </p>
          </div>
          <button
            onClick={() => setShowCreate(true)}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700"
          >
            + New task
          </button>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="rounded-2xl border border-slate-200 bg-white p-4"
            >
              <p className="text-xs font-medium text-slate-500">{stat.label}</p>
              <p className={`mt-1 text-2xl font-semibold ${stat.color}`}>
                {stat.value}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="inline-flex w-fit rounded-xl bg-slate-100 p-1">
            {tabs.map((tab) => (
              <button
                key={tab.value}
                onClick={() => setView(tab.value)}
                className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                  view === tab.value
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
            className="w-fit rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
          >
            <option value="all">Any status</option>
            <option value="pending">Pending</option>
            <option value="completed">Completed</option>
          </select>
        </div>

        {error && (
          <p className="mt-6 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
            {error}
          </p>
        )}

        <div className="mt-6">
          {loading ? (
            <div className="grid gap-4 md:grid-cols-2">
              {[1, 2, 3, 4].map((n) => (
                <div
                  key={n}
                  className="h-44 animate-pulse rounded-2xl bg-slate-200/60"
                />
              ))}
            </div>
          ) : visibleTasks.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
              <p className="font-medium text-slate-700">No tasks here yet</p>
              <p className="mt-1 text-sm text-slate-500">
                {view === "assigned"
                  ? "Nothing has been assigned to you."
                  : "Create a task and assign it to someone to get started."}
              </p>
              <button
                onClick={() => setShowCreate(true)}
                className="mt-5 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
              >
                + New task
              </button>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {visibleTasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  currentUserId={currentUser.id}
                  users={users}
                  onUpdated={handleUpdated}
                  onDeleted={handleDeleted}
                />
              ))}
            </div>
          )}
        </div>
      </main>

      {showCreate && (
        <CreateTaskModal
          users={users}
          currentUserId={currentUser.id}
          onClose={() => setShowCreate(false)}
          onCreated={handleCreated}
        />
      )}
    </div>
  );
}
