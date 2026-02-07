from fastapi import APIRouter
from app.models.schemas import ChatRequest
from app.core.database import supabase
from app.services.rag_service import search_database, get_relevant_images
from app.services.ai_service import generate_chat_response

router = APIRouter()

@router.post("/chat")
async def chat_endpoint(req: ChatRequest):
    # 1. Check Credits
    user_res = supabase.table("profiles").select("plan_type, credits_left").eq("id", req.user_id).single().execute()
    if user_res.data:
        plan = user_res.data['plan_type']
        credits = user_res.data['credits_left']
        if plan != "genius" and credits <= 0:
            return {"answer": "⚠️ Credits ඉවරයි. Unlimited Plan එක ගන්න.", "status": "no_credits"}

    # 2. RAG Logic
    context_data = search_database(req.message, req.grade, req.subject, req.medium)
    context_text = "\n---\n".join(context_data) if context_data else "No context."

    # 3. Session Handling
    session_id = req.session_id
    if not session_id:
        title = " ".join(req.message.split()[:4]) + "..."
        session_res = supabase.table("chat_sessions").insert({
            "user_id": req.user_id, "subject": req.subject, "title": title
        }).execute()
        session_id = session_res.data[0]['id']

    # 4. Generate Answer
    answer = generate_chat_response(req.message, context_text, req.subject, req.medium)

    # 5. Get Images
    image_urls = get_relevant_images(context_data, req.subject, req.medium)
    main_image = image_urls[0] if image_urls else None

    # 6. Save & Deduct
    supabase.table("chat_messages").insert([
        {"session_id": session_id, "role": "user", "content": req.message},
        {"session_id": session_id, "role": "ai", "content": answer, "image_url": main_image}
    ]).execute()

    if plan != "genius":
        supabase.table("profiles").update({"credits_left": credits - 1}).eq("id", req.user_id).execute()

    return {
        "session_id": session_id,
        "answer": answer,
        "image_url": main_image,
        "credits_left": credits - 1 if plan != "genius" else "Unlimited"
    }