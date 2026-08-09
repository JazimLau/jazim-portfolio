# JAZIM LAU Portfolio - 一键启动本地开发服务器
# 由 start-portfolio.bat 调用。负责检查 Node / 依赖 / 端口并启动 Vite。

$ErrorActionPreference = 'Stop'
$Host.UI.RawUI.WindowTitle = "Jazim Portfolio - Local Server"
Set-Location -Path $PSScriptRoot

function Pause-Exit($code) {
    Write-Host ""
    Read-Host "按回车退出"
    exit $code
}

# ---------- 1. 检查 package.json ----------
if (-not (Test-Path "package.json")) {
    Write-Host ""
    Write-Host " [错误] 当前目录没有 package.json，可能放错了位置。" -ForegroundColor Red
    Write-Host "        请把本文件夹放回作品集项目根目录。"
    Pause-Exit 1
}

# ---------- 2. 检查 Node.js ----------
$node = Get-Command node -ErrorAction SilentlyContinue
if (-not $node) {
    Write-Host ""
    Write-Host " [错误] 没有找到 Node.js。" -ForegroundColor Red
    Write-Host "        请先安装 Node.js（https://nodejs.org），安装后重试。"
    Write-Host "        若刚装完，请关掉本窗口重新双击一次。"
    Pause-Exit 1
}
$ver = & node --version
Write-Host (" Node.js {0}  OK" -f $ver) -ForegroundColor Green

# ---------- 3. 检查依赖，缺失则安装 ----------
if (-not (Test-Path "node_modules")) {
    Write-Host ""
    Write-Host " 首次运行：未检测到 node_modules，正在安装依赖，请耐心等待（约 1-2 分钟）..."
    Write-Host ""
    & npm.cmd install
    if ($LASTEXITCODE -ne 0) {
        Write-Host ""
        Write-Host " [错误] 依赖安装失败，请把上方报错内容发给我。" -ForegroundColor Red
        Pause-Exit 1
    }
    Write-Host ""
    Write-Host " 依赖安装完成。" -ForegroundColor Green
}

# ---------- 4. 提示端口占用（strictPort 下若被占用 Vite 会报错，这里先提醒） ----------
$listening = Get-NetTCPConnection -LocalPort 5173 -State Listen -ErrorAction SilentlyContinue
if ($listening) {
    Write-Host ""
    Write-Host " [提示] 端口 5173 已被占用，可能是服务器已在运行。" -ForegroundColor Yellow
    Write-Host "        若浏览器已打开作品集，可直接使用；"
    Write-Host "        否则启动报错时可关闭占用端口的程序后重试。"
}

# ---------- 5. 启动 Vite（独立窗口运行，open:true 自动开浏览器） ----------
Write-Host ""
Write-Host " ============================================"
Write-Host "   JAZIM LAU PORTFOLIO - 启动本地服务器"
Write-Host " ============================================"
Write-Host ""
Write-Host " 正在独立窗口中启动 Vite 开发服务器，浏览器将自动打开..."
Write-Host " 地址：http://127.0.0.1:5173"
Write-Host ""
Write-Host " Vite 运行在独立窗口（标题：Jazim Portfolio - Vite 5173）。"
Write-Host " 该窗口独立长期运行，修改代码自动热更新。"
Write-Host " 停止服务：关闭那个窗口，或在其中按 Ctrl+C。"
Write-Host ""
& cmd.exe /c start "Jazim Portfolio - Vite 5173" /D "$PSScriptRoot" cmd /k "npm run dev"
Write-Host ""
Write-Host " Vite 已在独立窗口启动，本窗口任务完成。"
Read-Host "按回车退出"
exit 0
