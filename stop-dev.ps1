# JAZIM LAU Portfolio - 安全停止本地开发服务器
# 由 stop-portfolio.bat 调用。只关闭监听 5173 端口的进程，不误杀其它 Node 项目。

$Host.UI.RawUI.WindowTitle = "Jazim Portfolio - Stop Server"

Write-Host ""
Write-Host " 正在查找本地作品集服务器（端口 5173）..."

$conn = Get-NetTCPConnection -LocalPort 5173 -State Listen -ErrorAction SilentlyContinue
if ($conn) {
    $ownerPids = $conn | Select-Object -ExpandProperty OwningProcess -Unique
    foreach ($ownerPid in $ownerPids) {
        $proc = Get-Process -Id $ownerPid -ErrorAction SilentlyContinue
        if ($proc) {
            Write-Host (" 找到进程 PID={0} ({1})，正在结束..." -f $ownerPid, $proc.ProcessName) -ForegroundColor Yellow
            Stop-Process -Id $ownerPid -Force -ErrorAction SilentlyContinue
        }
    }
    Write-Host " 已停止。" -ForegroundColor Green
} else {
    Write-Host " 未发现端口 5173 上的服务器进程（可能已经停止）。"
}

Write-Host ""
Write-Host " 提示：也可以直接回到启动窗口按 Ctrl+C 停止。"
Write-Host ""
Read-Host "按回车退出"
exit 0
