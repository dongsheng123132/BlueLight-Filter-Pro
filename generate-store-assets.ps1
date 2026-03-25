param(
  [string]$OutDir = "store-assets/output",
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

  if (!(Test-Path $InputPath)) {
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

  # Save as PNG without alpha (24bpp)
  $codec = [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() | Where-Object { $_.MimeType -eq "image/png" }
  $canvas.Save($OutputPath, $codec, $null)

  $g.Dispose(); $img.Dispose(); $canvas.Dispose()
}

# Ensure output directory
if (!(Test-Path $OutDir)) { New-Item -ItemType Directory -Path $OutDir -Force | Out-Null }

# Source images (choose best available)
$src1 = "screenshot_google_dark.png"   # good for global
$src2 = "screenshot1.png"
$src3 = "screenshot2.png"
$src4 = "screenshot3.png"

# Size definitions per Chrome Web Store requirements
$jobs = @(
  @{ Name = "localized-1280x800-1"; Src = $src4; W = 1280; H = 800 },
  @{ Name = "localized-640x400-1";  Src = $src4; W = 640;  H = 400 },
  @{ Name = "global-1280x800-1";    Src = $src1; W = 1280; H = 800 },
  @{ Name = "global-640x400-1";     Src = $src1; W = 640;  H = 400 },
  @{ Name = "global-1280x800-2";    Src = $src2; W = 1280; H = 800 },
  @{ Name = "global-640x400-2";     Src = $src2; W = 640;  H = 400 },
  @{ Name = "promo-small-440x280";  Src = $src1; W = 440;  H = 280 },
  @{ Name = "promo-marquee-1400x560"; Src = $src2; W = 1400; H = 560 }
)

Write-Host "Generating store assets into '$OutDir'..." -ForegroundColor Cyan

foreach ($job in $jobs) {
  $srcPath = Join-Path -Path (Get-Location) -ChildPath $job.Src
  $outPath = Join-Path -Path (Get-Location) -ChildPath (Join-Path $OutDir ("$($job.Name).png"))
  Resize-ImageFit -InputPath $srcPath -OutputPath $outPath -Width $job.W -Height $job.H -BgColorHex $Background
  if (Test-Path $outPath) {
    Write-Host "[OK] $($job.Name) -> $outPath" -ForegroundColor Green
  }
}

Write-Host "Done. Review 'store-assets/output' and upload required files to the Chrome Web Store." -ForegroundColor Cyan