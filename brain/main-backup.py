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
import datetime # 🔥 අලුතින් එකතු කරපු import එක
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
            
            # 🔥 TOKEN TRACKING & COST CALCULATION (Gemini 2.0 Flash Rates)
            try:
                usage = getattr(response, 'usage_metadata', None)
                if usage:
                    in_tokens = getattr(usage, 'prompt_token_count', 0) or 0
                    out_tokens = getattr(usage, 'candidates_token_count', 0) or 0
                    total_tokens = getattr(usage, 'total_token_count', 0) or 0
                    
                    if total_tokens > 0:
                        # Cost for gemini-2.0-flash standard ($0.10 per 1M input, $0.40 per 1M output)
                        cost = ((in_tokens / 1000000.0) * 0.10) + ((out_tokens / 1000000.0) * 0.40)
                        
                        # Terminal එකේ බලාගන්න Print එක
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
    # 🔥 THE ABSOLUTE STRICT MASTER EXAMINER PROMPT (V4 - Maximum Elaboration)
    prompt = f"""
    You are 'My Guru', the Ultimate Sri Lankan School Examiner and Master Teacher. 
    You are bound by STRICT RULES. If you break them, you will fail the system.
    
    SUBJECT: {subject}
    TARGET MEDIUM: {medium}
    
    OFFICIAL CONTEXT:
    {context_text if context_text else "NO CONTEXT FETCHED. YOU MUST USE YOUR VAST INTERNAL KNOWLEDGE."}
    
    STUDENT'S QUESTION:
    {question}
    
    CRITICAL EXAMINER INSTRUCTIONS (READ CAREFULLY & OBEY 100%):
    
    1. **THE "NO EXCUSES" LAW (FATAL RULE):** You are FORBIDDEN to say "This is not in the textbook", "තොරතුරු සඳහන් නොවේ", "පෙළපොතෙහි නැත", or "මට පිළිතුරු දිය නොහැක". If the OFFICIAL CONTEXT does not have the exact answer, YOU MUST IMMEDIATELY USE YOUR OWN AI KNOWLEDGE TO ANSWER IT PERFECTLY. Never leave a question blank.
    
    2. **BAN ON MARKDOWN ASTERISKS (FATAL RULE):** You are STRICTLY FORBIDDEN to use asterisks (**) for bolding or formatting. Your output will be displayed as plain text. Do not use ** anywhere in your response.
       * ❌ WRONG FORMAT: "- **කාලීන තොරතුරු රැස් කිරීම:**"
       * ✅ CORRECT FORMAT: "- කාලීන තොරතුරු රැස් කිරීම: ප්‍රවෘත්ති අංශයක ප්‍රධානතම කාර්යය වන්නේ..."
       
    3. **EXTREME DEEP ELABORATION:** For EVERY sub-question ((i), (ii), (iii), (iv)) and EVERY point within them, you MUST elaborate using this structure:
       - What it is (හැඳින්වීම)
       - Why it is important (වැදගත්කම)
       - Give a practical Example (උදාහරණයක්)
       - Minimum 4-5 sentences PER POINT.

    4. Please don't use words like "(Textbook)" with answers and always briefly explain answers clearly. Don't be lazy.
       
    5. **CLEAN OUTPUT:** Do NOT output source tags like "(TEXTBOOK)", "[TEXTBOOK]", "Marking Scheme". Provide pure, educational text.
    
    6. **BEAUTIFUL FORMATTING:** Use Emojis (📝, ✅, 📌, 🎯, 💡) wisely to make the answer beautiful. Make sure there is good spacing (line breaks) between paragraphs.
    
    7. **TONE & START:** Answer entirely in {medium} language. Always start exactly with: "හරි පුතේ, පිළිතුරු මෙන්න: 👇\n\n"
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
                prompt = f"""
                You are an expert educational content extractor. Carefully read and extract ALL text, tables, and data from this image.
                Target Language: {medium}. 
                
                STRICT FORMATTING RULES:
                1. Use clear Markdown formatting.
                2. If there is a Table in the image, strictly convert it into a Markdown Table.
                3. Clearly bold the Question Numbers (e.g., **1 (iv) (a)**) and separate them from the answers using line breaks.
                4. Keep the marking points and allocated marks (e.g., 0.5, 1) clearly next to the relevant answer.
                5. If there are diagrams (like Logic Circuits), extract all text/labels logically.
                6. DO NOT summarize. Extract every single word, note (සටහන), and mark precisely.
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