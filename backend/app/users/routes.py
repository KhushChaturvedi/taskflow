from flask import Blueprint, jsonify

from app.auth.utils import login_required
from app.db import supabase

users_bp = Blueprint("users", __name__, url_prefix="/users")


@users_bp.get("")
@login_required
def list_users():
    result = (
        supabase.table("users")
        .select("id, email, name, avatar_url")
        .order("name")
        .execute()
    )
    return jsonify({"users": result.data}), 200
