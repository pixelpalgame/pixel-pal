param([string]$GameDir)

Add-Type -AssemblyName System.Drawing

$iconPng  = Join-Path $GameDir 'GAME IMAGES\TRANSPARENTICON.png'
$iconIco  = Join-Path $GameDir 'GAME IMAGES\GAMEICON.ico'
$launcher = Join-Path $GameDir 'launcher.vbs'
$desktop  = [Environment]::GetFolderPath('Desktop')
$lnkPath  = Join-Path $desktop 'Pixel Pal.lnk'

# Convert PNG -> ICO (PNG-in-ICO format, supported on Windows Vista+)
try {
    $bmp     = New-Object System.Drawing.Bitmap($iconPng)
    $resized = New-Object System.Drawing.Bitmap($bmp, 256, 256)

    # Save resized bitmap as PNG bytes in memory
    $ms = New-Object System.IO.MemoryStream
    $resized.Save($ms, [System.Drawing.Imaging.ImageFormat]::Png)
    $pngBytes = $ms.ToArray()
    $ms.Close()
    $resized.Dispose()
    $bmp.Dispose()

    # Write ICO file manually
    # Format: ICONDIR (6 bytes) + ICONDIRENTRY (16 bytes) + PNG data
    $fs     = [System.IO.File]::Open($iconIco, [System.IO.FileMode]::Create)
    $writer = New-Object System.IO.BinaryWriter($fs)

    # ICONDIR header
    $writer.Write([uint16]0)   # reserved
    $writer.Write([uint16]1)   # type = 1 (ICO)
    $writer.Write([uint16]1)   # image count = 1

    # ICONDIRENTRY (16 bytes)
    $writer.Write([byte]0)     # width  — 0 means 256
    $writer.Write([byte]0)     # height — 0 means 256
    $writer.Write([byte]0)     # color count
    $writer.Write([byte]0)     # reserved
    $writer.Write([uint16]1)   # planes
    $writer.Write([uint16]32)  # bit count
    $writer.Write([uint32]$pngBytes.Length)  # size of image data
    $writer.Write([uint32]22)  # offset to image data (6 + 16 = 22)

    # Embed PNG bytes
    $writer.Write($pngBytes)
    $writer.Close()
    $fs.Close()

    Write-Host '  [OK] Icon converted.'
} catch {
    Write-Host "  [!] Icon conversion failed: $_"
}

# Create desktop shortcut
try {
    $ws = New-Object -ComObject WScript.Shell
    $sc = $ws.CreateShortcut($lnkPath)
    $sc.TargetPath       = $launcher
    $sc.WorkingDirectory = $GameDir
    $sc.WindowStyle      = 1
    if (Test-Path $iconIco) { $sc.IconLocation = "$iconIco,0" }
    $sc.Description      = 'Launch Pixel Pal'
    $sc.Save()
    Write-Host '  [OK] Desktop shortcut created.'
} catch {
    Write-Host "  [!] Shortcut creation failed: $_"
}
