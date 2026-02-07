from pydantic import BaseModel
from typing import Optional, List, Any

# --- Chat Models ---
class ChatRequest(BaseModel):
    user_id: str
    session_id: Optional[str] = None
    message: str
    subject: str
    grade: str
    medium: str

# --- Admin Models ---
class PackageUpdate(BaseModel):
    name: str
    price: float
    discount_price: Optional[float] = None
    features: List[str]
    is_highlighted: bool

class SlipAction(BaseModel):
    payment_id: str
    user_id: str
    action: str  # 'approve' or 'reject'
    package_name: Optional[str] = None # 'genius' or 'scholar'

class TestimonialCreate(BaseModel):
    student_name: str
    message: str
    image_url: Optional[str] = None