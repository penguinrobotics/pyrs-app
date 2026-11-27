@echo off
setlocal EnableExtensions

set "CADDY_DIR=%~dp0"
for %%I in ("%CADDY_DIR%..") do set "REPO_ROOT=%%~fI"

set "CADDY_EXE=%CADDY_DIR%caddy.exe"
set "CADDYFILE=%CADDY_DIR%Caddyfile"
set "ENV_FILE=%REPO_ROOT%\.env"

if not exist "%CADDY_EXE%" (
    echo [ERROR] caddy.exe not found at "%CADDY_EXE%"
    echo Run the installer first:
    echo   powershell -ExecutionPolicy Bypass -File "%CADDY_DIR%install-caddy.ps1"
    pause
    exit /b 1
)

if not exist "%ENV_FILE%" (
    echo [ERROR] .env file not found at "%ENV_FILE%"
    echo Copy .env.example to .env and configure CADDY_DOMAIN and CLOUDFLARE_API_TOKEN.
    pause
    exit /b 1
)

REM Load key variables from .env for basic pre-flight validation
set "CADDY_DOMAIN="
set "CLOUDFLARE_API_TOKEN="
set "PORT="
for /f "usebackq tokens=1,* delims==" %%A in ("%ENV_FILE%") do (
    if /i "%%A"=="CADDY_DOMAIN" set "CADDY_DOMAIN=%%B"
    if /i "%%A"=="CLOUDFLARE_API_TOKEN" set "CLOUDFLARE_API_TOKEN=%%B"
    if /i "%%A"=="PORT" set "PORT=%%B"
)

if not defined CADDY_DOMAIN (
    echo [ERROR] CADDY_DOMAIN is not set in .env
    pause
    exit /b 1
)
if not defined CLOUDFLARE_API_TOKEN (
    echo [ERROR] CLOUDFLARE_API_TOKEN is not set in .env
    pause
    exit /b 1
)
if "%PORT%"=="80" (
    echo [WARN] PORT is set to 80 in .env, which conflicts with Caddy's HTTP listener.
    echo        Update PORT=3000 in .env so Caddy can bind ports 80/443 and proxy to Node.js.
    echo.
)

echo Starting Caddy HTTPS reverse proxy for %CADDY_DOMAIN%...
echo Config: %CADDYFILE%
echo Env:    %ENV_FILE%
echo.

"%CADDY_EXE%" run --config "%CADDYFILE%" --envfile "%ENV_FILE%"
if errorlevel 1 (
    echo.
    echo Caddy exited with error code %ERRORLEVEL%.
    pause
    exit /b %ERRORLEVEL%
)
