param(
  [string]$SdkRoot = "$env:LOCALAPPDATA\Android\Sdk"
)

$ErrorActionPreference = "Stop"
$Root = Split-Path $PSScriptRoot -Parent
if ($PSScriptRoot -match "synstudios") {
  # default already set
}
$ToolsZip = Join-Path $env:TEMP "cmdline-tools.zip"
$ToolsUrl = "https://dl.google.com/android/repository/commandlinetools-win-13114758_latest.zip"

Write-Host "== SynStudios Android SDK bootstrap =="
New-Item -ItemType Directory -Force -Path $SdkRoot | Out-Null
$cmdRoot = Join-Path $SdkRoot "cmdline-tools\latest"
if (-not (Test-Path (Join-Path $cmdRoot "bin\sdkmanager.bat"))) {
  Write-Host "Downloading Android command-line tools..."
  Invoke-WebRequest -Uri $ToolsUrl -OutFile $ToolsZip -UseBasicParsing
  $extract = Join-Path $env:TEMP "android-cmdline"
  if (Test-Path $extract) { Remove-Item $extract -Recurse -Force }
  Expand-Archive $ToolsZip $extract -Force
  New-Item -ItemType Directory -Force -Path (Split-Path $cmdRoot) | Out-Null
  Move-Item (Join-Path $extract "cmdline-tools") $cmdRoot -Force
}

$sdkmanager = Join-Path $cmdRoot "bin\sdkmanager.bat"
$env:ANDROID_HOME = $SdkRoot
$env:ANDROID_SDK_ROOT = $SdkRoot

Write-Host "Installing platform-tools, build-tools, platform android-35..."
echo y | & $sdkmanager --sdk_root=$SdkRoot "platform-tools" "platforms;android-35" "build-tools;35.0.0" "platforms;android-34"

$localProps = Join-Path $Root "android\local.properties"
$sdkPath = $SdkRoot -replace '\\', '/'
Set-Content -Path $localProps -Value "sdk.dir=$sdkPath" -Encoding ASCII
Write-Host "PASS: SDK at $SdkRoot"
Write-Host "local.properties -> $localProps"
