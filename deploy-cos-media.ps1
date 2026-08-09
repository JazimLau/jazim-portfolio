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
$configFile = Join-Path $PSScriptRoot 'deploy-cos-config.env'
$bucket = $env:COS_BUCKET
$region = $env:COS_REGION
if (Test-Path $configFile) {
  Get-Content $configFile | ForEach-Object {
    if ($_ -match '^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.+?)\s*$') {
      Set-Variable -Name $matches[1] -Value $matches[2]
    }
  }
}
if (-not $bucket) { $bucket = 'jazimprofile-media' }   # example default
if (-not $region) { $region = 'ap-guangzhou' }          # example default

# --- coscli check -----------------------------------------------------------
$coscli = Get-Command coscli -ErrorAction SilentlyContinue
if (-not $coscli) {
  Write-Host 'COS AUTH REQUIRED' -ForegroundColor Red
  Write-Host 'coscli is not installed or not on PATH.'
  Write-Host '  1) Install Tencent COSCLI (official docs -> COSCLI_SETUP_GUIDE.md).'
  Write-Host '  2) Run in YOUR terminal:  coscli config'
  Write-Host '     (enter your SecretId/SecretKey yourself - do NOT share with anyone)'
  exit 1
}

# --- Pre-flight: verify credentials (non-destructive list) -------------------
Write-Host "[pre-flight] verifying COS auth (coscli ls cos://$bucket/) ..."
& coscli ls "cos://$bucket/" 2>$null | Out-Null
if ($LASTEXITCODE -ne 0) {
  Write-Host "COS AUTH REQUIRED - coscli cannot list cos://$bucket/" -ForegroundColor Red
  Write-Host 'Check your coscli config (run: coscli config show). Region/bucket:'
  Write-Host "  bucket=$bucket region=$region"
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

$target = "cos://$bucket/assets/videos/"
Write-Host ''
Write-Host 'Syncing HLS media:'
Write-Host "  from: $src"
Write-Host "  to  : $target"
Write-Host '  (keeps relative structure: assets/videos/<project>/... ; no --delete)'

& coscli sync $src $target --bucket $bucket --region $region
if ($LASTEXITCODE -ne 0) {
  Write-Host "coscli sync failed (exit $LASTEXITCODE). Check credentials / region." -ForegroundColor Red
  exit $LASTEXITCODE
}

Write-Host ''
Write-Host 'Sync done.' -ForegroundColor Green
Write-Host '  Next:'
Write-Host '    1) npm run verify:media          -> check m3u8/ts reachability'
Write-Host '    2) Check MIME: .m3u8 = application/vnd.apple.mpegurl ; .ts = video/mp2t'
Write-Host '    3) Check CORS allows https://jazimprofile.com and https://www.jazimprofile.com'
Write-Host '    4) Check custom domain + HTTPS for media.jazimprofile.com'
