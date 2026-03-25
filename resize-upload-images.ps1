param(
  [string]$InputDir = "要上传的截图图片",
  [string]$OutDir = "store-assets/output-upload",
  [string]$Background = "#000000"
)

Add-Type -AssemblyName System.Drawing

function Resize-ImageFit {
  param(
    [string]$InputPath,
    [string]$OutputPath,
    [int]$Width,
    [int]$Height,
    [string]$BgColorHex = "#000000"
  )

  if (!(Test-Path -LiteralPath $InputPath)) {
    Write-Host "[Skip] Source not found: $InputPath" -ForegroundColor Yellow
    return
  }

  $img = [System.Drawing.Image]::FromFile($InputPath)
  $canvas = New-Object System.Drawing.Bitmap($Width, $Height, [System.Drawing.Imaging.PixelFormat]::Format24bppRgb)
  $g = [System.Drawing.Graphics]::FromImage($canvas)

  $bg = [System.Drawing.ColorTranslator]::FromHtml($BgColorHex)
  $g.Clear($bg)
  $g.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
  $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
  $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality

  $scale = [Math]::Min($Width / $img.Width, $Height / $img.Height)
  $newW = [int]([Math]::Round($img.Width * $scale))
  $newH = [int]([Math]::Round($img.Height * $scale))
  $offsetX = [int](($Width - $newW) / 2)
  $offsetY = [int](($Height - $newH) / 2)
  $rect = New-Object System.Drawing.Rectangle($offsetX, $offsetY, $newW, $newH)
  $g.DrawImage($img, $rect)

  $codec = [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() | Where-Object { $_.MimeType -eq "image/png" }
  $canvas.Save($OutputPath, $codec, $null)

  $g.Dispose(); $img.Dispose(); $canvas.Dispose()
}

if (!(Test-Path -LiteralPath $OutDir)) { New-Item -ItemType Directory -Path $OutDir -Force | Out-Null }

# Use -LiteralPath to safely handle non-ASCII folder names
$files = Get-ChildItem -LiteralPath $InputDir -File -Recurse | Where-Object { $_.Extension -in ('.png', '.jpg', '.jpeg') }
if ($files.Count -eq 0) { Write-Host "No images found in '$InputDir'" -ForegroundColor Yellow; exit 0 }

Write-Host "Processing $($files.Count) image(s) from '$InputDir' into '$OutDir'..." -ForegroundColor Cyan

foreach ($f in $files) {
  $base = [System.IO.Path]::GetFileNameWithoutExtension($f.Name)
  $srcPath = $f.FullName

  Resize-ImageFit -InputPath $srcPath -OutputPath (Join-Path $OutDir ("${base}-1280x800.png")) -Width 1280 -Height 800 -BgColorHex $Background
  Resize-ImageFit -InputPath $srcPath -OutputPath (Join-Path $OutDir ("${base}-640x400.png"))  -Width 640  -Height 400 -BgColorHex $Background
  Resize-ImageFit -InputPath $srcPath -OutputPath (Join-Path $OutDir ("${base}-440x280.png"))  -Width 440  -Height 280 -BgColorHex $Background
  Resize-ImageFit -InputPath $srcPath -OutputPath (Join-Path $OutDir ("${base}-1400x560.png")) -Width 1400 -Height 560 -BgColorHex $Background

  Write-Host "[OK] $($f.Name) -> ${base}-{1280x800,640x400,440x280,1400x560}.png" -ForegroundColor Green
}

Write-Host "Done. Review output in '$OutDir' for upload." -ForegroundColor Cyan