#Requires -Version 5.1
param(
  [int]$PortRoot = 5501,
  [int]$PortUpload = 8081
)

Write-Host "Starting local servers for preview..." -ForegroundColor Cyan

# Check Node & npx
$node = (Get-Command node -ErrorAction SilentlyContinue)
$npx = (Get-Command npx -ErrorAction SilentlyContinue)
if (-not $node -or -not $npx) {
  Write-Error "Node.js 或 npx 未安装。请安装 Node.js 22.12+ 后重试。"
  exit 1
}

# Ensure directories
$root = "$PSScriptRoot"
$uploadDir = Join-Path $root 'uploadtochrome'
if (-not (Test-Path $uploadDir)) {
  Write-Error "未找到 uploadtochrome/ 目录，请先运行 build.ps1。"
  exit 1
}

# Start http-server for project root
Start-Process -NoNewWindow -FilePath "npx" -ArgumentList "http-server", "-p", "$PortRoot", "." | Out-Null
Start-Sleep -Milliseconds 600
Write-Host "Root server: http://127.0.0.1:$PortRoot/" -ForegroundColor Green
Write-Host "Popup preview: http://127.0.0.1:$PortRoot/uploadtochrome/popup.html" -ForegroundColor Green

# Start http-server for output-upload (assets quick browse)
$assetsDir = Join-Path $root 'store-assets/output-upload'
if (Test-Path $assetsDir) {
  Start-Process -NoNewWindow -FilePath "npx" -ArgumentList "http-server", "-p", "$PortUpload", "-c-1" | Out-Null
  Start-Sleep -Milliseconds 600
  Write-Host "Assets server: http://127.0.0.1:$PortUpload/store-assets/output-upload/" -ForegroundColor Green
}
else {
  Write-Warning "未找到 store-assets/output-upload/ 目录，跳过第二个服务器。"
}

Write-Host "Servers started. Use MCP to navigate and take screenshots." -ForegroundColor Cyan