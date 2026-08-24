#!/usr/bin/env python3
"""Merge VPS guide cover + body into final PDF."""
import os
from pypdf import PdfReader, PdfWriter

COVER_PDF = '/home/z/my-project/scripts/vps-guide-cover.pdf'
BODY_PDF = '/home/z/my-project/download/_vps_guide_body.pdf'
FINAL_PDF = '/home/z/my-project/download/RCSI-VPS-Deployment-Guide.pdf'

A4_W, A4_H = 595.28, 841.89

def normalize_page_to_a4(page):
    box = page.mediabox
    w, h = float(box.width), float(box.height)
    if abs(w - A4_W) > 0.1 or abs(h - A4_H) > 0.1:
        page.scale_to(A4_W, A4_H)
    return page

writer = PdfWriter()
cover_page = PdfReader(COVER_PDF).pages[0]
writer.add_page(normalize_page_to_a4(cover_page))
for page in PdfReader(BODY_PDF).pages:
    writer.add_page(normalize_page_to_a4(page))

writer.add_metadata({
    '/Title': 'El Salvador Division RCSI Dashboard — VPS Deployment Guide',
    '/Author': 'El Salvador Division',
    '/Creator': 'El Salvador Division',
    '/Subject': 'Deployment instructions for the RCSI Dashboard on a Virtual Private Server',
})

with open(FINAL_PDF, 'wb') as f:
    writer.write(f)

if os.path.exists(BODY_PDF):
    os.remove(BODY_PDF)

size_kb = os.path.getsize(FINAL_PDF) / 1024
page_count = len(PdfReader(FINAL_PDF).pages)
print(f'Final guide: {FINAL_PDF}')
print(f'Size: {size_kb:.1f} KB')
print(f'Pages: {page_count}')
