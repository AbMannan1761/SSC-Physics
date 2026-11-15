import os
import json
import glob
import re

files = sorted(glob.glob("ocr_cache/page_*_layout.json"))
print(f"Indexing {len(files)} pages...")

search_index = []

for f in files:
    m = re.search(r"page_(\d+)_layout", f)
    if not m:
        continue
    page_num = int(m.group(1))
    
    text_chunks = []
    try:
        with open(f, "r", encoding="utf-8") as fl:
            data = json.load(fl)
            for seg in data.get("segments", []):
                if seg.get("type") == "text":
                    v = seg.get("value", "").strip()
                    if v:
                        text_chunks.append(v)
    except Exception as e:
        pass
    
    combined_text = " ".join(text_chunks)
    if combined_text:
        # Save compact entry
        search_index.append({
            "p": page_num,
            "text": combined_text[:1200] # First 1200 chars for snippet extraction & fast search
        })

output_path = "app/js/data/search_index.js"
with open(output_path, "w", encoding="utf-8") as out:
    out.write("window.BOOK_SEARCH_INDEX = ")
    json.dump(search_index, out, ensure_ascii=False)
    out.write(";\n")

print(f"Successfully generated {output_path} with {len(search_index)} pages indexed.")
