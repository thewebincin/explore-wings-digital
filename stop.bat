@echo off
title Stop Explore Wings Server
cd /d "%~dp0"
echo Stopping any running Explore Wings web server processes...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":3000"') do (
  taskkill /f /pid %%a >nul 2>nul
)
echo Server stopped successfully.
timeout /t 2 >nul
