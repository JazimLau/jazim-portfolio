# COSCLI SETUP GUIDE — Tencent COS CLI

> PHASE 31 · 官方流程指引。只指向腾讯云官方渠道，不从未知源安装。

## 安装 COSCLI

参考腾讯云官方文档（以官方页面为准）：
- 官方文档：https://cloud.tencent.com/document/product/436/63143
- 下载：腾讯云官方 GitHub `tencentyun/coscli` Releases（或腾讯云控制台指引）

Windows 示例（以官方文档为准）：

```powershell
# 1. 下载 coscli.exe（官方 Release）
# 2. 放入某个目录并加入 PATH，或直接使用完整路径
coscli --version
```

## 配置凭证（在你自己的终端执行）

```powershell
coscli config
```

按提示输入：
- SecretId / SecretKey：**在腾讯云控制台「访问管理 CAM」创建子账号 / API 密钥后获得**
- Bucket、Region

> ⚠️ SecretId / SecretKey 只在你自己的终端输入，**绝不发给任何人（包括 AI）**。
> 项目脚本不读取、不存储任何 Secret。

## 验证

```powershell
coscli ls cos://<bucket>/
```

## 之后

- 上传媒体：`npm run cos:media`（`deploy-cos-media.ps1`，使用你配置好的 coscli）
- 上传配置项（Bucket / Region）放 `deploy-cos-config.env`（已被 .gitignore 忽略，只含公开值）：

```
COS_BUCKET=jazimprofile-media
COS_REGION=ap-guangzhou
```
