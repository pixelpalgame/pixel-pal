@echo off
title Pixel Pal — Publish Release
color 0B
cls

echo.
echo  +------------------------------------------+
echo  |     PIXEL PAL  --  PUBLISH RELEASE       |
echo  +------------------------------------------+
echo.

set "GAMEDIR=%~dp0"
if "%GAMEDIR:~-1%"=="\" set "GAMEDIR=%GAMEDIR:~0,-1%"

powershell -ExecutionPolicy Bypass -File "%GAMEDIR%\publish_release.ps1" -GameDir "%GAMEDIR%"
if %errorlevel% neq 0 (
    echo.
    echo  [!] Something went wrong. See above for details.
)

echo.
pause
