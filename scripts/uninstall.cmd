@echo off
rem wb-convo-flow uninstaller (Windows)
cd /d "%~dp0.."
node scripts\setup.js uninstall
pause
