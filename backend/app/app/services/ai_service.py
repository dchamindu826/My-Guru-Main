from app.core.database import client

def generate_chat_response(message, context_text, subject, medium):
    prompt = f"""
    You are an expert Sri Lankan O/L Tutor.
    SETTINGS: Subject: {subject} | Medium: {medium}
    CONTEXT DATA: {context_text}
    USER QUESTION: {message}
    
    INSTRUCTIONS:
    1. Be friendly and explain clearly.
    2. If "Figure IDs" (e.g. 4.5) exist in context, mention them.
    3. Answer in {medium} ONLY.
    """
    try:
        res = client.models.generate_content(model='gemini-2.0-flash', contents=prompt)
        return res.text
    except:
        return "සමාවෙන්න, තාක්ෂණික දෝෂයක්."

# --- FOR ADMIN PANEL (Slip Check) ---
def analyze_slip_image(slip_url, amount, ref_no):
    """
    Slip එකේ රූපය කියවලා ඇත්තද බලන AI Logic එක.
    """
    # මෙතනට Gemini 2.0 Vision Logic එක එන්න ඕන.
    # දැනට Dummy logic එකක් දාන්නම් (Backend වැඩ කරන්න).
    return {"status": "unsure", "confidence": 50, "reason": "AI implementation pending"}