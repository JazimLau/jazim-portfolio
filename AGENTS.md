# 开发环境规则（DEV SERVER RULES）

> 本文件用于约束 AI 助手在改代码时不要干扰正在运行的本地开发服务器。

## 1. Vite Dev Server 是独立长期运行进程

- 由 `start-dev.bat` 在**独立 CMD 窗口**中启动（窗口标题：`Jazim Portfolio - Vite 5173`）。
- 固定地址：`http://127.0.0.1:5173`（`vite.config.ts` 已设置 `strictPort: true`，端口被占用时报错而不是换端口）。
- 状态检查：`check-dev.bat`。

## 2. 日常修改靠 HMR，禁止重启

修改以下内容后**不要**重新运行 `npm run dev`、不要关闭 Vite、不要 kill 5173 端口、不要 kill node.exe：

- `src/`、`components/`、`data/`、CSS、TSX、图片引用、项目文案

只需等待 Vite HMR 自动热更新即可。

## 3. 只有以下情况才需要重启

- `package.json` 依赖变化（需要 `npm install`）
- `vite.config.*` 修改
- `.env` 修改
- Node 依赖异常 / Vite 本身崩溃

重启方式：关闭标题为 `Jazim Portfolio - Vite 5173` 的窗口，再运行 `start-dev.bat`。

**绝对禁止** `taskkill /F /IM node.exe`、`pkill node`、`killall node` —— 会杀掉电脑上所有 Node 项目。

## 4. Build / Typecheck 与 Dev Server 相互独立

- `npm run build`、`npm run typecheck` 是独立一次性进程，**不影响**正在运行的 dev server。
- 执行 build / typecheck 前不需要关闭 Vite，执行后也不要重启 Vite。

## 5. 多项目并存

- 本项目固定使用 `5173`；其他项目依次用 `5174`、`5175` …，各自在 `vite.config` 中设置 `strictPort: true`。
- 不同项目之间不得互相 kill 进程；关闭一个项目不影响另一个项目。

---

# 部署架构规则（DEPLOYMENT RULES）

> 约束改代码时不要破坏「GitHub Source + Tencent EdgeOne + COS Media」一体化部署体系。

## 1. 媒体路径解析唯一出口

- 视频路径解析：`src/lib/media.ts` 的 `mediaUrl()`（生产 → COS，开发 → 本地）。
- 站点静态资源：`src/lib/media.ts` 的 `siteAsset()`（按 Vite base 解析）。
- **禁止**在组件里写 `if (production)` 或第二套视频路径逻辑。
- 所有 HLS 播放统一经 `useHlsVideo`（内部已调用 `mediaUrl`），不要绕过。

## 2. 路由与 base

- **禁止**把 `HashRouter` 改成 `BrowserRouter`。
- Vite base 由部署目标 env 决定（`.env.tencent` = `/`，`.env.github` = `/jazim-portfolio/`，
  默认 `./`）。**禁止**把 GitHub Repo 名手工拼进 `navigate()` / `Link` / breadcrumb。

## 3. 大型媒体不入 Git

- `public/assets/videos/`（约 1.5GB HLS）已 `.gitignore`，**禁止** `git add -f` 或去掉忽略。
- 本地 HLS 仅忽略不删除（Local Development / Source Media / Backup）。
- 部署产物（`dist/`、`deploy-output/`）不入 Git。

## 4. 构建与部署

- 生产构建：`npm run build` / `build:deploy` / `build:github`。
- 部署后处理：`prepare-deploy-build.mjs` 会剥离产物内 HLS，**禁止**跳过。
- GitHub Actions 只跑 `npm ci` / `typecheck` / `build:github`，**禁止**调用 BAT / PS1 / dev。

## 5. 环境变量

- `.env.production` / `.env.tencent` / `.env.github` 只含公开 URL，可入库。
- **禁止**把 SecretId / SecretKey / GitHub Token 写进任何 `.env*`、源码、README、Git History。
- COS 上传只用本机已配置的 COSCLI 凭证（`deploy-cos-media.ps1`）。

## 6. Canonical / QR / PDF

- Canonical 始终 `https://jazimprofile.com/`（github.io 不作 Canonical）。
- PDF QR 指向 `https://jazimprofile.com/#/...`，不要改成 GitHub。

