@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo === Build seed data (no npm required) ===
powershell -File "scripts\build.ps1"
if errorlevel 1 goto fail
echo.
echo === Export cloud import package ===
powershell -File "scripts\export-cloud.ps1"
if errorlevel 1 goto fail
echo.
echo All done. Import files: data\export\cloud-import\
goto end
:fail
echo FAILED - see errors above
:end
pause
