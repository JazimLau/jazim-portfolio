/**
 * 统一媒体 / 静态资源路径解析（部署一体化架构的核心）。
 *
 * 架构：
 *   - GitHub Repository  = 源码（不含大型 HLS）
 *   - Tencent COS        = 大型 HLS 媒体
 *     媒体域名：https://jazimprofile-media-1465643833.cos.ap-guangzhou.myqcloud.com
 *     （免备案 COS 默认域名；备案通过后可切回自定义域名 media.jazimportfolio.com）
 *   - GitHub Pages       = 主站（免备案）：jazimlau.github.io/jazim-portfolio/
 *                          及自定义域名 jazimportfolio.com（相对 base，同一构建双 URL）
 *   - Tencent EdgeOne    = 备案通过后的正式主站候选（大陆加速需备案）
 *
 * 约定：
 *   - siteAsset()：站点自身静态资源（封面图 / 案例图 / PDF 等）。
 *     按 Vite base 解析，兼容 file:// 双击、jazimportfolio.com 根路径、
 *     GitHub Pages 子路径（/repo/）三种环境。
 *   - mediaUrl()：大型视频媒体（HLS .m3u8）。
 *     生产环境（设置了 VITE_MEDIA_BASE_URL）统一指向 Tencent COS；
 *     本地开发（npm run dev，不加载 .env.production）回落到本地
 *     public/assets/videos/ 相对路径，不依赖 COS。
 *
 * 两点说明：
 *   1. VITE_MEDIA_BASE_URL 只是公开前端 URL（媒体 CDN 域名），不是 Secret。
 *   2. 不要在业务组件里写 if(production) 分支 —— 全部路径判断收敛在本文件。
 */

const MEDIA_BASE_URL: string | undefined = import.meta.env.VITE_MEDIA_BASE_URL as
  | string
  | undefined

/** 站点静态资源解析：根绝对路径 -> 当前 Vite base 下的可访问路径。 */
export function siteAsset(path: string | undefined): string | undefined {
  if (!path) return path
  // 已是绝对 URL 或 data/blob 协议：原样返回
  if (/^(https?:)?\/\//i.test(path) || /^(data|blob):/i.test(path)) return path
  if (path.startsWith('/')) {
    const base = import.meta.env.BASE_URL || './'
    return `${base}${path.slice(1)}`
  }
  // 相对路径（如 './assets/files/...'）保持原样：相对于文档路径天然兼容各托管环境
  return path
}

/** 大型视频媒体解析：生产 -> Tencent COS；本地开发 -> 本地相对路径。 */
export function mediaUrl(path: string | undefined): string | undefined {
  if (!path) return path
  // 已是绝对 URL：原样返回
  if (/^https?:\/\//i.test(path)) return path
  // 生产：设置了 VITE_MEDIA_BASE_URL 且是根绝对路径 -> 指向 COS
  if (MEDIA_BASE_URL && path.startsWith('/')) {
    return `${MEDIA_BASE_URL}${path}`
  }
  // 本地开发 / 相对路径：原样返回
  return path
}
