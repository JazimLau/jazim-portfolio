# JAZIM Portfolio — 迁移到新电脑 操作手册

> 目标：把「Jazim Lau 游戏动效作品集」工程完整、正确地搬到另一台电脑，并让新环境可开发 / 构建 / 部署 / 生成 PDF。
> 整理时间：2026-09-08　|　当前提交：`0d3204b`（本地与 GitHub origin/main 一致）
> 仓库：`https://github.com/JazimLau/jazim-portfolio.git`（分支 `main`）

---

## 0. 一页速览（TL;DR）

新电脑上按顺序执行：

```bash
# 1) 装环境（Node 20+、Git；可选 Python 3.12、Chrome）
# 2) 克隆源码
# 3) 从 GitHub transfer 分支取「被忽略但必需」的本地文件包（pdf/ 等），解压到项目根（见 §5 步骤 3 方式 A）
# 4) 装依赖 + 启动
npm ci
双击 启动开发服务器.bat   （或 npm run dev）
```

> 只要做了 1+2+4，网站就能跑起来看布局、改代码、`npm run typecheck` / `npm run build`。
> 做 **PDF 生成 / COS 媒体上传 / EdgeOne 打包** 需要额外补 §3.2（transfer 分支 zip）与 §3.3（机器级凭证）的本地文件。
> 完整可执行命令见 §5 步骤 2–3。

---

## 1. 项目是什么

- **技术栈**：React 18 + Vite 5 + TypeScript(严格) + GSAP ScrollTrigger + React Router 6(hash)
- **多平台部署**：
  - 源码 GitHub 仓库（单一 Source of Truth）
  - 主站 GitHub Pages（`jazimportfolio.com`，自动部署）
  - 备用 GitHub Pages（`jazimlau.github.io/jazim-portfolio`，push 自动构建）
  - 大型 HLS 媒体统一放 **腾讯 COS**（`jazimprofile-media-1465643833.cos.ap-guangzhou.myqcloud.com`）
- **媒体策略**（很重要）：大型 `.m3u8/.ts` **不进 Git**；线上由 `VITE_MEDIA_BASE_URL` 指向 COS；本地 dev 读 `public/assets/videos/`（缺失也不报错，组件会回落成 CSS 占位）
- **PDF 生成链**（独立子工程，被 Git 忽略）：`pdf/parse_data.py`(src/data→json) → `pdf/build_html.py`(→portfolio-pdf.html) → `scripts/build-pdf.py`(Chrome 导出成品 PDF)

---

## 1.5 字体说明（重要：换电脑字体不会丢）

- **网站字体已自托管**：`public/assets/fonts/`（Barlow Condensed / Inter / IBM Plex Mono 的 woff2 + fonts.css）**全部入库（git tracked）**，clone 即可用，`npm run dev` / 构建后字体正常，**不依赖电脑安装字体**。
- **PDF 字体已自托管（2026-09-08 修复）**：`pdf/build_html.py` 的 CSS 现在内置 12 条 `@font-face`，指向 `pdf/assets-optimized/fonts/*.woff2`（同一批 woff2，已复制到 `pdf/assets/` 与 `pdf/assets-optimized/`）。导出 PDF 不再依赖 Chrome 所在系统的 Barlow / Inter / IBM Plex 字体，**新电脑直接重新导出字体也一致**。
- 中文字体仍走系统（微软雅黑等 Windows 自带），无需安装；如需 macOS/Linux 导出更接近的中文，可装 Noto Sans SC。
- 若想换字体：往 `public/assets/fonts/` 放新 woff2 → 更新 `fonts.css` 与 `pdf/build_html.py` 顶部 `@font-face` 块 → 同步把 woff2 复制到 `pdf/assets/fonts/` 与 `pdf/assets-optimized/fonts/`。

---

## 2. 迁移前（在旧电脑上做）

1. **确认代码已同步**：
   ```bash
   git status            # 应为 clean（不要有未提交改动被丢下）
   git fetch origin && git log origin/main -1 --oneline   # 与本地一致
   ```
2. **确认本地特殊文件都在**（§3.2 列表，逐个核对存在）。
3. （可选）如果只带关键文件，用 U 盘/移动硬盘按 §3 清单复制；或整体目录拷贝（最大是 `public/assets/videos` 1.65GB，见 §3.4 可选项）。

---

## 3. 迁移清单（什么要带 / 什么不用带）

### 3.1 从 GitHub clone 即可获得（无需拷贝）
源码、页面、`src/data/*`（所有文案数据）、站点图片/字体/PDF 简历、部署配置（`.github/workflows`、`vercel.json`、`.env.github/.env.tencent/.env.production` 等公开配置）、`scripts/` 全部工具脚本、`package.json`/锁文件、启动器（`启动开发服务器.bat`、`*.bat/*.ps1`）、README 与各类报告。

### 3.2 【Git 忽略、但新电脑要用】的本地文件（不随 clone 出现）
这些文件被 `.gitignore` 排除，`git clone` **不会**带过来，需单独获取。

**远程获取途径（推荐）**：旧机已把它们打包为 `jazim-portfolio-gitignored-transfer.zip` 并推送到本仓库的 **`transfer` 分支**
（`https://github.com/JazimLau/jazim-portfolio/tree/transfer`）。新电脑按 §5 步骤 3「方式 A」拉取即可，无需 U 盘。

| 路径（zip 内） | 为什么需要 | 不带的后果 |
|---|---|---|
| `pdf/`（整目录，~8MB） | 完整 PDF 生成链：`parse_data.py`(含 2026-09 修复的 CONTACT 解析)、`build_html.py`、`assets.py/frames*.py/qrcodes.py`、`assets/` 源图、`assets-optimized/` 优化图、`data/pdf-data.json` | 无法再「内容同步改 PDF」/重新导出作品集 PDF |
| `deploy-cos-config.env` | COS 上传配置（Bucket/Region/COSCLI 路径），被 gitignore | `npm run cos:media` 找不到配置 |
| `portfolio-output/Jazim-Lau-Game-Motion-Portfolio-2026.pdf`（可选，5.4MB） | 最新成品作品集 PDF | 可重新生成，但丢了当前这版 |
| `.env.local` / `.env.github.local` / `.env.production.local`（可选，未打包） | 本地联系方式覆盖；内容与公开默认值相同 | 无实际影响（值=默认值），可不带 |

> ⚠️ `pdf/` 里包含本机对 `parse_data.py` 的 CONTACT 引用修复，**务必获取**；否则新电脑重新解析会丢 email/phone/wechat。
> ℹ️ `transfer` 分支可随时删除（取完即弃），需要时可在旧机重新生成 zip 再推。

### 3.3 需在新电脑上「重建」的机器级配置（不进项目、不能靠拷贝目录解决）
| 项目 | 旧电脑位置 | 说明 |
|---|---|---|
| COSCLI 凭证 | `C:\Users\<你>\.cos.yaml`（**用户主目录**，不在项目里） | 含 SecretId/SecretKey；要么复制该文件，要么新电脑重新 `coscli config` |
| COSCLI 可执行文件 | `D:\coscli-windows-386.exe`（或任意路径） | 路径写死在 `deploy-cos-config.env` 的 `COSCLI_PATH`，新电脑放同路径或改 env |
| Chrome（用于导出 PDF） | `C:\Program Files\Google\Chrome\Application\chrome.exe` | `scripts/build-pdf.py` 按固定候选路径找，找不到会退出 |

### 3.4 完全不需要迁移（可再生 / 临时）
`node_modules/`、`dist/`（构建产物）、`deploy-output/`（部署产物）、`coscli_output/`（上传日志）、`optimized-test/`（临时测试，1.8GB）、`shots/`。
- `public/assets/videos/`（1.65GB 本地 HLS 缓存）：**可选**。它是本地 dev 播放用缓存；线上走 COS。不带 → 本地页面视频位显示占位底板，不影响改代码/构建；想本地完整看视频再复制。
- `.git/`：clone 后自动重建。

---

## 4. 新电脑环境安装清单

| 软件 | 版本要求 | 用途 | 检查命令 |
|---|---|---|---|
| Git | 任意较新 | clone/提交 | `git --version` |
| Node.js | **20+**（旧机 24.18；vite 引擎要求 ^18 或 >=20） | 前端构建 | `node -v` `npm -v` |
| Python | 3.12（可选，仅 PDF/COS 脚本用） | pdf 链、deploy 打包脚本 | `python --version` |
| Chrome | 稳定版（可选） | `build-pdf.py` headless 导出 | 见 §3.3 |
| ffmpeg | 可选（仅媒体压缩/转码脚本用） | `compress-videos.py` 等 | `ffmpeg -version` |
| COSCLI | 可选（仅上传媒体用） | `npm run cos:media` | 见 §3.3 |

> GitHub 直连若被重置（网络问题），需代理：PowerShell 里设
> `$env:HTTPS_PROXY="http://127.0.0.1:7897"; $env:HTTP_PROXY="http://127.0.0.1:7897"` 再 `git push`。

---

## 5. 新电脑落地步骤（详细）

1. **装环境**：Node 20+、Git（§4）。做 PDF/COS 再补 Python3.12 + Chrome + COSCLI。
2. **克隆**：
   ```bash
   git clone https://github.com/JazimLau/jazim-portfolio.git
   cd jazim-portfolio
   ```
3. **放入本地必需文件**（§3.2：`pdf/`、`deploy-cos-config.env`、可选成品 PDF）——两种方式任选：
   - **方式 A · 从 GitHub `transfer` 分支远程拉取（推荐，无需 U 盘）**：
     ```bash
     # ① 取 transfer 分支的文件（zip + 迁移手册），不切换分支
     git fetch origin transfer
     git checkout transfer -- jazim-portfolio-gitignored-transfer.zip MIGRATION_TO_NEW_PC.md
     # 若报错提示覆盖，改用：
     # git restore --source=origin/transfer -- jazim-portfolio-gitignored-transfer.zip MIGRATION_TO_NEW_PC.md

     # ② 解压 zip 到项目根（zip 内是 jazim-portfolio/ 目录结构，与 clone 内容合并）
     tar -xf jazim-portfolio-gitignored-transfer.zip
     # 或在资源管理器里右键解压到当前目录
     ```
     > 网页下载同样可行：浏览器登录 GitHub 打开
     > `https://github.com/JazimLau/jazim-portfolio/tree/transfer` → 点 zip → Download，
     > 解压后把 `pdf/`、`deploy-cos-config.env` 等放进项目根。
   - **方式 B · 手动复制**：把旧电脑的 `pdf/`、`deploy-cos-config.env` 拷到项目根。
   - COSCLI 凭证（用户主目录 `.cos.yaml`）无法走 Git，需单独复制或在新机重配（见 §3.3）。
4. **装依赖**：`npm ci`（用锁文件，别用 `npm install`，保证版本一致）。
5. **启动开发服务器**：
   - 双击 `启动开发服务器.bat`（推荐，菜单式）
   - 或 `npm run dev` → 打开 `http://127.0.0.1:5173`（固定端口，被占会提示）
6. **验证**：
   - 首页滚动/动效、`/projects/leihuo-external-motion-system` 案例页、语言切换 CN/EN
   - `npm run typecheck` 通过
7. **PDF 链验证（可选）**：见 §6.3。

---

## 6. 常用命令速查

### 6.1 开发
```bash
npm run dev          # 开发服务器（127.0.0.1:5173，HMR）
npm run typecheck    # TS 类型检查（提交前必跑）
npm run build        # 类型检查 + 生产构建到 dist/
npm run preview      # 本地预览 dist
```

### 6.2 构建 / 部署
```bash
npm run build:github    # GitHub Pages 构建 → deploy-output/github-site（含剥离 HLS 步骤）
npm run build:deploy    # Tencent EdgeOne 构建 → deploy-output/tencent-site
npm run package:deploy  # 打 EdgeOne ZIP
npm run manifest:media   # 生成 COS 上传清单 + HLS 完整性审计
npm run cos:media        # 用本机 COSCLI 上传媒体到 COS
npm run verify:media     # 生产媒体验证（COS 生效后）
```
- 正常流程：改代码 → `npm run typecheck` → `git commit` → `git push origin main` → **GitHub Actions 自动部署备用站**（无需手动跑 `build:github`）。
- EdgeOne 主站：本地 `build:deploy` → 上传（第一阶段手动）。

### 6.3 PDF（作品集 1920×1080 导出链）
```bash
python pdf/parse_data.py            # ① src/data → pdf/data/pdf-data.json
python pdf/build_html.py            # ② json → pdf/portfolio-pdf.html（20 页）
# ③ 起本地静态服务（在 pdf/ 目录）：
python -m http.server 8899 --directory pdf
# ④ 另开终端导出：
python scripts/build-pdf.py         # Chrome headless → portfolio-output/…2026.pdf
```
校验：`pymupdf` 打开，20 页 / 1440×810pt（`pip install pymupdf`）。

---

## 7. 注意事项（给另一台电脑的重点提醒）

### 7.1 绝对不要做的事
- ❌ **不要提交** `public/assets/videos/`、`pdf/`、`dist/`、`deploy-output/`、`.env*.local`、`deploy-cos-config.env`、任何 Secret。
  （已在 `.gitignore`；尤其 **禁止 `git add -f`** 去强制加入这些。）
- ❌ 不要把 SecretId / SecretKey / Token 写进任何 `.env*`、源码、README 或提交历史。
- ❌ **禁止** `taskkill /F /IM node.exe`（会误杀别的 Node 项目）；停 dev server 用 `stop-portfolio.bat`。
- ❌ 不要双击打开 `index.html`（React 工程需 Vite 编译；`dist/index.html` 也需 HTTP 访问）。
- ❌ 不要把项目源码里的绝对路径 `D:\...` 硬编码进代码（只在本地脚本/配置里用）。

### 7.2 编码 / 环境
- 中文 `.bat/.ps1` 脚本**用带 BOM 的 UTF-8 保存**，否则中文乱码（`run-tool.ps1` 改文案尤其注意）。
- 新电脑用户名不同会导致路径不同：检查 `deploy-cos-config.env` 的 `COSCLI_PATH`、`scripts/*.py` 里是否写死旧用户名路径（若有需改）。
- Windows 终端跑 Python 打印中文会 GBK 报错（无害，文件已写出），或用 `PYTHONIOENCODING=utf-8`。

### 7.3 数据 / 内容修改入口
- 改个人信息（姓名/邮箱/手机/微信/简历路径）：`src/data/profile.ts` 的 `profile` 对象；联系方式引用 `CONTACT` 常量（`email/phone/wechat`，默认即真实值）。
- 改履历 `src/data/timeline.ts`；能力 `src/data/skills.ts`；项目库/筛选器 `src/data/projects.ts`；导航 `src/data/navigation.ts`。
- 新增双语文案必须走 `lt()` / `t()` / `tx()`，JSX 里硬写中文会让英文版漏字。
- 中英文是完整两版，`localStorage['jazim-lang']` 记语言选择。

### 7.4 媒体 / 部署架构
- 视频路径唯一入口：`src/lib/media.ts` 的 `mediaUrl()`/`siteAsset()`；禁止在业务代码里写 `if (production)` 分支。
- 路由用 HashRouter（`#/...`），禁止改成 BrowserRouter；Vite base 由 env 控制（默认 `./`）。
- Canonical / PDF QR 一律指向 `https://jazimportfolio.com/`，不要写 github.io。
- 大型 HLS 只在本地（不删）→ COS 上线；本地是「Local Development / Source Media / Backup」缓存。

### 7.5 PDF 链（本机特有，注意保留）
- `pdf/` 不入 Git，属于本机生成链 + 素材。**换电脑必须获取**（从仓库 `transfer` 分支的 zip 或直接拷贝），否则丢 `parse_data.py` 的 CONTACT 修复与新 `pdf-data.json`。
- 若打算长期双机维护 PDF 链，可考虑把 `pdf/`（不含大素材）后续纳入 Git 或用网盘备份；**不要**在未确认前提交。

### 7.6 GitHub 相关
- Actions：push 到 `main` 自动构建 GitHub Pages（`.github/workflows/deploy-pages.yml`），Node 24，`npm ci` + typecheck + `build:github` + 上传 artifact + 可选 COS 静态资源同步。
- 仓库 Secrets（Settings → Secrets and variables → Actions）：
  - `CONTACT_EMAIL / CONTACT_PHONE / CONTACT_WECHAT`（构建注入联系方式）
  - `TENCENT_SECRET_ID / TENCENT_SECRET_KEY`（可选，COS 静态资源同步）
  - 换电脑后这些 Secrets 在 GitHub 上，无需迁移。

---

## 8. 迁移完整性核对表（在新电脑执行）

```bash
git log -1 --oneline          # 应为 048ea6f（或更新的提交）
npm run typecheck             # 0 错误
npm run build                 # 成功生成 dist/
git fetch origin transfer     # transfer 分支可达（本地被忽略文件包）
git checkout transfer -- jazim-portfolio-gitignored-transfer.zip   # 能取到 zip
tar -xf jazim-portfolio-gitignored-transfer.zip                    # 解压到项目根
ls pdf/parse_data.py          # pdf 链已就位（要做 PDF 时）
ls deploy-cos-config.env      # COS 配置已就位（要传媒体时）
测试 http://127.0.0.1:5173    # 首页 + 一个案例页 + CN/EN 切换
```

---

## 9. 目录职责速查

| 目录/文件 | 职责 | 是否进 Git |
|---|---|---|
| `src/` | 全部源码（组件/页面/数据/样式） | ✅ |
| `src/data/` | ★ 所有文案数据（改内容只动这里） | ✅ |
| `public/` | 静态资源：站点图片/字体/简历 PDF | 图片✅ / videos❌ |
| `public/assets/videos/` | 本地 HLS 媒体缓存（1.65GB） | ❌（线上走 COS） |
| `pdf/` | PDF 生成链 + 素材（parse/build_html/assets…） | ❌（本机） |
| `scripts/` | 构建/部署/COS/PDF 工具脚本 | ✅ |
| `portfolio-output/` | 成品 PDF + QR | ❌(*.pdf) |
| `dist/ deploy-output/` | 构建产物 | ❌ |
| `.github/` | GitHub Actions 自动部署 | ✅ |
| `.env.*` | 各 target 构建配置（仅公开 URL） | 公开✅ / *.local❌ |
| `coscli_output/ optimized-test/` | 日志/临时 | ❌ |
