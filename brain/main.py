from fastapi import FastAPI, HTTPException, Header, Depends, UploadFile, File, Form, Request
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
# .env එකෙන් GEMINI_API_KEYS අරගෙන list එකක් විදිහට හදාගන්නවා
keys_string = os.getenv("GEMINI_API_KEYS", "")
API_KEYS = [k.strip() for k in keys_string.split(",") if k.strip()]

if not API_KEYS:
    print("⚠️ WARNING: No API Keys found in .env file!")

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# --- HELPER FUNCTIONS ---
def get_random_client():
    return genai.Client(api_key=random.choice(API_KEYS))

def safe_google_api_call(contents, is_json=False):
    if not API_KEYS:
        print("⚠️ Error: API Keys array is empty.")
        return None
        
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

# 🔥 අලුත් Delete Pages Request Model එක
class DeletePagesRequest(BaseModel):
    subject: str
    grade: str | int
    medium: str
    category: str
    pages: list[int]

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

# 🔥 අලුත් Delete Pages Endpoint එක
@app.post("/knowledge/delete_pages")
async def delete_knowledge_pages(payload: DeletePagesRequest):
    try:
        print(f"🗑️ Delete Request - Subject: {payload.subject}, Pages: {payload.pages}")
        
        # 1. Subject සහ Medium වලට අදාල ඔක්කොම records ටික Database එකෙන් ගන්නවා
        query = supabase.table("documents").select("id, metadata") \
            .eq("metadata->>subject", payload.subject) \
            .eq("metadata->>medium", payload.medium)
        
        res = query.execute()
        
        ids_to_delete = []
        
        # 2. Python වලින්ම Page එක සහ Grade එක හරියටම match වෙනවද කියලා check කරනවා
        for item in res.data:
            meta = item.get("metadata", {})
            
            # String ද Number ද අදාල නෑ, දෙකම එකම ජාතියට හරවලා බලනවා
            is_grade_match = str(meta.get("grade")) == str(payload.grade)
            is_page_match = int(meta.get("page", -1)) in payload.pages
            
            if is_grade_match and is_page_match:
                ids_to_delete.append(item["id"])
        
        print(f"🔍 Found {len(ids_to_delete)} exact records to delete.")
        
        # 3. හොයාගත්තු IDs ටික Database එකෙන් මකලා දානවා
        if ids_to_delete:
            del_res = supabase.table("documents").delete().in_("id", ids_to_delete).execute()
            print(f"✅ Successfully deleted {len(del_res.data)} records from Supabase.")
            
        return {"message": "Pages deleted successfully", "deleted_count": len(ids_to_delete)}
    except Exception as e:
        print(f"❌ Delete Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))



@app.post("/ingest")
async def ingest_pdf(
    request: Request,
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
                # 🔥 User stop කරා නම් සම්පූර්ණයෙන්ම loop එකෙන් සහ function එකෙන් එළියට යනවා
                if await request.is_disconnected():
                    print("🛑 Client Disconnected. Force stopping backend extraction.")
                    return 

                page_num = startPage + i
                prompt = f"Extract all text/diagrams. Language: {medium}. Keep structure. Do NOT summarize."
                
                success = False
                for attempt in range(3):
                    client = get_random_client()
                    try:
                        if i > 0 or attempt > 0:
                            time.sleep(4) 
                            
                        response = client.models.generate_content(model='gemini-2.0-flash', contents=[image, prompt])
                        
                        supabase.table("documents").insert({
                            "content": response.text,
                            "metadata": {"grade": grade, "subject": subject, "medium": medium, "category": category, "page": page_num}
                        }).execute()
                        
                        # 🔥 Content එකේ මුල් අකුරු 60 Preview එකක් විදිහට යවනවා
                        snippet = response.text[:60].replace('\n', ' ') + "..."
                        yield f"✅ Page {page_num} Saved! [Preview: {snippet}]\n"
                        
                        success = True
                        break 
                        
                    except Exception as api_err:
                        err_str = str(api_err)
                        if "429" in err_str or "503" in err_str:
                            yield f"⚠️ API Limit hit on Page {page_num}. Retrying... ({attempt+1}/3)\n"
                            time.sleep(5) 
                        else:
                            yield f"❌ Database/API Error Page {page_num}: {err_str}\n"
                            break 
                            
                if not success:
                    yield f"❌ Failed to process Page {page_num} after retries.\n"

        except Exception as e:
             yield f"❌ Critical Error: {e}\n"
        yield "🎉 Complete!"
        
    return StreamingResponse(process_stream(), media_type="text/plain")