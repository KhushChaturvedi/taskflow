import os
from dotenv import load_dotenv

load_dotenv()


class Config:

    SUPABASE_URL = os.getenv("SUPABASE_URL")
    SUPABASE_SECRET_KEY = os.getenv("SUPABASE_SECRET_KEY")

    GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID")
    GOOGLE_CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET")

    GMAIL_REFRESH_TOKEN = os.getenv("GMAIL_REFRESH_TOKEN")
    GMAIL_SENDER_EMAIL = os.getenv("GMAIL_SENDER_EMAIL")

    JWT_SECRET = os.getenv("JWT_SECRET")
    JWT_EXPIRES_HOURS = 24

    FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:3000")

    @classmethod
    def validate(cls):
        required = [
            "SUPABASE_URL",
            "SUPABASE_SECRET_KEY",
            "GOOGLE_CLIENT_ID",
            "GOOGLE_CLIENT_SECRET",
            "GMAIL_REFRESH_TOKEN",
            "GMAIL_SENDER_EMAIL",
            "JWT_SECRET",
        ]

        missing = [name for name in required if not getattr(cls, name)]
        if missing:
            raise RuntimeError(f"Missing Enviornment Variables: {', '.join(missing)}")
