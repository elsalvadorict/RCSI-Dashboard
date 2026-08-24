# RCSI Dashboard — Render.com Deployment Guide

This guide walks you through deploying the El Salvador Division RCSI Dashboard to Render.com via GitHub.

## Overview

Render.com is a managed hosting platform that:
- Builds and deploys your app automatically from GitHub
- Provides a **persistent disk** (critical for SQLite — your data survives redeploys)
- Handles SSL certificates automatically (free HTTPS)
- Requires **no server administration** (no SSH, no PM2, no nginx)

## What You Need

| Item | Details | Cost |
|------|---------|------|
| GitHub account | Free at github.com | Free |
| Render account | Free at render.com | Free to sign up |
| Render Starter plan | Required for persistent disk | $7/month |
| Domain (optional) | e.g., rcsi.elsalvadordivision.ph | $10-15/year |

---

## Step 1: Push the Code to GitHub

1. Go to [github.com](https://github.com) and sign in (or create a free account)
2. Click the **"+"** icon → **New repository**
3. Name it `rcsi-dashboard`
4. Set visibility to **Private** (recommended — contains division data)
5. Click **Create repository**
6. On your local computer, in the project directory:

```bash
# Initialize git (if not already initialized)
git init

# Add all files
git add .

# Commit
git commit -m "RCSI Dashboard v2.0 — initial commit"

# Add your GitHub repository as the remote
git remote add origin https://github.com/YOUR_USERNAME/rcsi-dashboard.git

# Push to GitHub
git branch -M main
git push -u origin main
```

**Important:** The `.gitignore` file excludes:
- `node_modules/` (will be installed by Render)
- `.next/` (will be built by Render)
- `db/*.db` (your database — Render creates a fresh one)
- `.env` (your secrets — set via Render's dashboard)

---

## Step 2: Create a Render Web Service

1. Go to [dashboard.render.com](https://dashboard.render.com) and sign in
2. Click **New +** → **Web Service**
3. Connect your GitHub account (first time only)
4. Select the `rcsi-dashboard` repository
5. Configure the service:

| Setting | Value |
|---------|-------|
| **Name** | `rcsi-dashboard` |
| **Runtime** | Node |
| **Build Command** | (leave as-is in render.yaml — Render reads it automatically) |
| **Start Command** | (leave as-is in render.yaml) |
| **Instance Type** | Starter ($7/month) — **required for persistent disk** |

6. Scroll down to **Disks** and add:
   - **Name:** `rcsi-data`
   - **Mount Path:** `/opt/data`
   - **Size:** 1 GB

7. Scroll down to **Environment Variables** and verify:
   - `DATABASE_URL` = `file:/opt/data/db/custom.db`
   - `NODE_ENV` = `production`

8. Click **Create Web Service**

---

## Step 3: Wait for the Build

Render will now:
1. Clone your repository
2. Install Bun
3. Run `bun install` (installs dependencies)
4. Run `bun run db:generate` (generates Prisma client)
5. Run `bun run build:render` (builds the production bundle)
6. Start the app with `bun run start:render`

This takes **3–5 minutes**. You can watch the build logs in real-time on the Render dashboard.

---

## Step 4: Verify the Deployment

Once the build completes, Render will show:
- **Status:** Live (green)
- **URL:** `https://rcsi-dashboard.onrender.com` (or similar)

Click the URL to open the dashboard. You should see:
- The app loads with "0 schools" (empty database)
- The "Prototype — For Approval" badge in the header

**The app is now live on the internet!**

---

## Step 5: Seed the Database (Optional)

To populate the database with demo data for testing:

1. On the Render dashboard, click your web service
2. Go to the **Shell** tab (or click **Manual Deploy → Deploy Latest Commit** with a shell command)
3. Run:
```bash
# Set the DATABASE_URL to the persistent disk
export DATABASE_URL="file:/opt/data/db/custom.db"

# Seed demo data
bun run scripts/seed.ts
```

Or, for a clean slate (recommended for pilot):
```bash
export DATABASE_URL="file:/opt/data/db/custom.db"
bun run scripts/clean-slate.ts
```

---

## Step 6: Set Up a Custom Domain (Optional)

1. On the Render dashboard, go to your web service → **Settings**
2. Scroll to **Custom Domains**
3. Click **Add Custom Domain**
4. Enter your domain (e.g., `rcsi.elsalvadordivision.ph`)
5. Render will give you a **CNAME record** to add to your DNS provider
6. Once the DNS is configured, Render automatically provisions an SSL certificate

---

## How Updates Work

When you make changes to the code:

1. Make changes on your local computer
2. Push to GitHub:
```bash
git add .
git commit -m "Description of changes"
git push
```
3. Render **automatically detects the push** and rebuilds the app
4. The app is updated in 3–5 minutes — no manual intervention needed

Your data on the persistent disk is **never touched** during a redeploy.

---

## How the Database Works on Render

| Aspect | Details |
|--------|---------|
| **Location** | `/opt/data/db/custom.db` (on the persistent disk) |
| **Survives redeploys?** | ✅ Yes — the disk is separate from the app code |
| **Survives server restart?** | ✅ Yes |
| **Backup** | Render takes automatic snapshots of the disk |
| **Size limit** | 1 GB (more than enough — current database is 456 KB) |
| **Access** | Via the app only (no direct database management UI) |

---

## Cost Summary

| Item | Monthly Cost | Notes |
|------|-------------|-------|
| Render Starter plan | $7/month | Includes 512 MB RAM, persistent disk, auto-deploy |
| GitHub | Free | Private repositories are free |
| Domain (optional) | ~$1/month | Amortized from $10-15/year |
| SSL certificate | Free | Render provisions automatically via Let's Encrypt |
| **Total** | **$7–8/month** | All-in for a production deployment |

---

## Troubleshooting

### App shows "0 schools" after deploy
This is expected — the database starts empty. Run the seed script (Step 5) to populate demo data, or upload data via the Upload tab.

### Build fails with "Prisma generate error"
Ensure the `DATABASE_URL` environment variable is set in Render's dashboard before the first build.

### App crashes on startup
Check the logs: Render dashboard → your service → **Logs** tab. Common causes:
- Database path not found (check `DATABASE_URL` points to `/opt/data/db/custom.db`)
- Missing environment variables
- Port conflict (Render sets `PORT` automatically — the app listens on `process.env.PORT || 3000`)

### Data disappeared after a push
This should NOT happen — the persistent disk survives redeploys. If it does:
- Check that the disk is still attached: Render dashboard → Settings → Disks
- Ensure `DATABASE_URL` still points to `/opt/data/db/custom.db`

---

## Quick Reference

| Action | How |
|--------|-----|
| View the app | Click the URL on the Render dashboard |
| View logs | Render dashboard → Logs tab |
| Run a shell command | Render dashboard → Shell tab |
| Restart the app | Render dashboard → Manual Deploy → Clear build cache & deploy |
| Check disk usage | Render dashboard → Settings → Disks |
| Update the app | `git push` — Render auto-deploys |
| Scale up | Render dashboard → Settings → Instance Type (upgrade to Standard for $25/month) |
