@echo off
title JAZIM LAU Portfolio - Launcher
cd /d "%~dp0"
echo.
echo Starting JAZIM LAU Portfolio tool...
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0run-tool.ps1"
pause