param(
  [string]$SourceDir = "store-assets/output-upload",
  [string]$OutDir = "store-assets/output",
  [string]$BannerColor = "#1a73e8",
  [string]$TextColor = "#ffffff"
)

Add-Type -AssemblyName System.Drawing

function Draw-Overlay {
  param(
    [string]$BasePath,
    [string]$OutputPath,
    [string]$Label,
    [int]$Width,
    [int]$Height
  )

  if (!(Test-Path -LiteralPath $BasePath)) { Write-Host "[Skip] Not found: $BasePath" -ForegroundColor Yellow; return }

  $src = [System.Drawing.Image]::FromFile($BasePath)
  $bmp = New-Object System.Drawing.Bitmap($Width, $Height, [System.Drawing.Imaging.PixelFormat]::Format24bppRgb)
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  $g.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
  $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
  $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality

  # Fit draw
  $scale = [Math]::Min($Width / $src.Width, $Height / $src.Height)
  $newW = [int]([Math]::Round($src.Width * $scale))
  $newH = [int]([Math]::Round($src.Height * $scale))
  $offsetX = [int](($Width - $newW) / 2)
  $offsetY = [int](($Height - $newH) / 2)
  $g.DrawImage($src, [System.Drawing.Rectangle]::new($offsetX, $offsetY, $newW, $newH))

  # Banner
  $bannerColor = [System.Drawing.ColorTranslator]::FromHtml($BannerColor)
  $textColor = [System.Drawing.ColorTranslator]::FromHtml($TextColor)
  $bannerHeight = [int]([Math]::Round($Height * 0.11))
  $bannerRectF = New-Object System.Drawing.RectangleF(0, [float]($Height - $bannerHeight), [float]$Width, [float]$bannerHeight)
  $g.FillRectangle(([System.Drawing.SolidBrush]::new($bannerColor)), $bannerRectF)

  # Text
  $font = New-Object System.Drawing.Font("Arial", 28, [System.Drawing.FontStyle]::Bold)
  $sf = New-Object System.Drawing.StringFormat
  $sf.Alignment = [System.Drawing.StringAlignment]::Center
  $sf.LineAlignment = [System.Drawing.StringAlignment]::Center
  $g.DrawString($Label, $font, ([System.Drawing.SolidBrush]::new($textColor)), $bannerRectF, $sf)

  $codec = [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() | Where-Object { $_.MimeType -eq "image/png" }
  $bmp.Save($OutputPath, $codec, $null)

  $g.Dispose(); $src.Dispose(); $bmp.Dispose()
}

function Resize-Fit {
  param(
    [string]$InputPath,
    [string]$OutputPath,
    [int]$Width,
    [int]$Height
  )
  $img = [System.Drawing.Image]::FromFile($InputPath)
  $bmp = New-Object System.Drawing.Bitmap($Width, $Height, [System.Drawing.Imaging.PixelFormat]::Format24bppRgb)
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  $g.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
  $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
  $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
  $scale = [Math]::Min($Width / $img.Width, $Height / $img.Height)
  $newW = [int]([Math]::Round($img.Width * $scale))
  $newH = [int]([Math]::Round($img.Height * $scale))
  $offsetX = [int](($Width - $newW) / 2)
  $offsetY = [int](($Height - $newH) / 2)
  $g.DrawImage($img, [System.Drawing.Rectangle]::new($offsetX, $offsetY, $newW, $newH))
  $codec = [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() | Where-Object { $_.MimeType -eq "image/png" }
  $bmp.Save($OutputPath, $codec, $null)
  $g.Dispose(); $img.Dispose(); $bmp.Dispose()
}

# Define 5 localized screenshots (1280x800) and derive 640x400 copies
$files1280 = Get-ChildItem -LiteralPath $SourceDir -Filter "*-1280x800.png" | Sort-Object Name
if ($files1280.Count -lt 1) { Write-Host "[Error] No *-1280x800.png found in $SourceDir" -ForegroundColor Red; exit 1 }

$base1 = $files1280[0].Name
$base2 = if ($files1280.Count -ge 2) { $files1280[1].Name } else { $files1280[0].Name }

$sets = @(
  @{ Src = $base1; Label = "BlueLight Filter Pro — Warm Filter"; Out = "localized-1280x800-en-1.png" },
  @{ Src = $base2; Label = "BlueLight Filter Pro — Smart Dimming"; Out = "localized-1280x800-en-2.png" },
  @{ Src = $base1; Label = "护眼助手 — 暖色滤镜"; Out = "localized-1280x800-zh-1.png" },
  @{ Src = $base2; Label = "护眼助手 — 智能调暗"; Out = "localized-1280x800-zh-2.png" },
  @{ Src = $base2; Label = "护眼助手 — 日夜定时"; Out = "localized-1280x800-zh-3.png" }
)

Write-Host "Generating localized screenshots with overlays..." -ForegroundColor Cyan

foreach ($s in $sets) {
  $src1280 = Join-Path $SourceDir $s.Src
  $out1280 = Join-Path $OutDir $s.Out
  Draw-Overlay -BasePath $src1280 -OutputPath $out1280 -Label $s.Label -Width 1280 -Height 800

  $out1280Exists = Test-Path -LiteralPath $out1280
  $out640 = Join-Path $OutDir ($s.Out -replace "1280x800","640x400")

  if ($out1280Exists) {
    Resize-Fit -InputPath $out1280 -OutputPath $out640 -Width 640 -Height 400
  }
  else {
    # Fallback: directly overlay the 640x400 base if present
    $src640 = Join-Path $SourceDir ($s.Src -replace "1280x800","640x400")
    if (Test-Path -LiteralPath $src640) {
      Draw-Overlay -BasePath $src640 -OutputPath $out640 -Label $s.Label -Width 640 -Height 400
    }
    else {
      Write-Host "[Skip] Neither 1280x800 overlay nor 640x400 base available for $($s.Out)" -ForegroundColor Yellow
    }
  }

  if (Test-Path -LiteralPath $out1280) { Write-Host "[OK] $($s.Out)" -ForegroundColor Green }
  if (Test-Path -LiteralPath $out640) { Write-Host "[OK] $(Split-Path $out640 -Leaf)" -ForegroundColor Green }
}

Write-Host "Done. Check 'store-assets/output' for localized images." -ForegroundColor Cyan