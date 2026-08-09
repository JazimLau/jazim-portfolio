@echo off
setlocal
title Jazim Portfolio - Server Status Check

cd /d "%~dp0"

rem ---------- Check whether 127.0.0.1:5173 is responding ----------
powershell -NoProfile -Command "try { $r = Invoke-WebRequest -Uri 'http://127.0.0.1:5173' -UseBasicParsing -TimeoutSec 3; if ($r.StatusCode -eq 200) { exit 0 } else { exit 1 } } catch { exit 1 }"

if errorlevel 1 goto offline

echo.
echo ========================================
echo   JAZIM PORTFOLIO
echo   DEV SERVER ONLINE
echo   http://127.0.0.1:5173
echo ========================================
echo.
pause
exit /b 0

:offline
echo.
echo ========================================
echo   JAZIM PORTFOLIO
echo   DEV SERVER OFFLINE
echo   http://127.0.0.1:5173
echo ========================================
echo.
echo Press any key to start...
pause >nul
call "%~dp0start-dev.bat"
exit /b 0
