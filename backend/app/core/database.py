from supabase import create_client, Client
from google import genai
from app.core.config import settings

supabase: Client = create_client(settings.SUPABASE_URL, settings.SUPABASE_KEY)
client = genai.Client(api_key=settings.GOOGLE_API_KEY)