from supabase import create_client, Client
from app.config import Config

supabase: Client = create_client(Config.SUPABASE_URL, Config.SUPABASE_SECRET_KEY)
