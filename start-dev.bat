@echo off
setlocal
title Jazim Portfolio - Dev Server Launcher

rem ============================================================
rem  JAZIM PORTFOLIO - DEV SERVER LAUNCHER  (single shared entry)
rem  Called by: run-tool.ps1 menu Option 1 / check-dev.bat / directly
rem  Fixed address: 127.0.0.1:5173 (strictPort: true)
rem  Vite runs in its OWN separate CMD window and stays open.
rem  This script NEVER kills any node process.
rem  If the portfolio dev server is already running on 5173 it does
rem  NOT start a second instance - it just opens the browser.
rem ============================================================

cd /d "%~dp0"

echo ========================================
echo JAZIM PORTFOLIO DEV SERVER
echo http://127.0.0.1:5173
echo ========================================
echo.

rem ---------- 1. Check package.json (project root) ----------
if not exist "package.json" (
    echo [ERROR] package.json not found in this folder.
    echo Please run this launcher from the portfolio project root.
    echo.
    pause
    exit /b 1
)

rem ---------- 2. Check Node.js ----------
where node >nul 2>nul
if errorlevel 1 (
    echo [ERROR] Node.js not found.
    echo Please install Node.js from https://nodejs.org and retry.
    echo.
    pause
    exit /b 1
)
for /f "delims=" %%v in ('node --version') do echo Node.js %%v  OK

rem ---------- 3. Check npm ----------
where npm >nul 2>nul
if errorlevel 1 (
    echo [ERROR] npm not found.
    echo Please install Node.js from https://nodejs.org and retry.
    echo.
    pause
    exit /b 1
)

rem ---------- 4. Check dependencies (install only if missing) ----------
if not exist "node_modules" (
    echo.
    echo Installing dependencies with npm install, this may take 1-2 minutes.
    echo.
    call npm install
    if errorlevel 1 (
        echo.
        echo [ERROR] npm install failed.
        pause
        exit /b 1
    )
    echo.
    echo Dependencies installed.
)

rem ---------- 5. Check port 5173 ----------
rem   RC 0 = already OUR dev server (command line contains "jazim-portfolio") -> don't duplicate
rem   RC 1 = port free
rem   RC 2 = occupied by another program (never killed automatically)
powershell -NoProfile -Command "$c = Get-NetTCPConnection -LocalPort 5173 -State Listen -ErrorAction SilentlyContinue; if (-not $c) { exit 1 }; $pids = $c | Select-Object -ExpandProperty OwningProcess -Unique; foreach ($p in $pids) { $cl = (Get-CimInstance Win32_Process -Filter ('ProcessId=' + $p) -ErrorAction SilentlyContinue).CommandLine; if ($cl -and ($cl -match 'jazim-portfolio')) { exit 0 } }; exit 2"
set RC=%errorlevel%

if "%RC%"=="0" goto already_running
if "%RC%"=="2" goto occupied_other

rem ---------- 6. Start Vite in its own independent window ----------
echo Starting Vite development server in a separate window...
echo Window title: "Jazim Portfolio - Vite 5173"
echo To stop the server: close that window or press Ctrl+C inside it.
echo.
echo Opening http://127.0.0.1:5173 in your browser...
echo.

start "Jazim Portfolio - Vite 5173" /D "%~dp0" cmd /k "npm run dev"

echo Done. This launcher window can be closed now.
echo The dev server keeps running in its own window.
echo.
exit /b 0

:already_running
echo.
echo [INFO] Portfolio dev server is ALREADY running on http://127.0.0.1:5173
echo        No second instance was started.
echo        Opening the browser...
echo.
start "" "http://127.0.0.1:5173"
exit /b 0

:occupied_other
echo.
echo [WARNING] Port 5173 is occupied by ANOTHER program (not this portfolio).
echo           Vite uses strictPort:true and will FAIL to start on a busy port.
echo           Please close the program using port 5173, then retry.
echo.
pause
exit /b 1
