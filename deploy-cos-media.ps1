# ============================================================================
# deploy-cos-media.ps1
# Sync local HLS media (public/assets/videos/) -> Tencent COS media bucket.
#
# Requirements:
#   - coscli installed & configured LOCALLY by you (you enter your own
#     SecretId/SecretKey directly in YOUR terminal - never share them).
#     See COSCLI_SETUP_GUIDE.md for the official Tencent setup flow.
#
# Config (optional, gitignored file deploy-cos-config.env, NO secrets):
#   COS_BUCKET=jazimprofile-media
#   COS_REGION=ap-guangzhou
#   COS_ALIAS=jazim-media
# Values can also be provided via environment variables.
#
# Usage:
#   powershell -NoProfile -ExecutionPolicy Bypass -File deploy-cos-media.ps1
#   or: npm run cos:media
#
# IMPORTANT: does NOT use --delete by default, to avoid accidentally
# removing cloud media that is not present locally.
# ============================================================================
$ErrorActionPreference = 'Stop'

# --- Load config (gitignored, public values only) --------------------------
# 注意：本机 PowerShell 环境变量名区分大小写，因此脚本变量必须与
# deploy-cos-config.env 中的键名（COS_BUCKET / COS_REGION / COSCLI_PATH）完全一致。
$configFile = Join-Path $PSScriptRoot 'deploy-cos-config.env'
$COS_BUCKET = $env:COS_BUCKET
$COS_REGION = $env:COS_REGION
$COSCLI_PATH = $env:COSCLI_PATH
if (Test-Path $configFile) {
  foreach ($line in (Get-Content $configFile)) {
    $m = [regex]::Match($line, '^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.+?)\s*$')
    if ($m.Success) {
      Set-Variable -Name $m.Groups[1].Value -Value $m.Groups[2].Value
    }
  }
}
if (-not $COS_BUCKET) { $COS_BUCKET = 'jazimprofile-media' }   # example default
if (-not $COS_REGION) { $COS_REGION = 'ap-guangzhou' }         # example default

# --- coscli check -----------------------------------------------------------
# 支持两种方式：COSCLI_PATH（config/env 里填 coscli.exe 完整路径）或 PATH 中的 coscli
$coscliExe = $null
if ($COSCLI_PATH -and (Test-Path $COSCLI_PATH)) {
  $coscliExe = $COSCLI_PATH
} else {
  $cmd = Get-Command coscli -ErrorAction SilentlyContinue
  if ($cmd) { $coscliExe = $cmd.Source }
}
if (-not $coscliExe) {
  Write-Host 'COS AUTH REQUIRED' -ForegroundColor Red
  Write-Host 'coscli not found.'
  Write-Host '  1) Install Tencent COSCLI (official docs -> COSCLI_SETUP_GUIDE.md).'
  Write-Host '  2) Either add coscli to PATH, or set COSCLI_PATH in deploy-cos-config.env:'
  Write-Host '     COSCLI_PATH=C:\path\to\coscli.exe'
  Write-Host '  3) Run in YOUR terminal:  coscli config'
  Write-Host '     (enter your SecretId/SecretKey yourself - do NOT share with anyone)'
  exit 1
}

# --- Pre-flight: verify credentials (non-destructive list) -------------------
Write-Host "[pre-flight] verifying COS auth (coscli ls cos://$COS_BUCKET/) ..."
& $coscliExe ls "cos://$COS_BUCKET/" 2>$null | Out-Null
if ($LASTEXITCODE -ne 0) {
  Write-Host "COS AUTH REQUIRED - coscli cannot list cos://$COS_BUCKET/" -ForegroundColor Red
  Write-Host 'Check your coscli config (run: coscli config show). Bucket:'
  Write-Host "  bucket=$COS_BUCKET"
  Write-Host 'If needed, set correct values in deploy-cos-config.env (no secrets) and re-run.'
  exit 1
}
Write-Host '[pre-flight] COS auth OK' -ForegroundColor Green

# --- Sync -------------------------------------------------------------------
$src = Join-Path $PSScriptRoot 'public\assets\videos'
if (-not (Test-Path $src)) {
  Write-Host "Source not found: $src" -ForegroundColor Red
  exit 1
}

# coscli 会把「源目录名」追加到目标路径末尾：源 public\assets\videos + 目标 cos://.../assets/
# => cos://.../assets/videos/<project>/...（恰好得到期望的 assets/videos/ 结构）。
# 若目标写成 .../assets/videos/ 会多套一层 videos/videos。不用 --delete（避免误删云端媒体）。
$target = "cos://$COS_BUCKET/assets/"
Write-Host ''
Write-Host 'Syncing HLS media:'
Write-Host "  from: $src"
Write-Host "  to  : $target  (-> assets/videos/<project>/...)"
Write-Host '  (keeps relative structure ; no --delete)'

& $coscliExe sync $src $target --recursive
if ($LASTEXITCODE -ne 0) {
  Write-Host "coscli sync failed (exit $LASTEXITCODE). Check credentials / region." -ForegroundColor Red
  exit $LASTEXITCODE
}

Write-Host ''
Write-Host 'Sync done.' -ForegroundColor Green
Write-Host '  Next:'
Write-Host '    1) npm run verify:media          -> check m3u8/ts reachability'
Write-Host '    2) Check MIME: .m3u8 = application/vnd.apple.mpegurl ; .ts = video/mp2t'
Write-Host '    3) Check CORS allows https://jazimportfolio.com and https://www.jazimportfolio.com'
Write-Host '    4) Check custom domain + HTTPS for media.jazimportfolio.com'
