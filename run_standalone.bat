@echo off
echo Setting up Standalone Build for Windows...

REM Create necessary directories
if not exist ".next\standalone\.next\static" mkdir ".next\standalone\.next\static"
if not exist ".next\standalone\public" mkdir ".next\standalone\public"

REM Copy Static Assets
echo Copying static assets...
xcopy /E /I /Y ".next\static" ".next\standalone\.next\static"
xcopy /E /I /Y "public" ".next\standalone\public"

REM Run the Server
echo Starting Server...
cd .next\standalone
set PORT=3000
node server.js
pause
