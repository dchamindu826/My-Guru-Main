from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import chat, admin # Chat router එක කලින් එකමයි

app = FastAPI(title="MyGuru Backend")

# CORS (Allow Frontend)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Production වලදී ඔයාගේ Domain එක දාන්න
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routes ලින්ක් කිරීම
# Chat router එක කලින් වගේමයි (අපි කලින් කතා කරපු එක `app/routers/chat.py` එකට දාන්න)
# app.include_router(chat.router, tags=["Chat"]) 
app.include_router(admin.router, prefix="/api/admin", tags=["Admin"])

@app.get("/")
def home():
    return {"status": "MyGuru AI Brain Running 🧠"}