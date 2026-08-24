@echo off
REM ════════════════════════════════════════════════════════════════
REM RCSI Dashboard — Offline Startup Script (Windows)
REM ════════════════════════════════════════════════════════════════
REM This script starts the RCSI Dashboard on a Windows laptop
REM WITHOUT requiring internet access.
REM
REM Usage: Double-click this file, or run in Command Prompt:
REM   start-offline.bat
REM
REM Then open http://localhost:3000 in your browser.
REM ════════════════════════════════════════════════════════════════

echo.
echo ================================================================
echo   RCSI Dashboard - Offline Startup (Windows)
echo   El Salvador Division Research Culture Sustainability Index
echo ================================================================
echo.

REM ── Step 1: Check Node.js ──
echo [1/4] Checking Node.js...
where node >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo   X Node.js NOT found!
    echo.
    echo   Please install Node.js 20 LTS from:
    echo     https://nodejs.org/dist/v20.18.1/node-v20.18.1-x64.msi
    echo.
    echo   After installing, restart Command Prompt and run this script again.
    pause
    exit /b 1
)
for /f "tokens=*" %%v in ('node --version') do set NODE_VERSION=%%v
echo   OK Node.js found: %NODE_VERSION%
echo.

REM ── Step 2: Check Bun ──
echo [2/4] Checking Bun...
set PATH=%USERPROFILE%\.bun\bin;%PATH%
where bun >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo   X Bun NOT found!
    echo.
    echo   Installing Bun...
    powershell -Command "irm bun.sh/install.ps1 | iex"
    set PATH=%USERPROFILE%\.bun\bin;%PATH%
    where bun >nul 2>&1
    if %ERRORLEVEL% neq 0 (
        echo   X Bun installation failed.
        echo   Try: npm install -g bun
        pause
        exit /b 1
    )
)
for /f "tokens=*" %%v in ('bun --version') do set BUN_VERSION=%%v
echo   OK Bun found: %BUN_VERSION%
echo.

REM ── Step 3: Create database if it doesn't exist ──
echo [3/4] Checking database...
if exist "db\custom.db" (
    echo   OK Database found (db\custom.db)
) else (
    echo   ! Database NOT found. Creating fresh database...
    if not exist "db" mkdir db
    set DATABASE_URL=file:./db/custom.db
    bunx prisma db push
    if %ERRORLEVEL% neq 0 (
        echo   X Could not create database automatically.
        echo.
        echo   Manual fix - run these commands:
        echo     mkdir db
        echo     set DATABASE_URL=file:./db/custom.db
        echo     bunx prisma db push
        echo.
        echo   Then run this script again.
        pause
        exit /b 1
    )
    echo   OK Database created (db\custom.db)
    echo   i The database is empty. Use the Upload tab to add data.
)
echo.

REM ── Step 4: Start the application ──
echo [4/4] Starting RCSI Dashboard...
set DATABASE_URL=file:./db/custom.db

if exist ".next\standalone\server.js" (
    echo   Starting production build...
    cd .next\standalone
    if exist "..\static" xcopy /E /I /Y "..\static" ".next\static" >nul 2>&1
    if exist "..\..\public" xcopy /E /I /Y "..\..\public" "public" >nul 2>&1
    if exist "..\..\prisma" xcopy /E /I /Y "..\..\prisma" "prisma" >nul 2>&1
    if not exist "db" mkdir db
    if exist "..\..\db\custom.db" copy /Y "..\..\db\custom.db" "db\custom.db" >nul 2>&1
    set DATABASE_URL=file:./db/custom.db
    node server.js
) else (
    echo   Starting development server...
    cd /d "%~dp0"
    bun run dev
)

echo.
echo ================================================================
echo   RCSI Dashboard is now running!
echo   Open your browser and go to: http://localhost:3000
echo   To stop: Press Ctrl+C in this window
echo   Copyright 2026 El Salvador Division
echo ================================================================
pause
