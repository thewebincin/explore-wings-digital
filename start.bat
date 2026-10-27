@echo off
title Explore Wings Server
cd /d "%~dp0"

:: Check if node is in PATH, otherwise use portable node
where node >nul 2>nul
if %errorlevel% neq 0 (
  set "PATH=C:\Users\NAVANEETH\.gemini\antigravity\brain\454a8e99-f6d8-4c8e-9da4-ed550db5fcf8\scratch\node\node-v22.23.4-win-x64;%PATH%"
)

echo Starting Explore Wings Web Server...
node server.js
pause
