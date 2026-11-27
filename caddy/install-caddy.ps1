<#
.SYNOPSIS
    Downloads Caddy for Windows with the Namecheap DNS-01 plugin bundled.

.DESCRIPTION
    Fetches a pre-built Windows amd64 Caddy binary containing
    github.com/caddy-dns/namecheap from Caddy's official build API and saves it
    to caddy\caddy.exe. Also prints your current public IPv4 address so you can
    whitelist it in Namecheap's API Access settings.
#>

$ErrorActionPreference = 'Stop'

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$OutFile = Join-Path $ScriptDir 'caddy.exe'
$TempFile = Join-Path $ScriptDir 'caddy.exe.download'
$DownloadUrl = 'https://caddyserver.com/api/download?os=windows&arch=amd64&p=github.com%2Fcaddy-dns%2Fnamecheap'

Write-Host 'Downloading Caddy (Windows amd64) with github.com/caddy-dns/namecheap...' -ForegroundColor Cyan
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
if ($modules -match 'dns\.providers\.namecheap') {
    Write-Host 'Verified module: dns.providers.namecheap' -ForegroundColor Green
} else {
    Write-Warning 'dns.providers.namecheap module was not found in the downloaded binary.'
    exit 1
}

Write-Host "`n--- Next Steps ---" -ForegroundColor Yellow
try {
    $publicIp = (Invoke-RestMethod -Uri 'https://api.ipify.org' -TimeoutSec 5).Trim()
    Write-Host "1. Whitelist your public IPv4 in Namecheap (Profile -> Tools -> Namecheap API Access): $publicIp"
} catch {
    Write-Host '1. Whitelist your public IPv4 in Namecheap (Profile -> Tools -> Namecheap API Access).'
}
Write-Host '2. Copy .env.example to .env and set PORT=3000, CADDY_DOMAIN, NAMECHEAP_API_USER, and NAMECHEAP_API_KEY.'
Write-Host '3. Ensure Windows Firewall allows inbound TCP ports 80 and 443 for LAN clients.'
Write-Host '4. Start Caddy with caddy\start-caddy.bat (or run pyrs-app-start.bat to launch both Node and Caddy).'
