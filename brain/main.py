from fastapi import FastAPI, HTTPException, Header, Depends, UploadFile, File, Form
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from supabase import create_client, Client
from google import genai
from google.genai import types
import os
import json
import base64
import io
import random
import time
from PIL import Image
from pdf2image import convert_from_bytes
from dotenv import load_dotenv

# .env ෆයිල් එක ලෝඩ් කරනවා
load_dotenv()

app = FastAPI(title="My Guru Brain API")

# --- CORS (Frontend එකට Access දෙනවා) ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- KEYS ---
API_KEYS = [
    "AIzaSyA2Wy_hsYL8BuWPO5Sn9Bk4YNiNtjwnqmI",
    "AIzaSyANOxqfVJkyJWdrH7aJ6E64T41-_prrWZ4",
    "AIzaSyCMxhwBfJc8WQ-DtTyabi3hbyjDYKZFe7A",
    "AIzaSyDodD4f4rcUZuEl93zMCy_waRZZeiWRlTo",
    "AIzaSyAus-kuUo1jM8U1yU202YqB6604qq4kAiY",
    "AIzaSyA3h24AdZGHR-Ip-cC0Iez8AjDcpBrx3O0",
    "AIzaSyB7g8ETokT3eUkXzhdxoi3LcGysIthdXRg",
    "AIzaSyBWWqNNdU9suL9hnHHIV5uPvJDVgh9g6FQ",
    "AIzaSyD2hr_U0vFPJVrH9Na190oz9NOie1hb_fI",
    "AIzaSyAoP6llfIbWEGZdsaoIVj-ohJc2_Ahpqx0",
    "AIzaSyD6qSt3Cjb7tPtoPLc0KXp-MLPZdKpk0QQ"
]

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# --- HELPER FUNCTIONS ---
def get_random_client():
    return genai.Client(api_key=random.choice(API_KEYS))

def safe_google_api_call(contents, is_json=False):
    start_index = random.randint(0, len(API_KEYS) - 1)
    for i in range(len(API_KEYS)):
        current_key = API_KEYS[(start_index + i) % len(API_KEYS)]
        try:
            client = genai.Client(api_key=current_key)
            config = types.GenerateContentConfig(response_mime_type="application/json") if is_json else None
            response = client.models.generate_content(
                model='gemini-2.0-flash',
                contents=contents,
                config=config
            )
            return response
        except Exception as e:
            if "429" in str(e) or "503" in str(e): continue
            print(f"⚠️ Key Error: {e}")
    return None

class ChatRequest(BaseModel):
    question: str
    subject: str
    medium: str
    image_data: str | None = None

class DeleteRequest(BaseModel):
    ids: list[int]

# --- BRAIN LOGIC ---
def generate_smart_answer(context, question, subject, medium, img=None):
    context_text = ""
    if context:
        for item in context:
            meta = item.get('metadata', {})
            context_text += f"\n[SOURCE: {meta.get('category')} | Grade {meta.get('grade')}]\n{item.get('content', '')}\n---"
    
    # 🔥 UPDATED PROMPT FOR STRICTER CONTROL
    prompt = f"""
    You are an expert Sri Lankan School Teacher (My Guru) for O/L and A/L students.
    
    SETTINGS:
    - Subject: {subject}
    - TARGET MEDIUM: {medium} (You MUST reply in this language only).
    
    CONTEXT (Database Notes):
    {context_text if context_text else "No specific database notes found. Use your internal knowledge matching the Sri Lankan curriculum."}
    
    QUESTION:
    {question}
    
    STRICT INSTRUCTIONS:
    1. **Medium Enforcement:** If the user selected '{medium}', your ENTIRE response must be in {medium}. Even if the question is in a different language, TRANSLATE your answer to {medium}.
    2. **Accuracy:** Base your answer primarily on the provided CONTEXT. If context is missing, use general knowledge but ensure it aligns 100% with the Sri Lankan school syllabus. Do not give university-level complex answers for O/L students.
    3. **Formatting:** - DO NOT use Markdown bolding stars (like **this**). It looks messy. 
       - Use clean paragraphs and bullet points (-). 
       - You can use a few relevant emojis to make it friendly, but don't overdo it.
    4. **Tone:** Friendly, encouraging (call the student "Puthe" or "Duwa" appropriately if answering in Sinhala), but professional.
    """
    
    contents = [prompt]
    if img: contents.extend([img, "Analyze this image step-by-step based on the subject context."])
    
    res = safe_google_api_call(contents)
    return res.text if res else "System busy. Please try again."

# --- ENDPOINTS ---
@app.post("/chat")
async def chat_endpoint(request: ChatRequest):
    print(f"📩 Question: {request.question} | Subject: {request.subject} | Medium: {request.medium}")
    
    kw_prompt = f'Extract keywords from "{request.question}" in English and Sinhala. Output JSON Array: ["kw1", "kw2"]'
    kw_res = safe_google_api_call(kw_prompt, is_json=True)
    keywords = []
    try:
        if kw_res: keywords = json.loads(kw_res.text.strip().replace('```json', '').replace('```', ''))
    except: pass
    
    img = None
    if request.image_data:
        try:
            if "base64," in request.image_data: base64_str = request.image_data.split("base64,")[1]
            else: base64_str = request.image_data
            img = Image.open(io.BytesIO(base64.b64decode(base64_str)))
        except: pass

    ctx = []
    seen = set()
    # Increased context search limit to 5 for better coverage
    if keywords:
        for k in keywords:
            query = supabase.table("documents").select("content, metadata").eq("metadata->>subject", request.subject).ilike("content", f"%{k}%").limit(5)
            res = query.execute()
            for item in res.data:
                if item['content'] not in seen:
                    ctx.append(item)
                    seen.add(item['content'])
            if len(ctx) >= 7: break # Collect up to 7 chunks for thoroughness
            
    print(f"📚 Found {len(ctx)} context items.")

    ans = generate_smart_answer(ctx, request.question, request.subject, request.medium, img)
    return {"answer": ans}

@app.delete("/knowledge/delete")
async def delete_knowledge(payload: DeleteRequest):
    if not payload.ids: return {"message": "No IDs"}
    response = supabase.table("documents").delete().in_("id", payload.ids).execute()
    return {"message": "Deleted", "data": response.data}

@app.post("/ingest")
async def ingest_pdf(
    pdf: UploadFile = File(...),
    grade: str = Form(...),
    subject: str = Form(...),
    medium: str = Form(...),
    category: str = Form(...),
    startPage: int = Form(...),
    endPage: int = Form(...)
):
    async def process_stream():
        yield f"✅ Started Ingestion: {subject}\n"
        try:
            pdf_bytes = await pdf.read()
            images = convert_from_bytes(pdf_bytes, first_page=startPage, last_page=endPage, dpi=300)
            
            for i, image in enumerate(images):
                page_num = startPage + i
                client = get_random_client()
                prompt = f"Extract all text/diagrams. Language: {medium}. Keep structure. Do NOT summarize."
                
                try:
                    response = client.models.generate_content(model='gemini-2.0-flash', contents=[image, prompt])
                    supabase.table("documents").insert({
                        "content": response.text,
                        "metadata": {"grade": grade, "subject": subject, "medium": medium, "category": category, "page": page_num}
                    }).execute()
                    yield f"✅ Page {page_num} Saved!\n"
                except Exception as e:
                    yield f"❌ Error Page {page_num}: {e}\n"
                    time.sleep(1)
        except Exception as e:
             yield f"❌ Critical Error: {e}\n"
        yield "🎉 Complete!"
    return StreamingResponse(process_stream(), media_type="text/plain")