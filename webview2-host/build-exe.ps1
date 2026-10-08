# Builds the standalone Windows .exe (FMB-Diff-Merge-Checker.exe) + bundled Node.js server & frontend
# Does NOT require GitHub access or downloading Electron/Chromium binaries.

$ErrorActionPreference = "Stop"

Write-Host "1/3 Building frontend assets (dist/)..."
npm run build

Write-Host "2/3 Bundling local Node.js server (server.js)..."
npm run build:server

Write-Host "3/3 Building Windows WebView2 Desktop Host (.exe)..."
dotnet publish ./webview2-host/FmbDiffMergeHost.csproj -c Release -r win-x64 --self-contained false -o ./release

Copy-Item -Path ./server.js -Destination ./release/server.js -Force
if (Test-Path ./release/dist) { Remove-Item ./release/dist -Recurse -Force }
Copy-Item -Path ./dist -Destination ./release/dist -Recurse -Force

Write-Host "Build complete: ./release/FMB-Diff-Merge-Checker.exe"
