import uuid
from datetime import date, datetime, timezone

from flask import Blueprint, g, jsonify, request

from app.auth.utils import login_required
from app.db import supabase
from app.services.email_service import (
    notify_task_assigned,
    notify_task_completed,
    notify_task_created,
)

tasks_bp = Blueprint("tasks", __name__, url_prefix="/tasks")

TASK_SELECT = (
    "*, "
    "creator:users!tasks_created_by_fkey(id, name, email, avatar_url), "
    "assignee:users!tasks_assigned_to_fkey(id, name, email, avatar_url)"
)


def _now_iso():
    return datetime.now(timezone.utc).isoformat()


def _is_uuid(value):
    try:
        uuid.UUID(str(value))
        return True
    except ValueError:
        return False


def _get_user(user_id):
    result = (
        supabase.table("users")
        .select("id, name, email, avatar_url")
        .eq("id", user_id)
        .limit(1)
        .execute()
    )
    return result.data[0] if result.data else None


def _get_task(task_id):
    result = (
        supabase.table("tasks").select(TASK_SELECT).eq("id", task_id).limit(1).execute()
    )
    return result.data[0] if result.data else None


def _parse_due_date(value):
    if value in (None, ""):
        return None, None
    try:
        return date.fromisoformat(str(value)).isoformat(), None
    except ValueError:
        return None, "due_date must be in YYYY-MM-DD format"


@tasks_bp.get("")
@login_required
def list_tasks():
    view = request.args.get("view", "all")
    query = supabase.table("tasks").select(TASK_SELECT)

    if view == "created":
        query = query.eq("created_by", g.user_id)
    elif view == "assigned":
        query = query.eq("assigned_to", g.user_id)
    else:
        query = query.or_(f"created_by.eq.{g.user_id},assigned_to.eq.{g.user_id}")

    result = query.order("created_at", desc=True).execute()
    return jsonify({"tasks": result.data}), 200


@tasks_bp.post("")
@login_required
def create_task():
    data = request.get_json(silent=True) or {}
    title = str(data.get("title") or "").strip()
    description = str(data.get("description") or "").strip() or None
    assigned_to = data.get("assigned_to") or None

    if not title:
        return jsonify({"error": "Title is required"}), 400
    if len(title) > 200:
        return jsonify({"error": "Title must be 200 characters or fewer"}), 400

    due_date, error = _parse_due_date(data.get("due_date"))
    if error:
        return jsonify({"error": error}), 400

    assignee = None
    if assigned_to:
        if not _is_uuid(assigned_to):
            return jsonify({"error": "Invalid assigned_to user id"}), 400
        assignee = _get_user(assigned_to)
        if not assignee:
            return jsonify({"error": "Assigned user not found"}), 404

    inserted = (
        supabase.table("tasks")
        .insert(
            {
                "title": title,
                "description": description,
                "due_date": due_date,
                "created_by": g.user_id,
                "assigned_to": assigned_to,
            }
        )
        .execute()
    )

    task = _get_task(inserted.data[0]["id"])

    if assignee:
        notify_task_assigned(task, assignee, task["creator"])
    else:
        notify_task_created(task, task["creator"])

    return jsonify({"task": task}), 201


@tasks_bp.patch("/<uuid:task_id>/assign")
@login_required
def assign_task(task_id):
    task = _get_task(str(task_id))
    if not task:
        return jsonify({"error": "Task not found"}), 404
    if task["created_by"] != g.user_id:
        return jsonify({"error": "Only the task creator can assign this task"}), 403
    if task["status"] == "completed":
        return jsonify({"error": "Completed tasks cannot be reassigned"}), 400

    data = request.get_json(silent=True) or {}
    assigned_to = data.get("assigned_to")
    if not assigned_to or not _is_uuid(assigned_to):
        return jsonify({"error": "A valid assigned_to user id is required"}), 400

    assignee = _get_user(assigned_to)
    if not assignee:
        return jsonify({"error": "Assigned user not found"}), 404

    supabase.table("tasks").update(
        {"assigned_to": assigned_to, "updated_at": _now_iso()}
    ).eq("id", str(task_id)).execute()

    task = _get_task(str(task_id))
    notify_task_assigned(task, assignee, task["creator"])
    return jsonify({"task": task}), 200


@tasks_bp.patch("/<uuid:task_id>/complete")
@login_required
def complete_task(task_id):
    task = _get_task(str(task_id))
    if not task:
        return jsonify({"error": "Task not found"}), 404
    if g.user_id not in (task["created_by"], task["assigned_to"]):
        return jsonify({"error": "You are not allowed to complete this task"}), 403
    if task["status"] == "completed":
        return jsonify({"error": "Task is already completed"}), 400

    now = _now_iso()
    supabase.table("tasks").update(
        {"status": "completed", "completed_at": now, "updated_at": now}
    ).eq("id", str(task_id)).execute()

    task = _get_task(str(task_id))
    completer = _get_user(g.user_id)
    notify_task_completed(task, task["creator"], completer)
    return jsonify({"task": task}), 200


@tasks_bp.delete("/<uuid:task_id>")
@login_required
def delete_task(task_id):
    task = _get_task(str(task_id))
    if not task:
        return jsonify({"error": "Task not found"}), 404
    if task["created_by"] != g.user_id:
        return jsonify({"error": "Only the task creator can delete this task"}), 403

    supabase.table("tasks").delete().eq("id", str(task_id)).execute()
    return jsonify({"message": "Task deleted"}), 200
