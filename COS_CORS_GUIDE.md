# COS CORS GUIDE — 媒体域名（免备案 COS 默认域名）

> PHASE 36 · 生产媒体域名 CORS 配置（腾讯云 COS 控制台）。

> ✅ **状态：已于 2026-08-09 通过 `scripts/set-cos-cors.py`（cos-python-sdk-v5）配置并验证生效。**
> 背景：GitHub Pages 站点用 hls.js 以 XHR 拉取 COS 的 .m3u8/.ts，未配置 CORS 时线上视频无法播放/切换
> （控制台报 "No 'Access-Control-Allow-Origin' header"，本地 dev 走本地文件所以正常）。
> 重新应用或校验：`python scripts/set-cos-cors.py`；仅查看：`python scripts/set-cos-cors.py --check`。

## 允许的 Origin

| Origin | 用途 |
|---|---|
| `https://jazimportfolio.com` | 主站（当前 GitHub Pages 自定义域名；备案后可改 EdgeOne） |
| `https://www.jazimportfolio.com` | 主站 www |
| `https://jazimlau.github.io` | GitHub Pages 主站（**已确认实际 Origin**；CORS Origin 不带 Path，不加 `/jazim-portfolio/`） |

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
