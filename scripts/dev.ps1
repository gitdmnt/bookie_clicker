$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $PSScriptRoot
$frontendDir = Join-Path $root "frontend"
$backendDir = Join-Path $root "apps\backend-web"

Start-Process -FilePath "powershell" -ArgumentList "-NoExit", "-Command", "cd `"$frontendDir`"; bun dev" -WorkingDirectory $frontendDir
Start-Process -FilePath "powershell" -ArgumentList "-NoExit", "-Command", "cd `"$backendDir`"; wrangler dev" -WorkingDirectory $backendDir

Write-Host "Started frontend (Vite) and backend (Wrangler) in separate windows."