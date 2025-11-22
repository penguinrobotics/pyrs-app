@echo off
echo Starting Queue Application...

REM Start the Next.js server in a new window
start "Queue Server" cmd /k npm run dev

REM Wait for server to start
echo Waiting for server to start...
timeout /t 8 /nobreak

REM Open admin page
start http://localhost:3000/queue/admin

REM Wait a moment before opening second page
timeout /t 1 /nobreak

REM Open queue display page
start http://localhost:3000/queue/current

echo.
echo Queue application started!
echo Admin page: http://localhost:3000/queue/admin
echo Queue display: http://localhost:3000/queue/current
echo Kiosk page: http://localhost:3000/queue/kiosk
echo.
echo Press any key to exit this window (server will continue running)...
pause > nul
