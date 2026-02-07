from fastapi import APIRouter, HTTPException
from app.core.database import supabase
from app.models.schemas import PackageUpdate, SlipAction, TestimonialCreate
from datetime import datetime

router = APIRouter()

# 1. 📊 Dashboard Overview Stats
@router.get("/stats")
async def get_dashboard_stats():
    try:
        # Active Students (Role = student)
        students = supabase.table("profiles").select("id", count="exact").eq("role", "student").execute()
        
        # Revenue (Total Approved Payments)
        revenue = supabase.table("payments").select("amount").eq("status", "approved").execute()
        total_revenue = sum([item['amount'] for item in revenue.data]) if revenue.data else 0
        
        # Pending Slips Count
        pending = supabase.table("payments").select("id", count="exact").eq("status", "pending").execute()

        # Online Users (Mock logic for now - Realtime needs WebSockets)
        online_users = 12 

        return {
            "active_students": students.count,
            "total_revenue": total_revenue,
            "pending_slips": pending.count,
            "online_users": online_users
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# 2. 🧾 Get Pending Slips
@router.get("/pending-slips")
async def get_pending_slips():
    # Fetch payments with user details (Join profiles)
    res = supabase.table("payments").select("*, profiles(full_name, email)").eq("status", "pending").execute()
    return res.data

# 3. ✅ Approve or Reject Slip (AI Logic Hook included)
@router.post("/process-slip")
async def process_slip(data: SlipAction):
    try:
        if data.action == "approve":
            # 1. Update Payment Status
            supabase.table("payments").update({"status": "approved"}).eq("id", data.payment_id).execute()
            
            # 2. Upgrade User Plan (Auto)
            # Genius නම් Unlimited credits, නැත්නම් Package එක අනුව
            new_credits = 9999 if data.package_name == "Genius" else 100
            plan_type = data.package_name.lower() if data.package_name else "scholar"

            supabase.table("profiles").update({
                "plan_type": plan_type,
                "credits_left": new_credits
            }).eq("id", data.user_id).execute()
            
            return {"message": "Slip Approved & User Upgraded"}

        elif data.action == "reject":
            supabase.table("payments").update({"status": "rejected"}).eq("id", data.payment_id).execute()
            return {"message": "Slip Rejected"}
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# 4. 📦 Update Packages
@router.get("/packages")
async def get_packages():
    res = supabase.table("packages").select("*").order("price").execute()
    return res.data

@router.put("/packages/{pkg_id}")
async def update_package(pkg_id: str, pkg: PackageUpdate):
    res = supabase.table("packages").update(pkg.dict()).eq("id", pkg_id).execute()
    return res.data

# 5. 🗣️ Manage Testimonials
@router.post("/testimonials")
async def add_testimonial(testi: TestimonialCreate):
    res = supabase.table("testimonials").insert(testi.dict()).execute()
    return res.data

@router.delete("/testimonials/{id}")
async def delete_testimonial(id: str):
    res = supabase.table("testimonials").delete().eq("id", id).execute()
    return {"message": "Deleted"}