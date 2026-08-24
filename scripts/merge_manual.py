#!/usr/bin/env python3
"""Merge cover PDF with body PDF into the final manual."""
import os
from pypdf import PdfReader, PdfWriter

COVER_PDF = '/home/z/my-project/scripts/manual-cover.pdf'
BODY_PDF = '/home/z/my-project/download/_rcsi_manual_body.pdf'
FINAL_PDF = '/home/z/my-project/download/RCSI-User-Manual.pdf'

A4_W, A4_H = 595.28, 841.89

def normalize_page_to_a4(page):
    """Force every page to exactly A4 dimensions to avoid sub-point mismatches."""
    box = page.mediabox
    w, h = float(box.width), float(box.height)
    # Always scale to exact A4 if there's any difference (even sub-point)
    if abs(w - A4_W) > 0.1 or abs(h - A4_H) > 0.1:
        page.scale_to(A4_W, A4_H)
    return page

writer = PdfWriter()

# Cover as page 1
cover_page = PdfReader(COVER_PDF).pages[0]
writer.add_page(normalize_page_to_a4(cover_page))

# Body pages
for page in PdfReader(BODY_PDF).pages:
    writer.add_page(normalize_page_to_a4(page))

writer.add_metadata({
    '/Title': 'El Salvador Division RCSI Dashboard — User Manual',
    '/Author': 'El Salvador Division',
    '/Creator': 'El Salvador Division',
    '/Subject': 'User manual and technical reference for the Research Culture Sustainability Index dashboard',
})

with open(FINAL_PDF, 'wb') as f:
    writer.write(f)

# Clean up intermediate body file
if os.path.exists(BODY_PDF):
    os.remove(BODY_PDF)

size_kb = os.path.getsize(FINAL_PDF) / 1024
page_count = len(PdfReader(FINAL_PDF).pages)
print(f'Final manual: {FINAL_PDF}')
print(f'Size: {size_kb:.1f} KB')
print(f'Pages: {page_count}')
