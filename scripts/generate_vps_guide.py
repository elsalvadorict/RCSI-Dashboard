#!/usr/bin/env python3
"""
Generate the VPS Deployment Guide PDF for the RCSI Dashboard.
Output: /home/z/my-project/download/RCSI-VPS-Deployment-Guide.pdf
"""

import os, sys, hashlib, platform

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
registerFontFamily('FreeSerif', normal='FreeSerif', bold='FreeSerif-Bold',
    italic='FreeSerif-Italic', boldItalic='FreeSerif-BoldItalic')
registerFontFamily('DejaVuSans', normal='DejaVuSans', bold='DejaVuSans')
from pdf import install_font_fallback
install_font_fallback()

# ── Palette ──
TEXT_PRIMARY  = colors.HexColor('#1A1A2E')
TEXT_MUTED    = colors.HexColor('#767c80')
ACCENT        = colors.HexColor('#0E7C7B')
HEADER_FILL   = colors.HexColor('#45606e')
CARD_BG       = colors.HexColor('#e5e9eb')
TABLE_STRIPE  = colors.HexColor('#eef0f0')
BORDER        = colors.HexColor('#b0bfc7')

TABLE_HEADER_COLOR = HEADER_FILL
TABLE_HEADER_TEXT  = colors.white
TABLE_ROW_EVEN     = colors.white
TABLE_ROW_ODD      = TABLE_STRIPE

PAGE_W, PAGE_H = A4
LEFT_MARGIN   = 0.85 * inch
RIGHT_MARGIN  = 0.85 * inch
TOP_MARGIN    = 0.85 * inch
BOTTOM_MARGIN = 0.85 * inch
AVAILABLE_WIDTH = PAGE_W - LEFT_MARGIN - RIGHT_MARGIN

OUTPUT_DIR = '/home/z/my-project/download'
os.makedirs(OUTPUT_DIR, exist_ok=True)
BODY_PDF = os.path.join(OUTPUT_DIR, '_vps_guide_body.pdf')

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
style_code = ParagraphStyle('Code', fontName='DejaVuSans', fontSize=8.5, leading=12,
    textColor=TEXT_PRIMARY, leftIndent=12, rightIndent=12, spaceBefore=4, spaceAfter=8,
    backColor=CARD_BG, borderPadding=6, alignment=TA_LEFT)
style_callout = ParagraphStyle('Callout', fontName=BASE, fontSize=10, leading=15,
    textColor=TEXT_PRIMARY, leftIndent=14, rightIndent=10, spaceBefore=6, spaceAfter=8,
    backColor=colors.HexColor('#e8f4f4'), borderColor=ACCENT, borderWidth=0,
    borderPadding=8, alignment=TA_LEFT)
style_caption = ParagraphStyle('Caption', fontName='FreeSerif-Italic', fontSize=9, leading=12,
    textColor=TEXT_MUTED, alignment=TA_CENTER, spaceBefore=4, spaceAfter=10)
style_table_header = ParagraphStyle('THdr', fontName='FreeSerif-Bold', fontSize=9.5,
    leading=12, textColor=colors.white, alignment=TA_CENTER)
style_table_cell = ParagraphStyle('TCell', fontName=BASE, fontSize=9, leading=12,
    textColor=TEXT_PRIMARY, alignment=TA_LEFT)
style_table_cell_center = ParagraphStyle('TCellC', parent=style_table_cell, alignment=TA_CENTER)
style_table_cell_mono = ParagraphStyle('TCellM', fontName='DejaVuSans', fontSize=8.5,
    leading=11, textColor=TEXT_PRIMARY, alignment=TA_LEFT)

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

def make_table(data, col_ratios, header=True, hAlign='CENTER'):
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
        for i in range(1, len(data)):
            bg = TABLE_ROW_ODD if i % 2 == 1 else TABLE_ROW_EVEN
            style_cmds.append(('BACKGROUND', (0, i), (-1, i), bg))
    t.setStyle(TableStyle(style_cmds))
    return t

def callout(text, title=None):
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

def code_block(text):
    """Render a code block with monospace font and light background."""
    # Escape HTML special chars
    escaped = text.replace('&', '&').replace('<', '<').replace('>', '>')
    return Paragraph(escaped.replace('\n', '<br/>'), style_code)

# ── Header / Footer ──
def header_footer(canvas, doc):
    canvas.saveState()
    canvas.setFont('FreeSerif', 8)
    canvas.setFillColor(TEXT_MUTED)
    canvas.drawString(LEFT_MARGIN, PAGE_H - 0.5 * inch,
        'El Salvador Division RCSI Dashboard \u2014 VPS Deployment Guide')
    canvas.setStrokeColor(ACCENT)
    canvas.setLineWidth(1.2)
    canvas.line(LEFT_MARGIN, PAGE_H - 0.55 * inch,
                PAGE_W - RIGHT_MARGIN, PAGE_H - 0.55 * inch)
    canvas.setFont('FreeSerif', 8)
    canvas.setFillColor(TEXT_MUTED)
    canvas.drawString(LEFT_MARGIN, 0.45 * inch, 'Copyright 2026 El Salvador Division')
    canvas.drawRightString(PAGE_W - RIGHT_MARGIN, 0.45 * inch, 'Page %d' % doc.page)
    canvas.setStrokeColor(BORDER)
    canvas.setLineWidth(0.4)
    canvas.line(LEFT_MARGIN, 0.6 * inch, PAGE_W - RIGHT_MARGIN, 0.6 * inch)
    canvas.restoreState()

# ── Story ──
story = []

# ========== TOC ==========
story.append(Paragraph('<b>Table of Contents</b>', ParagraphStyle('TOCTitle',
    fontName='FreeSerif-Bold', fontSize=22, leading=28, textColor=TEXT_PRIMARY,
    spaceAfter=4, alignment=TA_LEFT)))
story.append(HRFlowable(width='100%', color=ACCENT, thickness=1.5, spaceBefore=2, spaceAfter=18))
toc = TableOfContents()
toc.levelStyles = [toc_level0, toc_level1]
story.append(toc)
story.append(PageBreak())

# ========== Ch 1: Introduction ==========
story.extend(add_major_section('Chapter 1 \u2014 Introduction & Overview', style_h1, 0))

story.append(Paragraph(
    'This guide provides step-by-step instructions for deploying the El Salvador Division Research Culture '
    'Sustainability Index (RCSI) Dashboard to a Virtual Private Server (VPS). A VPS deployment is recommended '
    'for production use because it provides a permanent, stable hosting environment with full control over the '
    'server configuration, database, and security.', style_body))

story.append(Paragraph(
    'Unlike serverless cloud platforms (which have size limits and compatibility issues with SQLite databases), '
    'a VPS runs the application as a traditional Node.js server process. This means the SQLite database file '
    'persists on disk, native binaries run without restrictions, and the application can handle concurrent '
    'uploads from multiple schools simultaneously.', style_body))

story.append(add_heading('1.1 What you will need', style_h2, 1))

req_data = [
    [Paragraph('<b>Requirement</b>', style_table_header), Paragraph('<b>Specification</b>', style_table_header), Paragraph('<b>Estimated Cost</b>', style_table_header)],
    [Paragraph('VPS Server', style_table_cell), Paragraph('Ubuntu 22.04 or 24.04 LTS, 2+ CPU cores, 4 GB RAM, 40 GB SSD', style_table_cell), Paragraph('$5\u2013$20/month', style_table_cell_center)],
    [Paragraph('Domain name', style_table_cell), Paragraph('Optional but recommended (e.g., rcsi.elsalvadordivision.ph)', style_table_cell), Paragraph('$10\u2013$15/year', style_table_cell_center)],
    [Paragraph('SSL Certificate', style_table_cell), Paragraph('Free via Let\u2019s Encrypt (automated with Caddy or nginx)', style_table_cell), Paragraph('Free', style_table_cell_center)],
    [Paragraph('SSH access', style_table_cell), Paragraph('Root or sudo user access to the VPS', style_table_cell), Paragraph('\u2014', style_table_cell_center)],
    [Paragraph('Local computer', style_table_cell), Paragraph('With SSH client (Terminal on Mac/Linux, PuTTY on Windows)', style_table_cell), Paragraph('\u2014', style_table_cell_center)],
]
story.append(make_table(req_data, [0.25, 0.55, 0.20]))
story.append(Paragraph('Table 1.1 \u2014 Deployment requirements and estimated costs.', style_caption))

story.append(add_heading('1.2 Recommended VPS providers', style_h2, 1))
story.append(Paragraph(
    'Any VPS provider that offers Ubuntu LTS will work. Here are three popular options that the Division may '
    'consider, listed from most affordable to most feature-rich:', style_body))

providers_data = [
    [Paragraph('<b>Provider</b>', style_table_header), Paragraph('<b>Plan</b>', style_table_header), Paragraph('<b>Price</b>', style_table_header), Paragraph('<b>Notes</b>', style_table_header)],
    [Paragraph('DigitalOcean', style_table_cell), Paragraph('Basic Droplet (2 CPU, 4 GB RAM)', style_table_cell), Paragraph('$24/month', style_table_cell_center), Paragraph('Simplest setup, excellent documentation, Manila data center available', style_table_cell)],
    [Paragraph('Hetzner', style_table_cell), Paragraph('CX22 (2 CPU, 4 GB RAM)', style_table_cell), Paragraph('\u20ac4.50/month', style_table_cell_center), Paragraph('Best value, European data centers, very reliable', style_table_cell)],
    [Paragraph('AWS EC2', style_table_cell), Paragraph('t3.medium (2 CPU, 4 GB RAM)', style_table_cell_center), Paragraph('~$30/month', style_table_cell_center), Paragraph('Most features, complex billing, Singapore region available', style_table_cell)],
]
story.append(make_table(providers_data, [0.18, 0.30, 0.17, 0.35]))
story.append(Paragraph('Table 1.2 \u2014 Recommended VPS providers.', style_caption))

story.append(callout(
    'If the Division has an existing server (e.g., a DepEd-provided machine or a local computer that is always '
    'on), you can use that instead of renting a VPS. The deployment steps are the same \u2014 just skip the '
    '"rent a VPS" step and SSH into your existing machine.',
    title='Using an existing server'))

story.append(PageBreak())

# ========== Ch 2: Server Preparation ==========
story.extend(add_major_section('Chapter 2 \u2014 Server Preparation', style_h1, 0))

story.append(Paragraph(
    'This chapter covers the initial setup of your VPS: connecting to it, updating the system, and installing '
    'the required software (Node.js, Bun, and PM2). All commands in this guide are run in the terminal (SSH) '
    'and assume Ubuntu 22.04 or 24.04 LTS.', style_body))

story.append(add_heading('2.1 Connect to your VPS via SSH', style_h2, 1))
story.append(Paragraph(
    'After renting a VPS, you will receive an IP address and root password. Open a terminal on your local '
    'computer and connect:', style_body))

story.append(code_block(
    '# On Mac/Linux Terminal or Windows PowerShell:\n'
    'ssh root@YOUR_SERVER_IP\n'
    '\n'
    '# Enter the password when prompted\n'
    '# You should now see a prompt like: root@server:~#'
))

story.append(add_heading('2.2 Update the system', style_h2, 1))
story.append(Paragraph(
    'Run these commands to update all system packages to the latest versions:', style_body))
story.append(code_block(
    'apt update && apt upgrade -y\n'
    'apt install -y curl git build-essential python3'
))

story.append(add_heading('2.3 Install Node.js 20 LTS', style_h2, 1))
story.append(Paragraph(
    'The RCSI Dashboard runs on Next.js 16, which requires Node.js 20 or later. Install it using the '
    'NodeSource repository:', style_body))
story.append(code_block(
    'curl -fsSL https://deb.nodesource.com/setup_20.x | bash -\n'
    'apt install -y nodejs\n'
    '\n'
    '# Verify installation:\n'
    'node --version   # Should show v20.x.x\n'
    'npm --version    # Should show 10.x.x'
))

story.append(add_heading('2.4 Install Bun (package manager)', style_h2, 1))
story.append(Paragraph(
    'The project uses Bun as its package manager. Install it:', style_body))
story.append(code_block(
    'curl -fsSL https://bun.sh/install | bash\n'
    '\n'
    '# Add Bun to PATH (run this, then close and reopen the terminal):\n'
    'echo \'export PATH="$HOME/.bun/bin:$PATH"\' >> ~/.bashrc\n'
    'source ~/.bashrc\n'
    '\n'
    '# Verify:\n'
    'bun --version   # Should show 1.x.x'
))

story.append(add_heading('2.5 Install PM2 (process manager)', style_h2, 1))
story.append(Paragraph(
    'PM2 keeps the application running permanently, even after the server reboots. It also provides logging '
    'and automatic restarts if the app crashes.', style_body))
story.append(code_block(
    'npm install -g pm2\n'
    '\n'
    '# Verify:\n'
    'pm2 --version   # Should show 5.x.x'
))

story.append(callout(
    'PM2 is the key to keeping the app online 24/7. Without it, the app would stop running if the SSH '
    'session closes or the server reboots. PM2 starts the app automatically on boot and restarts it if '
    'it crashes for any reason.',
    title='Why PM2?'))

story.append(PageBreak())

# ========== Ch 3: Deploy the Application ==========
story.extend(add_major_section('Chapter 3 \u2014 Deploy the Application', style_h1, 0))

story.append(Paragraph(
    'This chapter covers transferring the application files to the server, installing dependencies, building '
    'the production bundle, and starting the app with PM2.', style_body))

story.append(add_heading('3.1 Create the application directory', style_h2, 1))
story.append(code_block(
    'mkdir -p /var/www/rcsi-dashboard\n'
    'cd /var/www/rcsi-dashboard'
))

story.append(add_heading('3.2 Transfer the application files', style_h2, 1))
story.append(Paragraph(
    'From your LOCAL computer (not the server), upload the project files using SCP or rsync. Replace '
    'YOUR_SERVER_IP with the actual IP address:', style_body))

story.append(code_block(
    '# Option A: Using SCP (from your local computer)\n'
    'scp -r /path/to/rcsi-dashboard/* root@YOUR_SERVER_IP:/var/www/rcsi-dashboard/\n'
    '\n'
    '# Option B: Using rsync (faster, skips unchanged files)\n'
    'rsync -avz --exclude node_modules --exclude .next \\\n'
    '  /path/to/rcsi-dashboard/ root@YOUR_SERVER_IP:/var/www/rcsi-dashboard/'
))

story.append(callout(
    'Exclude <b>node_modules</b> and <b>.next</b> directories when uploading \u2014 they will be regenerated '
    'on the server. Uploading them would take much longer (1.3 GB) and may cause compatibility issues.',
    title='Important: Exclude node_modules'))

story.append(add_heading('3.3 Install dependencies on the server', style_h2, 1))
story.append(Paragraph(
    'Back on the SERVER (via SSH), install the Node.js dependencies:', style_body))
story.append(code_block(
    'cd /var/www/rcsi-dashboard\n'
    'bun install\n'
    '\n'
    '# This takes 2\u20135 minutes. Wait for it to complete.'
))

story.append(add_heading('3.4 Set up the database', style_h2, 1))
story.append(Paragraph(
    'The app uses a SQLite database. The database file should be in the <code>db/</code> directory. Create it '
    'and set the environment variable:', style_body))
story.append(code_block(
    '# Create the db directory if it doesn\'t exist\n'
    'mkdir -p db\n'
    '\n'
    '# Create the .env file with the database path\n'
    'echo \'DATABASE_URL="file:./db/custom.db"\' > .env\n'
    '\n'
    '# Push the database schema\n'
    'bun run db:push\n'
    '\n'
    '# (Optional) Seed with demo data for testing\n'
    '# bun run scripts/seed.ts\n'
    '\n'
    '# OR start with a clean slate (recommended for pilot)\n'
    '# bun run scripts/clean-slate.ts'
))

story.append(add_heading('3.5 Build the production bundle', style_h2, 1))
story.append(Paragraph(
    'Build the optimized production version of the app:', style_body))
story.append(code_block(
    'bun run build\n'
    '\n'
    '# This takes 30\u201360 seconds. You should see:\n'
    '# \u2713 Compiled successfully\n'
    '# \u2713 Generating static pages (12/12)'
))

story.append(add_heading('3.6 Start the app with PM2', style_h2, 1))
story.append(Paragraph(
    'Start the production server using PM2:', style_body))
story.append(code_block(
    '# Start the app\n'
    'pm2 start "bun run start" --name rcsi-dashboard\n'
    '\n'
    '# Save PM2 process list (so it restarts on reboot)\n'
    'pm2 save\n'
    '\n'
    '# Enable PM2 to start on boot\n'
    'pm2 startup\n'
    '# (Follow the instructions PM2 prints, which usually means\n'
    '#  copying and pasting one command)'
))

story.append(Paragraph(
    'The app is now running on port 3000. Test it by running:', style_body))
story.append(code_block(
    'curl http://localhost:3000/api/overview\n'
    '\n'
    '# You should see JSON data with schoolCount, kpis, etc.\n'
    '# If you see data, the app is working!'
))

story.append(callout(
    'If the command returns an error, check the PM2 logs:\n'
    '<code>pm2 logs rcsi-dashboard --lines 50</code>\n'
    'Common issues: database path not found (check .env), port already in use '
    '(change the port in package.json), or missing dependencies (re-run bun install).',
    title='Troubleshooting'))

story.append(PageBreak())

# ========== Ch 4: Web Server & SSL ==========
story.extend(add_major_section('Chapter 4 \u2014 Web Server & SSL Configuration', style_h1, 0))

story.append(Paragraph(
    'The app runs on port 3000, but users need to access it via a standard web URL (port 80 for HTTP, port 443 '
    'for HTTPS). This chapter covers setting up a reverse proxy with Caddy (the easiest option) or nginx, '
    'plus free SSL certificates via Let\u2019s Encrypt.', style_body))

story.append(add_heading('4.1 Option A: Caddy (recommended \u2014 easiest)', style_h2, 1))
story.append(Paragraph(
    'Caddy is the simplest reverse proxy. It automatically obtains and renews SSL certificates from '
    'Let\u2019s Encrypt \u2014 no manual configuration needed.', style_body))

story.append(code_block(
    '# Install Caddy\n'
    'apt install -y debian-keyring debian-archive-keyring apt-transport-https\n'
    'curl -1sLf \'https://dl.cloudsmith.io/public/caddy/stable/gpg.key\' | \\\n'
    '  gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg\n'
    'curl -1sLf \'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt\' | \\\n'
    '  tee /etc/apt/sources.list.d/caddy-stable.list\n'
    'apt update\n'
    'apt install -y caddy\n'
))

story.append(Paragraph(
    'Edit the Caddy configuration file:', style_body))
story.append(code_block(
    'nano /etc/caddy/Caddyfile\n'
    '\n'
    '# Replace the contents with:\n'
    'rcsi.elsalvadordivision.ph {\n'
    '    reverse_proxy localhost:3000\n'
    '}\n'
    '\n'
    '# Save (Ctrl+O, Enter) and exit (Ctrl+X)'
))

story.append(code_block(
    '# Restart Caddy\n'
    'systemctl restart caddy\n'
    '\n'
    '# Caddy will automatically obtain an SSL certificate\n'
    '# Check status:\n'
    'systemctl status caddy'
))

story.append(callout(
    'Replace <b>rcsi.elsalvadordivision.ph</b> with your actual domain name. If you don\'t have a domain yet, '
    'you can use the server\'s IP address temporarily (SSL won\'t work without a domain, but HTTP will).',
    title='Domain configuration'))

story.append(add_heading('4.2 Option B: nginx (alternative)', style_h2, 1))
story.append(Paragraph(
    'If you prefer nginx (or the Division already uses it), here is the configuration:', style_body))
story.append(code_block(
    '# Install nginx and Certbot\n'
    'apt install -y nginx certbot python3-certbot-nginx\n'
    '\n'
    '# Create the site configuration\n'
    'nano /etc/nginx/sites-available/rcsi-dashboard\n'
    '\n'
    '# Paste this configuration:\n'
    'server {\n'
    '    listen 80;\n'
    '    server_name rcsi.elsalvadordivision.ph;\n'
    '\n'
    '    location / {\n'
    '        proxy_pass http://localhost:3000;\n'
    '        proxy_http_version 1.1;\n'
    '        proxy_set_header Upgrade $http_upgrade;\n'
    '        proxy_set_header Connection \'upgrade\';\n'
    '        proxy_set_header Host $host;\n'
    '        proxy_cache_bypass $http_upgrade;\n'
    '    }\n'
    '}\n'
    '\n'
    '# Enable the site\n'
    'ln -s /etc/nginx/sites-available/rcsi-dashboard /etc/nginx/sites-enabled/\n'
    'nginx -t && systemctl reload nginx\n'
    '\n'
    '# Obtain SSL certificate\n'
    'certbot --nginx -d rcsi.elsalvadordivision.ph'
))

story.append(PageBreak())

# ========== Ch 5: Post-Deployment ==========
story.extend(add_major_section('Chapter 5 \u2014 Post-Deployment Configuration', style_h1, 0))

story.append(Paragraph(
    'After the app is deployed and accessible via HTTPS, complete these final configuration steps.', style_body))

story.append(add_heading('5.1 Remove the "Prototype \u2014 For Approval" badge', style_h2, 1))
story.append(Paragraph(
    'Once the Division Superintendents approve the app, remove the prototype badge:', style_body))
story.append(code_block(
    '# Edit the main page file\n'
    'nano src/app/page.tsx\n'
    '\n'
    '# Find and delete the "Prototype \u2014 For Approval" span\n'
    '# (Search for "Prototype" \u2014 there are 2 occurrences: header and footer)\n'
    '\n'
    '# Also remove it from PDF reports:\n'
    'nano src/lib/pdfReport.ts\n'
    '# (Search for "PROTOTYPE" and delete the header text)\n'
    '\n'
    '# And from the printable questionnaire:\n'
    'nano src/components/dashboard/PrintableQuestionnaire.tsx\n'
    '# (Search for "Prototype" and delete the badge div)\n'
    '\n'
    '# Rebuild and restart:\n'
    'bun run build\n'
    'pm2 restart rcsi-dashboard'
))

story.append(add_heading('5.2 Add the official El Salvador Division logo', style_h2, 1))
story.append(Paragraph(
    'To add the official logo:', style_body))
story.append(code_block(
    '# Upload the logo image to the public directory\n'
    'scp logo.png root@YOUR_SERVER_IP:/var/www/rcsi-dashboard/public/logo.png\n'
    '\n'
    '# Edit the layout to use the logo\n'
    'nano src/app/layout.tsx\n'
    '# Update the icons section to reference /logo.png\n'
    '\n'
    '# Rebuild and restart\n'
    'bun run build\n'
    'pm2 restart rcsi-dashboard'
))

story.append(add_heading('5.3 Run clean slate for pilot deployment', style_h2, 1))
story.append(Paragraph(
    'Before launching for pilot testing, wipe the demo data so schools start with a clean database:', style_body))
story.append(code_block(
    'cd /var/www/rcsi-dashboard\n'
    'bun run scripts/clean-slate.ts\n'
    '\n'
    '# Verify the database is empty:\n'
    '# The dashboard should show "0 schools" and empty charts\n'
    '# Schools can now upload their own data via the Upload tab'
))

story.append(add_heading('5.4 Set up automatic database backups', style_h2, 1))
story.append(Paragraph(
    'Set up a daily backup of the SQLite database to prevent data loss:', style_body))
story.append(code_block(
    '# Create a backup script\n'
    'cat > /var/www/rcsi-dashboard/backup.sh << \'EOF\'\n'
    '#!/bin/bash\n'
    'BACKUP_DIR="/var/backups/rcsi-dashboard"\n'
    'DATE=$(date +%Y-%m-%d_%H%M%S)\n'
    'mkdir -p $BACKUP_DIR\n'
    'cp /var/www/rcsi-dashboard/db/custom.db "$BACKUP_DIR/custom_$DATE.db"\n'
    '# Keep only the last 30 days of backups\n'
    'find $BACKUP_DIR -name "*.db" -mtime +30 -delete\n'
    'EOF\n'
    '\n'
    '# Make it executable\n'
    'chmod +x /var/www/rcsi-dashboard/backup.sh\n'
    '\n'
    '# Add a daily cron job (runs at 2:00 AM)\n'
    'crontab -e\n'
    '# Add this line:\n'
    '0 2 * * * /var/www/rcsi-dashboard/backup.sh'
))

story.append(PageBreak())

# ========== Ch 6: Maintenance & Monitoring ==========
story.extend(add_major_section('Chapter 6 \u2014 Maintenance & Monitoring', style_h1, 0))

story.append(Paragraph(
    'This chapter covers routine maintenance tasks, monitoring the app\u2019s health, and updating the '
    'application when new features are added.', style_body))

story.append(add_heading('6.1 Daily monitoring commands', style_h2, 1))

maint_data = [
    [Paragraph('<b>Task</b>', style_table_header), Paragraph('<b>Command</b>', style_table_header), Paragraph('<b>When</b>', style_table_header)],
    [Paragraph('Check app status', style_table_cell), Paragraph('pm2 status', style_table_cell_mono), Paragraph('Daily', style_table_cell_center)],
    [Paragraph('View recent logs', style_table_cell), Paragraph('pm2 logs rcsi-dashboard --lines 50', style_table_cell_mono), Paragraph('Daily', style_table_cell_center)],
    [Paragraph('Check disk space', style_table_cell), Paragraph('df -h', style_table_cell_mono), Paragraph('Weekly', style_table_cell_center)],
    [Paragraph('Check memory usage', style_table_cell), Paragraph('free -h', style_table_cell_mono), Paragraph('Weekly', style_table_cell_center)],
    [Paragraph('Check database size', style_table_cell), Paragraph('ls -lh /var/www/rcsi-dashboard/db/', style_table_cell_mono), Paragraph('Monthly', style_table_cell_center)],
    [Paragraph('List backups', style_table_cell), Paragraph('ls -lh /var/backups/rcsi-dashboard/', style_table_cell_mono), Paragraph('Monthly', style_table_cell_center)],
]
story.append(make_table(maint_data, [0.25, 0.50, 0.25]))
story.append(Paragraph('Table 6.1 \u2014 Routine maintenance commands.', style_caption))

story.append(add_heading('6.2 Updating the application', style_h2, 1))
story.append(Paragraph(
    'When new features or fixes are made to the application, deploy them to the server:', style_body))
story.append(code_block(
    '# 1. Transfer updated files from your local computer\n'
    'rsync -avz --exclude node_modules --exclude .next \\\n'
    '  /path/to/rcsi-dashboard/ root@YOUR_SERVER_IP:/var/www/rcsi-dashboard/\n'
    '\n'
    '# 2. On the server, install any new dependencies\n'
    'cd /var/www/rcsi-dashboard\n'
    'bun install\n'
    '\n'
    '# 3. Rebuild\n'
    'bun run build\n'
    '\n'
    '# 4. Restart the app (zero downtime)\n'
    'pm2 restart rcsi-dashboard\n'
    '\n'
    '# The app is back online with the new features.'
))

story.append(add_heading('6.3 Restarting after a server reboot', style_h2, 1))
story.append(Paragraph(
    'If the server reboots (planned or unplanned), PM2 should automatically restart the app. Verify:', style_body))
story.append(code_block(
    '# After reboot, check if the app is running\n'
    'pm2 status\n'
    '\n'
    '# If it\'s "stopped" or "errored", start it manually:\n'
    'pm2 restart rcsi-dashboard\n'
    '\n'
    '# If PM2 itself didn\'t start on boot, run:\n'
    'pm2 resurrect'
))

story.append(add_heading('6.4 Viewing the upload audit log', style_h2, 1))
story.append(Paragraph(
    'Every upload operation is logged in the database. View the audit log via the Archive tab in the dashboard, '
    'or query it directly:', style_body))
story.append(code_block(
    '# Install sqlite3 if not already installed\n'
    'apt install -y sqlite3\n'
    '\n'
    '# View recent uploads\n'
    'sqlite3 /var/www/rcsi-dashboard/db/custom.db \\\n'
    '  "SELECT timestamp, mode, fileName, rowCount, status FROM UploadBatch ORDER BY timestamp DESC LIMIT 20;"'
))

story.append(PageBreak())

# ========== Ch 7: Troubleshooting ==========
story.extend(add_major_section('Chapter 7 \u2014 Troubleshooting', style_h1, 0))

story.append(Paragraph(
    'This chapter covers the most common issues and their solutions.', style_body))

troubleshoot_data = [
    [Paragraph('<b>Problem</b>', style_table_header), Paragraph('<b>Cause</b>', style_table_header), Paragraph('<b>Solution</b>', style_table_header)],
    [Paragraph('App not accessible (browser shows "Connection refused")', style_table_cell),
     Paragraph('PM2 process not running or port 3000 not listening.', style_table_cell),
     Paragraph('Run: pm2 restart rcsi-dashboard. Check: pm2 logs rcsi-dashboard --lines 50', style_table_cell)],
    [Paragraph('App shows "0 schools" and empty charts', style_table_cell),
     Paragraph('Database is empty (clean slate) or database path is wrong.', style_table_cell),
     Paragraph('Check .env has DATABASE_URL="file:./db/custom.db". Run: bun run scripts/seed.ts for demo data.', style_table_cell)],
    [Paragraph('Upload fails with "Another upload in progress"', style_table_cell),
     Paragraph('Another upload is currently running (concurrency mutex).', style_table_cell),
     Paragraph('Wait 30 seconds and try again. The mutex releases automatically after the upload completes.', style_table_cell)],
    [Paragraph('SSL certificate expired', style_table_cell),
     Paragraph('Let\u2019s Encrypt certificate needs renewal (happens automatically with Caddy).', style_table_cell),
     Paragraph('For Caddy: systemctl restart caddy. For nginx: certbot renew', style_table_cell)],
    [Paragraph('Server disk full', style_table_cell),
     Paragraph('Old backups or PM2 logs accumulating.', style_table_cell),
     Paragraph('Run: pm2 flush (clear logs). Delete old backups: find /var/backups -mtime +30 -delete', style_table_cell)],
    [Paragraph('App crashes after update', style_table_cell),
     Paragraph('New dependencies not installed or build failed.', style_table_cell),
     Paragraph('Run: bun install && bun run build && pm2 restart rcsi-dashboard', style_table_cell)],
    [Paragraph('Database locked error', style_table_cell),
     Paragraph('Two processes trying to write to SQLite simultaneously.', style_table_cell),
     Paragraph('Restart PM2: pm2 restart rcsi-dashboard. The upload mutex should prevent this.', style_table_cell)],
]
story.append(make_table(troubleshoot_data, [0.25, 0.30, 0.45]))
story.append(Paragraph('Table 7.1 \u2014 Common issues and solutions.', style_caption))

story.append(add_heading('7.1 Getting help', style_h2, 1))
story.append(Paragraph(
    'If you encounter an issue not covered in this guide, collect the following information before contacting '
    'support:', style_body))
story.append(Paragraph('\u2022 PM2 logs: <code>pm2 logs rcsi-dashboard --lines 100 > pm2-logs.txt</code>', style_body_left))
story.append(Paragraph('\u2022 System info: <code>uname -a && free -h && df -h</code>', style_body_left))
story.append(Paragraph('\u2022 App version: check the footer of the dashboard', style_body_left))
story.append(Paragraph('\u2022 Browser console errors (F12 \u2192 Console tab)', style_body_left))
story.append(Paragraph('\u2022 The exact error message or unexpected behavior', style_body_left))

story.append(PageBreak())

# ========== Appendix A: Quick Reference ==========
story.extend(add_major_section('Appendix A \u2014 Quick Reference Card', style_h1, 0))

story.append(Paragraph(
    'A one-page summary of all essential commands. Print this and keep it near the server.', style_body))

story.append(add_heading('A.1 Essential Commands', style_h2, 1))

story.append(Paragraph('<b>Start the app:</b>', style_h3))
story.append(code_block('pm2 start "bun run start" --name rcsi-dashboard'))

story.append(Paragraph('<b>Stop the app:</b>', style_h3))
story.append(code_block('pm2 stop rcsi-dashboard'))

story.append(Paragraph('<b>Restart the app:</b>', style_h3))
story.append(code_block('pm2 restart rcsi-dashboard'))

story.append(Paragraph('<b>View logs:</b>', style_h3))
story.append(code_block('pm2 logs rcsi-dashboard --lines 50'))

story.append(Paragraph('<b>Check status:</b>', style_h3))
story.append(code_block('pm2 status'))

story.append(Paragraph('<b>Rebuild after code update:</b>', style_h3))
story.append(code_block(
    'cd /var/www/rcsi-dashboard\n'
    'bun install && bun run build && pm2 restart rcsi-dashboard'
))

story.append(Paragraph('<b>Seed demo data:</b>', style_h3))
story.append(code_block(
    'cd /var/www/rcsi-dashboard\n'
    'bun run scripts/seed.ts'
))

story.append(Paragraph('<b>Clean slate (wipe all data):</b>', style_h3))
story.append(code_block(
    'cd /var/www/rcsi-dashboard\n'
    'bun run scripts/clean-slate.ts'
))

story.append(Paragraph('<b>Backup database:</b>', style_h3))
story.append(code_block(
    'cp /var/www/rcsi-dashboard/db/custom.db /var/backups/rcsi-dashboard/manual_backup_$(date +%Y%m%d).db'
))

story.append(Paragraph('<b>Check SSL certificate:</b>', style_h3))
story.append(code_block(
    '# For Caddy:\n'
    'systemctl status caddy\n'
    '\n'
    '# For nginx:\n'
    'certbot certificates'
))

story.append(add_heading('A.2 File Locations', style_h2, 1))

files_data = [
    [Paragraph('<b>Item</b>', style_table_header), Paragraph('<b>Path</b>', style_table_header)],
    [Paragraph('Application directory', style_table_cell), Paragraph('/var/www/rcsi-dashboard/', style_table_cell_mono)],
    [Paragraph('Database file', style_table_cell), Paragraph('/var/www/rcsi-dashboard/db/custom.db', style_table_cell_mono)],
    [Paragraph('Environment file', style_table_cell), Paragraph('/var/www/rcsi-dashboard/.env', style_table_cell_mono)],
    [Paragraph('PM2 logs', style_table_cell), Paragraph('~/.pm2/logs/rcsi-dashboard-out.log', style_table_cell_mono)],
    [Paragraph('Caddy config', style_table_cell), Paragraph('/etc/caddy/Caddyfile', style_table_cell_mono)],
    [Paragraph('nginx config', style_table_cell), Paragraph('/etc/nginx/sites-available/rcsi-dashboard', style_table_cell_mono)],
    [Paragraph('Backups', style_table_cell), Paragraph('/var/backups/rcsi-dashboard/', style_table_cell_mono)],
]
story.append(make_table(files_data, [0.35, 0.65]))
story.append(Paragraph('Table A.1 \u2014 File locations on the server.', style_caption))

# ── Build ──
doc = TocDocTemplate(
    BODY_PDF,
    pagesize=A4,
    leftMargin=LEFT_MARGIN,
    rightMargin=RIGHT_MARGIN,
    topMargin=TOP_MARGIN,
    bottomMargin=BOTTOM_MARGIN,
    title='El Salvador Division RCSI Dashboard \u2014 VPS Deployment Guide',
    author='El Salvador Division',
    creator='El Salvador Division',
    subject='Deployment instructions for the RCSI Dashboard on a Virtual Private Server',
)
doc.multiBuild(story, onFirstPage=header_footer, onLaterPages=header_footer)
print('Body PDF generated:', BODY_PDF)
