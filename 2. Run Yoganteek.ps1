Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$projectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$frontendDir = Join-Path $projectRoot 'frontend'
$indexFile = Join-Path $frontendDir 'index.html'

if (-not (Test-Path $indexFile)) {
    throw "Could not find frontend/index.html in $projectRoot"
}

$python = Get-Command python -ErrorAction SilentlyContinue
if ($null -ne $python) {
    $port = 8000
    Start-Process -FilePath $python.Source -ArgumentList @('-m', 'http.server', $port) -WorkingDirectory $frontendDir | Out-Null
    Start-Sleep -Milliseconds 700
    Start-Process "http://localhost:$port/index.html" | Out-Null
    return
}

Start-Process $indexFile