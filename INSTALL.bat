@echo off
title Pixel Pal — Installing...
color 0A
cls

echo.
echo  ╔══════════════════════════════════════════╗
echo  ║         PIXEL PAL  —  INSTALLER          ║
echo  ╚══════════════════════════════════════════╝
echo.

set "GAMEDIR=%~dp0"
if "%GAMEDIR:~-1%"=="\" set "GAMEDIR=%GAMEDIR:~0,-1%"

:: ── Step 1: Set up bundled Node.js runtime ───────────────────────────
echo  [1/3]  Setting up game runtime...
powershell -ExecutionPolicy Bypass -File "%GAMEDIR%\setup_runtime.ps1" -GameDir "%GAMEDIR%"
if %errorlevel% neq 0 (
    echo.
    echo  [!]  Setup failed. Check your internet connection and try again.
    echo.
    pause
    exit /b 1
)

:: ── Step 2: Install game components ──────────────────────────────────
echo.
echo  [2/3]  Installing game components...
pushd "%GAMEDIR%"
call "%GAMEDIR%\runtime\npm.cmd" install >nul 2>&1
if %errorlevel% neq 0 (
    echo  [!]  Installation failed. Please try again.
    popd
    pause
    exit /b 1
)
popd
echo  [OK] Game components installed.

:: ── Step 3: Create desktop shortcut with icon ────────────────────────
echo.
echo  [3/3]  Creating desktop shortcut...
powershell -ExecutionPolicy Bypass -File "%GAMEDIR%\install_helper.ps1" -GameDir "%GAMEDIR%"

echo.
echo  ╔══════════════════════════════════════════╗
echo  ║           INSTALL COMPLETE!              ║
echo  ║                                          ║
echo  ║   'Pixel Pal' added to your Desktop.     ║
echo  ║   Double-click it any time to play!      ║
echo  ╚══════════════════════════════════════════╝
echo.
pause
