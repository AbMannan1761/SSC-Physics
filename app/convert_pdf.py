import os
import sys
import time
import json
import fitz  # PyMuPDF
from PIL import Image
from dotenv import load_dotenv
from docx import Document
from google import genai
from google.genai.errors import APIError

# Load environment variables (from current dir .env or C:\Users\mannan\.env)
load_dotenv()
load_dotenv(os.path.expanduser("~/.env"))

GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY")

PDF_PATH = "2026_Class 9-10_Physics_compressed.pdf"
CACHE_DIR = "ocr_cache"
OUTPUT_DOCX = "2026_Class 9-10_Physics.docx"

# Ensure cache directory exists
os.makedirs(CACHE_DIR, exist_ok=True)

def get_gemini_client():
    if not GEMINI_API_KEY:
        print("Error: GEMINI_API_KEY environment variable is not set.")
        print("Please create a .env file containing: GEMINI_API_KEY=your_key_here")
        print("Or set it in your user profile (.env in home folder).")
        sys.exit(1)
    return genai.Client(api_key=GEMINI_API_KEY)

def render_page_to_image(doc, page_num):
    """Renders a PDF page to a PNG image and returns the file path."""
    image_path = os.path.join(CACHE_DIR, f"page_{page_num:03d}.png")
    if os.path.exists(image_path):
        return image_path
        
    page = doc[page_num]
    # Render page at 150 DPI for good OCR quality
    zoom = 150 / 72
    matrix = fitz.Matrix(zoom, zoom)
    pix = page.get_pixmap(matrix=matrix)
    pix.save(image_path)
    return image_path

def ocr_page(client, page_num, image_path):
    """Sends the page image to Gemini for OCR and caches the text response."""
    text_path = os.path.join(CACHE_DIR, f"page_{page_num:03d}.txt")
    
    # Check if text already exists and is non-empty
    if os.path.exists(text_path) and os.path.getsize(text_path) > 0:
        with open(text_path, "r", encoding="utf-8") as f:
            return f.read()
            
    print(f"Performing OCR on Page {page_num+1}...")
    
    image = Image.open(image_path)
    
    prompt = (
        "Perform highly accurate OCR on this Bengali physics textbook page. "
        "Extract all Bengali text exactly as it appears. "
        "Maintain the structural layout such as headings, lists, paragraphs, and mathematical equations. "
        "Do NOT add any introductory or explanatory text (e.g. do not say 'Here is the text'). "
        "Only output the extracted content of the page."
    )
    
    # Retry loop for rate limits or network glitches
    retries = 5
    delay = 5
    for attempt in range(retries):
        try:
            response = client.models.generate_content(
                model='gemini-3.1-flash-lite',
                contents=[image, prompt]
            )
            text = response.text
            
            # Save to cache
            with open(text_path, "w", encoding="utf-8") as f:
                f.write(text)
            return text
        except APIError as e:
            print(f"API Error on page {page_num+1}: {e}. Waiting {delay}s before retry... (Attempt {attempt+1}/{retries})")
            time.sleep(delay)
            delay = min(delay * 2, 60)
        except Exception as e:
            print(f"Unexpected error on page {page_num+1}: {e}. Waiting {delay}s before retry... (Attempt {attempt+1}/{retries})")
            time.sleep(delay)
            delay = min(delay * 2, 60)
            
    raise Exception(f"Failed to OCR page {page_num+1} after {retries} attempts.")

def compile_to_docx(total_pages):
    """Compiles all cached OCR texts into a single Word document."""
    print("Compiling all page texts into Word document...")
    doc = Document()
    
    from docx.shared import Inches
    for section in doc.sections:
        section.top_margin = Inches(1)
        section.bottom_margin = Inches(1)
        section.left_margin = Inches(1)
        section.right_margin = Inches(1)

    first = True
    for page_num in range(total_pages):
        text_path = os.path.join(CACHE_DIR, f"page_{page_num:03d}.txt")
        if not os.path.exists(text_path):
            print(f"Warning: OCR text for page {page_num+1} not found. Skipping...")
            continue
            
        with open(text_path, "r", encoding="utf-8") as f:
            page_text = f.read().strip()
            
        if not first:
            doc.add_page_break()
        else:
            first = False
            
        # Add heading or header for reference
        doc.add_paragraph(f"[Page {page_num+1}]", style='Normal')
        
        # Add the page text split into paragraphs
        paragraphs = page_text.split('\n')
        for p in paragraphs:
            if p.strip():
                doc.add_paragraph(p.strip())
                
    doc.save(OUTPUT_DOCX)
    print(f"Successfully created: {OUTPUT_DOCX}")

def main():
    if not os.path.exists(PDF_PATH):
        print(f"Error: PDF file {PDF_PATH} not found in workspace.")
        sys.exit(1)
        
    client = get_gemini_client()
    pdf_doc = fitz.open(PDF_PATH)
    total_pages = len(pdf_doc)
    print(f"Total pages to process: {total_pages}")
    
    # Process range specified by command line args if any (e.g. for testing)
    start_page = 0
    end_page = total_pages
    
    if len(sys.argv) >= 3:
        start_page = int(sys.argv[1])
        end_page = min(int(sys.argv[2]), total_pages)
        print(f"Processing subset of pages: {start_page} to {end_page}")
        
    for page_num in range(start_page, end_page):
        # Render image
        image_path = render_page_to_image(pdf_doc, page_num)
        
        # Perform OCR
        txt_exists = os.path.exists(os.path.join(CACHE_DIR, f"page_{page_num:03d}.txt"))
        if not txt_exists:
            ocr_page(client, page_num, image_path)
            # 15 RPM means 1 request every 4 seconds. Let's sleep 4.5 seconds to be safe.
            time.sleep(4.5)
        else:
            # If text already exists, just load it
            ocr_page(client, page_num, image_path)
            
    # Compile DOCX only if we processed the full document
    if start_page == 0 and end_page == total_pages:
        compile_to_docx(total_pages)
    else:
        print("Subset processing complete. Compile to docx skipped. Run the full script to compile.")

if __name__ == "__main__":
    main()
