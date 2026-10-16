@echo off
rem Scrap Arena - Windows exe build (needs Node.js 18+ : https://nodejs.org)
cd /d %~dp0
where npm >nul 2>nul || (echo [!] Node.js is not installed. Install it from https://nodejs.org and run again. & pause & exit /b 1)
call npm install || goto :err
call npm run dist || goto :err
echo.
echo Done. Check the "dist" folder:
echo   ScrapArena-1.0.0-portable.exe  (run directly)
echo   ScrapArena-1.0.0-setup.exe     (installer)
start "" "%~dp0dist"
pause
exit /b 0
:err
echo [!] Build failed. See the messages above.
pause
exit /b 1
