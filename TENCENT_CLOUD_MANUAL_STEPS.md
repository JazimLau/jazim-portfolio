# TENCENT CLOUD MANUAL STEPS — 腾讯云人工步骤

> PHASE 37 / 50 · 以下操作需要你在腾讯云控制台完成（AI 环境无对应权限，不会假装成功）。

## 推荐云端执行顺序

### STEP 1 · 创建 COS Bucket
控制台 → 对象存储 COS → 创建存储桶
- 名称：如 `jazimprofile-media`（记录实际值）
- 地域：如 `ap-guangzhou`（记录实际值）
- 访问权限：**私有读写**（已通过 Bucket 策略对 `assets/*` 开放匿名只读）

### STEP 2 · 上传 HLS 媒体
本地安装并配置 COSCLI（见 `COSCLI_SETUP_GUIDE.md`），然后：

```bash
npm run cos:media
```

保持相对结构：`assets/videos/<project>/...`（与 Manifest 的 `expected_cos_path` 一致）。

### STEP 3 · 媒体域名（免备案：COS 默认域名，无需 DNS/自定义域名）
当前无 ICP 备案，媒体直接使用 COS 默认域名（已生效）：
`https://jazimprofile-media-1465643833.cos.ap-guangzhou.myqcloud.com`
- 已通过 Bucket 策略对 `assets/*` 开放匿名只读（已完成）
- 默认域名自带 HTTPS，无需额外证书
- ⚠️ 绑定自定义域名 `media.jazimportfolio.com` 需要 ICP 备案；备案通过后再做
  （届时只需改各 `.env*` 的 `VITE_MEDIA_BASE_URL` 并重建）

### STEP 4 · HTTPS
- 免备案默认域名已内置 HTTPS，无需操作
- 备案通过后绑定自定义域名时，再为 `media.jazimportfolio.com` 申请 / 绑定 SSL 证书

### STEP 5 · CORS（控制台待办）
按 `COS_CORS_GUIDE.md` 配置（允许 jazimportfolio.com / www / GitHub Pages Origin）。
COS 控制台 → Bucket → 安全管理 → CORS 规则：3 个 Origin + GET/HEAD + `*` + MaxAge 600。

### STEP 6 · 媒体在线验证
```bash
npm run verify:media
```
目标：Playlist reachable 100%，Broken sampled segment 0。

### STEP 7 · 正式站构建
```bash
npm run build:deploy   # tencent 目标（base /，供 EdgeOne，备案后）
npm run build:github   # github 目标（相对 base ./，供 GitHub Pages 自定义域名，当前主站）
```
> 当前无备案：主站走 GitHub Pages（STEP 9）；EdgeOne（STEP 8）留待备案后。

### STEP 8 · 上传 EdgeOne Site Artifact
产物：`deploy-output/Jazim-Portfolio-EdgeOne.zip`（ZIP 根目录 = index.html + assets/）。
上传方式按 EdgeOne 平台当前支持（控制台直传 / CLI 等，以官方为准）。

### STEP 9 · 绑定主站域名（免备案：GitHub Pages 自定义域名）
1. GitHub 仓库 → Settings → Pages → **Custom domain** 填 `jazimportfolio.com` → Save（自动签发 HTTPS）
2. DNS 服务商添加记录：
   - `jazimportfolio.com` → CNAME 到 `jazimlau.github.io`（或按 GitHub 提供的 A 记录）
   - `www.jazimportfolio.com` → CNAME 到 `jazimlau.github.io`
3. 相对 base（`./`）构建同时兼容 `jazimlau.github.io/jazim-portfolio/` 与 `jazimportfolio.com` 根路径

> 备案通过后可选 EdgeOne：上传 `deploy-output/Jazim-Portfolio-EdgeOne.zip`，绑定 `jazimportfolio.com` / `www` + HTTPS。
> 注意：同一域名不要同时绑定 GitHub Pages 与 EdgeOne，避免 DNS 冲突。

### STEP 10 · HTTPS
- GitHub Pages 自定义域名：自动签发 Let's Encrypt 证书，无需操作
- （备案后 EdgeOne 方案）再在 EdgeOne 为 `jazimportfolio.com` / `www` 配置 HTTPS

### STEP 11 · Online QA
按 `FINAL_MULTI_PLATFORM_DEPLOYMENT_REPORT.md` 的 WEBSITE 清单进行线上检查
（导航 / 语言 / 项目 / 案例 / 返回 / 视频 / PDF / 联系 / QR，桌面 + 移动）。

## DNS 注意事项

- 所有 CNAME Target 必须以腾讯云控制台实际显示值为准，本项目不编造。
- www 策略：推荐裸域为 Primary / Canonical；www 可访问或按平台能力 301 到裸域。
