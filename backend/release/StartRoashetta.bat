@echo off
setlocal enableextensions
title Roashetta Server
cd /d "%~dp0"

echo ================================
echo    Roashetta Server Starting
echo ================================
echo.

:start
:: If a downloaded update is waiting, swap it in before launching.
if exist "RoashettaServer.exe.new" (
    echo Applying update...

    if exist "RoashettaServer.exe.bak" del /q "RoashettaServer.exe.bak"
    if exist "RoashettaServer.exe" (
        move /y "RoashettaServer.exe" "RoashettaServer.exe.bak" >nul
    )
    move /y "RoashettaServer.exe.new" "RoashettaServer.exe" >nul
    if errorlevel 1 (
        echo Update swap failed. Restoring previous version.
        if exist "RoashettaServer.exe.bak" (
            move /y "RoashettaServer.exe.bak" "RoashettaServer.exe" >nul
        )
        pause
        exit /b 1
    )
    echo Update applied.
    echo.
)

echo Server will be available at: http://localhost:3000
echo Press Ctrl+C to stop the server
echo.

:: Launch the server. We loop back if a .new file appears during this run
:: (i.e. the running server downloaded an update and exited cleanly).
"RoashettaServer.exe"
set EXIT_CODE=%errorlevel%

if exist "RoashettaServer.exe.new" goto start

if %EXIT_CODE% neq 0 (
    echo.
    echo Roashetta exited with code %EXIT_CODE%
    pause
)

endlocal
