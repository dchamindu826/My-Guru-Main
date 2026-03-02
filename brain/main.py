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
import datetime
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
                ],
                temperature=0.3 # Lower temperature for more accurate, less hallucinatory answers
            )
            
            response = client.models.generate_content(
                model='gemini-2.0-flash',
                contents=contents,
                config=config
            )
            
            # 🔥 TOKEN TRACKING & COST CALCULATION
            try:
                usage = getattr(response, 'usage_metadata', None)
                if usage:
                    in_tokens = getattr(usage, 'prompt_token_count', 0) or 0
                    out_tokens = getattr(usage, 'candidates_token_count', 0) or 0
                    total_tokens = getattr(usage, 'total_token_count', 0) or 0
                    
                    if total_tokens > 0:
                        cost = ((in_tokens / 1000000.0) * 0.10) + ((out_tokens / 1000000.0) * 0.40)
                        print(f"💰 [Request Cost] Tokens: {total_tokens} (In: {in_tokens} | Out: {out_tokens}) | Cost: ${cost:.6f}")
                        
                        supabase.table("token_usage").insert({
                            "input_tokens": in_tokens,
                            "output_tokens": out_tokens,
                            "total_tokens": total_tokens,
                            "estimated_cost": cost,
                            "created_at": datetime.datetime.utcnow().isoformat()
                        }).execute()
            except Exception as db_err:
                print(f"⚠️ Token Save Error: {db_err}")

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
    audio_data: str | None = None

class DeleteRequest(BaseModel):
    ids: list[int]

class DeletePagesRequest(BaseModel):
    subject: str
    grade: str | int
    medium: str
    category: str
    pages: list[int]

# --- BRAIN LOGIC ---
def generate_smart_answer(context, question, subject, medium, img=None, audio_part=None):
    # Categorize Context
    marking_schemes = ""
    textbooks = ""
    
    if context:
        for item in context:
            meta = item.get('metadata', {})
            category = str(meta.get('category', '')).lower()
            content_str = item.get('content', '')
            
            if 'marking' in category or 'paper' in category:
                marking_schemes += f"\n{content_str}\n---"
            else:
                textbooks += f"\n{content_str}\n---"

    lang_instruction = "You MUST reply entirely in Sinhala." if medium.lower() == "sinhala" else "You MUST reply entirely in English."

    prompt = f"""
    You are 'My Guru', an elite and highly professional examiner and expert teacher in Sri Lanka.
    Your task is to provide 100% accurate, highly structured, and deeply explanatory answers. NO HALLUCINATIONS. NO LIES. Do not generate long, irrelevant paragraphs ("wal pal"). Keep it focused, highly informative, and directly to the point.

    CURRENT SUBJECT: {subject}
    TARGET MEDIUM: {medium}
    
    {lang_instruction}

    STUDENT'S QUESTION:
    {question}

    --- KNOWLEDGE BASE ---
    [PRIORITY 1: MARKING SCHEMES]
    {marking_schemes if marking_schemes else "None available."}

    [PRIORITY 2: TEXTBOOKS]
    {textbooks if textbooks else "None available."}

    --- CRITICAL EXAMINER INSTRUCTIONS ---

    1. **TOPIC RESTRICTION:** You must ONLY answer questions related to the SUBJECT: '{subject}'. If the user asks a question completely unrelated to '{subject}' (e.g., asking a Science question when the subject is History), politely refuse to answer and ask them to switch the subject using the #menu command. 
       * Sinhala Refusal: "කරුණාකර '{subject}' විෂයට අදාළ ප්‍රශ්න පමණක් යොමු කරන්න. වෙනත් විෂයයක් සඳහා #menu ලෙස යවා විෂය වෙනස් කරන්න."
       * English Refusal: "Please ask questions related to '{subject}' only. To ask about another subject, type #menu and change the subject."

    2. **KNOWLEDGE HIERARCHY (HOW TO FIND THE ANSWER):**
       * **STEP 1:** Search the [PRIORITY 1: MARKING SCHEMES]. If the exact answer is there, use it as the core of your response.
       * **STEP 2:** If not in Marking Schemes, search the [PRIORITY 2: TEXTBOOKS]. If the concept is there, construct the answer based on it.
       * **STEP 3:** If the answer is NOT in the provided Context at all, use your vast internal knowledge (Social Knowledge/General AI Knowledge) to construct a perfect, accurate answer. NEVER say "It is not in the textbook" or "I cannot answer". ALWAYS provide the answer.
       * **WARNING FOR MATHS & SCIENCE:** Double-check all calculations and formulas. Provide step-by-step working. Do not output wrong mathematical answers.

    3. **MCQ QUESTIONS:** If the student asks a Multiple Choice Question (MCQ):
       * First, state the Correct Answer clearly.
       * Second, clearly explain *WHY* it is the correct answer and *WHY* the other options are wrong.

    4. **STRUCTURE & FORMATTING (MANDATORY):**
       * Be Professional. Do not use words like "(Textbook)", "(Marking Scheme)", "හැඳින්වීම:", "කරුණු:", "උදාහරණ:". Just weave them naturally into the text.
       * **DO NOT USE ASTERISKS (**) FOR BOLDING.** Use plain text.
       * Break the answer into logical paragraphs.
       * If it's a large question (e.g., Question 03 with parts a, b, c), answer EACH sub-question separately and clearly.
       * For every main point, provide:
         - A clear explanation.
         - A relevant, practical example to make it easy to understand.
       * Use emojis (📝, ✅, 📌, 💡) to make it visually appealing but keep it professional. Do not overdo it.

    5. **TONE:** Be encouraging, intelligent, and highly professional. Never be boring.
    """
    
    contents = [prompt]
    if img: 
        contents.extend([img, "Analyze this image perfectly. If it's a question paper, read every question carefully. Do not miss any details."])
    
    if audio_part:
        contents.extend([audio_part, "Listen to this audio carefully and answer the student's question based on the audio."])
        
    res, err = safe_google_api_call(contents)
    
    if res and hasattr(res, 'text') and res.text:
        return res.text
        
    error_msg_si = f"⚠️ සිස්ටම් එක කාර්යබහුලයි. (Error: {err}). කරුණාකර නැවත උත්සාහ කරන්න පුතේ."
    error_msg_en = f"⚠️ The system is currently busy. (Error: {err}). Please try again."
    
    return error_msg_si if medium.lower() == 'sinhala' else error_msg_en


# --- ENDPOINTS ---
@app.post("/chat")
def chat_endpoint(request: ChatRequest):
    img = None
    audio_part = None
    
    if request.image_data:
        try:
            base64_str = request.image_data.split("base64,")[1] if "base64," in request.image_data else request.image_data
            img = Image.open(io.BytesIO(base64.b64decode(base64_str)))
            if img.mode != 'RGB':
                img = img.convert('RGB')
            img.thumbnail((1024, 1024))
        except Exception as e:
            print(f"⚠️ Image Load Error: {e}")

    if request.audio_data:
        try:
            base64_audio = request.audio_data.split("base64,")[1] if "base64," in request.audio_data else request.audio_data
            audio_bytes = base64.b64decode(base64_audio)
            audio_part = types.Part.from_bytes(
                data=audio_bytes,
                mime_type='audio/ogg' 
            )
        except Exception as e:
            print(f"⚠️ Audio Load Error: {e}")

    safe_question = request.question if request.question.strip() else "Please analyze the provided media (image/audio) and answer accurately."
    
    kw_contents = []
    if img:
        kw_contents.append(img)
        kw_prompt = f'Read ALL text in the image. Extract 8-12 highly specific ROOT NOUNS and Technical Terms. Output ONLY a strict JSON Array of strings: ["word1", "word2"]'
    elif audio_part:
        kw_contents.append(audio_part)
        kw_prompt = f'Listen to the audio. Extract 8-12 highly specific ROOT NOUNS and Technical Terms. Output ONLY a strict JSON Array of strings: ["word1", "word2"]'
    else:
        kw_prompt = f'Extract 8-12 highly specific ROOT NOUNS and Technical Terms from "{safe_question}". Output ONLY a strict JSON Array of strings: ["word1", "word2"]'
        
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
            search_terms.extend([w for w in k.split() if len(w) > 2])
            
        search_terms = list(set(search_terms))[:10] 
        
        for term in search_terms:
            try:
                # Search using the provided subject and medium
                query = supabase.table("documents").select("content, metadata").eq("metadata->>subject", request.subject).eq("metadata->>medium", request.medium).ilike("content", f"%{term}%").limit(5)
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
        ans = generate_smart_answer(ctx, safe_question, request.subject, request.medium, img, audio_part)
        return {"answer": ans}
    except Exception as final_err:
        return {"answer": f"⚠️ Error: {str(final_err)}"}

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
                prompt = f"""
                You are an expert educational content extractor. Carefully read and extract ALL text, tables, and data from this image.
                Target Language: {medium}. 
                
                STRICT FORMATTING RULES:
                1. Use clear Markdown formatting.
                2. If there is a Table in the image, strictly convert it into a Markdown Table.
                3. Clearly bold the Question Numbers (e.g., **1 (iv) (a)**) and separate them from the answers using line breaks.
                4. Keep the marking points and allocated marks (e.g., 0.5, 1) clearly next to the relevant answer.
                5. If there are diagrams (like Logic Circuits), extract all text/labels logically.
                6. DO NOT summarize. Extract every single word, note, and mark precisely.
                """
                
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