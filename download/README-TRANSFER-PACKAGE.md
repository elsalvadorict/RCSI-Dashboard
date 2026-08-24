# RCSI Dashboard — Complete Technology Transfer Package
## El Salvador Division Research Culture Sustainability Index

**Package Date:** July 2026
**Version:** 2.0
**Classification:** Official — For Turnover to El Salvador Division

---

## Package Contents

This archive contains the complete source code, configuration, documentation, and deliverables for the RCSI Dashboard application.

### 1. Source Code (`src/`)
- **14 library files** (`src/lib/`) — RCSI computation engine, narratives, policy levers, survey questions, glossary, theme detector, PDF report generator, types, schools list, upload mutex
- **9 API routes** (`src/app/api/`) — Overview, Schools, Schools Detail, Twin Simulate, AI Chat, AI Report, AI Classify-Theme, Archive, Upload
- **23 dashboard components** (`src/components/dashboard/`) — All 9 tab panels, AI chat, PWA install, school detail dialog, narrative synopsis, etc.
- **70 UI components** (`src/components/ui/`) — shadcn/ui component library
- **Main page** (`src/app/page.tsx`) — The 9-tab dashboard
- **Layout** (`src/app/layout.tsx`) — Dark mode, PWA metadata, fonts
- **Manifest** (`src/app/manifest.ts`) — PWA configuration
- **Global styles** (`src/app/globals.css`) — Dark mode theme

### 2. Database (`prisma/`)
- `schema.prisma` — Database schema with 4 models (School, SurveyScore, ResearchRecord, UploadBatch)

### 3. Scripts (`scripts/`)
- `seed.ts` — Populate database with demo data
- `clean-slate.ts` — Wipe database for pilot deployment
- `generate-pwa-icons.js` — Generate app icons
- `generate_manual_body.py` — Generate the User Manual PDF
- `generate_turnover_document.js` — Generate the Turnover Document (.docx)
- `generate_vps_guide.py` — Generate the VPS Deployment Guide PDF
- Cover HTML files and merge scripts for PDF generation

### 4. Public Assets (`public/`)
- PWA icons (192px, 512px, maskable, favicon, apple-touch-icon)
- Service worker (`sw.js`)
- User Manual PDF (28 pages)
- Robots.txt

### 5. Configuration Files
- `package.json` — Dependencies and build scripts
- `next.config.ts` — Next.js configuration with DATABASE_URL fallback
- `tsconfig.json` — TypeScript configuration
- `tailwind.config.ts` — Tailwind CSS configuration
- `postcss.config.mjs` — PostCSS configuration
- `eslint.config.mjs` — ESLint configuration
- `components.json` — shadcn/ui configuration
- `.env.example` — Environment variable template
- `.gitignore` — Git ignore rules
- `render.yaml` — Render.com deployment blueprint
- `Caddyfile` — Caddy reverse proxy configuration (for VPS deployment)

### 6. Documentation
- `RENDER-DEPLOYMENT.md` — Step-by-step Render.com deployment guide
- `download/RCSI-User-Manual.pdf` — 28-page user manual (v2.0)
- `download/RCSI-VPS-Deployment-Guide.pdf` — 17-page VPS deployment guide
- `download/RCSI-Dashboard-Turnover-Document.docx` — Formal turnover document (for signature)

---

## How to Use This Package

### For Local Development / Testing
```bash
# 1. Extract the archive
tar -xzf RCSI-Dashboard-Complete-Transfer.tar.gz
cd rcsi-dashboard

# 2. Install dependencies
bun install

# 3. Set up the database
cp .env.example .env
bun run db:push

# 4. (Optional) Seed with demo data
bun run seed

# 5. Start the development server
bun run dev

# 6. Open http://localhost:3000 in your browser
```

### For Pilot Deployment (Clean Slate)
```bash
# Follow steps 1-3 above, then:
bun run clean-slate    # Wipe all data — schools start fresh
bun run dev            # Or deploy to Render/VPS per the deployment guides
```

### For Production Deployment
See one of these guides (both included in this package):
- **Render.com** (easiest): `RENDER-DEPLOYMENT.md`
- **VPS** (full control): `download/RCSI-VPS-Deployment-Guide.pdf`

---

## What's NOT Included (and Why)

| Excluded | Reason |
|----------|--------|
| `node_modules/` | 1.3 GB — regenerated with `bun install` |
| `.next/` | Build output — regenerated with `bun run build` |
| `db/custom.db` | Demo database — division starts with clean slate |
| `dev.log`, `server.log` | Development logs |
| `skills/` | Development tools (not part of the app) |
| `upload/` | Source CSVs (already seeded into the database) |

---

## Technology Stack
- **Framework:** Next.js 16 with App Router
- **Language:** TypeScript 5
- **Database:** SQLite via Prisma ORM
- **UI:** shadcn/ui + Tailwind CSS 4
- **Charts:** Recharts
- **AI:** Z.AI GLM-4 via z-ai-web-dev-sdk
- **PDF:** jsPDF (client-side), ReportLab (manuals)
- **PWA:** Service Worker + Web App Manifest

---

## Contact
For questions about this technology transfer, contact the El Salvador Division IT Office.

Copyright 2026 El Salvador Division
