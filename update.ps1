param(
    [string]$GameDir = $PSScriptRoot
)

$ErrorActionPreference = 'Stop'
$ProgressPreference    = 'SilentlyContinue'   # speeds up downloads

# ── Read local version.json ─────────────────────────────────────
$localFile = Join-Path $GameDir "version.json"
if (-not (Test-Path $localFile)) {
    Write-Host "  [!] version.json not found. Cannot check for updates."
    exit 0
}

$localData    = Get-Content $localFile -Raw | ConvertFrom-Json
$localVersion = [System.Version]$localData.version
$repo         = $localData.repo   # "owner/repo-name"

Write-Host "  Current version : v$localVersion"
Write-Host "  Repository      : $repo"
Write-Host ""

# ── Fetch remote version.json ───────────────────────────────────
$rawUrl = "https://raw.githubusercontent.com/$repo/main/version.json"
Write-Host "  Checking for updates..."

try {
    $remote        = Invoke-RestMethod -Uri $rawUrl -TimeoutSec 8
    $remoteVersion = [System.Version]$remote.version
} catch {
    Write-Host "  Could not reach update server. Check your internet connection."
    exit 0
}

if ($remoteVersion -le $localVersion) {
    Write-Host "  You are up to date! (v$localVersion)"
    exit 0
}

# ── Update available ────────────────────────────────────────────
Write-Host ""
Write-Host "  ╔══════════════════════════════════════════╗"
Write-Host ("  ║  UPDATE AVAILABLE:  v" + $localVersion + "  →  v" + $remoteVersion + "  ║")
Write-Host "  ╚══════════════════════════════════════════╝"
Write-Host ""
$ans = Read-Host "  Download and install now? [Y/N]"
if ($ans -notmatch '^[Yy]$') {
    Write-Host "  Skipped. Run UPDATE.bat any time to update."
    exit 0
}

# ── Download release zip ────────────────────────────────────────
$zipUrl  = "https://github.com/$repo/releases/latest/download/pixel-pal.zip"
$zipPath = Join-Path $GameDir "_update.zip"
$tempDir = Join-Path $GameDir "_update_temp"

Write-Host ""
Write-Host "  Downloading v$remoteVersion..."
try {
    Invoke-WebRequest -Uri $zipUrl -OutFile $zipPath
} catch {
    Write-Host "  [!] Download failed: $_"
    Write-Host "  Check your internet connection and try again."
    exit 1
}

# ── Extract ─────────────────────────────────────────────────────
Write-Host "  Extracting..."
if (Test-Path $tempDir) { Remove-Item $tempDir -Recurse -Force }
Expand-Archive -Path $zipPath -DestinationPath $tempDir -Force

# GitHub zips often wrap files in a top-level folder — unwrap if so
$children  = Get-ChildItem $tempDir
$sourceDir = if ($children.Count -eq 1 -and $children[0].PSIsContainer) {
    $children[0].FullName
} else {
    $tempDir
}

# ── Copy files — skip runtime/ and node_modules/ ────────────────
# (those are installed locally and don't change between game updates)
$skip = @('runtime', 'node_modules')

Get-ChildItem $sourceDir | Where-Object { $skip -notcontains $_.Name } | ForEach-Object {
    $dest = Join-Path $GameDir $_.Name
    if ($_.PSIsContainer) {
        Copy-Item $_.FullName $dest -Recurse -Force
    } else {
        Copy-Item $_.FullName $dest -Force
    }
}

# ── Cleanup ──────────────────────────────────────────────────────
Remove-Item $zipPath        -Force
Remove-Item $tempDir -Recurse -Force

Write-Host ""
Write-Host "  ╔══════════════════════════════════════════╗"
Write-Host "  ║   UPDATED TO v$remoteVersion — DONE!              ║"
Write-Host "  ║   Relaunch the game to play.             ║"
Write-Host "  ╚══════════════════════════════════════════╝"
Write-Host ""
exit 0
