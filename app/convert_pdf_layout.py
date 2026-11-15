import os
import sys
import time
import json
import fitz  # PyMuPDF
from PIL import Image
from dotenv import load_dotenv
from docx import Document
from docx.shared import Inches
from google import genai
from google.genai import types
from google.genai.errors import APIError
from pydantic import BaseModel, Field

# Load environment
load_dotenv()
load_dotenv(os.path.expanduser("~/.env"))

GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY")

PDF_PATH = "2026_Class 9-10_Physics_compressed.pdf"
CACHE_DIR = "ocr_cache"
OUTPUT_DOCX = "2026_Class 9-10_Physics_Layout.docx"
API_QUOTA_EXHAUSTED = False

# Ensure cache directory exists
os.makedirs(CACHE_DIR, exist_ok=True)

# Define structured schema
class Segment(BaseModel):
    type: str = Field(description="Type of segment: 'text' or 'element'")
    value: str = Field(default="", description="The Bengali text content (only for type='text')")
    box_2d: list[int] = Field(default=[], description="Normalized bounding box [ymin, xmin, ymax, xmax] from 0 to 1000 (only for type='element')")
    label: str = Field(default="", description="Brief description of the element, e.g. 'diagram' or 'equation' (only for type='element')")

class PageLayout(BaseModel):
    segments: list[Segment]

def get_gemini_client():
    if not GEMINI_API_KEY:
        print("Error: GEMINI_API_KEY is not set.")
        sys.exit(1)
    return genai.Client(
        api_key=GEMINI_API_KEY,
        http_options=types.HttpOptions(timeout=120000)
    )

def render_page_to_image(doc, page_num):
    """Renders page for OCR."""
    image_path = os.path.join(CACHE_DIR, f"page_{page_num:03d}.png")
    if os.path.exists(image_path):
        return image_path
    page = doc[page_num]
    zoom = 150 / 72
    matrix = fitz.Matrix(zoom, zoom)
    pix = page.get_pixmap(matrix=matrix)
    pix.save(image_path)
    return image_path

def trigger_fast_fallback(page_num, layout_path):
    txt_path = os.path.join(CACHE_DIR, f"page_{page_num:03d}.txt")
    if os.path.exists(txt_path) and os.path.getsize(txt_path) > 0:
        try:
            with open(txt_path, "r", encoding="utf-8") as f:
                text_content = f.read().strip()
            data = {"fallback": True, "segments": [{"type": "text", "value": text_content}]}
            with open(layout_path, "w", encoding="utf-8") as f:
                json.dump(data, f, ensure_ascii=False, indent=2)
            return data
        except Exception as e:
            print(f"Error reading plain text cache for page {page_num+1}: {e}")
    raise Exception(f"Layout extraction failed and no plain text cache found for page {page_num+1}")

def get_page_layout(client, page_num, image_path):
    """Gets layout from Gemini or cache."""
    global API_QUOTA_EXHAUSTED
    layout_path = os.path.join(CACHE_DIR, f"page_{page_num:03d}_layout.json")
    
    # Load cache
    if os.path.exists(layout_path) and os.path.getsize(layout_path) > 0:
        try:
            with open(layout_path, "r", encoding="utf-8") as f:
                data = json.load(f)
                # If it's a fallback page and we are NOT in fast-fallback mode, we re-process it!
                if not data.get("fallback") or API_QUOTA_EXHAUSTED:
                    return data
        except Exception:
            pass # Re-run if corrupted
            
    # If API quota is exhausted, immediately trigger fast fallback
    if API_QUOTA_EXHAUSTED:
        print(f"API Quota is exhausted. Fast fallback to text cache for page {page_num+1}...")
        return trigger_fast_fallback(page_num, layout_path)
            
    print(f"Detecting layout and performing OCR on Page {page_num+1}...")
    img = Image.open(image_path)
    
    prompt = (
        "Extract all content from this textbook page in reading order. "
        "Identify any diagrams, graphs, charts, photos, and complex math equations. "
        "For each diagram/graph/photo/equation, provide its bounding box [ymin, xmin, ymax, xmax] on the page (0-1000 scale). "
        "For text, perform OCR and extract the Bengali text."
    )
    
    retries = 5
    delay = 5
    for attempt in range(retries):
        try:
            # Try primary model: gemini-3.1-flash-lite
            model_name = 'gemini-3.1-flash-lite'
            if attempt > 0:
                # If first attempt failed, retry with more capable gemini-2.5-flash
                model_name = 'gemini-2.5-flash'
                print(f"Retrying page {page_num+1} with gemini-2.5-flash...")
            
            response = client.models.generate_content(
                model=model_name,
                contents=[img, prompt],
                config=types.GenerateContentConfig(
                    response_mime_type="application/json",
                    response_schema=PageLayout,
                    temperature=0.0
                )
            )
            
            # Fallback for RECITATION copyright filter block
            if response.candidates and 'RECITATION' in str(response.candidates[0].finish_reason):
                print(f"Page {page_num+1} blocked by RECITATION on {model_name}. Retrying with temperature 0.2 fallback...")
                response = client.models.generate_content(
                    model='gemini-2.5-flash',
                    contents=[img, prompt],
                    config=types.GenerateContentConfig(
                        response_mime_type="application/json",
                        response_schema=PageLayout,
                        temperature=0.2
                    )
                )
                
            if not response.text:
                raise Exception("Model returned empty text or was blocked.")
                
            # Validate JSON
            data = json.loads(response.text)
            
            # Save to cache
            with open(layout_path, "w", encoding="utf-8") as f:
                f.write(response.text)
                
            # Sleep 5 seconds to comply with rate limits (15 RPM)
            print(f"Page {page_num+1} successfully processed. Sleeping 5 seconds for rate limiting...")
            time.sleep(5)
            
            return data
        except APIError as e:
            # Check for 429 quota exhausted
            if e.code == 429 or 'Quota exceeded' in str(e) or 'RESOURCE_EXHAUSTED' in str(e):
                if attempt < retries - 1:
                    print(f"API Quota exhausted on page {page_num+1} (code 429). Waiting 60s before retry... (Attempt {attempt+1}/{retries})")
                    time.sleep(60)
                    continue
                else:
                    print(f"API Quota exhausted on page {page_num+1} after all retries. Activating fast fallback mode...")
                    API_QUOTA_EXHAUSTED = True
                    return trigger_fast_fallback(page_num, layout_path)
                
            print(f"API Error on page {page_num+1}: {e}. Waiting {delay}s... (Attempt {attempt+1}/{retries})")
            time.sleep(delay)
            delay = min(delay * 2, 60)
        except Exception as e:
            # Check for 429 quota exhausted in general exceptions
            if '429' in str(e) or 'RESOURCE_EXHAUSTED' in str(e):
                if attempt < retries - 1:
                    print(f"API Quota exhausted on page {page_num+1} (exception). Waiting 60s before retry... (Attempt {attempt+1}/{retries})")
                    time.sleep(60)
                    continue
                else:
                    print(f"API Quota exhausted on page {page_num+1} after all retries. Activating fast fallback mode...")
                    API_QUOTA_EXHAUSTED = True
                    return trigger_fast_fallback(page_num, layout_path)
                
            print(f"Error on page {page_num+1}: {e}. Waiting {delay}s... (Attempt {attempt+1}/{retries})")
            time.sleep(delay)
            delay = min(delay * 2, 60)
            
    # Fallback to plain text cache if API processing fails
    return trigger_fast_fallback(page_num, layout_path)

def crop_elements(pdf_doc, page_num, segments):
    """Crops all elements identified in segments from the PDF page."""
    page = pdf_doc[page_num]
    H = page.rect.height
    W = page.rect.width
    
    for i, seg in enumerate(segments):
        if seg.get("type") == "element":
            box = seg.get("box_2d", [])
            if len(box) == 4:
                element_path = os.path.join(CACHE_DIR, f"page_{page_num:03d}_element_{i:02d}.png")
                # Skip if already cropped
                if os.path.exists(element_path) and os.path.getsize(element_path) > 0:
                    continue
                    
                # Convert normalized box to PDF points
                ymin, xmin, ymax, xmax = box
                ymin_pts = (ymin / 1000.0) * H
                xmin_pts = (xmin / 1000.0) * W
                ymax_pts = (ymax / 1000.0) * H
                xmax_pts = (xmax / 1000.0) * W
                
                # Check bounding box sanity
                if xmax_pts > xmin_pts and ymax_pts > ymin_pts:
                    rect = fitz.Rect(xmin_pts, ymin_pts, xmax_pts, ymax_pts)
                    # Render cropped region at high resolution (200 DPI) for clarity
                    zoom = 200 / 72
                    matrix = fitz.Matrix(zoom, zoom)
                    try:
                        pix = page.get_pixmap(clip=rect, matrix=matrix)
                        pix.save(element_path)
                    except Exception as e:
                        print(f"Error cropping page {page_num+1} element {i}: {e}")

def compile_to_docx(total_pages):
    """Assembles all segments and cropped images into a final DOCX file."""
    print("Compiling final Word document...")
    doc = Document()
    
    # Set 1 inch margins
    for section in doc.sections:
        section.top_margin = Inches(1)
        section.bottom_margin = Inches(1)
        section.left_margin = Inches(1)
        section.right_margin = Inches(1)
        
    pdf_doc = fitz.open(PDF_PATH)
    
    first_page = True
    pending_chapter_num = None
    for page_num in range(total_pages):
        layout_path = os.path.join(CACHE_DIR, f"page_{page_num:03d}_layout.json")
        if not os.path.exists(layout_path):
            continue
            
        with open(layout_path, "r", encoding="utf-8") as f:
            data = json.load(f)
            
        if not first_page:
            doc.add_page_break()
        else:
            first_page = False
            
        # Add Page Marker
        p_marker = doc.add_paragraph()
        p_marker.paragraph_format.space_before = Inches(0.1)
        p_marker.paragraph_format.space_after = Inches(0.1)
        run_marker = p_marker.add_run(f"[Page {page_num+1}]")
        run_marker.bold = True
        
        page = pdf_doc[page_num]
        H = page.rect.height
        W = page.rect.width
        
        for i, seg in enumerate(data.get("segments", [])):
            seg_type = seg.get("type")
            if seg_type == "text":
                val = seg.get("value", "").strip()
                if val:
                    is_chapter_num = "অধ্যায়" in val and len(val) < 20 and ":" not in val
                    if is_chapter_num:
                        if pending_chapter_num:
                            doc.add_heading(pending_chapter_num, level=1)
                        pending_chapter_num = val
                    elif pending_chapter_num:
                        combined_heading = f"{pending_chapter_num} : {val}"
                        doc.add_heading(combined_heading, level=1)
                        pending_chapter_num = None
                    else:
                        for line in val.split("\n"):
                            if line.strip():
                                doc.add_paragraph(line.strip())
            elif seg_type == "element":
                if pending_chapter_num:
                    doc.add_heading(pending_chapter_num, level=1)
                    pending_chapter_num = None
                element_path = os.path.join(CACHE_DIR, f"page_{page_num:03d}_element_{i:02d}.png")
                if os.path.exists(element_path):
                    box = seg.get("box_2d", [])
                    if len(box) == 4:
                        ymin, xmin, ymax, xmax = box
                        width_pts = (xmax - xmin) * (W / 1000.0)
                        
                        # Calculate display width in inches (max 5.5 inches, min 0.5 inches)
                        display_width = max(0.5, min(5.5, width_pts / 72.0))
                        
                        # Insert centered picture
                        p_img = doc.add_paragraph()
                        p_img.alignment = 1 # Center
                        p_img.paragraph_format.space_before = Inches(0.1)
                        p_img.paragraph_format.space_after = Inches(0.1)
                        run_img = p_img.add_run()
                        try:
                            run_img.add_picture(element_path, width=Inches(display_width))
                        except Exception as e:
                            print(f"Error inserting picture {element_path}: {e}")
                            
                        # Add a small description below
                        label = seg.get("label", "").strip()
                        if label:
                            p_lbl = doc.add_paragraph()
                            p_lbl.alignment = 1 # Center
                            p_lbl.paragraph_format.space_after = Inches(0.15)
                            run_lbl = p_lbl.add_run(f"({label})")
                            run_lbl.italic = True
                            run_lbl.font.size = Inches(0.12) # ~9pt
                            
    if pending_chapter_num:
        doc.add_heading(pending_chapter_num, level=1)
    doc.save(OUTPUT_DOCX)
    print(f"Successfully compiled: {OUTPUT_DOCX}")

def main():
    if not os.path.exists(PDF_PATH):
        print(f"Error: {PDF_PATH} not found.")
        sys.exit(1)
        
    client = get_gemini_client()
    pdf_doc = fitz.open(PDF_PATH)
    total_pages = len(pdf_doc)
    
    start_page = 0
    end_page = total_pages
    
    if len(sys.argv) >= 3:
        start_page = int(sys.argv[1])
        end_page = min(int(sys.argv[2]), total_pages)
        print(f"Subset mode: Processing pages {start_page+1} to {end_page}")
        
    for page_num in range(start_page, end_page):
        # Render page
        image_path = render_page_to_image(pdf_doc, page_num)
        
        # Get structured layout (OCR and bounding boxes)
        layout_exists = os.path.exists(os.path.join(CACHE_DIR, f"page_{page_num:03d}_layout.json"))
        data = get_page_layout(client, page_num, image_path)
        
        # Crop elements
        crop_elements(pdf_doc, page_num, data.get("segments", []))
        
        # Rate limit sleep is now handled inside get_page_layout()
        pass
            
    if start_page == 0 and end_page == total_pages:
        compile_to_docx(total_pages)
    else:
        print("Subset run complete. Compilation skipped.")

if __name__ == "__main__":
    main()
