# DEPLOYMENT REQUIRED USER INPUT — 需要用户提供的信息

> 以下信息不是 Secret，请如实提供；用于完成云端配置。

## 待提供清单

| 编号 | 信息 | 用途 | Secret？ |
|---|---|---|---|
| 1 | GitHub Repository Name（建议 `jazim-portfolio`） | remote / Pages base | 否 |
| 2 | GitHub Public / Private | 创建 Repo | 否 |
| 3 | GitHub Repository URL（创建后获得） | git remote add | 否 |
| 4 | GitHub Username | Pages URL / CORS Origin | 否 |
| 5 | COS Bucket Name（如 `jazimprofile-media`） | coscli / 上传脚本 | 否 |
| 6 | COS Region（如 `ap-guangzhou`） | coscli / 上传脚本 | 否 |
| 7 | COSCLI Alias（可选，已配置时） | 上传脚本 | 否 |

## 明确不提供的（保持保密）

| 项 | 说明 |
|---|---|
| Tencent SecretId / SecretKey | 只在本机 COSCLI 配置中输入，绝不发给 AI |
| GitHub Token / Password | 只用本机 gh 登录 / 浏览器操作 |
| 任何账号密码 | 同上 |

## 未提供前

- 上传脚本 `deploy-cos-media.ps1` 会在无 coscli 配置时报 `COS AUTH REQUIRED` 并停止。
- 媒体验证器 `verify:media` 会在媒体域名不可达时输出 `PENDING`（不误报成功）。
