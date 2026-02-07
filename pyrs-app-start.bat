@echo off
echo Starting PYRS Application...
echo.

REM Config file to store last reset date
set "CONFIG_FILE=data\reset_config.txt"

REM Check if config file exists and read the date
set "LAST_RESET="
set "HOURS_SINCE_RESET=999"
if exist "%CONFIG_FILE%" (
    for /f "delims=" %%a in (%CONFIG_FILE%) do set "LAST_RESET=%%a"
)

REM Calculate hours since last reset using PowerShell
if defined LAST_RESET (
    for /f %%h in ('powershell -NoProfile -Command "try { $lastReset = [DateTime]::Parse('%LAST_RESET%'); $hours = [Math]::Floor(((Get-Date) - $lastReset).TotalHours); Write-Output $hours } catch { Write-Output 999 }"') do set "HOURS_SINCE_RESET=%%h"
)

REM Display current status
if %HOURS_SINCE_RESET% LSS 999 (
    echo Last reset: %LAST_RESET% ^(%HOURS_SINCE_RESET% hours ago^)
) else (
    echo No previous reset date found.
)
echo.

REM Determine if auto-reset is needed (more than 48 hours)
set "AUTO_RESET=0"
if %HOURS_SINCE_RESET% GTR 48 set "AUTO_RESET=1"
if %HOURS_SINCE_RESET% EQU 999 set "AUTO_RESET=1"

if %AUTO_RESET% EQU 1 (
    powershell -NoProfile -Command "Write-Host 'Data files will be auto-reset (last reset was more than 48 hours ago)' -ForegroundColor Yellow"
) else (
    powershell -NoProfile -Command "Write-Host 'Data files are within 48 hours - will keep existing files' -ForegroundColor Green"
)
echo Press Y within 10 seconds to manually reset files...
echo.

REM Wait for Y keypress with 10 second timeout
echo Waiting for input... (Y to reset files ^| wait 10s to continue)
powershell -NoProfile -Command "$key = $null; $endTime = (Get-Date).AddSeconds(10); while ((Get-Date) -lt $endTime) { if ([Console]::KeyAvailable) { $key = [Console]::ReadKey($true); break } Start-Sleep -Milliseconds 100 }; if ($key -and ($key.KeyChar -eq 'Y' -or $key.KeyChar -eq 'y')) { exit 1 } else { exit 0 }"
set "USER_PRESSED_Y=%ERRORLEVEL%"

REM Determine if we should reset: user pressed Y OR auto-reset is needed
set "DO_RESET=0"
if %USER_PRESSED_Y% EQU 1 set "DO_RESET=1"
if %AUTO_RESET% EQU 1 set "DO_RESET=1"

if %DO_RESET% EQU 1 (
    echo.
    if %USER_PRESSED_Y% EQU 1 (
        powershell -NoProfile -Command "Write-Host 'Manual reset requested...' -ForegroundColor Cyan"
    ) else (
        powershell -NoProfile -Command "Write-Host 'Auto-resetting files (48+ hours since last reset)...' -ForegroundColor Yellow"
    )
    powershell -NoProfile -Command "Write-Host 'Deleting data files...' -ForegroundColor Green"
    if exist "data\queue_data.json" (
        del "data\queue_data.json"
        echo Deleted data\queue_data.json
    )
    if exist "data\referee_data.json" (
        del "data\referee_data.json"
        echo Deleted data\referee_data.json
    )
    if exist "data\judging_schedule.json" (
        del "data\judging_schedule.json"
        echo Deleted data\judging_schedule.json
    )
    if exist "data\queue_settings.json" (
        del "data\queue_settings.json"
        echo Deleted data\queue_settings.json
    )
    REM Save current date to config file
    powershell -NoProfile -Command "Get-Date -Format 'yyyy-MM-dd HH:mm:ss' | Out-File -FilePath '%CONFIG_FILE%' -Encoding ASCII -NoNewline"
    echo.
    echo Reset date saved to config file.
) else (
    echo.
    echo Keeping existing data files...
)

echo.
echo Starting server...

REM Start the Next.js server in a new window
start "PYRS Server" cmd /k npm run prod

REM Wait for server to start
echo Waiting for server to start...
timeout /t 8 /nobreak

REM Wait a moment before opening second page
timeout /t 1 /nobreak

echo.
echo PYRS application started!
echo Press any key to exit this window (server will continue running)...
pause > nul
