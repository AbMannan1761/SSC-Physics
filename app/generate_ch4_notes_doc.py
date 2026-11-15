# -*- coding: utf-8 -*-
"""
Script to generate the comprehensive Udvash & QNA style SSC Physics Chapter 4 Revision Notes docx.
Chapter 4: কাজ, ক্ষমতা ও শক্তি (Work, Power & Energy)
"""

import os
import docx
from docx import Document
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT, WD_ALIGN_VERTICAL
from docx.oxml import OxmlElement, parse_xml
from docx.oxml.ns import nsdecls, qn

def set_cell_background(cell, fill_hex):
    """Sets cell background color using OxmlElement"""
    shading_elm = parse_xml(f'<w:shd {nsdecls("w")} w:fill="{fill_hex}"/>')
    cell._tc.get_or_add_tcPr().append(shading_elm)

def set_callout_box_borders(cell, border_color_hex="1E3A8A", border_sz="36"):
    """Creates a callout box style: thick left border, no top/right/bottom border"""
    tcPr = cell._tc.get_or_add_tcPr()
    borders_elm = parse_xml(f'''
        <w:tcBorders {nsdecls("w")}>
            <w:top w:val="none"/>
            <w:left w:val="single" w:sz="{border_sz}" w:space="0" w:color="{border_color_hex}"/>
            <w:bottom w:val="none"/>
            <w:right w:val="none"/>
        </w:tcBorders>
    ''')
    tcPr.append(borders_elm)

def set_table_borders(table, border_color="D1D5DB"):
    """Sets thin subtle borders for tables"""
    tblPr = table._tbl.tblPr
    borders_elm = parse_xml(f'''
        <w:tblBorders {nsdecls("w")}>
            <w:top w:val="single" w:sz="6" w:space="0" w:color="{border_color}"/>
            <w:bottom w:val="single" w:sz="6" w:space="0" w:color="{border_color}"/>
            <w:left w:val="none"/>
            <w:right w:val="none"/>
            <w:insideH w:val="single" w:sz="4" w:space="0" w:color="{border_color}"/>
            <w:insideV w:val="none"/>
        </w:tblBorders>
    ''')
    tblPr.append(borders_elm)

def add_callout(doc, title, text, box_type="trap"):
    """
    Creates a styled callout box.
    box_type: 'trap' (Red/Amber), 'tip' (Green/Teal), 'concept' (Blue)
    """
    tbl = doc.add_table(rows=1, cols=1)
    tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
    tbl.autofit = False
    
    cell = tbl.cell(0, 0)
    cell.width = Inches(6.8)
    
    if box_type == "trap":
        fill_hex = "FEF2F2"       # light red
        border_hex = "DC2626"     # crimson
        title_color = RGBColor(185, 28, 28)
        icon = "⚠️ STUDENT TRAP & ALERT | সাবধানতা:"
    elif box_type == "tip":
        fill_hex = "F0FDF4"       # light green
        border_hex = "16A34A"     # green
        title_color = RGBColor(22, 101, 52)
        icon = "💡 MASTER SHORTCUT / PRO TIP:"
    elif box_type == "math_box":
        fill_hex = "F8FAFC"       # slate light
        border_hex = "0284C7"     # sky blue
        title_color = RGBColor(3, 105, 161)
        icon = "🎯 FORMULA & CRUX:"
    else:
        fill_hex = "EFF6FF"       # light blue
        border_hex = "2563EB"     # royal blue
        title_color = RGBColor(30, 64, 175)
        icon = "📌 CORE CONCEPT KEYNOTE:"

    set_cell_background(cell, fill_hex)
    set_callout_box_borders(cell, border_hex, border_sz="36")
    
    p = cell.paragraphs[0]
    p.paragraph_format.space_before = Pt(4)
    p.paragraph_format.space_after = Pt(3)
    p.paragraph_format.line_spacing = 1.15
    run_icon = p.add_run(f"{icon} {title}\n")
    run_icon.bold = True
    run_icon.font.name = "Segoe UI"
    run_icon.font.size = Pt(10.5)
    run_icon.font.color.rgb = title_color
    
    run_text = p.add_run(text)
    run_text.font.name = "Segoe UI"
    run_text.font.size = Pt(10)
    run_text.font.color.rgb = RGBColor(31, 41, 55)

    # Empty spacer paragraph after table
    p_after = doc.add_paragraph()
    p_after.paragraph_format.space_before = Pt(0)
    p_after.paragraph_format.space_after = Pt(4)

def build_ch4_doc():
    doc = Document()
    
    # Page setup - Margins 0.8 inch
    sections = doc.sections
    for section in sections:
        section.top_margin = Inches(0.8)
        section.bottom_margin = Inches(0.8)
        section.left_margin = Inches(0.8)
        section.right_margin = Inches(0.8)
        
        # Header & Footer
        header = section.header
        hp = header.paragraphs[0]
        hp.alignment = WD_ALIGN_PARAGRAPH.RIGHT
        hrun = hp.add_run("SSC Physics Master Revision Series | উদ্ভাস ও কিউএনএ স্টাইল নোট")
        hrun.font.name = "Segoe UI"
        hrun.font.size = Pt(8.5)
        hrun.font.color.rgb = RGBColor(156, 163, 175)
        
        footer = section.footer
        fp = footer.paragraphs[0]
        fp.alignment = WD_ALIGN_PARAGRAPH.CENTER
        frun = fp.add_run("অধ্যায় ৪: কাজ, ক্ষমতা ও শক্তি (Work, Power & Energy) | PhysicsCore Pro")
        frun.font.name = "Segoe UI"
        frun.font.size = Pt(8.5)
        frun.font.color.rgb = RGBColor(156, 163, 175)

    # Helper styling functions
    def add_h1(text):
        p = doc.add_paragraph()
        p.paragraph_format.space_before = Pt(18)
        p.paragraph_format.space_after = Pt(6)
        p.paragraph_format.keep_with_next = True
        run = p.add_run(text)
        run.bold = True
        run.font.name = "Segoe UI"
        run.font.size = Pt(16)
        run.font.color.rgb = RGBColor(15, 44, 89) # Deep Navy
        return p

    def add_h2(text):
        p = doc.add_paragraph()
        p.paragraph_format.space_before = Pt(12)
        p.paragraph_format.space_after = Pt(4)
        p.paragraph_format.keep_with_next = True
        run = p.add_run(text)
        run.bold = True
        run.font.name = "Segoe UI"
        run.font.size = Pt(13)
        run.font.color.rgb = RGBColor(3, 105, 161) # Accent Blue
        return p

    def add_h3(text):
        p = doc.add_paragraph()
        p.paragraph_format.space_before = Pt(8)
        p.paragraph_format.space_after = Pt(2)
        p.paragraph_format.keep_with_next = True
        run = p.add_run(text)
        run.bold = True
        run.font.name = "Segoe UI"
        run.font.size = Pt(11)
        run.font.color.rgb = RGBColor(55, 65, 81)
        return p

    def add_p(text, bold_prefix=None, space_after=4):
        p = doc.add_paragraph()
        p.paragraph_format.space_before = Pt(2)
        p.paragraph_format.space_after = Pt(space_after)
        p.paragraph_format.line_spacing = 1.15
        if bold_prefix:
            run_b = p.add_run(bold_prefix)
            run_b.bold = True
            run_b.font.name = "Segoe UI"
            run_b.font.size = Pt(10.5)
            run_b.font.color.rgb = RGBColor(17, 24, 39)
        run = p.add_run(text)
        run.font.name = "Segoe UI"
        run.font.size = Pt(10.5)
        run.font.color.rgb = RGBColor(31, 41, 55)
        return p

    def add_bullet(bold_head, text):
        p = doc.add_paragraph(style='List Bullet')
        p.paragraph_format.space_before = Pt(1)
        p.paragraph_format.space_after = Pt(2)
        p.paragraph_format.line_spacing = 1.15
        run_b = p.add_run(bold_head)
        run_b.bold = True
        run_b.font.name = "Segoe UI"
        run_b.font.size = Pt(10.5)
        run_b.font.color.rgb = RGBColor(15, 23, 42)
        run_t = p.add_run(text)
        run_t.font.name = "Segoe UI"
        run_t.font.size = Pt(10.5)
        run_t.font.color.rgb = RGBColor(55, 65, 81)
        return p

    # --- COVER / TITLE BANNER ---
    title_p = doc.add_paragraph()
    title_p.paragraph_format.space_before = Pt(6)
    title_p.paragraph_format.space_after = Pt(2)
    title_p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r_badge = title_p.add_run("SSC PHYSICS ULTIMATE REVISION & CONCEPT NOTE\n")
    r_badge.bold = True
    r_badge.font.name = "Segoe UI"
    r_badge.font.size = Pt(10.5)
    r_badge.font.color.rgb = RGBColor(2, 132, 199)

    r_title = title_p.add_run("অধ্যায় ৪: কাজ, ক্ষমতা ও শক্তি (Work, Power & Energy)\n")
    r_title.bold = True
    r_title.font.name = "Segoe UI"
    r_title.font.size = Pt(20)
    r_title.font.color.rgb = RGBColor(15, 44, 89)

    r_sub = title_p.add_run("উদ্ভাস কনসেপ্ট বুক + কিউএনএ প্লেক্স স্পেশাল রিভিশন ফরম্যাট | বোর্ড ও শীর্ষ স্কুলের ১০০% সমাধান")
    r_sub.font.name = "Segoe UI"
    r_sub.font.size = Pt(10.5)
    r_sub.font.italic = True
    r_sub.font.color.rgb = RGBColor(107, 114, 128)

    # Divider line
    div_p = doc.add_paragraph()
    div_p.paragraph_format.space_after = Pt(12)
    div_p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r_div = div_p.add_run("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
    r_div.font.color.rgb = RGBColor(203, 213, 225)
    r_div.font.size = Pt(10)

    # --- TOPIC 1: কাজ (WORK) ---
    add_h1("১. কাজ (Work): গভীর কনসেপ্ট ও বাস্তব ফিল")
    
    add_p(
        "দৈনন্দিন জীবনে কোনো কিছু নিয়ে ভাবা বা দারোয়ান বসে বসে পাহারা দেওয়াকে আমরা 'কাজ' বলি। কিন্তু পদার্থবিজ্ঞানে 'কাজ' হতে হলে বল এবং সেই বলের কারণে সরণ—দুটোই আবশ্যক!",
        "বাস্তব জীবনের অ্যানালজি: "
    )
    add_p(
        "কোনো বস্তুর ওপর বল প্রযুক্ত হলে যদি বলের দিকে বস্তুর সরণ ঘটে (অথবা বলের অভিমুখে সরণের উপাংশ থাকে), তবে বল এবং সরণের গুণফলকে কাজ বলে।",
        "পদার্থবিজ্ঞানের আনুষ্ঠানিক সংজ্ঞা: "
    )

    add_h2("১.১ কাজের গাণিতিক রূপ ও বিভিন্ন কোণে কাজের শর্ত")
    add_p(
        "১) বলের দিকে সরাসরি সরণ ঘটলে: W = F × s\n"
        "২) প্রযুক্ত বল (F) এবং সরণের (s) মধ্যবর্তী কোণ θ হলে: W = F s cosθ\n"
        "এখানে s cosθ হলো বলের দিকে সরণের রূপাংশ (Component of displacement along the force)।",
        "কাজের সাধারণ সমীকরণ: "
    )

    # কাজের কোণভিত্তিক প্রকারভেদের টেবিল
    table1 = doc.add_table(rows=4, cols=4)
    table1.alignment = WD_TABLE_ALIGNMENT.CENTER
    set_table_borders(table1)
    
    headers = ["কোণ (θ) এর মান", "cosθ ও কাজের মান", "কাজের প্রকৃতি", "বাস্তব উদাহরণ ও ব্যাখ্যা"]
    hdr_row = table1.rows[0]
    for i, h in enumerate(headers):
        cell = hdr_row.cells[i]
        set_cell_background(cell, "1E3A8A")
        cp = cell.paragraphs[0]
        cp.alignment = WD_ALIGN_PARAGRAPH.CENTER
        crun = cp.add_run(h)
        crun.bold = True
        crun.font.name = "Segoe UI"
        crun.font.size = Pt(9.5)
        crun.font.color.rgb = RGBColor(255, 255, 255)

    row_data = [
        ("0° ≤ θ < 90°\n(সূক্ষ্মকোণ)", "cosθ > 0\nW = ধনাত্মক (+)", "বলের দ্বারা কাজ\n(Work done by force)", "উপর থেকে বস্তু নিচে পড়লে অভিকর্ষ বলের দ্বারা কৃতকাজ ধনাত্মক। কারণ বল যেদিকে, সরণও সেদিকে (θ = 0°)।"),
        ("θ = 90°\n(সমকোণ)", "cos 90° = 0\nW = 0 (শূন্য কাজ)", "শূন্য কাজ\n(Zero Work)", "মাথায় বোঝা নিয়ে অনুভূমিক রাস্তায় হাঁটা, কিংবা সূর্যের চারদিকে পৃথিবীর ঘূর্ণনে অভিকর্ষ বল সরণের সাথে লম্বভাবে থাকায় কাজ শূন্য।"),
        ("90° < θ ≤ 180°\n(স্থূলকোণ)", "cosθ < 0\nW = ঋণাত্মক (-)", "বলের বিরুদ্ধে কাজ\n(Work done against force)", "একটি বস্তুকে নিচ থেকে ওপরে তুললে অভিকর্ষ বলের বিরুদ্ধে কাজ হয় (θ = 180°, কারণ অভিকর্ষ নিচের দিকে কিন্তু সরণ ওপরের দিকে)।")
    ]

    for r_idx, r in enumerate(row_data):
        row = table1.rows[r_idx + 1]
        for c_idx, val in enumerate(r):
            cell = row.cells[c_idx]
            if r_idx % 2 == 1:
                set_cell_background(cell, "F8FAFC")
            cp = cell.paragraphs[0]
            crun = cp.add_run(val)
            crun.font.name = "Segoe UI"
            crun.font.size = Pt(9)
            if c_idx == 0 or c_idx == 1:
                cp.alignment = WD_ALIGN_PARAGRAPH.CENTER
                crun.bold = True

    p_sp = doc.add_paragraph()
    p_sp.paragraph_format.space_after = Pt(4)

    add_callout(
        doc,
        "বৃত্তাকার পথে ঘূর্ণায়মান বস্তুর ক্ষেত্রে কাজ সর্বদা শূন্য!",
        "যখন কোনো বস্তু বৃত্তাকার পথে ঘোরে, তখন কেন্দ্রমুখী বল (Centripetal force) সর্বদা বৃত্তের কেন্দ্রের দিকে ক্রিয়া করে এবং বস্তুর তাৎক্ষণিক সরণ হয় স্পর্শক বরাবর। ফলে স্পর্শক ও ব্যাসার্ধের মধ্যবর্তী কোণ θ = 90°। যেহেতু cos 90° = 0, তাই বৃত্তাকার কক্ষপথে একটি পূর্ণ ঘূর্ণন সম্পন্ন হোক বা যেকোনো অংশ হোক—কেন্দ্রমুখী বল দ্বারা কৃতকাজ সর্বদা শূন্য!",
        "trap"
    )

    add_h2("১.২ কাজের একক ও মাত্রা")
    add_bullet("একক: ", "জুল (Joule, J)। 1 J = 1 N × 1 m = 1 kg·m²·s⁻²।")
    add_bullet("১ জুল কাকে বলে? ", "কোনো বস্তুর ওপর 1 N বল প্রয়োগের ফলে যদি বলের দিকে বস্তুর 1 m সরণ ঘটে, তবে তার কৃতকাজকে 1 জুল (J) বলে।")
    add_bullet("মাত্রা: ", "[W] = [বল × সরণ] = [MLT⁻²] × [L] = [ML²T⁻²]। (কাজের মাত্রা এবং শক্তির মাত্রা অভিন্ন)।")
    add_bullet("রাশি প্রকৃতি: ", "কাজ একটি স্কেলার রাশি (Scalar Quantity), যদিও এটি দুটি ভেক্টর রাশি (বল ও সরণ) এর ডট গুণফল।")

    # --- TOPIC 2: শক্তি (ENERGY) ---
    add_h1("২. শক্তি (Energy): প্রকারভেদ ও রূপান্তর")
    add_p(
        "কোনো বস্তুর কাজ করার সামর্থ্যকে শক্তি বলে। কাজ সম্পন্ন হওয়া মানেই শক্তির রূপান্তর ঘটা। অর্থাৎ, কৃতকাজ = স্থানান্তরিত বা রূপান্তরিত শক্তি (W = ΔE)। তাই শক্তির একক ও মাত্রাও কাজের সমান (জুল এবং [ML²T⁻²])।",
        "সংজ্ঞা ও মূল রহস্য: "
    )

    add_h2("২.১ যান্ত্রিক শক্তি (Mechanical Energy)")
    add_p("যান্ত্রিক শক্তি প্রধানত দুই প্রকার: ১) বিভব শক্তি (Potential Energy) এবং ২) গতিশক্তি (Kinetic Energy)।")

    add_h3("ক) বিভব শক্তি (Potential Energy, Ep বা V)")
    add_p(
        "স্বাভাবিক অবস্থা বা অবস্থান পরিবর্তন করে কোনো বস্তুকে অন্য কোনো অবস্থা বা অবস্থানে আনলে বস্তু কাজ করার যে সামর্থ্য অর্জন করে, তাকে বিভব শক্তি বলে।",
        "সংজ্ঞা: "
    )
    add_p(
        "১) অভিকর্ষীয় বিভব শক্তি: m ভরের বস্তুকে ভূপৃষ্ঠ থেকে h উচ্চতায় তুললে অভিকর্ষের বিরুদ্ধে কৃতকাজই বিভব শক্তি হিসেবে সঞ্চিত হয়:\n"
        "   Ep = W = F × h = mgh\n"
        "২) স্প্রিং এর বিভব শক্তি: স্প্রিং এর সাম্যাবস্থা থেকে x পরিমাণ সংকুচিত বা প্রসারিত করলে সঞ্চিত স্থৈতিক শক্তি:\n"
        "   Ep = ½ k x² (যেখানে k = স্প্রিং ধ্রুবক, একক N/m)।",
        "গাণিতিক সমীকরণ: "
    )

    add_callout(
        doc,
        "বিভব শক্তির জন্য সর্বদা একটি 'প্রসঙ্গ তল' (Reference Plane) প্রয়োজন!",
        "ভূমিকে সাধারণত শূন্য বিভব শক্তি ধরা হয় (Ep = 0)। কিন্তু যদি কুয়ার তলদেশ থেকে পরিমাপ করা হয়, তবে ভূমির উচ্চতা হবে ধনাত্মক বিভব শক্তি এবং কুয়ার নিচে হবে ঋণাত্মক বিভব শক্তি। অঙ্ক করার সময় সবসময় স্পষ্ট করে নিতে হবে কার সাপেক্ষে উচ্চতা h ধরা হচ্ছে।",
        "concept"
    )

    add_h3("খ) গতিশক্তি (Kinetic Energy, Ek বা T)")
    add_p(
        "কোনো গতিশীল বস্তু তার গতির জন্য কাজ করার যে সামর্থ্য লাভ করে, তাকে তার গতিশক্তি বলে।",
        "সংজ্ঞা: "
    )
    add_p(
        "ধরি, m ভরের স্থির বস্তুর (u = 0) ওপর F বল প্রয়োগ করায় বস্তুটির a ত্বরণ সৃষ্টি হলো এবং s দূরত্ব অতিক্রম করে v শেষবেগ অর্জন করল।\n"
        "কৃতকাজ Ek = F × s = (ma) × s = m (as)\n"
        "আমরা গতির সমীকরণ থেকে জানি, v² = u² + 2as ⇒ v² = 0 + 2as ⇒ as = ½ v²\n"
        "সুতরাং, Ek = m (½ v²) = ½ mv²",
        "প্রতিপাদন (Derivation): "
    )

    add_h3("গ) ভরবেগ (p) এবং গতিশক্তির (Ek) মধ্যকার গভীর সম্পর্ক")
    add_p(
        "ভরবেগ p = mv ⇒ v = p/m। গতিশক্তির সূত্রে বসিয়ে পাই:\n"
        "Ek = ½ m (p/m)² = ½ m (p² / m²) = p² / (2m)\n"
        "অর্থাৎ, Ek = p² / 2m   এবং   p = √(2m Ek)",
        "মাস্টার ফর্মুলা: "
    )

    add_callout(
        doc,
        "ভরবেগ ও গতিশক্তির পরিবর্তনের সুপার শর্টকাট (MCQ 5-Second Hack):",
        "১) যদি কোনো বস্তুর ভরবেগ x% বৃদ্ধি পায়, তবে নতুন গতিশক্তি বৃদ্ধির হার = [ (1 + x/100)² - 1 ] × 100%\n"
        "   উদাহরণ: ভরবেগ ৫০% বাড়লে গতিশক্তি বাড়বে: (1.5² - 1) × 100% = 125%!\n"
        "২) যদি গতিশক্তি E গুণ করা হয়, তবে ভরবেগ বৃদ্ধি পাবে √E গুণ।\n"
        "৩) দুটি ভিন্ন ভরের বস্তুর (m₁ < m₂) ভরবেগ সমান হলে, হালকা বস্তুর গতিশক্তি বেশি হবে (যেহেতু Ek ∝ 1/m যখন p স্থির)।",
        "tip"
    )

    # --- TOPIC 3: শক্তির নিত্যতা বা সংরক্ষণশীলতা নীতি ---
    add_h1("৩. শক্তির নিত্যতা নীতি ও মুক্তভাবে পড়ন্ত বস্তু")
    add_p(
        "শক্তির সৃষ্টি বা ধ্বংস নেই, শক্তি কেবল এক রূপ থেকে অন্য রূপে রূপান্তরিত হতে পারে। মহাবিশ্বের মোট শক্তির পরিমাণ নির্দিষ্ট ও অপরিবর্তনীয়।",
        "মূল নীতি: "
    )

    add_h2("৩.১ মুক্তভাবে পড়ন্ত বস্তুর বিভিন্ন বিন্দুতে মোট শক্তির নিত্যতা প্রমাণ")
    add_p(
        "ধরি, m ভরের একটি বস্তু ভূমি থেকে h উচ্চতায় A বিন্দুতে স্থির অবস্থায় আছে। বস্তুটি মুক্তভাবে নিচে পড়তে থাকলে পথিমধ্যে B একটি বিন্দু যা A থেকে x নিচে (ভূমি থেকে h - x উচ্চতায়), এবং C হলো ভূমিস্পর্শ করার ঠিক পূর্ব মুহূর্তের বিন্দু।",
        "দৃশ্যপট: "
    )

    # A, B, C পয়েন্টের সমীকরণ টেবিল
    table2 = doc.add_table(rows=4, cols=4)
    table2.alignment = WD_TABLE_ALIGNMENT.CENTER
    set_table_borders(table2)

    headers2 = ["অবস্থান (বিন্দু)", "বিভব শক্তি (Ep)", "গতিশক্তি (Ek)", "মোট শক্তি (E = Ep + Ek)"]
    for i, h in enumerate(headers2):
        cell = table2.rows[0].cells[i]
        set_cell_background(cell, "0369A1")
        cp = cell.paragraphs[0]
        cp.alignment = WD_ALIGN_PARAGRAPH.CENTER
        crun = cp.add_run(h)
        crun.bold = True
        crun.font.name = "Segoe UI"
        crun.font.size = Pt(9.5)
        crun.font.color.rgb = RGBColor(255, 255, 255)

    row_data2 = [
        ("শীর্ষবিন্দু A\n(উচ্চতা = h, বেগ v = 0)", "Ep = mgh", "Ek = ½ m(0)² = 0", "E_A = mgh + 0 = mgh"),
        ("মধ্যবর্তী বিন্দু B\n(উচ্চতা = h - x,\nপতন দূরত্ব = x)", "Ep = mg(h - x)\n= mgh - mgx", "v_B² = 0 + 2gx\nEk = ½ m(2gx) = mgx", "E_B = (mgh - mgx) + mgx\n= mgh"),
        ("ভূমিস্পর্শ মুহূর্ত C\n(উচ্চতা = 0,\nপতন দূরত্ব = h)", "Ep = mg(0) = 0", "v_C² = 0 + 2gh\nEk = ½ m(2gh) = mgh", "E_C = 0 + mgh = mgh")
    ]

    for r_idx, r in enumerate(row_data2):
        row = table2.rows[r_idx + 1]
        for c_idx, val in enumerate(r):
            cell = row.cells[c_idx]
            if r_idx % 2 == 1:
                set_cell_background(cell, "F8FAFC")
            cp = cell.paragraphs[0]
            crun = cp.add_run(val)
            crun.font.name = "Segoe UI"
            crun.font.size = Pt(9)
            if c_idx == 0 or c_idx == 3:
                cp.alignment = WD_ALIGN_PARAGRAPH.CENTER
                crun.bold = True

    p_sp2 = doc.add_paragraph()
    p_sp2.paragraph_format.space_after = Pt(4)

    add_p(
        "দেখা যাচ্ছে, A, B এবং C প্রতিটি বিন্দুতেই বস্তুর মোট যান্ত্রিক শক্তি সর্বদা ধ্রুবক (mgh)। অর্থাৎ পতনকালে বিভব শক্তি ক্রমাগত কমতে থাকে এবং সমপরিমাণে গতিশক্তি বাড়তে থাকে।",
        "উপসংহার: "
    )

    add_callout(
        doc,
        "কোথায় বিভব শক্তি ও গতিশক্তি সমান বা n গুণ হবে? (Golden Shortcut Formula)",
        "প্রশ্ন ১: ভূমি থেকে কত উচ্চতায় বিভব শক্তি ও গতিশক্তি সমান হবে (Ek = Ep)?\n"
        "   উত্তর: x = h / 2 (ঠিক অর্ধেক উচ্চতায়)।\n\n"
        "প্রশ্ন ২: ভূমি থেকে কত উচ্চতায় গতিশক্তি বিভব শক্তির n গুণ হবে (Ek = n Ep)?\n"
        "   শর্টকাট সূত্র: উচ্চতা x = h / (n + 1)\n"
        "   (উদাহরণ: গতিশক্তি বিভব শক্তির দ্বিগুণ হলে, n = 2 ⇒ x = h / (2 + 1) = h/3)।\n\n"
        "প্রশ্ন ৩: ভূমি থেকে কত উচ্চতায় বিভব শক্তি গতিশক্তির n গুণ হবে (Ep = n Ek)?\n"
        "   শর্টকাট সূত্র: উচ্চতা x = [ n / (n + 1) ] × h\n"
        "   (উদাহরণ: বিভব শক্তি গতিশক্তির দ্বিগুণ হলে, n = 2 ⇒ x = (2/3) h)।",
        "tip"
    )

    # --- TOPIC 4: ক্ষমতা ও কর্মদক্ষতা ---
    add_h1("৪. ক্ষমতা (Power) ও কর্মদক্ষতা (Efficiency)")
    
    add_h2("৪.১ ক্ষমতা (Power, P)")
    add_bullet("সংজ্ঞা: ", "কোনো ব্যক্তি বা উৎসের কাজ করার হারকে ক্ষমতা বলে। অর্থাৎ একক সময়ে যে পরিমাণ কাজ সম্পন্ন হয়।")
    add_bullet("গাণিতিক রূপ: ", "P = W / t = (F × s) / t = F × (s / t) = F × v (বল × সুষম বেগ)।")
    add_bullet("একক: ", "ওয়াট (Watt, W)। 1 W = 1 J/s। বড় একক: 1 কিলোওয়াট (kW) = 1000 W, 1 মেগাওয়াট (MW) = 10⁶ W।")
    add_bullet("অশ্বক্ষমতা (Horsepower, hp): ", "1 hp = 746 Watt। ইঞ্জিন বা মোটরের ক্ষমতা প্রকাশে বহুল ব্যবহৃত।")
    add_bullet("মাত্রা: ", "[P] = [কাজ / সময়] = [ML²T⁻²] / [T] = [ML²T⁻³]।")

    add_h2("৪.২ কর্মদক্ষতা (Efficiency, η)")
    add_p(
        "বাস্তব জগতে কোনো যন্ত্রই তার মধ্যে প্রদত্ত সম্পূর্ণ শক্তিকে কার্যকর কাজে রূপান্তর করতে পারে না। ঘর্ষণ, তাপ ও শব্দের কারণে শক্তির কিছু অপচয় ঘটে।",
        "বাস্তব ভিত্তি: "
    )
    add_p(
        "কোনো যন্ত্র থেকে প্রাপ্ত মোট কার্যকর শক্তি (বা কার্যকর ক্ষমতা) এবং যন্ত্রে প্রদত্ত মোট শক্তির (বা প্রদত্ত মোট ক্ষমতা) অনুপাতকে কর্মদক্ষতা বলে। একে শতকরায় প্রকাশ করা হয়।",
        "সংজ্ঞা: "
    )
    add_p(
        "η = (লভ্য কার্যকর শক্তি / প্রদত্ত মোট শক্তি) × 100% = (W_out / W_in) × 100%\n"
        "অথবা ক্ষমতার সাপেক্ষে: η = (P_out / P_in) × 100%\n"
        "যেখানে, অপচয়কৃত ক্ষমতা P_loss = P_in - P_out।",
        "মাস্টার ইকুয়েশন: "
    )

    add_callout(
        doc,
        "পানির পাম্প ও কুয়া (Well) খালি করার মহাবিপদজনক ফাঁদ—'ভরকেন্দ্রের সরণ' (h')!",
        "পানির পাম্পের ম্যাথে কাজ W = mgh' সূত্রে h' কিন্তু কুয়ার মোট গভীরতা নয়! h' হলো পানির ভরকেন্দ্রের সরণ (Displacement of Center of Mass)।\n\n"
        "১) সম্পূর্ণ পূর্ণ কুয়া সম্পূর্ণ খালি করতে: h' = (0 + h) / 2 = h / 2\n"
        "২) সম্পূর্ণ পূর্ণ কুয়ার অর্ধেক খালি করতে: h' = (0 + h/2) / 2 = h / 4\n"
        "৩) অর্ধেক পূর্ণ কুয়া সম্পূর্ণ খালি করতে: h' = (h/2 + h) / 2 = 3h / 4 (সবচেয়ে বেশি আসে!)\n"
        "৪) কুয়ার এক-তৃতীয়াংশ পূর্ণ থাকলে পুরোটা তুলতে: h' = (2h/3 + h) / 2 = 5h / 6\n"
        "মনে রাখার ব্রহ্মাস্ত্র: h' = (পানির ওপরের পৃষ্ঠের গভীরতা + পানির নিচের পৃষ্ঠের গভীরতা) / ২।",
        "trap"
    )

    # --- TOPIC 5: টাইপভিত্তিক গাণিতিক সমস্যা ও সমাধান ---
    add_h1("৫. টাইপভিত্তিক গাণিতিক মাস্টারক্লাস (Type-wise Math Mastery)")

    # TYPE 1
    add_h2("Type 1: কোণযুক্ত বল ও পরিবর্তনশীল কাজের ম্যাথ")
    add_p(
        "একটি ট্রলি ব্যাগের হাতল অনুভূমিকের সাথে 30° কোণে রেখে একজন যাত্রী 50 N বল প্রয়োগ করে 100 m টেনে নিয়ে গেলেন। কৃতকাজ কত?",
        "গাণিতিক সমস্যা ১.১: "
    )
    add_p(
        "দেওয়া আছে: প্রযুক্ত বল F = 50 N, সরণ s = 100 m, মধ্যবর্তী কোণ θ = 30°\n"
        "আমরা জানি, কৃতকাজ W = F s cosθ\n"
        "W = 50 × 100 × cos 30° = 5000 × (√3 / 2) = 5000 × 0.866 = 4330.13 J (বা 4.33 kJ)\n"
        "উত্তর: কৃতকাজ 4330.13 জুল।",
        "সমাধান: "
    )

    # TYPE 2
    add_h2("Type 2: মুক্তভাবে পড়ন্ত বস্তু ও নির্দিষ্ট উচ্চতায় শক্তির বিভাজন")
    add_p(
        "5 kg ভরের একটি বস্তুকে 80 m উঁচু দালানের ছাদ থেকে বিনা বাধায় ছেড়ে দেওয়া হলো।\n"
        "ক) ভূমি থেকে কত উচ্চতায় বস্তুটির গতিশক্তি বিভব শক্তির এক-তৃতীয়াংশ (1/3) হবে?\n"
        "খ) ভূমি স্পর্শ করার মুহূর্তে বস্তুটির বেগ কত হবে?",
        "গাণিতিক সমস্যা ২.১ (বোর্ড স্ট্যান্ডার্ড): "
    )
    add_p(
        "ধরি, ভূমি থেকে x উচ্চতায় গতিশক্তি বিভব শক্তির এক-তৃতীয়াংশ হবে। অর্থাৎ Ek = ⅓ Ep ⇒ Ep = 3 Ek।\n"
        "ভূমি থেকে উচ্চতা = x, সুতরাং বিভব শক্তি Ep = mgx\n"
        "পতন দূরত্ব h' = (80 - x), সুতরাং v² = u² + 2gh' = 0 + 2g(80 - x)\n"
        "গতিশক্তি Ek = ½ mv² = ½ m [2g(80 - x)] = mg(80 - x)\n\n"
        "শর্তমতে, Ep = 3 Ek\n"
        "⇒ mgx = 3 [mg(80 - x)]\n"
        "⇒ x = 3(80 - x) = 240 - 3x\n"
        "⇒ 4x = 240 ⇒ x = 60 m।\n"
        "[শর্টকাট যাচাই: Ep = n Ek এখানে n = 3, তাই x = (n/(n+1)) h = (3/4) × 80 = 60 m! মিলে গেছে!]\n\n"
        "খ-এর সমাধান: সম্পূর্ণ পতনে সরণ h = 80 m।\n"
        "v² = u² + 2gh = 0 + 2 × 9.8 × 80 = 1568 ⇒ v = √1568 = 39.6 m/s।\n"
        "উত্তর: ক) 60 m উচ্চতায়; খ) 39.6 m/s।",
        "ধাপভিত্তিক সমাধান: "
    )

    # TYPE 3
    add_h2("Type 3: ভরবেগ ও গতিশক্তির শতকরা পরিবর্তন")
    add_p(
        "একটি গতিশীল বস্তুর ভরবেগ 60% বৃদ্ধি করা হলো। বস্তুটির গতিশক্তি শতকরা কত বৃদ্ধি পাবে?",
        "গাণিতিক সমস্যা ৩.১: "
    )
    add_p(
        "ধরি, আদি ভরবেগ = p₁ এবং আদি গতিশক্তি Ek₁ = p₁² / 2m\n"
        "ভরবেগ 60% বৃদ্ধিতে শেষ ভরবেগ p₂ = p₁ + 0.60 p₁ = 1.60 p₁\n"
        "শেষ গতিশক্তি Ek₂ = p₂² / 2m = (1.60 p₁)² / 2m = 2.56 (p₁² / 2m) = 2.56 Ek₁\n"
        "গতিশক্তি বৃদ্ধি ΔEk = Ek₂ - Ek₁ = 2.56 Ek₁ - Ek₁ = 1.56 Ek₁\n"
        "শতকরা বৃদ্ধি = (ΔEk / Ek₁) × 100% = 1.56 × 100% = 156%।\n"
        "উত্তর: গতিশক্তি 156% বৃদ্ধি পাবে।",
        "সমাধান: "
    )

    # TYPE 4
    add_h2("Type 4: পানির পাম্প, কুয়া খালি করা ও কর্মদক্ষতার কম্বাইন্ড ম্যাথ")
    add_p(
        "একটি কুয়ার গভীরতা 12 m এবং ব্যাস 2 m। কুয়াটি পানি দ্বারা অর্ধেক পূর্ণ আছে। 2.5 kW ক্ষমতার একটি পাম্প 15 মিনিটে কুয়াটিকে সম্পূর্ণ পানিশূন্য করতে পারে।\n"
        "ক) উত্তোলিত পানির ভর নির্ণয় করো।\n"
        "খ) পাম্পটির কর্মদক্ষতা কত ছিল?",
        "গাণিতিক সমস্যা ৪.১ (শীর্ষ ক্যাডেট ও বোর্ড CQ স্পেশাল): "
    )
    add_p(
        "ক) পানির ভর (m):\n"
        "কুয়ার ব্যাসার্ধ r = 2/2 = 1 m। কুয়াটি অর্ধেক পূর্ণ থাকায় পানির স্তম্ভের উচ্চতা h_w = 12 / 2 = 6 m।\n"
        "পানির আয়তন V = π r² h_w = 3.1416 × (1)² × 6 = 18.8496 m³\n"
        "পানির ঘনত্ব ρ = 1000 kg/m³\n"
        "পানির ভর m = V × ρ = 18.8496 × 1000 = 18849.6 kg ≈ 18850 kg।\n\n"
        "খ) কর্মদক্ষতা (η) নির্ণয়:\n"
        "এখানে সবচেয়ে গুরুত্বপূর্ণ হলো ভরকেন্দ্রের সরণ (h')!\n"
        "কুয়া অর্ধেক পূর্ণ থাকায় পানির ওপরের পৃষ্ঠ ছিল 6 m নিচে এবং নিচের পৃষ্ঠ ছিল 12 m নিচে।\n"
        "সুতরাং ভরকেন্দ্রের সরণ h' = (6 + 12) / 2 = 18 / 2 = 9 m।\n"
        "লভ্য কার্যকর কাজ W_out = m g h' = 18849.6 × 9.8 × 9 = 1,662,534.72 J\n"
        "সময় t = 15 min = 15 × 60 = 900 s\n"
        "লভ্য কার্যকর ক্ষমতা P_out = W_out / t = 1,662,534.72 / 900 = 1847.26 W\n"
        "প্রদত্ত মোট ক্ষমতা P_in = 2.5 kW = 2500 W\n"
        "কর্মদক্ষতা η = (P_out / P_in) × 100% = (1847.26 / 2500) × 100% = 73.89%\n"
        "উত্তর: ক) পানির ভর 18850 kg; খ) কর্মদক্ষতা 73.89%।",
        "ধাপভিত্তিক নিখুঁত সমাধান: "
    )

    # --- TOPIC 6: অনুধাবনমূলক প্রশ্নব্যাংক (ক ও খ) ---
    add_h1("৬. গুরুত্বপূর্ণ জ্ঞান ও অনুধাবনমূলক প্রশ্নব্যাংক (ক ও খ স্পেশাল)")

    add_h2("জ্ঞানমূলক প্রশ্ন ('ক' বিভাগ):")
    add_bullet("কাজ কী? ", "বল এবং বলের দিকে সরণের রূপাংশের গুণফলকে কাজ বলে।")
    add_bullet("১ ওয়াট কাকে বলে? ", "১ সেকেন্ডে ১ জুল কাজ করার ক্ষমতাকে ১ ওয়াট বলে।")
    add_bullet("শক্তি কী? ", "কোনো বস্তুর কাজ করার সামর্থ্যকে শক্তি বলে।")
    add_bullet("কর্মদক্ষতা কাকে বলে? ", "লভ্য কার্যকর ক্ষমতা এবং প্রদত্ত মোট ক্ষমতার শতকরা অনুপাতকে কর্মদক্ষতা বলে।")
    add_bullet("স্প্রিং ধ্রুবক কী? ", "স্প্রিংয়ের একক প্রসারণ বা সংকোচনে যে প্রত্যয়নী বল সৃষ্টি হয় তাকে স্প্রিং ধ্রুবক (k) বলে। একক N/m।")

    add_h2("অনুধাবনমূলক প্রশ্ন ও উত্তর ('খ' বিভাগ):")
    
    add_p(
        "উত্তর: কোনো ভারী বস্তু মাথায় নিয়ে দাঁড়িয়ে থাকলে বস্তুর অবস্থানের কোনো পরিবর্তন ঘটে না, অর্থাৎ সরণ s = 0 হয়। পদার্থবিজ্ঞানের সংজ্ঞানুযায়ী কৃতকাজ W = F × s। যেহেতু সরণ s = 0, তাই প্রযুক্ত বল থাকা সত্ত্বেও ব্যক্তির কোনো কাজ সম্পন্ন হয় না (W = 0)। শারীরিকভাবে ক্লান্তি এলেও বৈজ্ঞানিক দৃষ্টিতে কৃতকাজ শূন্য।",
        "প্রশ্ন ১: একজন ব্যক্তি ভারী বোঝা মাথায় নিয়ে দীর্ঘক্ষণ দাঁড়িয়ে থাকলেও কোনো কাজ হয় না কেন? ব্যাখ্যা করো।\n"
    )

    add_p(
        "উত্তর: কাজ W = F s cosθ সমীকরণে বল F এবং সরণ s এর মধ্যবর্তী কোণ θ এর মান 90° এর বেশি হলে (90° < θ ≤ 180°) cosθ এর মান ঋণাত্মক হয়। এই অবস্থায় কাজকে বলের বিরুদ্ধে কাজ বলে। যেমন—একটি বস্তুকে ভূমি থেকে খাড়া ওপরে তুললে অভিকর্ষ বল কাজ করে নিচের দিকে কিন্তু সরণ ঘটে ওপরের দিকে (θ = 180°, cos 180° = -1)। তাই এটি অভিকর্ষ বলের বিরুদ্ধে কাজ।",
        "প্রশ্ন ২: বলের বিরুদ্ধে কাজ বলতে কী বোঝায়? উদাহরণসহ লেখো।\n"
    )

    add_p(
        "উত্তর: কোনো মোটরের কর্মদক্ষতা 70% বলতে বোঝায়—মোটরটিতে যদি 100 জুল তড়িৎ শক্তি ইনপুট হিসেবে প্রদান করা হয়, তবে তা থেকে 70 জুল শক্তি কার্যকর যান্ত্রিক কাজে রূপান্তরিত হয়। অবশিষ্ট 30 জুল শক্তি ঘর্ষণ, তাপ ও শব্দ হিসেবে পরিবেশে অপচয় ঘটে।",
        "প্রশ্ন ৩: একটি মোটরের কর্মদক্ষতা 70% বলতে কী বোঝায়?\n"
    )

    add_p(
        "উত্তর: গতিশক্তি Ek = ½ mv²। এখানে বস্তুর ভর m সর্বদা ধ্রুব ও ধনাত্মক। অন্যদিকে বস্তু যেদিকেই গতিশীল হোক না কেন, তার বেগ v ধনাত্মক বা ঋণাত্মক হলেও তার বর্গ (v²) সর্বদা ধনাত্মক সংখ্যা হয়। ফলে Ek এর মান কখনো ঋণাত্মক হতে পারে না, এটি সর্বদা শূন্য অথবা ধনাত্মক হবে।",
        "প্রশ্ন ৪: গতিশক্তি কখনো ঋণাত্মক হতে পারে না কেন?\n"
    )

    # --- TOPIC 7: এক নজরে রিভিশন চার্ট ---
    add_h1("৭. এক নজরে মাস্টার ফর্মুলা চিটশিট (Formula Cheat Sheet)")
    
    table3 = doc.add_table(rows=7, cols=4)
    table3.alignment = WD_TABLE_ALIGNMENT.CENTER
    set_table_borders(table3)

    headers3 = ["টপিক / বিষয়", "মূল সূত্র (Formula)", "প্রতীক ও চলকের অর্থ", "এসআই একক"]
    for i, h in enumerate(headers3):
        cell = table3.rows[0].cells[i]
        set_cell_background(cell, "1E3A8A")
        cp = cell.paragraphs[0]
        cp.alignment = WD_ALIGN_PARAGRAPH.CENTER
        crun = cp.add_run(h)
        crun.bold = True
        crun.font.name = "Segoe UI"
        crun.font.size = Pt(9.5)
        crun.font.color.rgb = RGBColor(255, 255, 255)

    formulas_summary = [
        ("সাধারণ কাজ", "W = F s cosθ", "F = বল, s = সরণ, θ = মধ্যবর্তী কোণ", "জুল (J)"),
        ("গতিশক্তি", "Ek = ½ mv² = p² / (2m)", "m = ভর, v = বেগ, p = ভরবেগ", "জুল (J)"),
        ("বিভব শক্তি", "Ep = mgh (বা ½ kx²)", "m = ভর, h = উচ্চতা, k = স্প্রিং ধ্রুবক", "জুল (J)"),
        ("ক্ষমতা", "P = W/t = F·v", "W = কাজ, t = সময়, v = সুষম বেগ", "ওয়াট (W) বা hp"),
        ("কর্মদক্ষতা", "η = (P_out / P_in) × 100%", "P_out = কার্যকর ক্ষমতা, P_in = প্রদত্ত ক্ষমতা", "শতকরা (%)"),
        ("ভরকেন্দ্র সরণ", "h' = (h₁ + h₂) / 2", "h₁ = ওপরের পৃষ্ঠ, h₂ = নিচের পৃষ্ঠ", "মিটার (m)")
    ]

    for r_idx, r in enumerate(formulas_summary):
        row = table3.rows[r_idx + 1]
        for c_idx, val in enumerate(r):
            cell = row.cells[c_idx]
            if r_idx % 2 == 1:
                set_cell_background(cell, "F8FAFC")
            cp = cell.paragraphs[0]
            crun = cp.add_run(val)
            crun.font.name = "Segoe UI"
            crun.font.size = Pt(9)
            if c_idx == 0 or c_idx == 1:
                cp.alignment = WD_ALIGN_PARAGRAPH.CENTER
                crun.bold = True

    # Save output
    output_path = r"e:\user\OneDrive - Bangladesh Telecommunication Regulatory Commission\ABM\SciAZ\Physics\SSC_Physics_Ch4_Work_Power_Energy_Revision_Notes.docx"
    doc.save(output_path)
    print(f"Successfully generated notes at: {output_path}")

if __name__ == "__main__":
    build_ch4_doc()
