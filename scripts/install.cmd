@echo off
rem wb-convo-flow one-click installer (Windows)
cd /d "%~dp0.."

where node >nul 2>nul
if errorlevel 1 (
  echo [ERROR] Node.js not found. Please install Node.js 18+ from https://nodejs.org
  pause
  exit /b 1
)

if not exist "node_modules" (
  echo [1/2] Installing dependencies ...
  call npm install
  if errorlevel 1 (
    echo [ERROR] npm install failed.
    pause
    exit /b 1
  )
)

if not exist "dist\index.html" (
  echo [2/2] Building frontend ...
  call npm run build
  if errorlevel 1 (
    echo [ERROR] npm run build failed.
    pause
    exit /b 1
  )
)

echo.
node scripts\setup.js install
pause
