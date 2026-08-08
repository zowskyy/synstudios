param(
  [switch]$SkipBuild
)

$ErrorActionPreference = "Stop"
$Root = Split-Path $PSScriptRoot -Parent
Set-Location $Root

$npm = Get-Command npm -ErrorAction SilentlyContinue
if (-not $npm) {
  $npmPath = "C:\Program Files\nodejs\npm.cmd"
  if (-not (Test-Path $npmPath)) { throw "npm not found. Install Node.js LTS." }
  $npm = $npmPath
}

function Invoke-Npm([string[]]$Args) {
  & $npm @Args
  if ($LASTEXITCODE -ne 0) { throw "npm failed: $($Args -join ' ')" }
}

if (-not $SkipBuild) {
  Write-Host "== W2 BuildCore: static export =="
  Invoke-Npm @("run", "build:mobile")
  Write-Host "== Capacitor sync =="
  Invoke-Npm @("run", "cap:sync")
}

$keystoreProps = Join-Path $Root "android\keystore.properties"
if (-not (Test-Path $keystoreProps)) {
  Write-Host ""
  Write-Host "WARN: android/keystore.properties not found."
  Write-Host "Copy android/keystore.properties.example and create release keystore first."
  Write-Host "Building unsigned bundle for validation only..."
}

$gradlew = Join-Path $Root "android\gradlew.bat"
if (-not (Test-Path $gradlew)) {
  throw "android/gradlew.bat missing — run: npx cap add android && npx cap sync"
}

Set-Location (Join-Path $Root "android")
& .\gradlew.bat bundleRelease
if ($LASTEXITCODE -ne 0) { throw "Gradle bundleRelease failed" }

$aab = Join-Path $Root "android\app\build\outputs\bundle\release\app-release.aab"
if (Test-Path $aab) {
  $dest = Join-Path $Root "dist\synstudios-release.aab"
  New-Item -ItemType Directory -Path (Split-Path $dest) -Force | Out-Null
  Copy-Item $aab $dest -Force
  Write-Host ""
  Write-Host "PASS: AAB ready at $dest"
} else {
  throw "AAB not found at expected path"
}
