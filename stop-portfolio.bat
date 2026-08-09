@echo off
rem JAZIM LAU Portfolio - safe stop (ASCII only, logic in stop-dev.ps1)
title Jazim Portfolio - Stop Server
cd /d "%~dp0"
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0stop-dev.ps1"
