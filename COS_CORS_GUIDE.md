# COS CORS GUIDE — media.jazimprofile.com

> PHASE 36 · 生产媒体域名 CORS 配置（腾讯云 COS 控制台）。

## 允许的 Origin

| Origin | 用途 |
|---|---|
| `https://jazimprofile.com` | Tencent EdgeOne 正式主站 |
| `https://www.jazimprofile.com` | 正式主站 www |
| `https://<你的用户名>.github.io` | GitHub Pages 备用站（**注意：不含 Repo Path**，CORS Origin 不带路径） |

> GitHub Pages 的 Origin 是 `https://USERNAME.github.io`，不是 `https://USERNAME.github.io/REPO/`。
> 在用户提供 GitHub 用户名 / Pages URL 前，此项先留空占位，不要猜。

## 推荐配置（COS 控制台 → Bucket → 安全管理 → CORS）

| 项 | 值 |
|---|---|
| 允许方法 | GET, HEAD |
| 允许请求头 | `*` |
| 暴露响应头 | `ETag, Content-Length, Content-Type` |
| 缓存时间（MaxAgeSeconds） | `600`（10 分钟） |

> ⚠️ 生产环境不要默认 `Origin: *`。按上面的具体 Origin 列表配置。

## MIME（PHASE 35）

上传后确认 Content-Type：

| 扩展 | Content-Type |
|---|---|
| `.m3u8` | `application/vnd.apple.mpegurl` |
| `.ts` | `video/mp2t` |

验证方式（COS 生效后运行）：

```bash
npm run verify:media
```

若 COS 自动 Content-Type 不正确，可在控制台对对应前缀设置元数据规则，
或使用 coscli 上传时指定 `--content-type`。
