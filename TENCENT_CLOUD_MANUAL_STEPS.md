# TENCENT CLOUD MANUAL STEPS — 腾讯云人工步骤

> PHASE 37 / 50 · 以下操作需要你在腾讯云控制台完成（AI 环境无对应权限，不会假装成功）。

## 推荐云端执行顺序

### STEP 1 · 创建 COS Bucket
控制台 → 对象存储 COS → 创建存储桶
- 名称：如 `jazimprofile-media`（记录实际值）
- 地域：如 `ap-guangzhou`（记录实际值）
- 访问权限：**私有读写**（通过 CDN / 自定义域名公开访问）

### STEP 2 · 上传 HLS 媒体
本地安装并配置 COSCLI（见 `COSCLI_SETUP_GUIDE.md`），然后：

```bash
npm run cos:media
```

保持相对结构：`assets/videos/<project>/...`（与 Manifest 的 `expected_cos_path` 一致）。

### STEP 3 · 配置媒体自定义域名 `media.jazimprofile.com`
COS 控制台 → Bucket → 域名管理 → 自定义加速域名 / 自定义源站域名
- 域名：`media.jazimprofile.com`
- CNAME Target：**以腾讯控制台实际给出的值为准**（不要使用文档里的示例值）
- 在 DNS 服务商处添加对应 CNAME 记录

### STEP 4 · HTTPS
- 在腾讯云为 `media.jazimprofile.com` 申请 / 绑定 SSL 证书并开启 HTTPS

### STEP 5 · CORS
按 `COS_CORS_GUIDE.md` 配置（允许 jazimprofile.com / www / GitHub Pages Origin）。

### STEP 6 · 媒体在线验证
```bash
npm run verify:media
```
目标：Playlist reachable 100%，Broken sampled segment 0。

### STEP 7 · Tencent 正式站构建
```bash
npm run build:deploy
```

### STEP 8 · 上传 EdgeOne Site Artifact
产物：`deploy-output/Jazim-Portfolio-EdgeOne.zip`（ZIP 根目录 = index.html + assets/）。
上传方式按 EdgeOne 平台当前支持（控制台直传 / CLI 等，以官方为准）。

### STEP 9 · 绑定主站域名
EdgeOne 站点绑定：
- `jazimprofile.com`（Primary）
- `www.jazimprofile.com`（可访问或 301 到裸域，按平台能力）

> 不要将 `jazimprofile.com` 同时绑定到 GitHub Pages，避免两平台 DNS 冲突。
> GitHub Pages 保持 github.io 地址，仅作备用 / Mirror。

### STEP 10 · HTTPS
为 `jazimprofile.com` / `www.jazimprofile.com` 配置 HTTPS 证书。

### STEP 11 · Online QA
按 `FINAL_MULTI_PLATFORM_DEPLOYMENT_REPORT.md` 的 WEBSITE 清单进行线上检查
（导航 / 语言 / 项目 / 案例 / 返回 / 视频 / PDF / 联系 / QR，桌面 + 移动）。

## DNS 注意事项

- 所有 CNAME Target 必须以腾讯云控制台实际显示值为准，本项目不编造。
- www 策略：推荐裸域为 Primary / Canonical；www 可访问或按平台能力 301 到裸域。
