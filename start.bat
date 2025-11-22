@echo off
echo Starting PYRS Application...
echo.
powershell -NoProfile -Command "Write-Host 'Data files will be deleted in 10 seconds (execute this for a new tournament)' -ForegroundColor Green"
echo Press N to skip file deletion and keep existing data files...
echo.

REM Wait for any keypress with 10 second timeout using PowerShell
REM Check if N was pressed, otherwise delete files
echo Waiting for input... (N to keep files ^| any key or wait 10s to delete)
powershell -NoProfile -Command "$key = $null; $endTime = (Get-Date).AddSeconds(10); while ((Get-Date) -lt $endTime) { if ([Console]::KeyAvailable) { $key = [Console]::ReadKey($true); break } Start-Sleep -Milliseconds 100 }; if ($key -and ($key.KeyChar -eq 'N' -or $key.KeyChar -eq 'n')) { exit 0 } else { exit 1 }"

if %ERRORLEVEL% EQU 0 (
    REM User pressed N - keep files
    echo.
    echo Keeping existing data files...
) else (
    REM User pressed any other key or timeout occurred - delete files
    echo.
    powershell -NoProfile -Command "Write-Host 'Deleting data files...' -ForegroundColor Green"
    if exist "data\queue_data.json" (
        del "data\queue_data.json"
        echo Deleted data\queue_data.json
    )
    if exist "data\referee_data.json" (
        del "data\referee_data.json"
        echo Deleted data\referee_data.json
    )
)

echo.
echo Starting server...

REM Start the Next.js server in a new window
start "PYRS Server" cmd /k npm run dev

REM Wait for server to start
echo Waiting for server to start...
timeout /t 8 /nobreak

REM Wait a moment before opening second page
timeout /t 1 /nobreak

echo.
echo PYRS application started!
echo Admin page: http://localhost:3000/queue/admin
echo Queue display: http://localhost:3000/queue/current
echo Kiosk page: http://localhost:3000/queue/kiosk
echo Referee page: http://localhost:3000/referee
echo.
echo Press any key to exit this window (server will continue running)...
pause > nul
