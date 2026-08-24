#!/bin/bash
# ════════════════════════════════════════════════════════════════
# RCSI Dashboard — Offline Startup Script
# ════════════════════════════════════════════════════════════════
# This script starts the RCSI Dashboard on a local laptop
# WITHOUT requiring internet access.
#
# It automatically:
#   1. Checks if Node.js is installed
#   2. Creates the database if it doesn't exist
#   3. Starts the application
#
# Usage:
#   chmod +x start-offline.sh
#   ./start-offline.sh
#
# Then open http://localhost:3000 in your browser.
# ════════════════════════════════════════════════════════════════

set -e

echo "╔══════════════════════════════════════════════════════════════╗"
echo "║  RCSI Dashboard — Offline Startup                           ║"
echo "║  El Salvador Division Research Culture Sustainability Index  ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""

# ── Step 1: Check Node.js ──
echo "[1/4] Checking Node.js..."
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    echo "  ✓ Node.js found: $NODE_VERSION"
else
    echo "  ✗ Node.js NOT found!"
    echo ""
    echo "  Please install Node.js 20 LTS first:"
    echo "    1. Download from: https://nodejs.org/dist/v20.18.1/node-v20.18.1.pkg (macOS)"
    echo "    2. Or for Windows: https://nodejs.org/dist/v20.18.1/node-v20.18.1-x64.msi"
    echo "    3. Or for Linux: https://nodejs.org/dist/v20.18.1/node-v20.18.1-linux-x64.tar.xz"
    echo ""
    echo "  After installing Node.js, run this script again."
    exit 1
fi

# Check Node version >= 18
NODE_MAJOR=$(node -e "console.log(process.versions.node.split('.')[0])")
if [ "$NODE_MAJOR" -lt 18 ]; then
    echo "  ✗ Node.js version too old. Need v18 or later (found v$NODE_MAJOR)"
    echo "  Please upgrade from https://nodejs.org/"
    exit 1
fi
echo "  ✓ Node.js version is compatible"

# ── Step 2: Check Bun ──
echo ""
echo "[2/4] Checking Bun..."
export PATH="$HOME/.bun/bin:$PATH"
if command -v bun &> /dev/null; then
    BUN_VERSION=$(bun --version)
    echo "  ✓ Bun found: $BUN_VERSION"
else
    echo "  ✗ Bun NOT found!"
    echo ""
    echo "  Installing Bun locally (does NOT require internet)..."
    echo "  If this fails, install Bun manually from https://bun.sh"
    curl -fsSL https://bun.sh/install | bash
    export PATH="$HOME/.bun/bin:$PATH"
    if command -v bun &> /dev/null; then
        echo "  ✓ Bun installed: $(bun --version)"
    else
        echo "  ✗ Bun installation failed."
        echo "  Try: npm install -g bun"
        exit 1
    fi
fi

# ── Step 3: Create database if it doesn't exist ──
echo ""
echo "[3/4] Checking database..."
if [ -f "db/custom.db" ]; then
    echo "  ✓ Database found (db/custom.db)"
else
    echo "  ⚠ Database NOT found. Creating fresh database..."
    mkdir -p db
    export DATABASE_URL="file:./db/custom.db"
    bunx prisma db push 2>/dev/null || npx prisma db push 2>/dev/null || {
        echo "  ✗ Could not create database automatically."
        echo ""
        echo "  Manual fix: Run these commands:"
        echo "    mkdir -p db"
        echo "    export DATABASE_URL=\"file:./db/custom.db\""
        echo "    bunx prisma db push"
        echo ""
        echo "  Then run this script again."
        exit 1
    }
    echo "  ✓ Database created (db/custom.db)"
    echo "  ℹ The database is empty. Use the Upload tab or Survey tab to add data."
    echo "  ℹ To load demo data: bun run scripts/seed.ts"
fi

# ── Step 4: Start the application ──
echo ""
echo "[4/4] Starting RCSI Dashboard..."
export DATABASE_URL="file:./db/custom.db"

# Check if the standalone build exists
if [ -d ".next/standalone" ]; then
    echo "  Starting production build..."
    cd .next/standalone
    # Copy static files if needed
    cp -r ../static .next/ 2>/dev/null || true
    cp -r ../../public . 2>/dev/null || true
    cp -r ../../prisma . 2>/dev/null || true
    mkdir -p db
    cp ../../db/custom.db db/ 2>/dev/null || true
    export DATABASE_URL="file:./db/custom.db"
    node server.js &
    SERVER_PID=$!
else
    echo "  Starting development server..."
    bun run dev &
    SERVER_PID=$!
fi

echo ""
echo "╔══════════════════════════════════════════════════════════════╗"
echo "║  ✓ RCSI Dashboard is now running!                           ║"
echo "║                                                              ║"
echo "║  Open your browser and go to:                                ║"
echo "║     http://localhost:3000                                    ║"
echo "║                                                              ║"
echo "║  To stop the server:                                         ║"
echo "║     Press Ctrl+C in this terminal                            ║"
echo "║                                                              ║"
echo "║  Copyright 2026 El Salvador Division                        ║"
echo "╚══════════════════════════════════════════════════════════════╝"

# Wait for the server process
wait $SERVER_PID
