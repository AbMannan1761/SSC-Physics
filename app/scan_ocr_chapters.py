import os
import json
import glob
import re

files = glob.glob("ocr_cache/page_*_layout.json")
print("Total cached layout files:", len(files))

chapter_keywords = [
    ("ch1", "প্রথম অধ্যায়", 1),
    ("ch2", "দ্বিতীয় অধ্যায়", 2),
    ("ch3", "তৃতীয় অধ্যায়", 3),
    ("ch4", "চতুর্থ অধ্যায়", 4),
    ("ch5", "পঞ্চম অধ্যায়", 5),
    ("ch6", "ষষ্ঠ অধ্যায়", 6),
    ("ch7", "সপ্তম অধ্যায়", 7),
    ("ch8", "অষ্টম অধ্যায়", 8),
    ("ch9", "নবম অধ্যায়", 9),
    ("ch10", "দশম অধ্যায়", 10),
    ("ch11", "একাদশ অধ্যায়", 11),
    ("ch12", "দ্বাদশ অধ্যায়", 12),
    ("ch13", "ত্রয়োদশ অধ্যায়", 13),
    ("ch14", "চতুর্দশ অধ্যায়", 14),
]

detected = {}

for f in sorted(files):
    p_num = int(re.search(r"page_(\d+)_layout", f).group(1))
    with open(f, "r", encoding="utf-8") as fl:
        try:
            data = json.load(fl)
            for seg in data.get("segments", []):
                val = seg.get("value", "").replace("অধ্যায়", "অধ্যায়")
                for ch_id, kw, num in chapter_keywords:
                    if kw in val and len(val) < 60:
                        if ch_id not in detected:
                            detected[ch_id] = {
                                "id": ch_id,
                                "num": num,
                                "kw": kw,
                                "page": p_num,
                                "text": val
                            }
        except:
            pass

with open("ocr_chapters_detected.json", "w", encoding="utf-8") as out:
    json.dump(detected, out, ensure_ascii=False, indent=2)

print(f"Detected {len(detected)} chapters from OCR cache.")
