@echo off
set "GAMEDIR=%~dp0"
if "%GAMEDIR:~-1%"=="\" set "GAMEDIR=%GAMEDIR:~0,-1%"

:: Put bundled Node.js first in PATH so all tools use it
set "PATH=%GAMEDIR%\runtime;%PATH%"

:: Start co-op relay server in background (minimized)
start "Pixel Pal Co-op Server" /MIN "%GAMEDIR%\runtime\node.exe" "%GAMEDIR%\server.js"

:: Wait for server then open browser
timeout /t 2 /nobreak >nul
start http://localhost:3000

:: Start local file server (serve installed via npm)
call "%GAMEDIR%\node_modules\.bin\serve.cmd" "%GAMEDIR%"
