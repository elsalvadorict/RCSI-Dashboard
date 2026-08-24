# RCSI Dashboard — Offline Laptop Installation Guide
## For El Salvador Division IT Office

This guide explains how to install and run the RCSI Dashboard on a **local laptop without internet access**.

---

## Prerequisites (Install BEFORE Going Offline)

You need to install these on the laptop **while you still have internet access**. Once installed, they work offline permanently.

### 1. Install Node.js 20 LTS
- **Windows:** Download and run `node-v20.18.1-x64.msi` from https://nodejs.org/
- **macOS:** Download and run `node-v20.18.1.pkg` from https://nodejs.org/
- **Linux:** Download `node-v20.18.1-linux-x64.tar.xz` from https://nodejs.org/

Verify: Open Terminal/Command Prompt and run:
```
node --version
```
Should show: `v20.x.x`

### 2. Install Bun (Package Manager)
Open Terminal/Command Prompt and run:
- **Mac/Linux:** `curl -fsSL https://bun.sh/install | bash`
- **Windows:** `powershell -Command "irm bun.sh/install.ps1 | iex"`

Verify:
```
bun --version
```
Should show: `1.x.x`

### 3. Copy the Transfer Package to the Laptop
Copy `RCSI-Dashboard-Offline-Ready.tar.gz` to the laptop (via USB, shared folder, etc.)

---

## Installation Steps (Can Be Done Offline)

### Step 1: Extract the Package
Open Terminal/Command Prompt in the folder where you copied the package:

**Mac/Linux:**
```bash
tar -xzf RCSI-Dashboard-Offline-Ready.tar.gz
cd rcsi-dashboard
```

**Windows:**
```
# Use 7-Zip or WinRAR to extract the .tar.gz file
# Then open Command Prompt in the extracted folder
cd rcsi-dashboard
```

### Step 2: Install Dependencies
This requires internet access **once**. After this, the app runs offline.

```bash
bun install
```

This takes 2-5 minutes. Wait for it to complete.

### Step 3: Run the Startup Script

**Mac/Linux:**
```bash
chmod +x scripts/start-offline.sh
./scripts/start-offline.sh
```

**Windows:**
```
scripts\start-offline.bat
```

Or simply **double-click** `start-offline.bat` in File Explorer.

### Step 4: Open the Dashboard
The script will display:
```
✓ RCSI Dashboard is now running!
Open your browser and go to: http://localhost:3000
```

Open your browser and go to **http://localhost:3000**

---

## What the Startup Script Does Automatically

The `start-offline.sh` / `start-offline.bat` script handles everything:

1. **Checks Node.js** is installed
2. **Checks Bun** is installed
3. **Creates the database** if `db/custom.db` doesn't exist:
   - Creates the `db/` directory
   - Runs `bunx prisma db push` to create the SQLite database with the correct schema
   - The database starts EMPTY (0 schools, 0 research records)
4. **Starts the application** on port 3000

If the database file (`db/custom.db`) is already included in the package, the script skips step 3 and uses the existing database.

---

## Common Issues

### "custom.db not found" Error
This happens if the `db/` directory is missing or empty. Fix:
```bash
mkdir -p db
set DATABASE_URL=file:./db/custom.db    # Windows: use "set"
export DATABASE_URL="file:./db/custom.db"  # Mac/Linux: use "export"
bunx prisma db push
```
This creates a fresh, empty database.

### "command not found: bun" Error
Bun is not in your PATH. Fix:
- **Mac/Linux:** `export PATH="$HOME/.bun/bin:$PATH"`
- **Windows:** Add `%USERPROFILE%\.bun\bin` to your PATH environment variable

### "Port 3000 already in use" Error
Another application is using port 3000. Fix:
```bash
# Find and kill the process using port 3000
# Mac/Linux:
lsof -i :3000
kill -9 <PID>

# Windows:
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

### "Cannot find module" Error
Dependencies are not installed. Run:
```bash
bun install
```

---

## Loading Demo Data (Optional)

If you want to populate the database with demo data for testing:
```bash
bun run scripts/seed.ts
```

This loads 30 schools, 4 quarters of survey data, and 1,899 research records.

To wipe all data and start clean (for pilot):
```bash
bun run scripts/clean-slate.ts
```

---

## Stopping the Application

Press **Ctrl+C** in the Terminal/Command Prompt window where the app is running.

---

## Files in the Package

| File/Directory | Purpose |
|---|---|
| `scripts/start-offline.sh` | Startup script for Mac/Linux |
| `scripts/start-offline.bat` | Startup script for Windows |
| `db/custom.db` | SQLite database (pre-created, empty) |
| `.env` | Database path configuration |
| `package.json` | Dependencies list |
| `src/` | All application source code |
| `prisma/` | Database schema |
| `public/` | Icons, service worker, manual PDF |

---

## Quick Reference

| Action | Command |
|---|---|
| Start the app | `./scripts/start-offline.sh` (Mac/Linux) or `scripts\start-offline.bat` (Windows) |
| Stop the app | Press Ctrl+C |
| Load demo data | `bun run scripts/seed.ts` |
| Wipe all data | `bun run scripts/clean-slate.ts` |
| Access the app | http://localhost:3000 |

---

Copyright 2026 El Salvador Division
