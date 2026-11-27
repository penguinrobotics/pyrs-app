<#
.SYNOPSIS
    Downloads Caddy for Windows with the Cloudflare DNS-01 plugin bundled.

.DESCRIPTION
    Fetches a pre-built Windows amd64 Caddy binary containing
    github.com/caddy-dns/cloudflare from Caddy's official build API and saves it
    to caddy\caddy.exe.
#>

$ErrorActionPreference = 'Stop'

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$OutFile = Join-Path $ScriptDir 'caddy.exe'
$TempFile = Join-Path $ScriptDir 'caddy.exe.download'
$DownloadUrl = 'https://caddyserver.com/api/download?os=windows&arch=amd64&p=github.com%2Fcaddy-dns%2Fcloudflare'

Write-Host 'Downloading Caddy (Windows amd64) with github.com/caddy-dns/cloudflare...' -ForegroundColor Cyan
Write-Host "Source: $DownloadUrl"

try {
    Invoke-WebRequest -Uri $DownloadUrl -OutFile $TempFile -UseBasicParsing
    Move-Item -Path $TempFile -Destination $OutFile -Force
} catch {
    if (Test-Path $TempFile) {
        Remove-Item $TempFile -Force
    }
    Write-Error "Failed to download Caddy binary: $_"
    exit 1
}

Write-Host "`nInstalled Caddy to: $OutFile" -ForegroundColor Green
& $OutFile version

$modules = & $OutFile list-modules
if ($modules -match 'dns\.providers\.cloudflare') {
    Write-Host 'Verified module: dns.providers.cloudflare' -ForegroundColor Green
} else {
    Write-Warning 'dns.providers.cloudflare module was not found in the downloaded binary.'
    exit 1
}

Write-Host "`n--- Next Steps ---" -ForegroundColor Yellow
Write-Host '1. Create a Cloudflare API token for penguinrobotics.ca with Zone:Zone:Read and Zone:DNS:Edit.'
Write-Host '2. Copy .env.example to .env and set PORT=3000, CADDY_DOMAIN=*.penguinrobotics.ca, and CLOUDFLARE_API_TOKEN.'
Write-Host '3. Point app.penguinrobotics.ca to this machine''s LAN IP in your local router DNS (or a DNS-only Cloudflare A record).'
Write-Host '4. Ensure Windows Firewall allows inbound TCP ports 80 and 443 for LAN clients.'
Write-Host '5. Start Caddy with caddy\start-caddy.bat (or run pyrs-app-start.bat to launch both Node and Caddy).'
