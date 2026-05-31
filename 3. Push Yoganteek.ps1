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

git -C $projectRoot add -A | Out-Null
git -C $projectRoot diff --cached --quiet
$hasStagedChanges = $LASTEXITCODE -ne 0

if ($hasStagedChanges) {
    Write-Host 'Committing staged changes...'
    git -C $projectRoot commit -m 'Update Yoganteek site'
} else {
    Write-Host 'No changes to commit.'
}

Write-Host "Pushing to origin/$branch..."
git -C $projectRoot push -u origin $branch