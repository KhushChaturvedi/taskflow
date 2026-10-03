"use client";

import { useState } from "react";
import { assignTask, completeTask, deleteTask } from "@/lib/api";
import { Task, User } from "@/lib/types";
import Avatar from "./Avatar";

type Props = {
  task: Task;
  currentUserId: string;
  users: User[];
  onUpdated: (task: Task) => void;
  onDeleted: (taskId: string) => void;
};

function displayName(user: User | null, currentUserId: string) {
  if (!user) return "Unassigned";
  if (user.id === currentUserId) return "You";
  return user.name || user.email;
}

function formatDate(value: string) {
  return new Date(`${value}T00:00:00`).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function TaskCard({
  task,
  currentUserId,
  users,
  onUpdated,
  onDeleted,
}: Props) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [reassigning, setReassigning] = useState(false);

  const isCreator = task.created_by === currentUserId;
  const isAssignee = task.assigned_to === currentUserId;
  const isCompleted = task.status === "completed";
  const today = new Date().toISOString().split("T")[0];
  const isOverdue = !isCompleted && !!task.due_date && task.due_date < today;

  const canComplete = !isCompleted && (isCreator || isAssignee);
  const canAssign = !isCompleted && isCreator;
  const canDelete = isCreator;

  async function run(action: () => Promise<void>) {
    setBusy(true);
    setError("");
    try {
      await action();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  function handleComplete() {
    run(async () => {
      const { task: updated } = await completeTask(task.id);
      onUpdated(updated);
    });
  }

  function handleAssign(userId: string) {
    if (!userId) return;
    run(async () => {
      const { task: updated } = await assignTask(task.id, userId);
      onUpdated(updated);
      setReassigning(false);
    });
  }

  function handleDelete() {
    if (!confirm(`Delete "${task.title}"? This can't be undone.`)) return;
    run(async () => {
      await deleteTask(task.id);
      onDeleted(task.id);
    });
  }

  return (
    <div
      className={`flex flex-col rounded-2xl border bg-white p-5 shadow-sm transition hover:shadow-md ${
        isOverdue ? "border-red-200" : "border-slate-200"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <h3
          className={`font-semibold leading-snug ${isCompleted ? "text-slate-400 line-through" : "text-slate-900"}`}
        >
          {task.title}
        </h3>
        <span
          className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${
            isCompleted
              ? "bg-emerald-50 text-emerald-700"
              : "bg-amber-50 text-amber-700"
          }`}
        >
          {isCompleted ? "Completed" : "Pending"}
        </span>
      </div>

      {task.description && (
        <p className="mt-2 line-clamp-3 whitespace-pre-line text-sm text-slate-600">
          {task.description}
        </p>
      )}

      {(task.due_date || task.completed_at) && (
        <div className="mt-4 flex flex-wrap gap-2 text-xs">
          {task.due_date && (
            <span
              className={`rounded-md px-2 py-1 ${isOverdue ? "bg-red-50 text-red-600" : "bg-slate-100 text-slate-600"}`}
            >
              {isOverdue ? "Overdue · " : "Due "}
              {formatDate(task.due_date)}
            </span>
          )}
          {task.completed_at && (
            <span className="rounded-md bg-emerald-50 px-2 py-1 text-emerald-700">
              Done {formatDate(task.completed_at.split("T")[0])}
            </span>
          )}
        </div>
      )}

      <div className="mt-auto pt-4">
        <div className="flex items-center gap-3 border-t border-slate-100 pt-4">
          <div className="flex min-w-0 items-center gap-2">
            <Avatar user={task.creator} />
            <div className="min-w-0 text-xs">
              <p className="text-slate-400">From</p>
              <p className="truncate font-medium text-slate-700">
                {displayName(task.creator, currentUserId)}
              </p>
            </div>
          </div>

          <span className="text-slate-300">→</span>

          <div className="flex min-w-0 items-center gap-2">
            <Avatar user={task.assignee} />
            <div className="min-w-0 text-xs">
              <p className="text-slate-400">To</p>
              <p className="truncate font-medium text-slate-700">
                {displayName(task.assignee, currentUserId)}
              </p>
            </div>
          </div>
        </div>

        {reassigning && (
          <select
            autoFocus
            defaultValue=""
            disabled={busy}
            onChange={(e) => handleAssign(e.target.value)}
            className="mt-3 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
          >
            <option value="" disabled>
              Choose a person...
            </option>
            {users
              .filter((user) => user.id !== task.assigned_to)
              .map((user) => (
                <option key={user.id} value={user.id}>
                  {user.id === currentUserId
                    ? `${user.name || user.email} (you)`
                    : user.name || user.email}
                </option>
              ))}
          </select>
        )}

        {error && <p className="mt-3 text-xs text-red-600">{error}</p>}

        {(canComplete || canAssign || canDelete) && (
          <div className="mt-4 flex flex-wrap items-center gap-2">
            {canComplete && (
              <button
                onClick={handleComplete}
                disabled={busy}
                className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
              >
                Mark complete
              </button>
            )}
            {canAssign && (
              <button
                onClick={() => setReassigning((value) => !value)}
                disabled={busy}
                className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
              >
                {reassigning
                  ? "Cancel"
                  : task.assigned_to
                    ? "Reassign"
                    : "Assign"}
              </button>
            )}
            {canDelete && (
              <button
                onClick={handleDelete}
                disabled={busy}
                className="ml-auto rounded-lg px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
              >
                Delete
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
