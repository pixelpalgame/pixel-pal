param([string]$GameDir = $PSScriptRoot)

$ProgressPreference = 'SilentlyContinue'

$vData   = Get-Content (Join-Path $GameDir "version.json") -Raw | ConvertFrom-Json
$version = $vData.version
$repo    = $vData.repo

Write-Host "  Repo    : $repo"
Write-Host "  Version : v$version"
Write-Host ""

$tokenSec = Read-Host "  GitHub token (hidden)" -AsSecureString
$token    = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($tokenSec))
$token    = $token.Trim()

$headers = @{
    Authorization = "token $token"
    Accept        = 'application/vnd.github+json'
    'User-Agent'  = 'pixel-pal'
}

$zipPath = Join-Path $GameDir "pixel-pal.zip"
if (-not (Test-Path $zipPath)) {
    Write-Host "  [!] pixel-pal.zip not found. Run MAKE_RELEASE.bat first."
    exit 1
}

Write-Host ""
Write-Host "  Creating release v$version..."
$body = @{
    tag_name   = "v$version"
    name       = "v$version"
    body       = ""
    draft      = $false
    prerelease = $false
} | ConvertTo-Json

$release = Invoke-RestMethod `
    -Uri     "https://api.github.com/repos/$repo/releases" `
    -Method  POST -Headers $headers `
    -Body    $body -ContentType 'application/json'

Write-Host "  Uploading pixel-pal.zip..."
$uploadUrl = $release.upload_url -replace '\{\?name,label\}', ''
$zipBytes  = [System.IO.File]::ReadAllBytes($zipPath)
Invoke-RestMethod `
    -Uri     "${uploadUrl}?name=pixel-pal.zip" `
    -Method  POST -Headers $headers `
    -Body    $zipBytes -ContentType 'application/zip' | Out-Null

Write-Host ""
Write-Host "  Done: $($release.html_url)"
exit 0
