#!/usr/bin/env python3
"""
Generate the body PDF for the RCSI User Manual (v2.0).
Body only — cover is generated separately via html2poster.js and merged later.

Chapter Numbering Plan (mandatory per report.md Step 3.5):
| Outline Index | Type    | Chapter # | Title                                       |
|---------------|---------|-----------|---------------------------------------------|
| 1             | cover   | —         | Cover (separate PDF, merged via pypdf)      |
| 2             | toc     | —         | Table of Contents                           |
| 3             | content | Ch 1      | Introduction & Purpose                      |
| 4             | content | Ch 2      | The RCSI Framework                          |
| 5             | content | Ch 3      | Dashboard Walkthrough: Overview Tab         |
| 6             | content | Ch 4      | Dashboard Walkthrough: Schools Tab          |
| 7             | content | Ch 5      | Dashboard Walkthrough: Research Tab         |
| 8             | content | Ch 6      | The Digital Twin Sandbox                    |
| 9             | content | Ch 7      | Policy Levers Reference                     |
| 10            | content | Ch 8      | Data Collection: Survey Tab                 |
| 11            | content | Ch 9      | Trend Analysis                              |
| 12            | content | Ch 10     | Data Archive                                |
| 13            | content | Ch 11     | Upload Portal & Data Management             |
| 14            | appendix| App A     | Data Dictionary                             |
| 15            | appendix| App B     | FAQ & Troubleshooting                       |
"""

import os
import sys
import hashlib
import platform

# ── PDF skill setup ──
PDF_SKILL_DIR = '/home/z/my-project/skills/pdf'
_scripts = os.path.join(PDF_SKILL_DIR, 'scripts')
if _scripts not in sys.path:
    sys.path.insert(0, _scripts)

from reportlab.lib.pagesizes import A4
from reportlab.lib.units import inch, mm
from reportlab.lib import colors
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_RIGHT, TA_JUSTIFY
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, PageBreak, Table, TableStyle,
    KeepTogether, HRFlowable, CondPageBreak, Image,
)
from reportlab.platypus.tableofcontents import TableOfContents
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfbase.pdfmetrics import registerFontFamily

# ── Font registration ──
_IS_MAC = platform.system() == 'Darwin'
if _IS_MAC:
    FONT_DIR = os.path.expanduser('~/.openclaw/workspace/fonts')
else:
    FONT_DIR = '/usr/share/fonts'

pdfmetrics.registerFont(TTFont('FreeSerif', f'{FONT_DIR}/truetype/freefont/FreeSerif.ttf'))
pdfmetrics.registerFont(TTFont('FreeSerif-Bold', f'{FONT_DIR}/truetype/freefont/FreeSerifBold.ttf'))
pdfmetrics.registerFont(TTFont('FreeSerif-Italic', f'{FONT_DIR}/truetype/freefont/FreeSerifItalic.ttf'))
pdfmetrics.registerFont(TTFont('FreeSerif-BoldItalic', f'{FONT_DIR}/truetype/freefont/FreeSerifBoldItalic.ttf'))
pdfmetrics.registerFont(TTFont('DejaVuSans', f'{FONT_DIR}/truetype/dejavu/DejaVuSansMono.ttf'))

registerFontFamily('FreeSerif',
    normal='FreeSerif', bold='FreeSerif-Bold',
    italic='FreeSerif-Italic', boldItalic='FreeSerif-BoldItalic')
registerFontFamily('DejaVuSans', normal='DejaVuSans', bold='DejaVuSans')

# Install font fallback for any missing glyphs
from pdf import install_font_fallback
install_font_fallback()

# ── Cascade Palette (auto-generated, do not hand-edit) ──
PAGE_BG       = colors.HexColor('#eff0f0')
SECTION_BG    = colors.HexColor('#ebedee')
CARD_BG       = colors.HexColor('#e5e9eb')
TABLE_STRIPE  = colors.HexColor('#eef0f0')
HEADER_FILL   = colors.HexColor('#45606e')
COVER_BLOCK   = colors.HexColor('#4e6875')
BORDER        = colors.HexColor('#b0bfc7')
ICON          = colors.HexColor('#49778f')
ACCENT        = colors.HexColor('#0E7C7B')   # teal accent matching the app + cover
ACCENT_2      = colors.HexColor('#ca7254')
TEXT_PRIMARY  = colors.HexColor('#1A1A2E')
TEXT_MUTED    = colors.HexColor('#767c80')
SEM_SUCCESS   = colors.HexColor('#428a5a')
SEM_WARNING   = colors.HexColor('#94773c')
SEM_ERROR     = colors.HexColor('#a44c44')
SEM_INFO      = colors.HexColor('#4b7095')

TABLE_HEADER_COLOR = HEADER_FILL
TABLE_HEADER_TEXT  = colors.white
TABLE_ROW_EVEN     = colors.white
TABLE_ROW_ODD      = TABLE_STRIPE

# ── Page geometry ──
PAGE_W, PAGE_H = A4
LEFT_MARGIN   = 0.85 * inch
RIGHT_MARGIN  = 0.85 * inch
TOP_MARGIN    = 0.85 * inch
BOTTOM_MARGIN = 0.85 * inch
AVAILABLE_WIDTH = PAGE_W - LEFT_MARGIN - RIGHT_MARGIN  # ≈ 473pt

OUTPUT_DIR = '/home/z/my-project/download'
os.makedirs(OUTPUT_DIR, exist_ok=True)
BODY_PDF = os.path.join(OUTPUT_DIR, '_rcsi_manual_body.pdf')

# ── Styles ──
BASE = 'FreeSerif'

style_h1 = ParagraphStyle('H1', fontName='FreeSerif-Bold', fontSize=20, leading=26,
    textColor=TEXT_PRIMARY, spaceBefore=18, spaceAfter=10, alignment=TA_LEFT)
style_h2 = ParagraphStyle('H2', fontName='FreeSerif-Bold', fontSize=14, leading=18,
    textColor=HEADER_FILL, spaceBefore=14, spaceAfter=6, alignment=TA_LEFT)
style_h3 = ParagraphStyle('H3', fontName='FreeSerif-Bold', fontSize=11.5, leading=15,
    textColor=TEXT_PRIMARY, spaceBefore=10, spaceAfter=4, alignment=TA_LEFT)
style_body = ParagraphStyle('Body', fontName=BASE, fontSize=10.5, leading=16,
    textColor=TEXT_PRIMARY, spaceBefore=0, spaceAfter=6, alignment=TA_JUSTIFY)
style_body_left = ParagraphStyle('BodyLeft', parent=style_body, alignment=TA_LEFT)
style_bullet = ParagraphStyle('Bullet', parent=style_body, leftIndent=18, bulletIndent=4,
    spaceAfter=3, alignment=TA_LEFT)
style_muted = ParagraphStyle('Muted', fontName=BASE, fontSize=9, leading=12,
    textColor=TEXT_MUTED, alignment=TA_LEFT, spaceAfter=4)
style_caption = ParagraphStyle('Caption', fontName='FreeSerif-Italic', fontSize=9, leading=12,
    textColor=TEXT_MUTED, alignment=TA_CENTER, spaceBefore=4, spaceAfter=10)
style_code = ParagraphStyle('Code', fontName='DejaVuSans', fontSize=8.5, leading=12,
    textColor=TEXT_PRIMARY, leftIndent=12, rightIndent=12, spaceBefore=4, spaceAfter=8,
    backColor=CARD_BG, borderPadding=6, alignment=TA_LEFT)
style_callout = ParagraphStyle('Callout', fontName=BASE, fontSize=10, leading=15,
    textColor=TEXT_PRIMARY, leftIndent=14, rightIndent=10, spaceBefore=6, spaceAfter=8,
    backColor=colors.HexColor('#e8f4f4'), borderColor=ACCENT, borderWidth=0,
    borderPadding=8, alignment=TA_LEFT)
style_table_header = ParagraphStyle('THdr', fontName='FreeSerif-Bold', fontSize=9.5,
    leading=12, textColor=colors.white, alignment=TA_CENTER)
style_table_cell = ParagraphStyle('TCell', fontName=BASE, fontSize=9, leading=12,
    textColor=TEXT_PRIMARY, alignment=TA_LEFT)
style_table_cell_center = ParagraphStyle('TCellC', parent=style_table_cell, alignment=TA_CENTER)
style_table_cell_mono = ParagraphStyle('TCellM', fontName='DejaVuSans', fontSize=8.5,
    leading=11, textColor=TEXT_PRIMARY, alignment=TA_LEFT)

# TOC styles
toc_level0 = ParagraphStyle('TOC0', fontName='FreeSerif-Bold', fontSize=11, leading=16,
    textColor=TEXT_PRIMARY, leftIndent=0, spaceBefore=6)
toc_level1 = ParagraphStyle('TOC1', fontName=BASE, fontSize=10, leading=14,
    textColor=TEXT_MUTED, leftIndent=20, spaceBefore=2)

# ── TocDocTemplate ──
class TocDocTemplate(SimpleDocTemplate):
    def afterFlowable(self, flowable):
        if hasattr(flowable, 'bookmark_name'):
            level = getattr(flowable, 'bookmark_level', 0)
            text = getattr(flowable, 'bookmark_text', '')
            key = getattr(flowable, 'bookmark_key', '')
            self.notify('TOCEntry', (level, text, self.page, key))

def add_heading(text, style, level=0):
    key = 'h_' + hashlib.md5(text.encode()).hexdigest()[:8]
    p = Paragraph('<a name="%s"/>%s' % (key, text), style)
    p.bookmark_name = key
    p.bookmark_level = level
    p.bookmark_text = text
    p.bookmark_key = key
    return p

H1_ORPHAN_THRESHOLD = (PAGE_H - TOP_MARGIN - BOTTOM_MARGIN) * 0.15

def add_major_section(text, style=style_h1, level=0):
    return [CondPageBreak(H1_ORPHAN_THRESHOLD), add_heading(text, style, level)]

# ── Helpers ──
def make_table(data, col_ratios, header=True, hAlign='CENTER'):
    """Build a table with palette colors and proportional column widths."""
    col_widths = [r * AVAILABLE_WIDTH for r in col_ratios]
    t = Table(data, colWidths=col_widths, hAlign=hAlign, repeatRows=1 if header else 0)
    style_cmds = [
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('LEFTPADDING', (0, 0), (-1, -1), 6),
        ('RIGHTPADDING', (0, 0), (-1, -1), 6),
        ('TOPPADDING', (0, 0), (-1, -1), 5),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
        ('GRID', (0, 0), (-1, -1), 0.4, BORDER),
    ]
    if header:
        style_cmds.extend([
            ('BACKGROUND', (0, 0), (-1, 0), TABLE_HEADER_COLOR),
            ('TEXTCOLOR', (0, 0), (-1, 0), TABLE_HEADER_TEXT),
        ])
        # Alternating row colors
        for i in range(1, len(data)):
            bg = TABLE_ROW_ODD if i % 2 == 1 else TABLE_ROW_EVEN
            style_cmds.append(('BACKGROUND', (0, i), (-1, i), bg))
    t.setStyle(TableStyle(style_cmds))
    return t

def callout(text, title=None):
    """Render a callout box with accent left border (simulated via table)."""
    inner = []
    if title:
        inner.append(Paragraph('<b>%s</b>' % title, ParagraphStyle('CalT', fontName='FreeSerif-Bold',
            fontSize=10, leading=13, textColor=ACCENT, spaceAfter=3)))
    inner.append(Paragraph(text, style_callout))
    t = Table([[inner]], colWidths=[AVAILABLE_WIDTH])
    t.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#e8f4f4')),
        ('LINEBEFORE', (0, 0), (0, -1), 3, ACCENT),
        ('LEFTPADDING', (0, 0), (-1, -1), 12),
        ('RIGHTPADDING', (0, 0), (-1, -1), 10),
        ('TOPPADDING', (0, 0), (-1, -1), 8),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
    ]))
    return t

def safe_keep_together(elements):
    MAX_KEEP_HEIGHT = PAGE_H * 0.4
    total_h = 0
    for el in elements:
        try:
            w, h = el.wrap(AVAILABLE_WIDTH, PAGE_H)
            total_h += h
        except Exception:
            total_h += 50
    if total_h <= MAX_KEEP_HEIGHT:
        return [KeepTogether(elements)]
    elif len(elements) >= 2:
        return [KeepTogether(elements[:2])] + list(elements[2:])
    return list(elements)

# ── Header / Footer ──
def header_footer(canvas, doc):
    canvas.saveState()
    # Header
    canvas.setFont('FreeSerif', 8)
    canvas.setFillColor(TEXT_MUTED)
    canvas.drawString(LEFT_MARGIN, PAGE_H - 0.5 * inch,
        'El Salvador Division RCSI Dashboard — User Manual')
    canvas.setStrokeColor(ACCENT)
    canvas.setLineWidth(1.2)
    canvas.line(LEFT_MARGIN, PAGE_H - 0.55 * inch,
                PAGE_W - RIGHT_MARGIN, PAGE_H - 0.55 * inch)
    # Footer
    canvas.setFont('FreeSerif', 8)
    canvas.setFillColor(TEXT_MUTED)
    canvas.drawString(LEFT_MARGIN, 0.45 * inch, 'Copyright 2026 El Salvador Division')
    canvas.drawRightString(PAGE_W - RIGHT_MARGIN, 0.45 * inch, 'Page %d' % doc.page)
    canvas.setStrokeColor(BORDER)
    canvas.setLineWidth(0.4)
    canvas.line(LEFT_MARGIN, 0.6 * inch, PAGE_W - RIGHT_MARGIN, 0.6 * inch)
    canvas.restoreState()

# ── Story builder ──
story = []

# ========== TABLE OF CONTENTS ==========
story.append(Paragraph('<b>Table of Contents</b>', ParagraphStyle('TOCTitle',
    fontName='FreeSerif-Bold', fontSize=22, leading=28, textColor=TEXT_PRIMARY,
    spaceAfter=4, alignment=TA_LEFT)))
story.append(HRFlowable(width='100%', color=ACCENT, thickness=1.5, spaceBefore=2, spaceAfter=18))

toc = TableOfContents()
toc.levelStyles = [toc_level0, toc_level1]
story.append(toc)
story.append(PageBreak())

# ========== CHAPTER 1: Introduction ==========
story.extend(add_major_section('Chapter 1 — Introduction & Purpose', style_h1, 0))

story.append(Paragraph(
    'The <b>El Salvador Division Research Culture Sustainability Index (RCSI)</b> dashboard is an interactive '
    'web application that lets school heads, division officials, and data administrators see, at a glance, '
    'how research-ready every school in the division is — and what to do about it. The dashboard turns the '
    'seven-dimension RCSI framework (Readiness, Awareness, Capacity, Structured Support, Institutional '
    'Anchoring, Community of Practice, and Impact Realization) into a living picture that updates every quarter '
    'when new survey data is uploaded.', style_body))

story.append(Paragraph(
    'This manual is written for two audiences. <b>Part I (Chapters 1–7)</b> is for decision-makers — '
    'school heads, division supervisors, and policy officers who consume the dashboards, read the narrative '
    'briefs, and use the Digital Twin Sandbox to model interventions before committing resources. '
    '<b>Part II (Chapter 8 and the appendices)</b> is for administrators — the IT and data officers who upload '
    'Excel files, manage the database, and keep the system running. Both parts use plain language and '
    'step-by-step instructions; no programming knowledge is required.', style_body))

story.append(add_heading('1.1 What the dashboard is for', style_h2, 1))
story.append(Paragraph(
    'The dashboard answers four questions that decision-makers ask every quarter: <b>(1)</b> How is the '
    'division doing overall on research culture? <b>(2)</b> Which schools are leading, which are lagging, '
    'and by how much? <b>(3)</b> Where is the research pipeline bottlenecked — at the awareness stage, the '
    'capacity stage, or the publication stage? <b>(4)</b> If we invest in a specific intervention (more '
    'training, more mentors, more budget), what will the projected improvement be? Each of these questions '
    'maps to one of the five tabs at the top of the dashboard.', style_body))

story.append(add_heading('1.2 The eight tabs at a glance', style_h2, 1))

tabs_overview = [
    [Paragraph('<b>Tab</b>', style_table_header), Paragraph('<b>Audience</b>', style_table_header),
     Paragraph('<b>Purpose</b>', style_table_header)],
    [Paragraph('Overview', style_table_cell_center), Paragraph('Decision-makers', style_table_cell_center),
     Paragraph('Division-wide KPIs, RCSI trend, milestone distribution, and an executive brief with historical quarter-over-quarter comparison. Includes a quarter selector and PDF report download.', style_table_cell)],
    [Paragraph('Schools', style_table_cell_center), Paragraph('Decision-makers', style_table_cell_center),
     Paragraph('Sortable table of all schools with sparklines and milestone badges; click any row to open a detailed school profile with radar chart and research records. PDF report download available.', style_table_cell)],
    [Paragraph('Research', style_table_cell_center), Paragraph('Decision-makers', style_table_cell_center),
     Paragraph('Theme \u00d7 status matrix, teacher-rank \u00d7 education heatmap, and a Top 10 Teacher-Researchers recognition section. PDF report download available.', style_table_cell)],
    [Paragraph('Twin Sandbox', style_table_cell_center), Paragraph('Decision-makers', style_table_cell_center),
     Paragraph('Real-time what-if simulator with policy levers and dimension sliders. See projected RCSI, milestone, and narrative update live. PDF report download available.', style_table_cell)],
    [Paragraph('Trends', style_table_cell_center), Paragraph('Decision-makers', style_table_cell_center),
     Paragraph('Multi-quarter trend analysis: RCSI and sub-index trends across all quarters, a radar overlay of recent quarters, and a dimension-by-dimension change table.', style_table_cell)],
    [Paragraph('Survey', style_table_cell_center), Paragraph('School heads / Data collectors', style_table_cell_center),
     Paragraph('Two data collection instruments: a 35-item quarterly survey questionnaire and a 14-field research metadata form. Both produce CSV files and include a Print Questionnaire button for offline collection.', style_table_cell)],
    [Paragraph('Archive', style_table_cell_center), Paragraph('Administrators', style_table_cell_center),
     Paragraph('Quarter snapshots with CSV export, full research metadata export, and a complete upload audit log showing every merge/replace operation.', style_table_cell)],
    [Paragraph('Upload', style_table_cell_center), Paragraph('Administrators', style_table_cell_center),
     Paragraph('Drag-and-drop portal with Merge (recommended) and Replace modes. Validates file schema, handles simultaneous uploads safely, and logs every operation to the audit trail.', style_table_cell)],
]
story.append(make_table(tabs_overview, [0.15, 0.22, 0.63]))
story.append(Paragraph('Table 1.1 — The eight dashboard tabs and their primary audiences.', style_caption))

story.append(add_heading('1.3 How to read this manual', style_h2, 1))
story.append(Paragraph(
    'If you are a decision-maker, read Chapters 1 and 2 first \u2014 they explain the RCSI framework and the '
    'M0\u2013M6 milestone ladder in plain terms. Then jump to the chapter for the tab you want to use (Chapters 3\u20137). '
    'Chapter 8 covers the data collection instruments (Survey tab). Chapters 9 and 10 cover trend analysis and the '
    'data archive. If you are an administrator, read Chapter 11 (Upload Portal) and Appendix A (the data dictionary) '
    'before your first upload. Appendix B (FAQ) is useful for everyone when something does not behave as expected.', style_body))

story.append(callout(
    'The dashboard is a decision-support tool, not a decision-maker. The RCSI scores, milestone classifications, '
    'and twin-sandbox projections are computed from the data you upload and the formula defaults described in '
    'Chapter 2. Always cross-check a projected intervention against on-the-ground knowledge of the school before '
    'committing budget or personnel.',
    title='A note on interpretation'))

story.append(PageBreak())

# ========== CHAPTER 2: RCSI Framework ==========
story.extend(add_major_section('Chapter 2 — The RCSI Framework', style_h1, 0))

story.append(Paragraph(
    'The Research Culture Sustainability Index is built on a study conducted in the El Salvador Division. '
    'It measures seven dimensions of a school\'s research culture, combines them into a single composite score '
    'called the <b>RCSI</b>, and classifies each school into one of seven sequential <b>milestones (M0–M6)</b>. '
    'This chapter explains each dimension, the milestone progression, the composite formula, and what '
    '"sustainable" means in this framework.', style_body))

story.append(add_heading('2.1 The seven sub-indices', style_h2, 1))

dims_data = [
    [Paragraph('<b>Code</b>', style_table_header), Paragraph('<b>Name</b>', style_table_header),
     Paragraph('<b>Milestone</b>', style_table_header), Paragraph('<b>What it measures</b>', style_table_header)],
    [Paragraph('R', style_table_cell_center), Paragraph('Readiness', style_table_cell),
     Paragraph('M0', style_table_cell_center),
     Paragraph('School preparedness and foundational conditions for research, including infrastructure and mindset. This is the baseline dimension — every school starts here.', style_table_cell)],
    [Paragraph('A', style_table_cell_center), Paragraph('Awareness', style_table_cell),
     Paragraph('M1', style_table_cell_center),
     Paragraph('Level of research awareness among teachers and leaders. <b>The threshold for advancing from M0 to M1 is A ≥ 0.80.</b> Until this threshold is crossed, no school can progress.', style_table_cell)],
    [Paragraph('C', style_table_cell_center), Paragraph('Capacity', style_table_cell),
     Paragraph('M2', style_table_cell_center),
     Paragraph('Research skills, training, and expertise of the teaching staff. Built through mentorship, workshops, and graduate study.', style_table_cell)],
    [Paragraph('S', style_table_cell_center), Paragraph('Structured Support', style_table_cell),
     Paragraph('M3', style_table_cell_center),
     Paragraph('Availability of budget, time allocation, mentoring, and other institutional support for research.', style_table_cell)],
    [Paragraph('I', style_table_cell_center), Paragraph('Institutional Anchoring', style_table_cell),
     Paragraph('M4', style_table_cell_center),
     Paragraph('How deeply research is embedded in school plans, policies, and regular meetings. Reflects leadership commitment.', style_table_cell)],
    [Paragraph('P', style_table_cell_center), Paragraph('Community of Practice', style_table_cell),
     Paragraph('M5', style_table_cell_center),
     Paragraph('Strength of research collaboration, sharing forums, and peer learning among teachers.', style_table_cell)],
    [Paragraph('M', style_table_cell_center), Paragraph('Impact Realization', style_table_cell),
     Paragraph('M6', style_table_cell_center),
     Paragraph('Tangible outcomes of research: publications, utilizations, and policy changes. The final milestone.', style_table_cell)],
]
story.append(make_table(dims_data, [0.08, 0.20, 0.10, 0.62]))
story.append(Paragraph('Table 2.1 — The seven sub-indices and their corresponding milestones.', style_caption))

story.append(add_heading('2.2 The M0–M6 milestone ladder', style_h2, 1))
story.append(Paragraph(
    'The milestones form a strict sequential ladder. A school can only be classified at milestone M<i>k</i> if '
    'it has already met the thresholds for all earlier milestones M0 through M<i>k−1</i>. This means a school '
    'cannot skip stages — even with strong publication outputs (M), it cannot reach M6 if its Awareness (A) is '
    'below 0.80, because it would be stuck at M0.', style_body))

story.append(Paragraph(
    'The default thresholds are: <b>A ≥ 0.80</b> for M0→M1 (per the original study), and <b>0.50</b> for the '
    'other dimensions (C, S, I, P, M). These defaults can be overridden in the Twin Sandbox\'s Thresholds sub-tab '
    '(see Chapter 6) for sensitivity analysis, but the production dashboard always uses the defaults.', style_body))

story.append(callout(
    'When a school reaches M6 <i>and</i> its composite RCSI is ≥ 0.70, it is flagged as <b>"sustainable"</b>. '
    'In the milestone model, sustainability means the school cycles back to M0 for the next iteration — a '
    'self-sustaining research culture that no longer requires external push. This is the long-term goal for '
    'every school in the division.',
    title='What "sustainable" means'))

story.append(add_heading('2.3 The composite RCSI formula', style_h2, 1))
story.append(Paragraph(
    'The composite RCSI is a weighted average of the seven sub-indices. By default, the dashboard uses '
    '<b>equal weights of 12.5% per dimension</b> (1/8 each), as preferred by the division. The formula is:', style_body))

story.append(Paragraph(
    '<b>RCSI = 0.125·R + 0.125·A + 0.125·C + 0.125·S + 0.125·I + 0.125·P + 0.125·M</b>',
    ParagraphStyle('Formula', fontName='DejaVuSans', fontSize=10, leading=14,
        textColor=TEXT_PRIMARY, alignment=TA_CENTER, spaceBefore=6, spaceAfter=6,
        backColor=CARD_BG, borderPadding=8)))

story.append(Paragraph(
    'Each sub-index value is a decimal between 0 and 1, so the RCSI also ranges from 0 to 1. Higher is better. '
    'The dashboard displays RCSI to three decimal places (e.g., 0.364). The weights can be overridden in the '
    'Twin Sandbox\'s Weights sub-tab — for example, to emphasize Impact Realization (M) more heavily, you might '
    'set its weight to 25% and reduce the others proportionally. Weights are auto-normalized to sum to 1.', style_body))

story.append(add_heading('2.4 How milestones and RCSI relate', style_h2, 1))
story.append(Paragraph(
    'The RCSI and the milestone are two complementary views of the same data. The RCSI is a continuous score\u00a0— '
    'useful for ranking schools and tracking trends. The milestone is a discrete stage\u00a0— useful for '
    'communicating progress to non-technical audiences and for triggering interventions ("we need to push '
    'School X past M1 this quarter"). A school can improve its RCSI without advancing its milestone (if the '
    'improvement is in a dimension whose threshold is already met, or in a dimension below the next threshold). '
    'The Twin Sandbox narrative explicitly distinguishes these cases — see Chapter 6.', style_body))

story.append(PageBreak())

# ========== CHAPTER 3: Overview Tab ==========
story.extend(add_major_section('Chapter 3 — Dashboard Walkthrough: Overview Tab', style_h1, 0))

story.append(Paragraph(
    'The Overview tab is the first thing you see when you open the dashboard. It gives a division-wide '
    'snapshot of where research culture stands right now, what has changed over the last four quarters, and '
    'where to focus your attention next. Every chart on this tab has a matching line in the Executive Brief '
    'narrative at the top\u2014so you can read the brief first, then drill into the charts that prompted each '
    'insight. A <b>quarter selector</b> in the header lets you view any historical quarter, and the school count '
    'badge dynamically reflects how many schools have data for the selected quarter.', style_body))

story.append(add_heading('3.1 The Executive Brief narrative', style_h2, 1))
story.append(Paragraph(
    'At the very top of the Overview tab is a colored card titled <b>"Executive Brief"</b>. This is the most '
    'important element on the page for decision-makers. It is auto-generated from the live data and contains '
    'three parts: a <b>title</b> that summarizes the division\'s state in one line (e.g., "30 of 30 at M0, RCSI '
    '0.364 (+0.018 vs 2026-07)"), a list of <b>insights</b> that interpret the charts in milestone terms\u2014'
    'including a historical comparison insight when a previous quarter exists\u2014and a <b>Recommended '
    'Intervention</b> box that names the single highest-leverage action for the quarter. A <b>Download PDF</b> '
    'button next to the brief generates a branded report with the narrative, KPIs, and data tables.', style_body))

story.append(Paragraph(
    'The brief\'s color tone changes with the data: <b>green</b> when schools are sustainable, <b>amber</b> when '
    'the Awareness gap is the binding constraint, <b>red</b> when the division is in critical condition, and '
    '<b>neutral blue</b> for general insights. Read the color first — it tells you whether to celebrate, plan, '
    'or intervene urgently.', style_body))

story.append(add_heading('3.2 The five KPI cards', style_h2, 1))
story.append(Paragraph(
    'Below the brief are five KPI cards. <b>Division Avg RCSI</b> is the mean composite score across all 30 '
    'schools in the latest quarter. <b>Sustainable Schools</b> counts how many have reached M6 with RCSI ≥ 0.70. '
    '<b>Total Research</b> is the cumulative count of all research outputs (abstracts plus full papers). '
    '<b>Publication Rate</b> is the percentage of outputs that have reached "published" status. '
    '<b>Utilization Rate</b> is the percentage of outputs marked as utilized by a school. Hover any card to see '
    'the underlying numbers.', style_body))

story.append(add_heading('3.3 The RCSI Trend chart', style_h2, 1))
story.append(Paragraph(
    'The large area chart shows the division\'s average RCSI per quarter, with the seven sub-indices drawn as '
    'faint lines behind it. Use this chart to see whether the division is improving over time and which '
    'dimensions are dragging the composite down. If the RCSI line is rising but a sub-index line is flat or '
    'falling, that dimension is the next bottleneck — even if the overall trend looks healthy.', style_body))

story.append(add_heading('3.4 Milestone distribution and dimension averages', style_h2, 1))
story.append(Paragraph(
    'The donut chart on the left shows how many schools are at each milestone stage (M0–M6). In a healthy '
    'division, you want to see the donut shift rightward over time — fewer schools at M0, more at M3 and '
    'above. The horizontal bar chart on the right shows the division-wide average for each of the seven '
    'sub-indices, with the dimension\'s color matching the legend at the top. The shortest bar is the dimension '
    'you should target next\u00a0— improving it lifts the composite RCSI the fastest.', style_body))

story.append(add_heading('3.5 Theme, status, and year breakdowns', style_h2, 1))
story.append(Paragraph(
    'The bottom row of the Overview tab has three charts. <b>Research Themes</b> is a donut showing the '
    'distribution of outputs across the seven research themes (Assessment & Evaluation, Leadership & '
    'Governance, etc.). <b>Research Status</b> is a horizontal bar chart showing how many outputs are at each '
    'publication stage (draft, under review, submitted, published, rejected). <b>Research Outputs per Year</b> '
    'is a line chart showing annual productivity. Together these three charts tell you <i>what</i> the division '
    'researches, <i>how far</i> it gets in the publication pipeline, and <i>how much</i> it produces over time.', style_body))

story.append(callout(
    'If the Status chart shows a large "draft" or "under review" bar, the publication pipeline is bottlenecked. '
    'Research that never gets published cannot be utilized, which directly limits the M dimension (Impact '
    'Realization, M6). This is the single most common blocker for divisions that produce a lot of research but '
    'never see it translated into practice.',
    title='Reading the pipeline'))

story.append(PageBreak())

# ========== CHAPTER 4: Schools Tab ==========
story.extend(add_major_section('Chapter 4 — Dashboard Walkthrough: Schools Tab', style_h1, 0))

story.append(Paragraph(
    'The Schools tab is where you go to compare individual schools. It shows all 30 schools in a single '
    'sortable table, with a sparkline for each school\'s RCSI trend and a milestone badge that tells you the '
    'school\'s current stage. Click any row to open a detailed school profile in a dialog.', style_body))

story.append(add_heading('4.1 The Schools Explorer table', style_h2, 1))
story.append(Paragraph(
    'The table has 14 columns: school ID, name, RCSI, milestone badge, the seven dimension values (R, A, C, S, '
    'I, P, M), a sparkline of the last four quarters\' RCSI, and counts of research outputs, published outputs, '
    'and utilized outputs. Click any column header to sort by that column — click again to reverse the order. '
    'Use the search box in the top-right corner to filter by school name or ID.', style_body))

story.append(Paragraph(
    'The default sort is by RCSI descending, so the strongest schools appear at the top. The milestone badge '
    'uses a color scale from gray (M0) through red, orange, amber, yellow, lime, to green (M6). A school at M6 '
    'with RCSI ≥ 0.70 shows an additional "Sustainable" tag. The sparkline lets you see at a glance whether a '
    'school is improving, flat, or declining — a flat line at a low RCSI is a bigger concern than a rising line '
    'at the same score.', style_body))

story.append(add_heading('4.2 The School Detail dialog', style_h2, 1))
story.append(Paragraph(
    'Click any school row to open a detailed profile dialog. The dialog has four sections. At the top are four '
    'KPI cards: current RCSI, milestone (with a 7-segment progress bar showing how far the school has climbed '
    'the M0–M6 ladder), total research outputs, and the document mix (full papers vs. abstracts).', style_body))

story.append(Paragraph(
    'Below the KPIs are two charts side by side. The <b>radar chart</b> shows the school\'s seven-dimension '
    'profile for the latest quarter — the shape tells you instantly whether the school is balanced (a near-circle) '
    'or lopsided (a star burst in one or two directions). The <b>quarterly RCSI trend</b> line chart shows how '
    'the composite has changed over time. Beneath those is a multi-line <b>sub-index evolution</b> chart that '
    'shows each of the seven dimensions over the available quarters.', style_body))

story.append(Paragraph(
    'The bottom of the dialog shows the school\'s research portfolio: a theme breakdown, a status breakdown, '
    'and a scrollable table of the 20 most recent research records (title, teacher, theme, status, year). '
    'Records with a publication link are clickable. Use this dialog to brief yourself on a school before a '
    'site visit or a mentoring conversation.', style_body))

story.append(add_heading('4.3 The Schools Executive Brief', style_h2, 1))
story.append(Paragraph(
    'Like the Overview tab, the Schools tab has an Executive Brief at the top. It names the <b>top 3 schools '
    'closest to advancing</b> (with the exact Awareness gap each needs to close to reach M1) and the <b>bottom '
    '3 needing foundational support</b>. It also identifies the most common weakest dimension among the bottom '
    '3 and recommends a tiered strategy: push the top quartile past M1, lift the bottom quartile with '
    'foundational Readiness investments, and pair both with a buddy-system where top performers mentor bottom '
    'performers on their shared weak dimension.', style_body))

story.append(PageBreak())

# ========== CHAPTER 5: Research Tab ==========
story.extend(add_major_section('Chapter 5 — Dashboard Walkthrough: Research Tab', style_h1, 0))

story.append(Paragraph(
    'The Research tab is for decision-makers who want to understand the <i>shape</i> of the division\'s '
    'research output — not just how much, but what themes, what status, and which teacher ranks are producing. '
    'It has two heatmap tables and four summary KPI cards, plus its own Executive Brief that interprets the '
    'heatmaps in milestone terms.', style_body))

story.append(add_heading('5.1 The Theme × Status matrix', style_h2, 1))
story.append(Paragraph(
    'The left heatmap shows research themes (rows) crossed with publication statuses (columns). Each cell is '
    'colored by count — darker cells mean more outputs in that theme-status combination. The right-most column '
    'shows the row total per theme. Use this matrix to answer two questions: <b>(1)</b> Which themes dominate '
    'the division\'s research agenda? <b>(2)</b> Where in the publication pipeline is each theme stuck?', style_body))

story.append(Paragraph(
    'A theme with a large "draft" or "under review" cell but a small "published" cell has a pipeline problem — '
    'research is being started but not finished. A theme with a high "published" count is a model whose review '
    'practices could be replicated. The Executive Brief automatically identifies the theme with the highest '
    'publication efficiency and recommends it as the playbook for the others.', style_body))

story.append(add_heading('5.2 The Teacher Rank × Education heatmap', style_h2, 1))
story.append(Paragraph(
    'The right heatmap shows teacher ranks (rows: Teacher I, II, III, Master Teacher I, II, School Head) '
    'crossed with educational attainment (columns: Bachelor\'s, Master\'s, Doctorate). Each cell is the count '
    'of research outputs produced by teachers in that rank-education combination. This heatmap reveals the '
    'capacity distribution — which directly maps to the <b>C dimension (Capacity, M2)</b>.', style_body))

story.append(Paragraph(
    'If the heatmap shows that Master Teacher I and II produce most of the research while Teacher I and II '
    'produce very little, the division has a capacity gap. Until lower-producing ranks are trained and '
    'supported, the division cannot progress past M2 at scale. The Executive Brief recommends targeted '
    'research-methods training for the lowest-producing rank.', style_body))

story.append(add_heading('5.3 The summary KPI cards', style_h2, 1))
story.append(Paragraph(
    'Below the heatmaps are four summary cards: <b>Total Outputs</b> (with full-paper vs. abstract breakdown), '
    '<b>Published</b> (with publication rate), <b>Utilized</b> (with utilization rate), and <b>Schools</b> '
    '(count of schools in the division). These mirror the Overview tab\'s KPIs but are positioned here for '
    'quick reference while you study the heatmaps.', style_body))

story.append(add_heading('5.4 Top 10 Teacher-Researchers', style_h2, 1))
story.append(Paragraph(
    'At the bottom of the Research tab is a recognition section titled <b>"Top 10 Teacher-Researchers"</b>, '
    'styled with an amber/gold gradient and a trophy icon. This table ranks the division\'s most productive '
    'researchers by number of research outputs. The top three receive gold, silver, and bronze medals '
    'respectively, and their rows are highlighted with a subtle amber tint.', style_body))

story.append(Paragraph(
    'Each row shows the researcher\'s name, research output count (in an amber badge), teacher rank '
    '(Teacher I/II/III, Master Teacher I/II, or School Head), educational attainment (Bachelor\'s, Master\'s, '
    'or Doctorate), years of service, the years their research was undertaken (shown as a range if 3+ years, '
    'or comma-separated if fewer), and up to three theme chips with a "+N more" indicator for additional themes. '
    'This recognition gives public visibility to the division\'s research leaders and incentivizes continued '
    'productivity\u2014which directly advances the division\'s RCSI.', style_body))

story.append(callout(
    'The Research tab\'s Executive Brief is the most action-oriented of the four. It always ends with three '
    'sequenced recommendations aligned to the milestone ladder: <b>(1)</b> build Capacity (C, M2) via training, '
    '<b>(2)</b> streamline the publication pipeline (M6 enabler) via mentor assignment, and <b>(3)</b> broaden '
    'theme coverage (I, M4) to deepen institutional anchoring. Use these three actions as your quarterly '
    'research-committee agenda. A <b>Download PDF</b> button next to the brief exports the research analytics '
    'report with the narrative, KPIs, matrices, and the Top 10 Researchers table.',
    title='The three-action agenda'))

story.append(PageBreak())

# ========== CHAPTER 6: Twin Sandbox ==========
story.extend(add_major_section('Chapter 6 — The Digital Twin Sandbox', style_h1, 0))

story.append(Paragraph(
    'The Digital Twin Sandbox is the centerpiece of the dashboard for decision-makers. It is a real-time '
    'what-if simulator that lets you model interventions <i>before</i> committing resources. Pick a school, '
    'adjust the policy levers (or raw dimension sliders), and watch the projected RCSI, milestone, and '
    'Executive Brief update live against the actual baseline.', style_body))

story.append(add_heading('6.1 The Twin concept', style_h2, 1))
story.append(Paragraph(
    'A "digital twin" is a virtual copy of a real system that you can experiment on without affecting the '
    'original. In this dashboard, the twin is a copy of a school\'s seven-dimension profile. When you adjust a '
    'slider, the twin recomputes what the school\'s RCSI and milestone <i>would be</i> if the intervention were '
    'actually applied. The actual baseline never changes — only the projected values do. This lets you explore '
    '"what if we doubled training frequency?" or "what if we cut the mentorship ratio in half?" safely, before '
    'you spend a peso.', style_body))

story.append(add_heading('6.2 The four sub-tabs', style_h2, 1))
story.append(Paragraph(
    'The Twin Sandbox has four sub-tabs, selected from the left panel. <b>Policy Levers</b> (the default) is '
    'the decision-maker-friendly input layer — see Chapter 7 for the full reference. <b>Intervention</b> lets '
    'you set raw dimension deltas directly (range −0.30 to +0.30 per dimension). <b>Weights</b> lets you '
    'override the default 12.5% equal weights. <b>Thresholds</b> lets you override the default milestone '
    'thresholds (A ≥ 0.80, others ≥ 0.50).', style_body))

story.append(Paragraph(
    'When you adjust Policy Levers, the Intervention tab\'s sliders update automatically to show the combined '
    'dimension deltas — a "Synced from Policy Levers" badge appears to confirm the link. If you then manually '
    'edit a dimension slider on the Intervention tab, the badge changes to a "Manual edits override" warning. '
    'To re-sync, switch back to Policy Levers and adjust any lever.', style_body))

story.append(add_heading('6.3 The results panel', style_h2, 1))
story.append(Paragraph(
    'The right panel shows the simulation result. Three headline cards compare <b>Actual</b> (gray), '
    '<b>Projected</b> (cyan), and <b>Δ Change</b> (green for improvement, red for regression). Beneath them '
    'are two milestone progress bars — one for the actual path, one for the projected path — each with a '
    'plain-language note about which dimension to boost next and by how much.', style_body))

story.append(Paragraph(
    'Below the progress bars are two charts. The <b>radar overlay</b> shows the actual and projected '
    'seven-dimension profiles on the same axes — the gap between the two shapes is the intervention\'s effect. '
    'The <b>per-dimension delta bar chart</b> shows which dimensions gained (cyan bars) and which lost (rose '
    'bars). Together these two charts let you see both the shape of the change and its magnitude.', style_body))

story.append(add_heading('6.4 The reactive Executive Brief', style_h2, 1))
story.append(Paragraph(
    'The Executive Brief at the top of the Twin Sandbox is reactive — it changes tone and content based on the '
    'simulation outcome. There are five states:', style_body))

twin_states = [
    [Paragraph('<b>State</b>', style_table_header), Paragraph('<b>Tone</b>', style_table_header),
     Paragraph('<b>What the brief says</b>', style_table_header)],
    [Paragraph('No change yet', style_table_cell_center), Paragraph('Neutral blue', style_table_cell_center),
     Paragraph('Guides you to drag a slider. Names the dimension with the smallest gap to the next milestone.', style_table_cell)],
    [Paragraph('Milestone advances', style_table_cell_center), Paragraph('Green', style_table_cell_center),
     Paragraph('Celebrates the advance. Names the largest-gaining dimension and the next threshold to chase.', style_table_cell)],
    [Paragraph('RCSI up, milestone unchanged', style_table_cell_center), Paragraph('Amber', style_table_cell_center),
     Paragraph('Names the improvement but flags that the next threshold was not crossed. Tells you exactly which dimension to boost next and by how much.', style_table_cell)],
    [Paragraph('Milestone regresses', style_table_cell_center), Paragraph('Red', style_table_cell_center),
     Paragraph('Warns that the intervention would set the school back. Names the largest-declining dimension and recommends reversing the change.', style_table_cell)],
    [Paragraph('RCSI down, milestone unchanged', style_table_cell_center), Paragraph('Orange', style_table_cell_center),
     Paragraph('Flags the decline even though the milestone held. Recommends reversing the change or compensating elsewhere.', style_table_cell)],
]
story.append(make_table(twin_states, [0.25, 0.18, 0.57]))
story.append(Paragraph('Table 6.1 — The five reactive states of the Twin Sandbox Executive Brief.', style_caption))

story.append(callout(
    'The Twin Sandbox is for exploration, not prediction. The projected RCSI assumes that a slider delta '
    'translates linearly into a dimension change — in reality, interventions have diminishing returns and '
    'interaction effects. Use the sandbox to <i>compare</i> interventions and find the highest-leverage move, '
    'then validate with on-the-ground knowledge before committing budget.',
    title='A note on simulation fidelity'))

story.append(PageBreak())

# ========== CHAPTER 7: Policy Levers ==========
story.extend(add_major_section('Chapter 7 — Policy Levers Reference', style_h1, 0))

story.append(Paragraph(
    'The Policy Levers sub-tab is the default input layer for the Twin Sandbox. It translates five '
    'decision-maker-friendly policy choices into the seven-dimension deltas that drive the simulation. Each '
    'lever has a baseline (the status quo) — moving a lever above baseline produces positive deltas; below '
    'produces negative deltas. This chapter is a complete reference for all five levers.', style_body))

story.append(add_heading('7.1 The five policy levers', style_h2, 1))

levers_data = [
    [Paragraph('<b>Lever</b>', style_table_header), Paragraph('<b>Range (baseline)</b>', style_table_header),
     Paragraph('<b>Primary → Dimension</b>', style_table_header), Paragraph('<b>Secondary → Dimension</b>', style_table_header)],
    [Paragraph('Training Frequency', style_table_cell), Paragraph('0–8 sessions/qtr (2)', style_table_cell_center),
     Paragraph('C — Capacity (M2)', style_table_cell_center), Paragraph('A — Awareness (M1)', style_table_cell_center)],
    [Paragraph('Mentorship Ratio', style_table_cell), Paragraph('1:1 to 1:20 (1:10)', style_table_cell_center),
     Paragraph('S — Structured Support (M3)', style_table_cell_center), Paragraph('P — Community of Practice (M5)', style_table_cell_center)],
    [Paragraph('Support Budget', style_table_cell), Paragraph('0–100% of target (40%)', style_table_cell_center),
     Paragraph('S — Structured Support (M3)', style_table_cell_center), Paragraph('R — Readiness (M0)', style_table_cell_center)],
    [Paragraph('Leadership Commitment', style_table_cell), Paragraph('0–100% of meetings (30%)', style_table_cell_center),
     Paragraph('I — Institutional Anchoring (M4)', style_table_cell_center), Paragraph('A — Awareness (M1)', style_table_cell_center)],
    [Paragraph('Collaboration Frequency', style_table_cell), Paragraph('0–8 forums/qtr (1)', style_table_cell_center),
     Paragraph('P — Community of Practice (M5)', style_table_cell_center), Paragraph('M — Impact Realization (M6)', style_table_cell_center)],
]
story.append(make_table(levers_data, [0.24, 0.22, 0.27, 0.27]))
story.append(Paragraph('Table 7.1 — The five policy levers and their dimension mappings.', style_caption))

story.append(add_heading('7.2 How levers map to dimensions', style_h2, 1))
story.append(Paragraph(
    'Each lever affects one primary dimension (larger weight) and one secondary dimension (smaller weight). '
    'The mapping is grounded in the milestone framework — a lever\'s primary dimension is the one whose '
    'milestone the lever most directly advances. For example, Training Frequency primarily builds Capacity '
    '(C, M2) because training is the most direct way to build research skills; secondarily it raises Awareness '
    '(A, M1) because exposure to training also makes teachers more aware of research.', style_body))

story.append(Paragraph(
    'The per-dimension impact chips below each lever show the exact delta contribution in real time. A green '
    'chip means the lever is contributing a positive delta to that dimension; a red chip means negative; a '
    'gray chip means zero (lever at baseline). The chips are color-coded by dimension (R=cyan, A=violet, '
    'C=emerald, S=amber, I=rose, P=blue, M=pink) to match the rest of the dashboard.', style_body))

story.append(add_heading('7.3 Worked example: advancing a school from M0 to M2', style_h2, 1))
story.append(Paragraph(
    'Suppose School_1 is at M0 with RCSI 0.319, Awareness (A) at 0.61, and Capacity (C) at 0.39. To advance '
    'to M1, A must reach 0.80 — a gap of 0.19. To then advance to M2, C must reach 0.50 — a gap of 0.11. '
    'Here is a lever sequence that achieves both:', style_body))

story.append(Paragraph(
    '<b>Step 1:</b> Set Training Frequency to 8 sessions/qtr (max). This produces A +0.09 (from 0.61 to 0.70) '
    'and C +0.15 (from 0.39 to 0.54). A is still 0.10 short of the M1 threshold.', style_body))
story.append(Paragraph(
    '<b>Step 2:</b> Set Leadership Commitment to 100% of meetings. This produces A +0.07 (cumulative 0.77) '
    'and I +0.21. A is still 0.03 short.', style_body))
story.append(Paragraph(
    '<b>Step 3:</b> Switch to the Intervention tab and nudge the A slider up by +0.03 manually. A crosses '
    '0.80 — M1 achieved. Because C is already at 0.54 (above the 0.50 threshold), M2 is also achieved. The '
    'milestone jumps from M0 directly to M2, and the Executive Brief flips to green with the title '
    '"Intervention advances School_1 from M0 → M2".', style_body))

story.append(callout(
    'This example shows that policy levers alone may not always close the final gap — sometimes a small '
    'manual nudge on the Intervention tab is needed. This is realistic: policy decisions set the conditions, '
    'but targeted support for an individual school is what closes the last mile. Use the Twin Sandbox to find '
    'the smallest combination that advances the milestone, then replicate the recipe at similar schools.',
    title='When levers are not enough'))

story.append(PageBreak())

# ========== CHAPTER 8: Survey Tab (Data Collection) ==========
story.extend(add_major_section('Chapter 8 — Data Collection: Survey Tab', style_h1, 0))

story.append(Paragraph(
    'The Survey tab is the data collection hub. It contains two instruments that produce the CSV files the '
    'Upload tab expects: a <b>Quarterly Survey</b> (35 items, 5 per RCSI dimension) and a <b>Research Metadata</b> '
    'form (14 fields per research output). Both instruments feature a <b>School dropdown</b> populated with the '
    '24 real El Salvador Division schools and their official DepEd IDs, a <b>Load Example</b> button for '
    'demonstration, and a <b>Print Questionnaire</b> button for offline paper-based collection.', style_body))

story.append(add_heading('8.1 The Quarterly Survey form', style_h2, 1))
story.append(Paragraph(
    'The Quarterly Survey is a 35-item Likert-scale questionnaire\u20145 questions per RCSI dimension (R, A, C, S, '
    'I, P, M). Each question has 5 response options: None (0), Low (0.25), Mid (0.5), High (0.75), and Full (1.0). '
    'The dimension score is the average of its 5 questions, producing a 0\u20131 value that matches the '
    'quarterly_survey_data.csv format.', style_body))

story.append(Paragraph(
    'A <b>live scores sidebar</b> on the right shows the computed RCSI, milestone badge, next threshold to clear, '
    'and per-dimension progress bars\u2014all updating in real time as you answer questions. A <b>CSV row preview</b> '
    'shows the exact row that will be generated. The quarter dropdown auto-detects the current quarter based on '
    'today\'s date (e.g., in July it selects "Q3 (July) 2026 \u00b7 Current") and auto-rolls to the new year when '
    'January arrives.', style_body))

story.append(Paragraph(
    'Click <b>Add to Queue</b> to save the current school\'s responses and start another, or <b>Download CSV</b> '
    'to export a single row or all queued rows as a file ready for the Upload tab. The <b>Load Example</b> button '
    'pre-fills all 35 questions with a realistic profile (RCSI \u2248 0.436, M2) for demonstration.', style_body))

story.append(add_heading('8.2 The Research Metadata form', style_h2, 1))
story.append(Paragraph(
    'The Research Metadata form captures individual research outputs (abstracts and full papers). It has three '
    'sections: <b>Researcher & School</b> (teacher name, school dropdown, upload date, teacher rank, '
    'educational attainment, years of service, year undertaken), <b>Research Output</b> (title, document type, '
    'theme, status, publication link), and <b>Utilization</b> (utilized by school toggle + utilization date).', style_body))

story.append(Paragraph(
    'The form features <b>automatic theme detection</b>: as you type the research title, the system scans it '
    'against 60+ keywords and suggests the most likely theme. A violet "Auto-detected" badge appears next to the '
    'title with a tooltip showing the matched keywords and confidence level (Strong / Likely / Possible). The '
    'Theme dropdown auto-sets to the detected theme. If you manually change the theme, an amber "Manual override" '
    'badge appears and auto-detection pauses until you edit the title again.', style_body))

story.append(Paragraph(
    'Like the Quarterly Survey, the Research Metadata form has a <b>CSV row preview</b>, a <b>multi-record queue</b>, '
    'and a <b>Load Example</b> button that pre-fills the form with one of three sample research records (Assessment '
    '& Evaluation, Technology Integration, or Leadership & Governance).', style_body))

story.append(add_heading('8.3 The Print Questionnaire button', style_h2, 1))
story.append(Paragraph(
    'The <b>Print Questionnaire</b> button at the top of the Survey tab opens a new browser window with a '
    'print-optimized A4 version of the 35-item survey and triggers the browser\'s print dialog. This is designed '
    'for offline data collection: school heads print the survey, distribute copies to teachers for paper-based '
    'completion during a staff meeting, then enter the responses into the digital form later.', style_body))

story.append(Paragraph(
    'The printable version includes: a branded header with "El Salvador Division \u00b7 RCSI Quarterly Survey", '
    'school and respondent information form fields, a response scale legend, all 35 questions organized into 7 '
    'dimension sections (each with a colored header showing the dimension code, name, description, and milestone), '
    '5 checkboxes per question (None/Low/Mid/High/Full), and signature blocks for the respondent and school head.', style_body))

story.append(PageBreak())

# ========== CHAPTER 9: Trend Analysis ==========
story.extend(add_major_section('Chapter 9 — Trend Analysis', style_h1, 0))

story.append(Paragraph(
    'The Trends tab is the dedicated multi-quarter trend analysis view. While the Overview tab shows a single '
    'quarter (with a comparison to the previous one), the Trends tab shows the full historical trajectory across '
    'all available quarters. This is where decision-makers go to answer: "Are we improving over time? Which '
    'dimensions are trending up or down? Is the division making progress toward sustainability?"', style_body))

story.append(add_heading('9.1 The Trend Summary brief', style_h2, 1))
story.append(Paragraph(
    'At the top is a color-coded brief that summarizes the division\'s trajectory. The tone adapts to the '
    'direction: <b>green</b> (TrendingUp icon) when RCSI is improving, <b>red</b> (TrendingDown icon) when '
    'declining, <b>amber</b> (Minus icon) when stable. The title states the full range: e.g., "Division RCSI '
    'trending upward: 0.306 \u2192 0.364 (+0.058)". The body lists the percentage change and names the improving '
    'and declining dimensions.', style_body))

story.append(add_heading('9.2 The multi-quarter trend chart', style_h2, 1))
story.append(Paragraph(
    'The first chart is a line chart showing the division\'s RCSI and all 7 sub-indices across every available '
    'quarter. The RCSI line is thick and cyan; the 7 dimension lines are thinner and color-coded. Use this chart '
    'to see at a glance which dimensions are rising, flat, or falling over time. If the RCSI line is rising but a '
    'sub-index line is flat or falling, that dimension is the next bottleneck.', style_body))

story.append(add_heading('9.3 The multi-quarter radar overlay', style_h2, 1))
story.append(Paragraph(
    'The second chart is a radar overlay showing the 7-dimension profile for the 4 most recent quarters. Each '
    'quarter is a different color. The shape expanding outward over time shows dimension improvement visually\u2014'
    'a shrinking shape is a warning sign. This is the most intuitive chart for non-technical audiences: "the shape '
    'is getting bigger, so we\'re improving."', style_body))

story.append(add_heading('9.4 The dimension-by-dimension trend table', style_h2, 1))
story.append(Paragraph(
    'Below the charts is a table showing, for each dimension (and the RCSI composite), the first-quarter value, '
    'latest-quarter value, absolute change, percentage change, a direction icon (up/down/flat), and a mini '
    'sparkline. The RCSI row is highlighted in cyan at the top. This table gives the precise numbers behind the '
    'charts\u2014useful for including in reports or presentations.', style_body))

story.append(PageBreak())

# ========== CHAPTER 10: Data Archive ==========
story.extend(add_major_section('Chapter 10 — Data Archive', style_h1, 0))

story.append(Paragraph(
    'The Archive tab is the administrator\'s data management hub. It provides a complete view of everything in '
    'the database: quarter snapshots, full research metadata export, and an upload audit log. Use this tab to '
    'verify data integrity, export backups, and trace any upload operation.', style_body))

story.append(add_heading('10.1 Stats overview', style_h2, 1))
story.append(Paragraph(
    'At the top are four stat cards: <b>Total Quarters</b> (how many quarters have data), <b>Schools in DB</b> '
    '(total unique schools), <b>Research Records</b> (total research outputs), and <b>Upload Operations</b> '
    '(count of upload batches in the audit log).', style_body))

story.append(add_heading('10.2 Quarter snapshots', style_h2, 1))
story.append(Paragraph(
    'The Quarter Snapshots table lists every quarter with data, showing the school count, average RCSI, milestone '
    'distribution (M0\u2013M6), and a <b>CSV export button</b> per quarter. Click "CSV" to download that quarter\'s '
    'raw survey data as a file in the exact quarterly_survey_data.csv format. This is useful for sharing a single '
    'quarter\'s data with a school head or for external analysis.', style_body))

story.append(add_heading('10.3 Full research metadata export', style_h2, 1))
story.append(Paragraph(
    'A single button downloads <b>all</b> research records as one CSV file (research_metadata_full.csv). Use this '
    'for periodic backups or for importing into external systems. The file includes all 14 columns defined in '
    'Appendix A.', style_body))

story.append(add_heading('10.4 The upload audit log', style_h2, 1))
story.append(Paragraph(
    'The Upload Audit Log is a complete history of every upload operation, most recent first. Each row shows the '
    'timestamp, mode (Merge or Replace, color-coded), file name, detected type (survey/research), row count, '
    'inserted/updated/skipped counts, and status (success or failure). This audit trail is written to a dedicated '
    'database table on every upload and cannot be deleted from the UI\u2014it provides a permanent record of all '
    'data changes for accountability.', style_body))

story.append(PageBreak())

# ========== CHAPTER 11: Upload Portal & Data Management ==========
story.extend(add_major_section('Chapter 11 — Upload Portal & Data Management', style_h1, 0))

story.append(Paragraph(
    'The Upload tab is the administrator\'s entry point. It accepts two file types\u2014quarterly survey data '
    'and research metadata\u2014in CSV or Excel format (.csv, .xlsx, .xls). The portal auto-detects the file '
    'type by inspecting the column headers, validates the schema, shows a preview, and only then commits the '
    'data to the database. The default commit mode is <b>Merge</b> (preserves historical data); a <b>Replace '
    'All</b> mode is available for full dataset refreshes. The portal handles simultaneous uploads safely '
    'using an upload mutex.', style_body))

story.append(add_heading('11.1 The upload workflow', style_h2, 1))
story.append(Paragraph(
    '<b>Step 1 \u2014 Select files.</b> Drag one or more files onto the drop zone, or click the zone to browse. '
    'You can upload both file types in a single operation. The portal accepts .csv, .xlsx, and .xls extensions. '
    'Each file\'s size is displayed next to its name.', style_body))
story.append(Paragraph(
    '<b>Step 2 \u2014 Choose upload mode.</b> After selecting files, an <b>Upload Mode</b> toggle appears with two '
    'options: <b>Merge (recommended)</b> or <b>Replace All</b>. Merge adds new rows and updates existing ones '
    'by their natural key (school+quarter for surveys, teacher+title+year for research)\u2014previous quarters\' '
    'data is preserved. Replace wipes all existing data before inserting\u2014use only for full dataset refreshes.', style_body))
story.append(Paragraph(
    '<b>Step 3 \u2014 Validate.</b> Click the <b>Validate</b> button. The portal reads each file, detects whether '
    'it is a survey or research file based on its columns, checks that all required columns are present, and '
    'shows a preview of the first five rows. Each file gets a badge: "Clean" (green) if no errors, or '
    '"N errors" (red) with a list of missing columns or other issues. The <b>Merge to Database</b> (or '
    '<b>Replace Database</b>) button remains disabled until all files are clean.', style_body))
story.append(Paragraph(
    '<b>Step 4 \u2014 Commit.</b> Once all files pass validation, click <b>Merge to Database</b> (or <b>Replace '
    'Database</b>). In Merge mode, the system upserts each row\u2014new rows are inserted, existing rows (matched '
    'by natural key) are updated, and all other data is preserved. After the commit completes, a success alert '
    'shows how many rows were inserted, updated, and skipped (duplicates), and every dashboard tile refreshes '
    'automatically with historical data intact.', style_body))

story.append(callout(
    '<b>Simultaneous uploads are handled safely.</b> If two schools upload at the same time, the first upload '
    'proceeds normally and the second receives a friendly "Another upload is in progress" message with automatic '
    'retry (up to 3 times, 5 seconds apart). Each upload runs inside a database transaction, so it is atomic\u2014'
    'either all rows commit or none do. No data is lost or corrupted.',
    title='Concurrency safety'))

story.append(add_heading('11.2 File format requirements', style_h2, 1))
story.append(Paragraph(
    'The portal expects two file formats. The <b>quarterly survey data</b> file has 10 columns: month, '
    'school_id_no, school_name, R, A, C, S, I, P, M. The <b>research metadata</b> file has 14 columns: '
    'upload_date, teacher_name, school_id_no, document_type, title, theme, status, publication_link, '
    'utilized_by_school, utilization_date, year_undertaken, years_of_service, teacher_rank, '
    'educational_attainment. See <b>Appendix A</b> for the complete data dictionary with types, allowed '
    'values, and examples for every column.', style_body))

story.append(add_heading('11.3 How school IDs are resolved', style_h2, 1))
story.append(Paragraph(
    'The dashboard uses a canonical school ID derived from the <b>school_name</b> column\'s numeric suffix '
    '(e.g., "School_1" \u2192 ID 1, "School_30" \u2192 ID 30). The Survey tab\'s school dropdown is pre-populated '
    'with the 24 real El Salvador Division schools and their official DepEd IDs (e.g., 127667 = Amoros ES, '
    '304787 = El Salvador City National High School). When you select a school from the dropdown, its real DepEd '
    'ID is written to the CSV\'s school_id_no column. <b>If you rename a school in the upload file, the dashboard '
    'will treat it as a new school</b>\u2014keep the School_N naming convention for backward compatibility.', style_body))

story.append(add_heading('11.4 Automatic year/quarter rollover', style_h2, 1))
story.append(Paragraph(
    'The Survey tab\'s quarter dropdown is dynamically generated based on today\'s date. It shows all 4 quarters '
    'of the current year (labeled "Q1 (January) 2026 \u00b7 Current", etc.) and all 4 quarters of the previous '
    'year (for back-filling). The current quarter is auto-selected: in January\u2013March it selects Q1, in '
    'April\u2013June Q2, in July\u2013September Q3, and in October\u2013December Q4. <b>When a new year arrives, '
    'the form automatically rolls over</b>\u2014no manual update is needed. On the Upload tab, the header\'s '
    'quarter selector shows all quarters that have data in the database.', style_body))

story.append(add_heading('11.5 Common validation errors', style_h2, 1))
errors_data = [
    [Paragraph('<b>Error</b>', style_table_header), Paragraph('<b>Cause</b>', style_table_header),
     Paragraph('<b>Fix</b>', style_table_header)],
    [Paragraph('Missing required column: X', style_table_cell),
     Paragraph('A required column is not in the file. The portal lists the exact column name.', style_table_cell),
     Paragraph('Open the file in Excel, add the missing column with the correct values, save, and re-upload.', style_table_cell)],
    [Paragraph('File has no data rows', style_table_cell),
     Paragraph('The file has headers but no data, or is completely empty.', style_table_cell),
     Paragraph('Populate the file with at least one data row.', style_table_cell)],
    [Paragraph('Unsupported file type', style_table_cell),
     Paragraph('The file extension is not .csv, .xlsx, or .xls.', style_table_cell),
     Paragraph('Re-save the file in one of the supported formats. CSV is the most reliable.', style_table_cell)],
    [Paragraph('detectedKind: unknown', style_table_cell),
     Paragraph('The file\'s columns do not match either the survey or the research schema closely enough.', style_table_cell),
     Paragraph('Check the column headers against Appendix A. Even a small typo (e.g., "shool_id_no") will cause detection to fail.', style_table_cell)],
]
story.append(make_table(errors_data, [0.28, 0.36, 0.36]))
story.append(Paragraph('Table 11.1 — Common upload validation errors and their fixes.', style_caption))

story.append(PageBreak())

# ========== APPENDIX A: Data Dictionary ==========
story.extend(add_major_section('Appendix A — Data Dictionary', style_h1, 0))

story.append(Paragraph(
    'This appendix defines every column in the two upload file formats. Use it as a reference when preparing '
    'files for upload or when investigating data quality issues. All columns are required unless marked '
    'optional.', style_body))

story.append(add_heading('A.1 quarterly_survey_data', style_h2, 1))

survey_dict = [
    [Paragraph('<b>Column</b>', style_table_header), Paragraph('<b>Type</b>', style_table_header),
     Paragraph('<b>Example</b>', style_table_header), Paragraph('<b>Notes</b>', style_table_header)],
    [Paragraph('month', style_table_cell_mono), Paragraph('string (YYYY-MM)', style_table_cell),
     Paragraph('2026-01', style_table_cell_mono),
     Paragraph('The quarter this survey row covers. Use 01 (Q1), 04 (Q2), 07 (Q3), or 10 (Q4) as the month.', style_table_cell)],
    [Paragraph('school_id_no', style_table_cell_mono), Paragraph('integer', style_table_cell),
     Paragraph('127947', style_table_cell_mono),
     Paragraph('The school\'s official ID number. Note: the dashboard derives the canonical ID from school_name\'s suffix, so this column\'s value is informational only — see §8.3.', style_table_cell)],
    [Paragraph('school_name', style_table_cell_mono), Paragraph('string', style_table_cell),
     Paragraph('School_1', style_table_cell_mono),
     Paragraph('Must follow the School_N naming convention. The N suffix becomes the canonical school ID used throughout the dashboard.', style_table_cell)],
    [Paragraph('R', style_table_cell_mono), Paragraph('decimal [0, 1]', style_table_cell),
     Paragraph('0.333279', style_table_cell_mono),
     Paragraph('Readiness sub-index. Computed from the quarterly survey.', style_table_cell)],
    [Paragraph('A', style_table_cell_mono), Paragraph('decimal [0, 1]', style_table_cell),
     Paragraph('0.567994', style_table_cell_mono),
     Paragraph('Awareness sub-index. The M0→M1 threshold is A ≥ 0.80.', style_table_cell)],
    [Paragraph('C', style_table_cell_mono), Paragraph('decimal [0, 1]', style_table_cell),
     Paragraph('0.328972', style_table_cell_mono),
     Paragraph('Capacity sub-index.', style_table_cell)],
    [Paragraph('S', style_table_cell_mono), Paragraph('decimal [0, 1]', style_table_cell),
     Paragraph('0.253977', style_table_cell_mono),
     Paragraph('Structured Support sub-index.', style_table_cell)],
    [Paragraph('I', style_table_cell_mono), Paragraph('decimal [0, 1]', style_table_cell),
     Paragraph('0.114062', style_table_cell_mono),
     Paragraph('Institutional Anchoring sub-index.', style_table_cell)],
    [Paragraph('P', style_table_cell_mono), Paragraph('decimal [0, 1]', style_table_cell),
     Paragraph('0.153476', style_table_cell_mono),
     Paragraph('Community of Practice sub-index.', style_table_cell)],
    [Paragraph('M', style_table_cell_mono), Paragraph('decimal [0, 1]', style_table_cell),
     Paragraph('0.006462', style_table_cell_mono),
     Paragraph('Impact Realization sub-index.', style_table_cell)],
]
story.append(make_table(survey_dict, [0.20, 0.18, 0.18, 0.44]))
story.append(Paragraph('Table A.1 — quarterly_survey_data column dictionary (10 columns).', style_caption))

story.append(add_heading('A.2 research_metadata', style_h2, 1))

research_dict = [
    [Paragraph('<b>Column</b>', style_table_header), Paragraph('<b>Type</b>', style_table_header),
     Paragraph('<b>Example</b>', style_table_header), Paragraph('<b>Notes</b>', style_table_header)],
    [Paragraph('upload_date', style_table_cell_mono), Paragraph('string (YYYY-MM-DD)', style_table_cell),
     Paragraph('2026-12-18', style_table_cell_mono),
     Paragraph('The date this research record was uploaded to the system.', style_table_cell)],
    [Paragraph('teacher_name', style_table_cell_mono), Paragraph('string', style_table_cell),
     Paragraph('Carlos Santos', style_table_cell_mono),
     Paragraph('Full name of the teacher who produced the research.', style_table_cell)],
    [Paragraph('school_id_no', style_table_cell_mono), Paragraph('integer', style_table_cell),
     Paragraph('21', style_table_cell_mono),
     Paragraph('The school ID. Must match the School_N suffix used in the survey file for the school to appear in both views.', style_table_cell)],
    [Paragraph('document_type', style_table_cell_mono), Paragraph('enum', style_table_cell),
     Paragraph('abstract', style_table_cell_mono),
     Paragraph('One of: <i>abstract</i> or <i>full_paper</i>.', style_table_cell)],
    [Paragraph('title', style_table_cell_mono), Paragraph('string', style_table_cell),
     Paragraph('Research on Student Engagement 1', style_table_cell_mono),
     Paragraph('The title of the research output.', style_table_cell)],
    [Paragraph('theme', style_table_cell_mono), Paragraph('enum', style_table_cell),
     Paragraph('Teaching Strategies', style_table_cell_mono),
     Paragraph('One of: Assessment & Evaluation, Leadership & Governance, Learner Engagement & Well-being, Others, Professional Development, Teaching Strategies, Technology Integration.', style_table_cell)],
    [Paragraph('status', style_table_cell_mono), Paragraph('enum', style_table_cell),
     Paragraph('draft', style_table_cell_mono),
     Paragraph('One of: draft, under_review, submitted, published, rejected.', style_table_cell)],
    [Paragraph('publication_link', style_table_cell_mono), Paragraph('string (URL, optional)', style_table_cell),
     Paragraph('https://doi.org/...', style_table_cell_mono),
     Paragraph('The DOI or URL of the published research. Leave empty if not yet published.', style_table_cell)],
    [Paragraph('utilized_by_school', style_table_cell_mono), Paragraph('boolean', style_table_cell),
     Paragraph('True', style_table_cell_mono),
     Paragraph('Whether the research has been utilized by a school. Case-insensitive: "True" or "False".', style_table_cell)],
    [Paragraph('utilization_date', style_table_cell_mono), Paragraph('string (YYYY-MM-DD, optional)', style_table_cell),
     Paragraph('2026-12-18', style_table_cell_mono),
     Paragraph('The date the research was utilized. Leave empty if not yet utilized.', style_table_cell)],
    [Paragraph('year_undertaken', style_table_cell_mono), Paragraph('integer', style_table_cell),
     Paragraph('2023', style_table_cell_mono),
     Paragraph('The year the research was undertaken (started).', style_table_cell)],
    [Paragraph('years_of_service', style_table_cell_mono), Paragraph('integer', style_table_cell),
     Paragraph('18', style_table_cell_mono),
     Paragraph('The teacher\'s total years of service at the time of the research.', style_table_cell)],
    [Paragraph('teacher_rank', style_table_cell_mono), Paragraph('enum', style_table_cell),
     Paragraph('Teacher III', style_table_cell_mono),
     Paragraph('One of: Teacher I, Teacher II, Teacher III, Master Teacher I, Master Teacher II, School Head.', style_table_cell)],
    [Paragraph('educational_attainment', style_table_cell_mono), Paragraph('enum', style_table_cell),
     Paragraph("Bachelor's", style_table_cell_mono),
     Paragraph("One of: Bachelor's, Master's, Doctorate.", style_table_cell)],
]
story.append(make_table(research_dict, [0.20, 0.18, 0.20, 0.42]))
story.append(Paragraph('Table A.2 — research_metadata column dictionary (14 columns).', style_caption))

story.append(PageBreak())

# ========== APPENDIX B: FAQ ==========
story.extend(add_major_section('Appendix B — FAQ & Troubleshooting', style_h1, 0))

story.append(Paragraph(
    'This appendix answers the questions that come up most often when using the dashboard. If you encounter '
    'an issue not covered here, check the Executive Brief on the relevant tab first — it is designed to '
    'explain what the charts mean and what to do next.', style_body))

story.append(add_heading('B.1 Frequently asked questions', style_h2, 1))

faqs = [
    ('Why are all 30 schools at M0 in the current dataset?',
     'Because the Awareness (A) sub-index \u2014 the gatekeeper from M0 to M1 \u2014 averages only 0.53 across the '
     'division, well below the 0.80 threshold. No school has A \u2265 0.80 in the latest quarter, so no school can '
     'advance past M0. This is the single most important finding in the current data: the division\'s binding '
     'constraint is Awareness, not Capacity or Support. An awareness campaign (seminars, research orientation '
     'for teachers and school heads) is the highest-leverage intervention available.'),
    ('Why does the milestone not advance when RCSI improves?',
     'Because the RCSI is a continuous average of all seven dimensions, while the milestone is a discrete '
     'threshold-based stage. Improving a dimension whose threshold is already met (e.g., boosting R when the '
     'school is at M0 and the next threshold is A \u2265 0.80) raises the RCSI but does not advance the milestone. '
     'The Twin Sandbox narrative explicitly distinguishes these cases \u2014 see Table 6.1.'),
    ('What happens if I upload a file with missing columns?',
     'The Validate button will flag the file with a red "N errors" badge and list the missing columns. The '
     'Commit button stays disabled until all files are clean. See Table 11.1 for the full list of common errors.'),
    ('Does uploading new data erase previous quarters?',
     'No \u2014 not in the default Merge mode. Merge upserts rows by their natural key (school+quarter for surveys, '
     'teacher+title+year for research), so uploading Q2 preserves Q1. Only the explicit "Replace All" mode wipes '
     'the database first. Always use Merge (the default) unless you need a full dataset refresh.'),
    ('Can I undo a commit?',
     'No \u2014 commits are irreversible. However, in Merge mode, uploading corrected data will update the existing '
     'rows (not erase them). In Replace mode, always keep a backup of the previous data. The Archive tab\'s '
     'audit log records every upload operation for traceability, and you can export any quarter\'s raw data from '
     'the Archive tab\'s Quarter Snapshots table.'),
    ('What happens if two schools upload at the same time?',
     'The system handles this safely using an upload mutex. The first upload proceeds normally; the second '
     'receives a "Another upload is in progress" message and automatically retries up to 3 times with a 5-second '
     'delay. Each upload runs in a database transaction, so no data is lost or corrupted. See \u00a711.1.'),
    ('How are school IDs derived?',
     'The Survey tab\'s school dropdown is pre-populated with the 24 real El Salvador Division schools and their '
     'official DepEd IDs (e.g., 127667 = Amoros ES, 304787 = El Salvador City National High School). When you '
     'select a school, its real DepEd ID is written to the CSV. For backward compatibility with existing data, '
     'the dashboard also derives a canonical ID from the school_name suffix (e.g., "School_1" \u2192 ID 1). See '
     '\u00a711.3 for details.'),
    ('Will the quarter dropdown auto-update when a new year arrives?',
     'Yes. The Survey tab dynamically generates quarters based on today\'s date. It shows all 4 quarters of the '
     'current year (with the current quarter labeled "\u00b7 Current") and all 4 quarters of the previous year. '
     'When January 2027 arrives, the form automatically shows "Q1 (January) 2027 \u00b7 Current". See \u00a711.4.'),
    ('How does the Top 10 Teacher-Researchers ranking work?',
     'The Research tab ranks all teachers by their total number of research outputs in the database. The top 10 '
     'are displayed in a recognition table with gold/silver/bronze medals for the top 3. Each row shows the '
     'teacher\'s name, output count, rank, educational attainment, years of service, years undertaken, and '
     'themes covered. This gives public recognition to the division\'s research leaders.'),
    ('How does the auto-theme detection work in the Research Metadata form?',
     'As you type the research title, the system scans it against 60+ keywords across 6 themes and suggests the '
     'most likely theme. A violet "Auto-detected" badge appears with the confidence level (Strong / Likely / '
     'Possible) and matched keywords. If you manually change the theme, an amber "Manual override" badge appears '
     'and auto-detection pauses until you edit the title again. See \u00a78.2.'),
    ('What is the difference between Policy Levers and the Intervention tab?',
     'Policy Levers are decision-maker-friendly inputs (Training Frequency, Mentorship Ratio, etc.) that map '
     'to dimension deltas automatically. The Intervention tab lets you set raw dimension deltas directly. '
     'Adjusting a Policy Lever syncs the Intervention sliders; manually editing an Intervention slider '
     'overrides the levers (a warning badge appears).'),
    ('Can I change the RCSI weights or milestone thresholds?',
     'Yes \u2014 in the Twin Sandbox only. The Weights sub-tab lets you override the default 12.5% equal weights '
     '(they auto-normalize to sum to 1). The Thresholds sub-tab lets you override the default milestone '
     'thresholds (A \u2265 0.80, others \u2265 0.50). These overrides affect only the Twin Sandbox simulation \u2014 the '
     'production dashboard always uses the defaults.'),
    ('What does "sustainable" mean?',
     'A school is flagged as sustainable when it reaches M6 <i>and</i> its composite RCSI is \u2265 0.70. In the '
     'milestone model, sustainability means the school cycles back to M0 for the next iteration \u2014 a '
     'self-sustaining research culture that no longer requires external push.'),
    ('Why does the Twin Sandbox narrative change color?',
     'The narrative tone (green/amber/red/blue) reflects the simulation outcome. Green = milestone advanced; '
     'amber = RCSI improved but milestone did not; red = milestone regressed; blue = no change yet. See '
     'Table 6.1 for the full state map.'),
    ('How do I download a PDF report for a meeting?',
     'Each of the four main sandboxes (Overview, Schools, Research, Twin Sandbox) has a "Download PDF" button '
     'next to its Executive Brief. The PDF includes the narrative, key data tables, and the Copyright 2026 '
     'footer. The Twin Sandbox PDF captures the current simulation state \u2014 adjust the sliders first, then '
     'download.'),
    ('How often should I upload new data?',
     'The survey file is quarterly \u2014 upload it once per quarter, after the survey closes. The research '
     'metadata file can be uploaded more frequently (e.g., monthly) as new research records are added. '
     'Always validate before committing. Use Merge mode (the default) to preserve historical data.'),
]

for i, (q, a) in enumerate(faqs, 1):
    story.extend(safe_keep_together([
        Paragraph('<b>Q%d. %s</b>' % (i, q), style_h3),
        Paragraph(a, style_body),
    ]))
    story.append(Spacer(1, 4))

story.append(add_heading('B.2 Glossary', style_h2, 1))

glossary = [
    [Paragraph('<b>Term</b>', style_table_header), Paragraph('<b>Definition</b>', style_table_header)],
    [Paragraph('RCSI', style_table_cell), Paragraph('Research Culture Sustainability Index. The composite score (0–1) formed by averaging the seven sub-indices.', style_table_cell)],
    [Paragraph('Sub-index', style_table_cell), Paragraph('One of the seven dimensions: R, A, C, S, I, P, M. Each ranges from 0 to 1.', style_table_cell)],
    [Paragraph('Milestone', style_table_cell), Paragraph('A discrete stage (M0–M6) on the research-culture progression ladder. Based on threshold crossings.', style_table_cell)],
    [Paragraph('Threshold', style_table_cell), Paragraph('The minimum sub-index value required to advance to the next milestone. Default: A ≥ 0.80 for M0→M1; 0.50 for others.', style_table_cell)],
    [Paragraph('Sustainable', style_table_cell), Paragraph('A school at M6 with RCSI ≥ 0.70. The long-term goal for every school.', style_table_cell)],
    [Paragraph('Delta', style_table_cell), Paragraph('An additive change to a sub-index value, used in the Twin Sandbox. Range: −0.30 to +0.30.', style_table_cell)],
    [Paragraph('Twin', style_table_cell), Paragraph('A virtual copy of a school\'s seven-dimension profile that you can experiment on in the Twin Sandbox.', style_table_cell)],
    [Paragraph('Policy lever', style_table_cell), Paragraph('A decision-maker-friendly input (Training Frequency, Mentorship Ratio, etc.) that maps to dimension deltas.', style_table_cell)],
    [Paragraph('Baseline', style_table_cell), Paragraph('The status-quo value for a policy lever. Moving a lever above baseline produces positive deltas; below produces negative.', style_table_cell)],
    [Paragraph('Sparkline', style_table_cell), Paragraph('A small inline line chart showing a school\'s RCSI trend over the available quarters.', style_table_cell)],
    [Paragraph('Executive Brief', style_table_cell), Paragraph('The auto-generated narrative at the top of each tab that interprets the charts in milestone terms and recommends an intervention.', style_table_cell)],
]
story.append(make_table(glossary, [0.20, 0.80]))
story.append(Paragraph('Table B.1 — Glossary of key terms.', style_caption))

# ── Build ──
doc = TocDocTemplate(
    BODY_PDF,
    pagesize=A4,
    leftMargin=LEFT_MARGIN,
    rightMargin=RIGHT_MARGIN,
    topMargin=TOP_MARGIN,
    bottomMargin=BOTTOM_MARGIN,
    title='El Salvador Division RCSI Dashboard — User Manual',
    author='El Salvador Division',
    creator='El Salvador Division',
    subject='User manual and technical reference for the RCSI dashboard',
)

doc.multiBuild(story, onFirstPage=header_footer, onLaterPages=header_footer)
print('Body PDF generated:', BODY_PDF)
