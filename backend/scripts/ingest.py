import os
import time
import fitz  # PyMuPDF
import PIL.Image
import io
import sys
import json
from supabase import create_client
from dotenv import load_dotenv
import google.generativeai as genai

# Force UTF-8 for Windows Console
sys.stdout.reconfigure(encoding='utf-8')

load_dotenv()

# Setup Clients
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")
GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
genai.configure(api_key=GOOGLE_API_KEY)

# OCR Model Selection (with fallback)
try:
    model = genai.GenerativeModel('gemini-2.0-flash')
except:
    print("⚠️ Gemini 2.0 Flash not found, switching to 1.5 Flash")
    sys.stdout.flush()
    model = genai.GenerativeModel('gemini-1.5-flash')

def get_embedding_with_retry(text, retries=3):
    for attempt in range(retries):
        try:
            # Using the specific model you confirmed is available
            result = genai.embed_content(
                model="models/gemini-embedding-001",
                content=text,
                task_type="retrieval_document",
                output_dimensionality=768
            )
            return result['embedding']
        except Exception as e:
            print(f"   ⚠️ Embedding Error (Attempt {attempt+1}): {e}")
            sys.stdout.flush()
            time.sleep(5)
    return None

def ingest_document(pdf_path, start_page, end_page, meta_data):
    doc = fitz.open(pdf_path)
    
    # Extract metadata for logging
    grade = meta_data.get('grade', 'Unknown')
    subject = meta_data.get('subject', 'Unknown')
    medium = meta_data.get('medium', 'Unknown')
    category = meta_data.get('category', 'Unknown')

    print(f"🚀 Starting Upload: {subject} ({medium}) - {category}...")
    print(f"📘 Processing: Grade {grade} - {subject} ({medium})")
    print(f"📂 Type: {category}")
    print(f"📄 Total Pages: {len(doc)}")
    print(f"🎯 Selected Range: Page {start_page} to {end_page}\n")
    sys.stdout.flush()

    for page_num in range(start_page, end_page + 1):
        # Adjust for 0-based index
        pdf_page_index = page_num - 1
        
        if pdf_page_index >= len(doc):
            print(f"🛑 Reached End of Document (Page {page_num}). Stopping.")
            break

        page = doc.load_page(pdf_page_index)
        
        # Retry logic: 4 attempts (1 initial + 3 retries)
        max_retries = 4
        success = False
        
        for attempt in range(1, max_retries + 1):
            try:
                print(f"🔄 Processing Page {page_num} (Attempt {attempt}/{max_retries})...")
                sys.stdout.flush()
                
                # Image Capture
                pix = page.get_pixmap(matrix=fitz.Matrix(2, 2))
                img_data = pix.tobytes("png")
                image = PIL.Image.open(io.BytesIO(img_data))

                # OCR Prompt
                prompt = f"""
                You are a highly accurate OCR engine.
                Task: Extract content from this {medium} medium {category} page.

                RULES:
                1. **OUTPUT RAW TEXT ONLY.**
                2. If it is a Question Paper, preserve question numbers (1, 1.1, (a), etc.).
                3. If it is a Marking Scheme, keep the answer structure clear.
                4. **IMAGES:** Describe diagrams in [brackets] (Use English for English medium, Sinhala for Sinhala medium).
                5. **NO CHATTER:** Just give the content.
                """
                
                response = model.generate_content([prompt, image])
                text_content = response.text.strip()

                if not text_content or len(text_content) < 20:
                    print(f"⚠️ Page {page_num} seems empty. Skipped.")
                    sys.stdout.flush()
                    success = True # Treat empty page as processed
                    break

                # --- PREVIEW ---
                print("\n" + "="*60)
                print(f"📄 PAGE {page_num} CONTENT:")
                print("="*60)
                print(text_content[:200].replace('\n', ' ') + "...") 
                print("="*60 + "\n")
                sys.stdout.flush()

                # Get Embedding
                vector = get_embedding_with_retry(text_content)
                
                if vector:
                    data = {
                        "content": text_content,
                        "embedding": vector,
                        "metadata": {
                            "source": f"Gr{grade} {subject} ({medium}) {category}", 
                            "page": page_num,
                            "subject": subject,
                            "grade": grade,
                            "type": category,
                            "medium": medium,
                            "file_name": os.path.basename(pdf_path)
                        }
                    }
                    supabase.table('documents').insert(data).execute()
                    print(f"✅ Page {page_num} Uploaded Successfully! ({medium} - {category})\n")
                    sys.stdout.flush()
                    success = True
                    break # Success, move to next page
                else:
                    print(f"❌ Embedding Failed for Page {page_num}")
                    # If embedding fails, we retry the whole page process
                    raise Exception("Embedding generation failed")

            except Exception as e:
                print(f"❌ Error on Page {page_num}: {e}")
                sys.stdout.flush()
                
                # Check for critical API errors (Stop immediately)
                err_str = str(e).lower()
                if "403" in err_str or "api key" in err_str:
                    print("🛑 Critical API Error. Stopping Script.")
                    sys.exit(1)

                if attempt < max_retries:
                    print("⏳ Retrying in 5 seconds...")
                    sys.stdout.flush()
                    time.sleep(5)
                else:
                    print(f"🛑 Failed Page {page_num} after {max_retries} attempts. Moving to next page.")
                    sys.stdout.flush()
        
        time.sleep(2) # Safety delay between pages

if __name__ == "__main__":
    try:
        # Arguments from Node.js
        if len(sys.argv) < 5:
            print("❌ Error: Missing arguments from Node.js")
            # For testing manually, you can uncomment this block:
            # FILE_CONFIG = {
            #     "path": "knowledge/grade-11-civic-education-text-book-6200f2820bcac.pdf",
            #     "start": 155, "end": 155,
            #     "meta": { "grade": "11", "subject": "Civic", "medium": "Sinhala", "category": "textbook" }
            # }
            # ingest_document(FILE_CONFIG["path"], FILE_CONFIG["start"], FILE_CONFIG["end"], FILE_CONFIG["meta"])
            sys.exit(1)

        pdf_path = sys.argv[1]
        start_page = int(sys.argv[2])
        end_page = int(sys.argv[3])
        meta_data = json.loads(sys.argv[4])

        if os.path.exists(pdf_path):
            ingest_document(pdf_path, start_page, end_page, meta_data)
            print("\n🎉 Upload Completed Successfully!")
        else:
            print(f"❌ PDF File not found at: {pdf_path}")

    except SystemExit:
        pass
    except Exception as e:
        print(f"🔥 Critical Script Error: {e}")