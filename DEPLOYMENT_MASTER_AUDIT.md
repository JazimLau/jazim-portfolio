# DEPLOYMENT MASTER AUDIT — Jazim Lau Portfolio

> PHASE 01 部署前总审计 · 生成时间：2026-08-09
> 目标：在开始任何修改之前，如实记录当前项目真实状态。

---

## 1. 项目是否已有 Git

| 项 | 结果 |
|---|---|
| `.git` 目录 | ❌ 不存在 |
| `git` 命令 | ❌ 未安装（`git --version` 报错：不是内部或外部命令） |
| `gh` CLI | ❌ 未安装 |

**影响**：PHASE 13/14（git init / commit）无法在本机自动执行，需要用户先安装 Git。
所有 Git 相关准备（.gitignore / 大文件审计 / Secret 扫描 / 待提交清单）已由本地脚本完成，
并生成 `GIT_INIT_GUIDE.md` 提供精确操作步骤。

## 2. Node / npm 版本

| 项 | 版本 |
|---|---|
| Node | v24.18.0 |
| npm | 11.16.0 |

GitHub Actions 使用 `node-version: 24`，与本地一致（不擅自升级 Major）。

## 3. npm scripts（审计时）

```
dev             vite
build           tsc --noEmit && vite build
preview         vite preview
typecheck       tsc --noEmit
portfolio:images python scripts/optimize-pdf-images.py
portfolio:pdf   python scripts/build-pdf.py
```

## 4. Vite base（审计时）

`vite.config.ts` 固定 `base: './'`（为 file:// 双击打开设计）。已改造为按部署目标可配置
（`VITE_BASE`，见 `.env.tencent` / `.env.github`），默认仍为 `./`。

## 5. HashRouter 状态

✅ `src/main.tsx` 使用 `HashRouter`。**保持不动**。所有部署环境无需 SPA Route Rewrite。

## 6. 当前视频路径生成方式

- 视频路径硬编码在 `src/data/projects.ts` 与 `src/data/types.ts` 的数据字段：
  `'/assets/videos/<project>/<name>.m3u8'`（根绝对路径）。
- HLS 播放器：`src/hooks/useHlsVideo.ts`（hls.js，动态加载）；Safari 原生 HLS。
- 播放唯一出口：`useHlsVideo(videoRef, src)`，全站视频（VideoPreview / CaseViewer /
  ProjectDetail / Projects 卡片）都经由此函数挂载 src。
- 封面：项目封面 `/assets/images/project-0X-cover.jpg`；案例封面 `caseCoverPath()`。

## 7. 是否已有 VITE_MEDIA_BASE_URL

❌ 不存在。已建立：
- `.env.production` → `VITE_MEDIA_BASE_URL=https://media.jazimprofile.com`
- `.env.tencent` / `.env.github` → 同值（公开前端 URL，非 Secret）
- 解析器：`src/lib/media.ts`（`mediaUrl()` / `siteAsset()`）

## 8. dist 为什么可能达到约 1.5GB

`public/assets/videos/` 含大型 HLS（95 个 .m3u8 + 635 个 .ts ≈ 1.56GB）。Vite 默认把整个
`public/` 复制进 `dist/`，导致产物 ≈1.57GB。解决方案（PHASE 21/22）：
- 部署构建后由 `scripts/prepare-deploy-build.mjs` 剥离产物内 HLS 副本；
- 生产媒体统一走 COS（`media.jazimprofile.com`），部署包不含大型视频。

## 9. 是否已有 GitHub Actions

❌ 不存在。已建立 `.github/workflows/deploy-pages.yml`（Pages 正式方案，最小权限）。

## 10. 是否已有 Tencent / COS 脚本

❌ 不存在。已建立：
- `deploy-cos-media.ps1`（coscli sync，无 `--delete`）
- `scripts/generate-cos-manifest.mjs`（Manifest + HLS 完整性）
- `scripts/verify-production-media.mjs`（生产媒体验证）
- `scripts/package-tencent-deploy.py`（EdgeOne ZIP）
- `scripts/prepare-deploy-build.mjs`（部署产物后处理）

## 11. 是否有 Secret

全项目扫描 **0 命中**（见 `SECRET_SCAN_REPORT.md`）。所有新建 env 文件只含公开 URL。

## 12. 是否存在旧部署配置

| 文件 | 状态 |
|---|---|
| `vercel.json` | 存在（SPA rewrites + assets 缓存头）。Netlify `_redirects` 同用途。保留（无冲突）。 |
| `.env*` | 无（新建立 `.env.production` 等） |
| `deploy-output/` | 无（新建立） |
| `.github/` | 无（新建立） |

---

## 审计发现的问题

1. **案例封面路径 bug**：`caseCoverPath()` 返回 `/assets/images/cases/...`，但实际文件在
   `public/images/cases/...`（线上 `/images/cases/...`）。已修复为正确路径。
   （部署 QA 要求 0 missing assets，此修复保证案例封面正常显示。）
2. **Git 未安装**：无法在本机执行 git init/commit/push，需用户操作（详见 `GIT_INIT_GUIDE.md`）。
3. **GitHub / 腾讯云账号信息未知**：Repository URL、Bucket、Region 等需用户提供
   （详见 `DEPLOYMENT_REQUIRED_USER_INPUT.md`）。

## 结论

- 本地可自动化部分：✅ 全部完成（Resolver / env / 多部署 Build / Actions / COS Manifest /
  Secret 扫描 / 大文件审计 / 部署产物 / 生产 QA 脚本 / 文档）。
- 需用户操作：Git 安装、GitHub Repo 创建、腾讯云 COS/EdgeOne 配置、DNS/HTTPS。
