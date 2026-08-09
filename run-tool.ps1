# JAZIM LAU Portfolio - 一键开启工具
# 由 启动开发服务器.bat 调用（请勿直接删除）
$Host.UI.RawUI.WindowTitle = "JAZIM LAU Portfolio - 一键开启"
Set-Location -Path $PSScriptRoot

function Show-Menu {
    Clear-Host
    Write-Host ""
    Write-Host " =========================================="
    Write-Host "   JAZIM LAU / PORTFOLIO   一键开启"
    Write-Host " =========================================="
    Write-Host ""
    Write-Host "   1. 启动开发服务器（推荐）"
    Write-Host "      热更新，改代码即时生效，浏览器自动打开"
    Write-Host ""
    Write-Host "   2. 构建生产版本 + 本地预览"
    Write-Host "      先类型检查再打包，最后起服务器预览成品"
    Write-Host ""
    Write-Host "   3. 只做类型检查"
    Write-Host "      快速检查代码有没有类型错误"
    Write-Host ""
    Write-Host "   4. 退出"
    Write-Host ""
}

function Test-Node {
    $node = Get-Command node -ErrorAction SilentlyContinue
    if (-not $node) {
        Write-Host ""
        Write-Host " [错误] 没有找到 Node.js。" -ForegroundColor Red
        Write-Host ""
        Write-Host " 可能是刚装好、当前窗口还没读到新的 PATH。"
        Write-Host " 请关掉这个窗口重新双击一次，或者重启电脑后再试。"
        Write-Host ""
        Read-Host "按回车退出"
        exit 1
    }
    $ver = & node --version
    Write-Host " Node.js $ver  OK" -ForegroundColor Green
}

function Test-Deps {
    if (Test-Path "node_modules") { return }
    Write-Host ""
    Write-Host " 首次运行，正在安装依赖，大约需要 1-2 分钟，请不要关闭窗口..."
    Write-Host ""
    & npm.cmd install
    if ($LASTEXITCODE -ne 0) {
        Write-Host ""
        Write-Host " [错误] 依赖安装失败。把上面的报错内容发给我。" -ForegroundColor Red
        Write-Host ""
        Read-Host "按回车退出"
        exit 1
    }
    Write-Host ""
    Write-Host " 依赖安装完成。"
    Write-Host ""
}

function Test-Port {
    param([int]$Port, [string]$Name)
    $listening = Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue
    if ($listening) {
        Write-Host ""
        Write-Host " [提示] 端口 $Port 已被占用（可能是 $Name 已经在运行）。" -ForegroundColor Yellow
        Write-Host "        如果浏览器里已经打开了站点，直接用就行；"
        Write-Host "        否则可能被其他程序占用，可改端口重试。"
    }
}

while ($true) {
    Show-Menu
    $choice = Read-Host " 请输入数字后按回车"

    switch ($choice) {
        "1" {
            Write-Host ""
            Write-Host " 正在启动开发服务器（统一入口 start-dev.bat）..."
            Write-Host ""
            & "$PSScriptRoot\start-dev.bat"
            Write-Host ""
            Write-Host " 已返回菜单。"
            Read-Host "按回车返回菜单"
        }
        "2" {
            Test-Node
            Test-Deps
            Write-Host ""
            Write-Host " 正在构建生产版本（含类型检查）..."
            Write-Host ""
            & npm.cmd run build
            if ($LASTEXITCODE -ne 0) {
                Write-Host ""
                Write-Host " [错误] 构建失败。请根据上面的报错修复代码，或把报错内容发给我。" -ForegroundColor Red
                Write-Host ""
                Read-Host "按回车返回菜单"
                continue
            }
            Write-Host ""
            Write-Host " 构建成功！产物在 dist\ 目录。" -ForegroundColor Green
            Write-Host " 下面起本地服务器预览成品（只用于本地查看，发布请用 Vercel 等平台）。"
            Write-Host ""
            Test-Port -Port 4173 -Name "预览服务器"
            Write-Host ""
            Write-Host " 正在独立窗口中启动预览服务器，浏览器会自动打开..."
            Write-Host "     地址：http://localhost:4173"
            Write-Host "     窗口标题：Jazim Portfolio - Preview 4173"
            Write-Host "     停止服务：关闭那个独立窗口，或在其中按 Ctrl+C"
            Write-Host ""
            & cmd.exe /c start "Jazim Portfolio - Preview 4173" /D "$PSScriptRoot" cmd /k "npm run preview"
            Write-Host ""
            Write-Host " 预览服务器已在独立窗口启动，返回菜单。"
            Read-Host "按回车返回菜单"
        }
        "3" {
            Test-Node
            Test-Deps
            Write-Host ""
            Write-Host " 正在检查类型（npm run typecheck）..."
            Write-Host ""
            & npm.cmd run typecheck
            if ($LASTEXITCODE -ne 0) {
                Write-Host ""
                Write-Host " [结果] 有类型错误，请根据上面的报错修复。" -ForegroundColor Red
            }
            else {
                Write-Host ""
                Write-Host " [结果] 类型检查通过，没有错误 OK" -ForegroundColor Green
            }
            Write-Host ""
            Read-Host "按回车返回菜单"
        }
        "4" {
            exit 0
        }
        default {
            continue
        }
    }
}
