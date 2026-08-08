param(
  [switch]$SkipWebBuild
)

$ErrorActionPreference = "Stop"
$Root = Split-Path $PSScriptRoot -Parent
Set-Location $Root

$env:Path = "C:\Program Files\nodejs;" + $env:Path
$npm = "C:\Program Files\nodejs\npm.cmd"
if (-not (Test-Path $npm)) { $npm = "npm" }

function Invoke-Npm([string[]]$Args) {
  Write-Host "> npm $($Args -join ' ')"
  & $npm @Args
  if ($LASTEXITCODE -ne 0) { throw "npm failed" }
}

if (-not (Test-Path "out\index.html")) {
  Write-Host "== Static export =="
  Invoke-Npm @("run", "build:mobile")
}

if (-not (Test-Path "out\index.html")) {
  throw "out/index.html missing after build:mobile"
}

if (-not (Test-Path "android\gradlew.bat")) {
  Write-Host "== Adding Capacitor Android project =="
  Invoke-Npm @("exec", "--", "cap", "add", "android")
}

Write-Host "== Capacitor sync =="
Invoke-Npm @("exec", "--", "cap", "sync", "android")

$sdkPaths = @(
  (Join-Path $Root ".tools\android-sdk"),
  "$env:LOCALAPPDATA\Android\Sdk",
  "C:\Users\thewi\AppData\Local\Android\Sdk"
)
$sdk = $null
foreach ($p in $sdkPaths) {
  if (Test-Path $p) { $sdk = $p; break }
}
if ($sdk) {
  $env:ANDROID_HOME = $sdk
  $env:ANDROID_SDK_ROOT = $sdk
  $sdkPath = $sdk -replace '\\', '/'
  Set-Content -Path (Join-Path $Root "android\local.properties") -Value "sdk.dir=$sdkPath" -Encoding ASCII
  Write-Host "ANDROID_HOME=$sdk"
} else {
  throw "Android SDK not found. Run: powershell -File scripts/setup-local-toolchain.ps1"
}

$localJdk = Join-Path $Root ".tools\jdk-21"
if (Test-Path (Join-Path $localJdk "bin\java.exe")) {
  $env:JAVA_HOME = $localJdk
  $env:Path = "$localJdk\bin;" + $env:Path
  Write-Host "JAVA_HOME=$localJdk"
}

$gradlew = Join-Path $Root "android\gradlew.bat"
if (-not (Test-Path $gradlew)) { throw "android/gradlew.bat missing" }

Set-Location (Join-Path $Root "android")
Write-Host "== assembleDebug (APK) =="
& .\gradlew.bat assembleDebug
if ($LASTEXITCODE -ne 0) { throw "assembleDebug failed" }

$apk = Join-Path $Root "android\app\build\outputs\apk\debug\app-debug.apk"
if (Test-Path $apk) {
  $dest = Join-Path $Root "dist\synstudios-debug.apk"
  New-Item -ItemType Directory -Path (Split-Path $dest) -Force | Out-Null
  Copy-Item $apk $dest -Force
  Write-Host ""
  Write-Host "PASS: APK at $dest"
  Write-Host "Install: adb install -r `"$dest`""
} else {
  throw "APK not found at $apk"
}
