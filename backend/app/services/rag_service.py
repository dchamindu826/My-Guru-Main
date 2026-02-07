import re
from app.core.database import supabase

def get_relevant_images(context_strings, subject, medium):
    """
    Strict Mode: Text එකේ 4.5 වගේ ඉලක්කම් තිබුනොත් විතරක් රූපේ ගන්නවා.
    """
    image_hits = {} 
    found_fig_ids = set()

    if context_strings:
        for text in context_strings:
            ids = re.findall(r"(\d+\.\d+)", text)
            for fig_id in ids:
                found_fig_ids.add(fig_id)
    
    if found_fig_ids:
        target_ids = list(found_fig_ids)[:3]
        for fid in target_ids:
            try:
                response = supabase.table("content_library") \
                    .select("image_url, description") \
                    .eq("subject", subject) \
                    .eq("medium", medium) \
                    .ilike("description", f"%Figure {fid}%") \
                    .limit(1) \
                    .execute()
                
                if response.data:
                    for img in response.data:
                        image_hits[img['image_url']] = img['image_url']
            except Exception as e:
                print(f"Error fetching Figure {fid}: {e}")

    return list(image_hits.values())

def search_database(query, grade, subject, medium):
    """
    RAG Search: ළමයා අහපු දේට අදාළ Notes හොයනවා.
    """
    all_hits = []
    keywords = query.split() 
    
    for kw in keywords:
        if len(kw) < 3: continue 

        response = supabase.table("documents").select("content") \
            .eq("metadata->>grade", grade) \
            .eq("metadata->>subject", subject) \
            .eq("metadata->>medium", medium) \
            .ilike("content", f"%{kw}%") \
            .limit(5) \
            .execute()
            
        for item in response.data: 
            all_hits.append(item['content'])
            
    return list(set(all_hits))