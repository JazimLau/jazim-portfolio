# COS CORS GUIDE — media.jazimportfolio.com

> PHASE 36 · 生产媒体域名 CORS 配置（腾讯云 COS 控制台）。

## 允许的 Origin

| Origin | 用途 |
|---|---|
| `https://jazimportfolio.com` | Tencent EdgeOne 正式主站 |
| `https://www.jazimportfolio.com` | 正式主站 www |
| `https://jazimlau.github.io` | GitHub Pages 备用站（**已确认实际 Origin**；CORS Origin 不带 Path，不加 `/jazim-portfolio/`） |

> GitHub Pages 的 Origin 是 `https://jazimlau.github.io`（已确认），不是 `https://jazimlau.github.io/jazim-portfolio/`（CORS Origin 不带 Path）。

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
