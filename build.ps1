# Define Source and Destination Paths
$sourceDir = $PSScriptRoot
$destinationDir = Join-Path -Path $sourceDir -ChildPath "uploadtochrome"

# Define Files and Folders to Copy
$itemsToCopy = @(
    "manifest.json",
    "popup.html",
    "popup.js",
    "content.js",
    "background.js",
    "translations.js",
    "utils.js",
    "options.html",
    "options.js",
    "options.css",
    "_locales",
    "images"
    # Add any other essential files or folders here
)

# Remove Destination Directory if it Exists (for a clean build)
if (Test-Path $destinationDir) {
    Write-Host "Removing existing destination directory: $destinationDir"
    Remove-Item -Recurse -Force $destinationDir
}

# Create Destination Directory
Write-Host "Creating destination directory: $destinationDir"
New-Item -ItemType Directory -Force -Path $destinationDir

# Copy Items
Write-Host "Copying items from $sourceDir to $destinationDir"
foreach ($item in $itemsToCopy) {
    $sourceItemPath = Join-Path -Path $sourceDir -ChildPath $item
    $destinationItemPath = Join-Path -Path $destinationDir -ChildPath $item
    if (Test-Path $sourceItemPath) {
        Write-Host "Copying $item..."
        Copy-Item -Path $sourceItemPath -Destination $destinationItemPath -Recurse -Force
    } else {
        Write-Warning "Source item not found and will be skipped: $sourceItemPath"
    }
}

Write-Host "Build process completed!"
Write-Host "Files copied to: $destinationDir"