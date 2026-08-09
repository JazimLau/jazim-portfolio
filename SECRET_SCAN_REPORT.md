# SECRET SCAN REPORT — Jazim Lau Portfolio

> PHASE 11 · 生成时间：2026-08-09
> 全项目扫描（排除 node_modules / dist / deploy-output / portfolio-output / 视频 / 二进制）。

## 扫描模式

- SecretId / SecretKey（腾讯云）
- AKID
- AccessKey / AccessKeyId
- Authorization header（Basic/Bearer）
- Bearer token
- Password / Passwd
- GitHub token（ghp_ / github_pat_ / gho_ / ghs_）
- AWS key（AKIA）
- Private key（-----BEGIN ... PRIVATE KEY-----）
- API key（通用）

## 结果

**HARDCODED SECRETS = 0** ✅

## 约定（已写死到项目约束）

- `.gitignore` 忽略所有 `.env*`（仅放行只含公开 URL 的 `.env.production/.env.tencent/.env.github/.env.example`）
- 任何 SecretId / SecretKey / GitHub Token 不得进入：`.env*`、源码、README、Git History
- COS 上传脚本 `deploy-cos-media.ps1` 只使用本机已配置的 COSCLI 凭证，不读取任何 Secret
- 部署构建无需任何 Secret（GitHub Actions 使用内置 `GITHUB_TOKEN`）
