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

Write-Host ""
Write-Host "  +------------------------------------------+"
Write-Host "  |  pixel-pal.zip built -- $sizeMB MB"
Write-Host "  +------------------------------------------+"
Write-Host ""
Write-Host "  Next steps:"
Write-Host "    1. git add ."
Write-Host "    2. git commit -m v$newVersion"
Write-Host "    3. git push"
Write-Host "    4. Go to GitHub -> Releases -> Draft a new release"
Write-Host "    5. Tag: v$newVersion"
Write-Host "    6. Upload pixel-pal.zip as a release asset"
Write-Host "    7. Publish release"
Write-Host ""
exit 0
