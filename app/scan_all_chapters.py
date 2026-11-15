import fitz

doc = fitz.open("2026_Class 9-10_Physics_compressed.pdf")
print("Total pages in PDF:", len(doc))

keywords = [
    "প্রথম অধ্যায়", "প্রথম অধ্যায়",
    "দ্বিতীয় অধ্যায়", "দ্বিতীয় অধ্যায়",
    "তৃতীয় অধ্যায়", "তৃতীয় অধ্যায়",
    "চতুর্থ অধ্যায়", "চতুর্থ অধ্যায়",
    "পঞ্চম অধ্যায়", "পঞ্চম অধ্যায়",
    "ষষ্ঠ অধ্যায়", "ষষ্ঠ অধ্যায়",
    "সপ্তম অধ্যায়", "সপ্তম অধ্যায়",
    "অষ্টম অধ্যায়", "অষ্টম অধ্যায়",
    "নবম অধ্যায়", "নবম অধ্যায়",
    "দশম অধ্যায়", "দশম অধ্যায়",
    "একাদশ অধ্যায়", "একাদশ অধ্যায়",
    "দ্বাদশ অধ্যায়", "দ্বাদশ অধ্যায়",
    "ত্রয়োদশ অধ্যায়", "ত্রয়োদশ অধ্যায়",
    "চতুর্দশ অধ্যায়", "চতুর্দশ অধ্যায়"
]

results = []
for p in range(len(doc)):
    txt = doc[p].get_text()
    for kw in keywords:
        if kw in txt:
            lines = [l.strip() for l in txt.split('\n') if l.strip()]
            for l in lines[:10]:
                if kw in l:
                    results.append((p, kw, lines[lines.index(l):lines.index(l)+4]))
                    break

import json
with open("pdf_chapter_pages.json", "w", encoding="utf-8") as f:
    json.dump(results, f, ensure_ascii=False, indent=2)

print(f"Detected {len(results)} occurrences.")
