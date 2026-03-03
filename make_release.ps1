param(
    [string]$GameDir = $PSScriptRoot
)

$ProgressPreference = 'SilentlyContinue'

# ── Read current version ──────────────────────────────────────────
$versionFile = Join-Path $GameDir "version.json"
$data        = Get-Content $versionFile -Raw | ConvertFrom-Json
$current     = [System.Version]$data.version

Write-Host "  Current version: v$current"
Write-Host ""
Write-Host "  Enter new version number (e.g. 1.1.0) or press Enter to keep v$current :"
$newInput = (Read-Host "  Version").Trim()

if ($newInput -eq '') {
    $newVersion = $current
} else {
    try { $newVersion = [System.Version]$newInput }
    catch { Write-Host "  [!] Invalid version format."; exit 1 }
    if ($newVersion -le $current) {
        Write-Host "  [!] New version must be greater than v$current."
        exit 1
    }
    $data.version = $newVersion.ToString()
    $data | ConvertTo-Json | Set-Content $versionFile -Encoding UTF8
    Write-Host "  version.json updated to v$newVersion"
}

# ── Build the zip ─────────────────────────────────────────────────
$zipPath = Join-Path $GameDir "pixel-pal.zip"
if (Test-Path $zipPath) { Remove-Item $zipPath -Force }

$skip = @(
    'runtime', 'node_modules',
    'pixel-pal.zip', '_update.zip', '_update_temp',
    '.git', 'MAKE_RELEASE.bat', 'make_release.ps1'
)

Write-Host ""
Write-Host "  Building pixel-pal.zip..."

Add-Type -Assembly 'System.IO.Compression.FileSystem'
$zip = [System.IO.Compression.ZipFile]::Open($zipPath, 'Create')

function Add-ToZip($zip, $sourcePath, $entryName) {
    if ((Get-Item $sourcePath).PSIsContainer) {
        Get-ChildItem $sourcePath -Recurse | Where-Object { -not $_.PSIsContainer } | ForEach-Object {
            $rel = $_.FullName.Substring($sourcePath.Length + 1).Replace('\', '/')
            [System.IO.Compression.ZipFileExtensions]::CreateEntryFromFile(
                $zip, $_.FullName, "$entryName/$rel", 'Optimal') | Out-Null
        }
    } else {
        [System.IO.Compression.ZipFileExtensions]::CreateEntryFromFile(
            $zip, $sourcePath, $entryName, 'Optimal') | Out-Null
    }
}

Get-ChildItem $GameDir | Where-Object { $skip -notcontains $_.Name } | ForEach-Object {
    Write-Host "    + $($_.Name)"
    Add-ToZip $zip $_.FullName $_.Name
}

$zip.Dispose()

$sizeMB = [math]::Round((Get-Item $zipPath).Length / 1MB, 1)
Write-Host "  pixel-pal.zip built ($sizeMB MB)"

# ── Push to GitHub ────────────────────────────────────────────────
Write-Host ""
Write-Host "  Pushing to GitHub..."
Set-Location $GameDir
& git add . 2>&1 | Out-Null
& git commit -m "v$newVersion" 2>&1 | Out-Null
& git push 2>&1 | Out-Null
if ($LASTEXITCODE -ne 0) {
    Write-Host "  [!] Git push failed. Check your internet connection."
    exit 1
}
Write-Host "  Pushed."

Write-Host ""
Write-Host "  +------------------------------------------+"
Write-Host "  |  v$newVersion ready!"
Write-Host "  |  Now run PUBLISH_RELEASE.bat to go live. |"
Write-Host "  +------------------------------------------+"
Write-Host ""
exit 0
