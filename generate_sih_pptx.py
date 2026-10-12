import sys
import os
from pptx import Presentation
from pptx.util import Inches, Pt
from pptx.dml.color import RGBColor
from pptx.enum.shapes import MSO_SHAPE

def create_single_technical_slide():
    prs = Presentation()
    prs.slide_width = Inches(13.333)
    prs.slide_height = Inches(7.5)

    blank_layout = prs.slide_layouts[6]

    BG_DARK = RGBColor(15, 23, 42)        # #0F172A Deep Navy
    CARD_BG = RGBColor(30, 41, 59)        # #1E293B Card BG
    CARD_BORDER = RGBColor(51, 65, 85)    # #334155 Border
    ACCENT_BLUE = RGBColor(59, 130, 246)  # #3B82F6
    ACCENT_CYAN = RGBColor(6, 182, 212)   # #06B6D4
    ACCENT_GREEN = RGBColor(16, 185, 129) # #10B981
    ACCENT_AMBER = RGBColor(245, 158, 11) # #F59E0B
    ACCENT_PURPLE = RGBColor(139, 92, 246)# #8B5CF6
    TEXT_LIGHT = RGBColor(248, 250, 252)  # #F8FAFC
    TEXT_MUTED = RGBColor(148, 163, 184) # #94A3B8

    slide = prs.slides.add_slide(blank_layout)
    slide.background.fill.solid()
    slide.background.fill.fore_color.rgb = BG_DARK

    def add_card(left, top, width, height, bg_color=CARD_BG, border_color=CARD_BORDER):
        shape = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, left, top, width, height)
        shape.fill.solid()
        shape.fill.fore_color.rgb = bg_color
        shape.line.color.rgb = border_color
        shape.line.width = Pt(1.5)
        return shape

    # Category Tag & Slide Title
    cat_box = slide.shapes.add_textbox(Inches(0.8), Inches(0.3), Inches(11.7), Inches(0.3))
    tf_cat = cat_box.text_frame
    p_cat = tf_cat.paragraphs[0]
    p_cat.text = "SMART INDIA HACKATHON 2026 | TECHNICAL APPROACH & STUDENT JOURNEY"
    p_cat.font.size = Pt(11)
    p_cat.font.bold = True
    p_cat.font.color.rgb = ACCENT_CYAN

    title_box = slide.shapes.add_textbox(Inches(0.8), Inches(0.55), Inches(11.7), Inches(0.6))
    tf_title = title_box.text_frame
    p_title = tf_title.paragraphs[0]
    p_title.text = "System Architecture, Production Stack & End-to-End Workflow"
    p_title.font.size = Pt(22)
    p_title.font.bold = True
    p_title.font.color.rgb = TEXT_LIGHT

    # SECTION 1 (TOP LEFT): Technical Architecture Box
    add_card(Inches(0.8), Inches(1.2), Inches(6.8), Inches(3.3), border_color=ACCENT_BLUE)
    tb_arch = slide.shapes.add_textbox(Inches(0.95), Inches(1.3), Inches(6.5), Inches(3.1))
    tf_arch = tb_arch.text_frame
    tf_arch.word_wrap = True

    p = tf_arch.paragraphs[0]
    p.text = "🏗️ TECHNICAL ARCHITECTURE & DATA FLOW"
    p.font.size = Pt(14)
    p.font.bold = True
    p.font.color.rgb = ACCENT_BLUE
    p.space_after = Pt(8)

    archs = [
        ("Presentation Layer", "Next.js 16 (App Router) + React 19 + Tailwind CSS v4 for reactive, zero-lag client dashboard & quiz runner."),
        ("Server & API Layer", "Node.js & Express 5.2 — Stateless JWT Bearer Auth with bcryptjs security middleware."),
        ("In-Memory Stream Parser", "Multer memoryStorage + pdf-parse — In-RAM PDF text extraction with ZERO disk storage footprint & total student privacy."),
        ("AI & Memory Decay Engine", "Google Gemini 3.6 Flash (<1.2s MCQ gen) + Modified Ebbinghaus Decay Algorithm.")
    ]
    for layer, desc in archs:
        p = tf_arch.add_paragraph()
        p.text = f"• {layer}: {desc}"
        p.font.size = Pt(10.5)
        p.font.color.rgb = TEXT_LIGHT
        p.space_after = Pt(5)

    # SECTION 2 (TOP RIGHT): Production Tech Stack
    add_card(Inches(7.8), Inches(1.2), Inches(4.733), Inches(3.3), border_color=ACCENT_PURPLE)
    tb_st = slide.shapes.add_textbox(Inches(7.95), Inches(1.3), Inches(4.433), Inches(3.1))
    tf_st = tb_st.text_frame
    tf_st.word_wrap = True

    p = tf_st.paragraphs[0]
    p.text = "⚡ PRODUCTION TECH STACK MATRIX"
    p.font.size = Pt(14)
    p.font.bold = True
    p.font.color.rgb = ACCENT_PURPLE
    p.space_after = Pt(8)

    stacks = [
        ("Frontend", "Next.js 16 (React 19), Turbopack, Tailwind v4"),
        ("Backend Server", "Node.js, Express 5.2, Mongoose 9.9"),
        ("Database Store", "MongoDB Atlas (Compound indexing on userId+conceptId)"),
        ("AI Model", "Google Gemini API (gemini-3.6-flash)"),
        ("File Ingestion", "In-Memory RAM Buffers (multer.memoryStorage)"),
        ("Security", "Stateless JWT Tokens + bcryptjs (10 salt rounds)")
    ]
    for label, tech in stacks:
        p = tf_st.add_paragraph()
        p.text = f"🔹 {label}: {tech}"
        p.font.size = Pt(10.5)
        p.font.color.rgb = TEXT_LIGHT
        p.space_after = Pt(5)

    # SECTION 3 (BOTTOM FULL): Student Step-by-Step Journey
    add_card(Inches(0.8), Inches(4.65), Inches(11.733), Inches(2.45), border_color=ACCENT_GREEN)
    tb_j = slide.shapes.add_textbox(Inches(0.95), Inches(4.75), Inches(11.433), Inches(2.25))
    tf_j = tb_j.text_frame
    tf_j.word_wrap = True

    p = tf_j.paragraphs[0]
    p.text = "🎓 END-TO-END STUDENT STEP-BY-STEP JOURNEY (WORKFLOW)"
    p.font.size = Pt(14)
    p.font.bold = True
    p.font.color.rgb = ACCENT_GREEN
    p.space_after = Pt(6)

    # 4-Column Workflow Steps
    steps_p1 = [
        "1. Login / Sign Up: Secure JWT auth opens personalized Cognitive Command Center.",
        "2. Add Subject & Concept: Organize target learning modules (e.g. Organic Chem, DBMS).",
        "3. Upload Notes (PDF <= 5MB): In-memory parser extracts context in <300ms.",
        "4. Synaptic Prime: Read 2-min high-yield AI summary to prime neural memory pathways."
    ]
    steps_p2 = [
        "5. 10-Q Active Recall Quiz: Answer Gemini-generated MCQs under active timer.",
        "6. Score & Review: Instant feedback + detailed step-by-step conceptual explanations.",
        "7. Ebbinghaus Decay Calc: Real-time update of memory stability curve & half-life (τ).",
        "8. Spaced Repetition: AI priority recovery queue + custom student exam date alarms."
    ]

    p_flow = tf_j.add_paragraph()
    p_flow.text = "📍 STEPS 1 to 4 (Ingestion & Priming):"
    p_flow.font.size = Pt(11)
    p_flow.font.bold = True
    p_flow.font.color.rgb = ACCENT_CYAN
    p_flow.space_after = Pt(3)

    for s in steps_p1:
        p = tf_j.add_paragraph()
        p.text = "  • " + s
        p.font.size = Pt(10)
        p.font.color.rgb = TEXT_LIGHT
        p.space_after = Pt(2)

    p_flow2 = tf_j.add_paragraph()
    p_flow2.text = "📍 STEPS 5 to 8 (Recall, Decay & Scheduling):"
    p_flow2.font.size = Pt(11)
    p_flow2.font.bold = True
    p_flow2.font.color.rgb = ACCENT_AMBER
    p_flow2.space_before = Pt(4)
    p_flow2.space_after = Pt(3)

    for s in steps_p2:
        p = tf_j.add_paragraph()
        p.text = "  • " + s
        p.font.size = Pt(10)
        p.font.color.rgb = TEXT_LIGHT
        p.space_after = Pt(2)

    # Save presentation
    output_path = os.path.join(os.getcwd(), "SIH_Technical_Approach_Slide.pptx")
    prs.save(output_path)
    print(f"Single Slide PPTX generated at: {output_path}")

if __name__ == "__main__":
    create_single_technical_slide()
