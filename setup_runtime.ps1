param([string]$GameDir)

$runtimeDir = Join-Path $GameDir 'runtime'
$nodeExe    = Join-Path $runtimeDir 'node.exe'

if (Test-Path $nodeExe) {
    Write-Host '  [OK] Runtime already present — skipping download.'
    exit 0
}

Write-Host '  [..] Downloading Node.js runtime (first time only)...'
New-Item -ItemType Directory -Path $runtimeDir -Force | Out-Null

try {
    # Fetch latest LTS version number
    $index = Invoke-WebRequest -Uri 'https://nodejs.org/dist/index.json' -UseBasicParsing | ConvertFrom-Json
    $lts   = $index | Where-Object { $_.lts -ne $false } | Select-Object -First 1
    $ver   = $lts.version

    Write-Host "  [..] Fetching Node.js $ver for Windows..."

    $url         = "https://nodejs.org/dist/$ver/node-$ver-win-x64.zip"
    $zipPath     = Join-Path $env:TEMP 'nodejs_portable.zip'
    $extractPath = Join-Path $env:TEMP 'nodejs_extracted'

    Invoke-WebRequest -Uri $url -OutFile $zipPath -UseBasicParsing

    Write-Host '  [..] Extracting...'

    if (Test-Path $extractPath) { Remove-Item $extractPath -Recurse -Force }
    Expand-Archive -Path $zipPath -DestinationPath $extractPath -Force

    $srcFolder = Get-ChildItem $extractPath -Directory | Select-Object -First 1
    Copy-Item -Path "$($srcFolder.FullName)\*" -Destination $runtimeDir -Recurse -Force

    Remove-Item $zipPath     -Force -ErrorAction SilentlyContinue
    Remove-Item $extractPath -Recurse -Force -ErrorAction SilentlyContinue

    Write-Host '  [OK] Node.js runtime ready.'
} catch {
    Write-Host "  [!] Download failed: $_"
    Write-Host '  [!] Check your internet connection and try again.'
    exit 1
}
