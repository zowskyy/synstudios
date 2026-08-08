param(
  [switch]$SkipSdk
)

$ErrorActionPreference = "Stop"
$Root = Split-Path $PSScriptRoot -Parent
$Tools = Join-Path $Root ".tools"
$JdkDir = Join-Path $Tools "jdk-21"
$SdkRoot = Join-Path $Tools "android-sdk"

New-Item -ItemType Directory -Force -Path $Tools | Out-Null

if (-not (Test-Path (Join-Path $JdkDir "bin\java.exe"))) {
  Write-Host "Downloading Temurin JDK 21..."
  $jdkZip = Join-Path $env:TEMP "jdk21.zip"
  $jdkUrl = "https://github.com/adoptium/temurin21-binaries/releases/download/jdk-21.0.6%2B7/OpenJDK21U-jdk_x64_windows_hotspot_21.0.6_7.zip"
  Invoke-WebRequest -Uri $jdkUrl -OutFile $jdkZip -UseBasicParsing
  Expand-Archive $jdkZip (Join-Path $Tools "jdk-extract") -Force
  $extracted = Get-ChildItem (Join-Path $Tools "jdk-extract") -Directory | Select-Object -First 1
  if (Test-Path $JdkDir) { Remove-Item $JdkDir -Recurse -Force }
  Move-Item $extracted.FullName $JdkDir
  Remove-Item (Join-Path $Tools "jdk-extract") -Recurse -Force -ErrorAction SilentlyContinue
}

$env:JAVA_HOME = $JdkDir
$env:Path = "$JdkDir\bin;" + $env:Path
Write-Host "JAVA_HOME=$JdkDir"
& java -version

if (-not $SkipSdk) {
  & (Join-Path $PSScriptRoot "setup-android-sdk.ps1") -SdkRoot $SdkRoot
}

Write-Host "PASS: local toolchain ready"
