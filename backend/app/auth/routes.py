from flask import Blueprint, g, jsonify, request
from google.auth.transport import requests as google_requests
from google.oauth2 import id_token

from app.auth.utils import create_access_token, login_required
from app.config import Config
from app.db import supabase

auth_bp = Blueprint("auth", __name__, url_prefix="/auth")


@auth_bp.post("/google")
def google_login():
    data = request.get_json(silent=True) or {}
    credential = data.get("credential")
    if not credential:
        return jsonify({"error": "Missing Google credential"}), 400

    try:
        google_user = id_token.verify_oauth2_token(
            credential, google_requests.Request(), Config.GOOGLE_CLIENT_ID
        )
    except ValueError:
        return jsonify({"error": "Invalid Google token"}), 401

    if not google_user.get("email_verified"):
        return jsonify({"error": "Google email is not verified"}), 401

    user_data = {
        "google_id": google_user["sub"],
        "email": google_user["email"],
        "name": google_user.get("name"),
        "avatar_url": google_user.get("picture"),
    }

    result = (
        supabase.table("users").upsert(user_data, on_conflict="google_id").execute()
    )
    user = result.data[0]

    token = create_access_token(user["id"])
    return jsonify({"token": token, "user": user}), 200


@auth_bp.get("/me")
@login_required
def get_me():
    result = supabase.table("users").select("*").eq("id", g.user_id).limit(1).execute()
    if not result.data:
        return jsonify({"error": "User not found"}), 404
    return jsonify({"user": result.data[0]}), 200
