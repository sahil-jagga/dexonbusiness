@echo off
title Nexbill Solar Pro Server
color 0E

echo ======================================================================
echo             NEXBILL SOLAR PRO - EASY 1-CLICK LAUNCHER
echo ======================================================================
echo.

where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [NOTICE] Node.js is not detected on your Windows PC.
    echo.
    echo Option 1 (No Installation needed):
    echo Simply double-click "Nexbill_Solar_Pro_Portable.html" in this folder!
    echo It opens directly in Google Chrome / Edge without any setup.
    echo.
    echo Option 2 (To run full server with remote license sync):
    echo Download and install Node.js from https://nodejs.org (LTS version)
    echo Then double-click this start.bat again.
    echo.
    pause
    exit /b
)

echo [1/2] Checking dependencies...
if not exist node_modules (
    echo Installing required packages (first time only, please wait 1-2 minutes)...
    call npm install
)

echo.
echo [2/2] Starting Nexbill Solar Pro on http://localhost:3000 ...
start http://localhost:3000
call npm run dev

pause
