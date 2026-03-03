@echo off
title Pixel Pal — Release Builder
color 0B
cls

echo.
echo  ╔══════════════════════════════════════════╗
echo  ║       PIXEL PAL  —  RELEASE BUILDER      ║
echo  ╚══════════════════════════════════════════╝
echo.

set "GAMEDIR=%~dp0"
if "%GAMEDIR:~-1%"=="\" set "GAMEDIR=%GAMEDIR:~0,-1%"

powershell -ExecutionPolicy Bypass -File "%GAMEDIR%\make_release.ps1" -GameDir "%GAMEDIR%"
if %errorlevel% neq 0 (
    echo.
    echo  [!] Build encountered an error.
)

echo.
pause
