Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$projectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path

if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
    throw 'Git is not installed or not available in PATH.'
}

$branch = git -C $projectRoot branch --show-current
if ([string]::IsNullOrWhiteSpace($branch)) {
    throw 'Could not determine the current branch.'
}

Write-Host "Pulling latest changes from origin/$branch..."
git -C $projectRoot pull --ff-only origin $branch
