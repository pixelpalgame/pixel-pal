@echo off
title Pixel Pal — Updater
color 0A
cls

echo.
echo  ╔══════════════════════════════════════════╗
echo  ║         PIXEL PAL  —  UPDATER            ║
echo  ╚══════════════════════════════════════════╝
echo.

set "GAMEDIR=%~dp0"
if "%GAMEDIR:~-1%"=="\" set "GAMEDIR=%GAMEDIR:~0,-1%"

powershell -ExecutionPolicy Bypass -File "%GAMEDIR%\update.ps1" -GameDir "%GAMEDIR%"
if %errorlevel% neq 0 (
    echo.
    echo  [!] Update encountered an error.
)

echo.
pause
