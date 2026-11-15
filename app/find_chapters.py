import os
import json
import re

chapters_found = []

for p in range(250):
    f = f'ocr_cache/page_{p:03d}_layout.json'
    if os.path.exists(f):
        try:
            with open(f, 'r', encoding='utf-8') as fl:
                data = json.load(fl)
                for i, seg in enumerate(data.get('segments', [])):
                    val = seg.get('value', '').strip()
                    if any(w in val for w in ['প্রথম অধ্যায়', 'প্রথম অধ্যায়', 'দ্বিতীয় অধ্যায়', 'দ্বিতীয় অধ্যায়', 'তৃতীয় অধ্যায়', 'তৃতীয় অধ্যায়', 'চতুর্থ অধ্যায়', 'চতুর্থ অধ্যায়', 'পঞ্চম অধ্যায়', 'পঞ্চম অধ্যায়', 'ষষ্ঠ অধ্যায়', 'ষষ্ঠ অধ্যায়', 'সপ্তম অধ্যায়', 'সপ্তম অধ্যায়', 'অষ্টম অধ্যায়', 'অষ্টম অধ্যায়', 'নবম অধ্যায়', 'নবম অধ্যায়', 'দশম অধ্যায়', 'দশম অধ্যায়', 'একাদশ অধ্যায়', 'একাদশ অধ্যায়', 'দ্বাদশ অধ্যায়', 'দ্বাদশ অধ্যায়', 'ত্রয়োদশ অধ্যায়', 'ত্রয়োদশ অধ্যায়', 'চতুর্দশ অধ্যায়', 'চতুর্দশ অধ্যায়']):
                        chapters_found.append({
                            'page': p,
                            'title': val
                        })
        except Exception:
            pass

with open('chapters_index.json', 'w', encoding='utf-8') as out:
    json.dump(chapters_found, out, ensure_ascii=False, indent=2)

print(f"Total chapter headings identified: {len(chapters_found)}")
