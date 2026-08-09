import { useEffect, useRef } from 'react'
import type { RefObject } from 'react'
import { mediaUrl } from '../lib/media'

/** 是否为 .m3u8（HLS）地址 */
export function isHlsSrc(src?: string): boolean {
  return !!src && /\.m3u8(\?.*)?$/i.test(src)
}

/** hls.js 动态导入：只在遇到 .m3u8 时加载，避免把 ~500KB 塞进主包 */
let hlsPromise: Promise<typeof import('hls.js')> | null = null
function loadHls(): Promise<typeof import('hls.js')> {
  if (!hlsPromise) hlsPromise = import('hls.js')
  return hlsPromise
}

/**
 * 是否为真正的 Safari（原生支持 HLS）。
 * 注意：部分 Chromium（含某些桌面版 Chrome）的 canPlayType('application/vnd.apple.mpegurl')
 * 会返回 "maybe"，但其原生管线对 TS 内 AAC 等编码的支持并不可靠（实测会出现
 * DECODER_ERROR_NOT_SUPPORTED）。因此只对真正的 Safari 走原生 HLS，其余一律交给 hls.js
 * 统一解复用（TS → fMP4），保证各浏览器播放行为一致。
 */
function isRealSafari(): boolean {
  if (typeof navigator === 'undefined') return false
  const ua = navigator.userAgent
  return (
    /Safari/i.test(ua) &&
    !/Chrome|CriOS|Chromium|Edg\/|Edge|OPR|Opera|SamsungBrowser|Firefox|FxiOS/i.test(ua)
  )
}

/**
 * 把视频地址挂到 <video> 上：
 * - 非 .m3u8 → 原生 src；
 * - .m3u8 且为真正的 Safari → 原生 src（不加载 hls.js）；
 * - 其余 .m3u8 → 动态加载 hls.js 接管播放。
 *
 * src 变化 / 组件卸载时销毁旧 Hls 实例并清空，避免重复加载、解码器状态残留与泄漏。
 * 切换源时先释放旧 blob/MediaSource，再挂新源，保证每次 currentVideo 变化
 * duration/currentTime/loading 都重新开始。
 */
export function useHlsVideo(
  videoRef: RefObject<HTMLVideoElement | null>,
  src: string | undefined,
  onFatalError?: () => void
): void {
  /* 用 ref 持有错误回调，effect 不依赖它，避免父组件内联箭头导致重复重建 Hls */
  const onErrorRef = useRef(onFatalError)
  onErrorRef.current = onFatalError

  useEffect(() => {
    const v = videoRef.current
    if (!v || !src) return

    /* 统一媒体解析：生产环境（VITE_MEDIA_BASE_URL）下 .m3u8 指向 Tencent COS，
       本地开发保持 /assets/videos/... 相对路径。这是全站视频加载的唯一出口。 */
    const resolved = mediaUrl(src) ?? src

    // 非 HLS 或真正的 Safari：交给原生
    if (!isHlsSrc(resolved) || isRealSafari()) {
      // 切换源时先清空旧源（旧 MediaSource/blob 残留可能触发解码器异常）
      try {
        if (v.currentSrc && v.currentSrc !== resolved) {
          v.removeAttribute('src')
          v.load()
        }
      } catch {
        /* 清空失败不影响后续挂源 */
      }
      v.src = resolved
      /* 带 autoPlay 属性（自动播放模式）时，同元素换源后主动拉起播放 */
      if (v.autoplay) {
        v.play().catch(() => {
          /* 播放被拦截时静默处理：由组件内 playing 状态回落封面 */
        })
      }
      return
    }

    let cancelled = false
    let hls: import('hls.js').default | undefined

    loadHls()
      .then(({ default: Hls }) => {
        if (cancelled) return
        if (!Hls.isSupported()) {
          v.src = resolved
          if (v.autoplay) {
            v.play().catch(() => {
              /* 静默处理 */
            })
          }
          return
        }
        hls = new Hls({
          /* 起播优化：COS 默认域名限速下，缩短目标缓冲 + 预取首分片，
             让首个画面更快出现、切换视频等待更短 */
          maxBufferLength: 10,
          maxMaxBufferLength: 20,
          backBufferLength: 30,
          startFragPrefetch: true,
          enableWorker: true,
          lowLatencyMode: false,
        })
        hls.loadSource(resolved)
        hls.attachMedia(v)
        if (onErrorRef.current) {
          hls.on(Hls.Events.ERROR, (_event, data) => {
            if (data.fatal) onErrorRef.current?.()
          })
        }
        /* 带 autoPlay 属性（自动播放模式）时，切源后主动拉起播放；
           否则换条视频时同元素换源不会再次触发浏览器自动播放 */
        if (v.autoplay) {
          v.play().catch(() => {
            /* 播放被拦截时静默处理：由组件内 playing 状态回落封面 */
          })
        }
      })
      .catch(() => {
        /* hls.js 加载失败：回落到原生 src（若浏览器不支持则走 onError 回落） */
        if (!cancelled) {
          v.src = resolved
          if (v.autoplay) {
            v.play().catch(() => {
              /* 静默处理 */
            })
          }
        }
      })

    return () => {
      cancelled = true
      /* 关键：src 变化 / 卸载时销毁旧 Hls 实例并清掉 blob src，
         避免「旧 hls 还在拉流 + 新 hls 又 attach」的双实例竞态 */
      try {
        hls?.destroy()
      } catch {
        /* 销毁失败不影响新源挂载 */
      }
      if (hls) {
        try {
          v.removeAttribute('src')
          v.load()
        } catch {
          /* 忽略 */
        }
      }
    }
  }, [src, videoRef])
}
