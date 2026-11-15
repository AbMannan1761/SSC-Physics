import glob, json, re

for f in sorted(glob.glob("ocr_cache/page_*_layout.json"))[340:]:
    p_num = int(re.search(r"page_(\d+)_layout", f).group(1))
    with open(f, "r", encoding="utf-8") as fl:
        try:
            data = json.load(fl)
            for seg in data.get("segments", []):
                val = seg.get("value", "")
                if "চতুর্দশ" in val or "চিকিৎসা" in val or "১৪" in val:
                    if len(val) < 80:
                        print(f"Page {p_num}: {val}")
        except:
            pass
