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

# --- CORS ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- KEYS ---
keys_string = os.getenv("GEMINI_API_KEYS", "").replace('"', '').replace("'", "")
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
        return None, "No API Keys found"
        
    start_index = random.randint(0, len(API_KEYS) - 1)
    last_err = ""
    
    for i in range(len(API_KEYS)):
        current_key = API_KEYS[(start_index + i) % len(API_KEYS)]
        try:
            client = genai.Client(api_key=current_key)
            
            config = types.GenerateContentConfig(
                response_mime_type="application/json" if is_json else None,
                safety_settings=[
                    types.SafetySetting(category="HARM_CATEGORY_HATE_SPEECH", threshold="BLOCK_NONE"),
                    types.SafetySetting(category="HARM_CATEGORY_HARASSMENT", threshold="BLOCK_NONE"),
                    types.SafetySetting(category="HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold="BLOCK_NONE"),
                    types.SafetySetting(category="HARM_CATEGORY_DANGEROUS_CONTENT", threshold="BLOCK_NONE"),
                ]
            )
            
            response = client.models.generate_content(
                model='gemini-2.0-flash',
                contents=contents,
                config=config
            )
            return response, None
            
        except Exception as e:
            err_str = str(e).lower()
            last_err = err_str
            if "429" in err_str or "503" in err_str or "quota" in err_str or "exhausted" in err_str: 
                time.sleep(0.5)
                continue
            print(f"❌ Core API Error: {err_str}")
            return None, err_str
            
    return None, f"All keys failed. Last error: {last_err}"

class ChatRequest(BaseModel):
    question: str
    subject: str
    medium: str
    image_data: str | None = None

class DeleteRequest(BaseModel):
    ids: list[int]

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
            category = meta.get('category', 'unknown').upper()
            context_text += f"\n[SOURCE: {category} | Grade {meta.get('grade')}]\n{item.get('content', '')}\n---"
    
    # 🔥 THE ABSOLUTE STRICT MASTER EXAMINER PROMPT
    prompt = f"""
    You are 'My Guru', the Ultimate Sri Lankan School Examiner and Master Teacher. Your absolute duty is to provide 100% complete, highly accurate, deeply elaborated, and beautifully structured answers.
    
    SUBJECT: {subject}
    TARGET MEDIUM: {medium}
    
    OFFICIAL CONTEXT (Marking Schemes & Textbooks):
    {context_text if context_text else "NO CONTEXT FETCHED. YOU MUST USE YOUR VAST INTERNAL KNOWLEDGE."}
    
    STUDENT'S QUESTION:
    {question}
    
    CRITICAL EXAMINER INSTRUCTIONS (READ CAREFULLY & FOLLOW STRICTLY OR YOU WILL BE PENALIZED):
    1. **THE "NEVER SAY NO" RULE (CRITICAL):** You MUST answer the question perfectly. If the OFFICIAL CONTEXT contains the answer (especially Marking Schemes), prioritize it. IF THE CONTEXT DOES NOT CONTAIN THE EXACT ANSWER, YOU MUST IMMEDIATELY USE YOUR OWN EXPERT AI KNOWLEDGE TO PROVIDE A PERFECT, SYLLABUS-ALIGNED ANSWER. NEVER, EVER say "Information is not provided", "තොරතුරු සපයා නැත", or "I don't know". 
    2. **COMPLETE COVERAGE:** Carefully read the question/image. If it contains multiple sub-parts like (i), (ii), (iii), (iv) or (අ), (ආ), (ඉ), YOU MUST ANSWER EVERY SINGLE PART. Do not skip or summarize sub-questions.
    3. **MANDATORY ELABORATION (NO LAZY ANSWERS):** Marking schemes contain short bullet points. You are FORBIDDEN from just pasting naked bullet points. You MUST explain, describe, and elaborate on *why* and *how* for each point. If the question says "විස්තර කරන්න" (Describe), "පැහැදිලි කරන්න" (Explain), or "සාකච්ඡා කරන්න" (Discuss), you MUST write highly detailed, rich paragraphs.
    4. **MCQ HANDLING:** If the question is a Multiple Choice Question (MCQ), clearly state the correct answer AND provide a detailed explanation of EXACTLY WHY it is correct and why the other options are wrong.
    5. **MULTI-LANGUAGE & FORMATTING:** Answer flawlessly in the language the student requested (Sinhala, English, or Tamil). Maintain a formal, educational tone.
       - If answering in Sinhala, ALWAYS start with: "හරි පුතේ, පිළිතුරු මෙන්න:"
       - Use appropriate spacing, sub-headings, and clear numbering.
    6. **FORBIDDEN WORDS:** - NEVER output words like: "පෙළපොතේ නැත", "සඳහන් කර නොමැත", "Marking Scheme", "ලකුණු දීමේ පටිපාටිය", (TEXTBOOK), [PAPER_MARKING]. Act as if the knowledge flows naturally from you.
       - NO Singlish (English words written in brackets) unless it is a globally accepted technical term.
    """
    
    contents = [prompt]
    if img: contents.extend([img, "Examine this image pixel by pixel. Read EVERY sub-question clearly. Answer EVERY sub-question accurately with deep elaboration based on the instructions."])
    
    res, err = safe_google_api_call(contents)
    
    if res and hasattr(res, 'text') and res.text:
        return res.text
        
    return f"⚠️ සිස්ටම් එක කාර්යබහුලයි. (Error: {err}). කරුණාකර නැවත උත්සාහ කරන්න පුතේ."

# --- ENDPOINTS ---
@app.post("/chat")
def chat_endpoint(request: ChatRequest):
    img = None
    if request.image_data:
        try:
            if "base64," in request.image_data: 
                base64_str = request.image_data.split("base64,")[1]
            else: 
                base64_str = request.image_data
            
            img = Image.open(io.BytesIO(base64.b64decode(base64_str)))
            if img.mode != 'RGB':
                img = img.convert('RGB')
            img.thumbnail((1024, 1024))
        except Exception as e:
            print(f"⚠️ Image Load Error: {e}")

    safe_question = request.question if request.question.strip() else "Answer ALL the questions in the image accurately."
    
    kw_contents = []
    # 🔥 EXTRACT MORE KEYWORDS INCLUDING PROPER NOUNS
    if img:
        kw_contents.append(img)
        kw_prompt = f'Read ALL questions in the image. Extract 8-12 highly specific, unique ROOT NOUNS (නාමපද/මූලික පද) and Technical Terms that represent the core subjects. DO NOT extract common verbs or joining words. Output ONLY a strict JSON Array of strings: ["word1", "word2"]'
    else:
        kw_prompt = f'Extract 8-12 highly specific ROOT NOUNS and Technical Terms from "{safe_question}". Ignore common verbs. Output ONLY a strict JSON Array of strings: ["word1", "word2"]'
        
    kw_contents.append(kw_prompt)
    kw_res, kw_err = safe_google_api_call(kw_contents, is_json=True)
    
    keywords = []
    try:
        if kw_res and hasattr(kw_res, 'text') and kw_res.text: 
            keywords = json.loads(kw_res.text.strip().replace('```json', '').replace('```', ''))
    except Exception:
        pass

    ctx = []
    seen = set()
    
    if keywords:
        search_terms = []
        for k in keywords:
            search_terms.append(k)
            # 🔥 FIX: Sinhala words can be short (2 chars) so lowered the length limit
            search_terms.extend([w for w in k.split() if len(w) > 2])
            
        search_terms = list(set(search_terms))[:10] 
        
        for term in search_terms:
            try:
                query = supabase.table("documents").select("content, metadata").eq("metadata->>subject", request.subject).ilike("content", f"%{term}%").limit(5)
                res = query.execute()
                
                for item in res.data:
                    if item['content'] not in seen:
                        ctx.append(item)
                        seen.add(item['content'])
                        
                if len(ctx) >= 30: break 
            except Exception as db_err:
                print(f"⚠️ DB Error: {db_err}")
                continue 

    try:
        ans = generate_smart_answer(ctx, safe_question, request.subject, request.medium, img)
        return {"answer": ans}
    except Exception as final_err:
        return {"answer": f"⚠️ කේත දෝෂයක් (Code Error): {str(final_err)}"}

@app.delete("/knowledge/delete")
def delete_knowledge(payload: DeleteRequest):
    if not payload.ids: return {"message": "No IDs"}
    response = supabase.table("documents").delete().in_("id", payload.ids).execute()
    return {"message": "Deleted", "data": response.data}

@app.post("/knowledge/delete_pages")
def delete_knowledge_pages(payload: DeletePagesRequest):
    try:
        query = supabase.table("documents").select("id, metadata") \
            .eq("metadata->>subject", payload.subject) \
            .eq("metadata->>medium", payload.medium)
        res = query.execute()
        ids_to_delete = []
        for item in res.data:
            meta = item.get("metadata", {})
            if str(meta.get("grade")) == str(payload.grade) and int(meta.get("page", -1)) in payload.pages:
                ids_to_delete.append(item["id"])
        
        if ids_to_delete:
            supabase.table("documents").delete().in_("id", ids_to_delete).execute()
        return {"message": "Pages deleted successfully", "deleted_count": len(ids_to_delete)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/ingest")
async def ingest_pdf(request: Request, pdf: UploadFile = File(...), grade: str = Form(...), subject: str = Form(...), medium: str = Form(...), category: str = Form(...), startPage: int = Form(...), endPage: int = Form(...)):
    async def process_stream():
        yield f"✅ Started Ingestion: {subject}\n"
        try:
            pdf_bytes = await pdf.read()
            images = convert_from_bytes(pdf_bytes, first_page=startPage, last_page=endPage, dpi=300)
            
            for i, image in enumerate(images):
                if await request.is_disconnected(): return 
                page_num = startPage + i
                prompt = f"Extract all text/diagrams. Language: {medium}. Keep structure. Do NOT summarize."
                
                success = False
                for attempt in range(3):
                    try:
                        if i > 0 or attempt > 0: time.sleep(4) 
                        client = get_random_client()
                        response = client.models.generate_content(model='gemini-2.0-flash', contents=[image, prompt])
                        supabase.table("documents").insert({
                            "content": response.text,
                            "metadata": {"grade": grade, "subject": subject, "medium": medium, "category": category, "page": page_num}
                        }).execute()
                        yield f"✅ Page {page_num} Saved! [Preview: {response.text[:60].replace(chr(10), ' ')}...]\n"
                        success = True
                        break 
                    except Exception as api_err:
                        err_str = str(api_err).lower()
                        if "429" in err_str or "503" in err_str:
                            yield f"⚠️ API Limit hit on Page {page_num}. Retrying...\n"
                            time.sleep(5) 
                        else:
                            yield f"❌ Database/API Error Page {page_num}: {err_str}\n"
                            break 
                if not success: yield f"❌ Failed to process Page {page_num} after retries.\n"
        except Exception as e:
             yield f"❌ Critical Error: {e}\n"
        yield "🎉 Complete!"
        
    return StreamingResponse(process_stream(), media_type="text/plain")

@app.get("/knowledge/page_content")
def get_page_content(subject: str, grade: str, medium: str, category: str, page: int):
    try:
        query = supabase.table("documents").select("content, metadata") \
            .eq("metadata->>subject", subject) \
            .eq("metadata->>medium", medium)
        res = query.execute()
        for item in res.data:
            meta = item.get("metadata", {})
            if str(meta.get("grade")) == str(grade) and int(meta.get("page", -1)) == page:
                return {"content": item.get("content", "No text content found.")}
        return {"content": "Page not found in database."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))