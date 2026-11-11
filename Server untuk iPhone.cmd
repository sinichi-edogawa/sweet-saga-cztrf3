@echo off
title Sweet Saga - server untuk iPhone
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
  echo.
  echo   Node.js belum terpasang. Unduh dulu di https://nodejs.org
  echo.
  pause
  exit /b
)
node "tools\serve.js" 8080
pause
