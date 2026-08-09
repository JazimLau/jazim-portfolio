# LOCAL STARTUP SCRIPTS CONSOLIDATION REPORT

> 生成时间：2026-08-09 14:19 · 本地启动脚本整理（菜单入口 + 单一 Direct Dev Launcher）

## 1. start-dev.ps1 原本的独有能力

| 能力 | start-dev.ps1（已删） | start-dev.bat（最终） |
| --- | --- | --- |
| 定位项目根目录 | Set-Location PSScriptRoot | cd /d %~dp0 |
| package.json 检查 | 有（错误提示） | **已迁移** |
| Node 检查 | Get-Command node + 版本输出 | where node + 版本输出（原有） |
| npm 检查 | 无（直接 npm install） | **新增**（where npm） |
| node_modules 检查 | 缺失自动 npm install | 缺失自动 npm install（原有） |
| 5173 端口检查 | 仅提示占用 | **升级**：判断是否为本 portfolio 已运行 → 不重复启动；被其他程序占用 → 明确警告不自动强杀 |
| Vite 启动 | 独立窗口 cmd /k npm run dev | 独立窗口 cmd /k npm run dev（原有） |
| strictPort 逻辑 | 保持（不改配置） | 保持（不改配置） |
| 错误提示/退出 | Pause-Exit 中文提示 | 英文提示 + pause + exit /b 1（原有） |

## 2. 迁移到 start-dev.bat 的能力

- **package.json 检查**（原 start-dev.ps1 独有 → 已加入 start-dev.bat 步骤 1）
- **npm 检查**（新增步骤 3）
- **5173 已运行防重复**（升级：检测监听 5173 进程命令行是否含 'jazim-portfolio'；是本项目→直接开浏览器不重复启动；被他程序占用→警告且不自动强杀未知进程；空闲→正常启动 Vite）
- 修复：原依赖安装提示行括号 `(npm install)` 触发 cmd 块解析语法错误，已改为无括号写法

## 3. 删除的文件

| 文件 | 原因 |
| --- | --- |
| `start-portfolio.bat` | 旧 wrapper（仅调 start-dev.ps1），被 start-dev.bat 取代；0 README/package.json/部署/PDF 依赖 |
| `start-dev.ps1` | 第二套 Direct Dev Launcher，独有能力已迁移至 start-dev.bat；0 依赖 |

## 4. run-tool.ps1 Option 1 现在调用什么

菜单「① 启动开发服务器」不再内联实现第二套启动逻辑，改为调用统一入口：

```powershell
& "$PSScriptRoot\start-dev.bat"
```

以后修改启动逻辑只需维护 `start-dev.bat` 一处。Option 2（Build + Preview）与 Option 3（Typecheck）逻辑未改动。

## 5. README 修改内容

- 新增「入口一览」表：`启动开发服务器.bat`（推荐入口/工具菜单）、`start-dev.bat`（快速入口/直接启动，菜单 ① 也调用它）、`check-dev.bat`（状态检查）、`stop-portfolio.bat`（安全停止 5173）
- 注明旧版重复入口 `start-portfolio.bat` / `start-dev.ps1` 已合并进 `start-dev.bat`，不再使用
- 更新菜单说明：菜单「① 启动开发服务器」与快速入口共用同一套启动逻辑 `start-dev.bat`
- 不再记录 start-portfolio.bat / start-dev.ps1

## 6. AGENTS.md 是否修改

**未修改**。AGENTS.md 已只引用 `start-dev.bat`（独立 CMD 窗口启动、重启方式）与 `check-dev.bat`（状态检查），描述与最终结构完全一致，未提及被删文件。

## 7. 验证结果

| 测试 | 结果 | 说明 |
| --- | --- | --- |
| A. 菜单启动（启动开发服务器.bat → run-tool.ps1 → ① → start-dev.bat） | **PASS** | 管道模拟：菜单正常显示 → 选① 调用 start-dev.bat → 识别已在运行 → 返回菜单 → 选④ 退出（RC 0） |
| B. Direct 启动（start-dev.bat） | **PASS** | RC 0，Node v24.18.0 OK，进入 already_running 分支 |
| C. 5173 重复启动测试 | **PASS** | 再次运行 start-dev.bat：监听进程数 1→1，未启动第二实例，未杀任何 Node 进程 |
| D. check-dev.bat | **PASS** | 正确识别 5173 Portfolio Server（DEV SERVER ONLINE，RC 0） |
| E. 菜单 Build + Preview | **PASS** | Option 2 逻辑未改动；npm run build RC 0 |
| F. 菜单 Typecheck | **PASS** | Option 3 逻辑未改动；npm run typecheck RC 0 |
| Typecheck | **PASS** | npm run typecheck RC 0 |
| Build | **PASS** | npm run build RC 0（built in 8.58s；验证后 dist 已按约定再次移除，可随时重建） |

## 8. 最终结构

```
启动开发服务器.bat   (推荐入口 · 工具菜单)
        │ 调 run-tool.ps1
        ▼
run-tool.ps1        (菜单：① 启动开发服务器 ② Build+Preview ③ Typecheck ④ 退出)
        │ Option 1 调 start-dev.bat（统一入口）
        ▼
start-dev.bat       (唯一 Direct Dev Launcher · 检测/防重复/启动 Vite)
        │
        ▼
npm run dev         (独立窗口 · 127.0.0.1:5173 · strictPort)

check-dev.bat       (状态检查 5173)
stop-portfolio.bat  (安全停止 5173，→ stop-dev.ps1)
```

已删除：`start-portfolio.bat`、`start-dev.ps1`。