@echo off
echo Starting LandFlow App Server...
echo Please wait a few seconds for the server to boot up...

:: Start the development server in a separate window
start "LandFlow Server" cmd /c "npm run dev"

:: Wait 5 seconds for the server to be ready
timeout /t 5 /nobreak > NUL

:: Now open the browser
start http://localhost:5173

echo Application launched in browser. You can close this window.
pause
