$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $PSScriptRoot
$source = Join-Path $root "scripts\TiltOverlayLauncher.ps1"
$dist = Join-Path $root "dist"
$target = Join-Path $dist "MalangYeondooOverlay.exe"

New-Item -ItemType Directory -Force -Path $dist | Out-Null

if (-not (Get-Command Invoke-PS2EXE -ErrorAction SilentlyContinue)) {
  Install-Module ps2exe -Scope CurrentUser -Force
}

Invoke-PS2EXE `
  -InputFile $source `
  -OutputFile $target `
  -NoConsole `
  -Title "Malang Yeondoo Overlay" `
  -Description "LoL game tilt counter overlay for Malang and Yeondoo" `
  -Company "Malang Yeondoo Bot Lab" `
  -Product "Malang Yeondoo Overlay" `
  -Version "0.3.0"

Write-Host "Built $target"
