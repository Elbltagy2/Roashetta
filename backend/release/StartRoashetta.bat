@echo off
setlocal enableextensions enabledelayedexpansion
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

    :: Wait for Windows + antivirus to release file handles on the old exe.
    :: After the server exits, the OS sometimes holds the handle briefly,
    :: and AV may still be scanning the freshly-downloaded .new file.
    timeout /t 3 /nobreak >nul

    if exist "RoashettaServer.exe.bak" del /q "RoashettaServer.exe.bak" >nul 2>&1

    :: Try to move the running exe out of the way, retrying on lock errors.
    set RETRIES=10
    :movecurrent
    if exist "RoashettaServer.exe" (
        move /y "RoashettaServer.exe" "RoashettaServer.exe.bak" >nul 2>&1
        if errorlevel 1 (
            set /a RETRIES-=1
            if !RETRIES! gtr 0 (
                echo File still locked, waiting...
                timeout /t 2 /nobreak >nul
                goto movecurrent
            )
            echo.
            echo ERROR: Cannot replace RoashettaServer.exe - file is locked.
            echo Make sure no other Roashetta windows are open, then run this again.
            echo If the problem persists, right-click StartRoashetta.bat and
            echo choose "Run as administrator".
            echo.
            pause
            exit /b 1
        )
    )

    :: Move the new exe into place, with the same retry logic.
    set RETRIES=10
    :movenew
    move /y "RoashettaServer.exe.new" "RoashettaServer.exe" >nul 2>&1
    if errorlevel 1 (
        set /a RETRIES-=1
        if !RETRIES! gtr 0 (
            timeout /t 2 /nobreak >nul
            goto movenew
        )
        echo Update swap failed. Restoring previous version.
        if exist "RoashettaServer.exe.bak" (
            move /y "RoashettaServer.exe.bak" "RoashettaServer.exe" >nul 2>&1
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
