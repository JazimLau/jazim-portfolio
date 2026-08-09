import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { RefObject } from 'react'
import { Maximize, Minimize, Pause, Play, Volume2, VolumeX } from 'lucide-react'
import { usePlayback } from '../../context/PlaybackContext'
import { useUI } from '../../context/UIContext'
import { useHlsVideo } from '../../hooks/useHlsVideo'
import { claimPlayback, releasePlayback } from '../../lib/videoMutex'
import { siteAsset } from '../../lib/media'
import styles from './VideoPreview.module.css'

type PlayMode = 'hover' | 'auto' | 'manual'

interface VideoPreviewProps {
  /** 单条视频（与 videos 二选一，优先 videos） */
  video?: string
  /** 视频播放列表：多条时在底部显示视频选择条 */
  videos?: string[]
  /** 受控模式下的当前视频下标（缺省为内部状态） */
  videoIndex?: number
  /** 受控模式下的切换回调 */
  onVideoChange?: (i: number) => void
  cover?: string
  /** 无障碍描述，视频与图片共用 */
  alt: string
  /** 占位底板上显示的大号编号 */
  indexLabel?: string
  category?: string
  status?: string
  /** hover=悬停播放；auto=自动播放；manual=仅按钮控制 */
  mode?: PlayMode
  /** 是否循环单条视频；false 时播完自动切下一条（播完所有回到第一条） */
  loopVideo?: boolean
  /** 是否显示时间码与进度条 */
  showMeta?: boolean
  /** 非首屏资源开启懒加载：进入视口才挂载 src */
  lazy?: boolean
  /** CSS aspect-ratio，例如 "16 / 9" */
  aspect?: string
  className?: string
  children?: React.ReactNode
  /** 视频选择行（Video Index 层）右侧的附加内容：如跨作品的扁平计数 "01 / 07"。
      渲染在与 VIDEO 按钮同一行、同一层级（Playback Controls 之下的独立行），
      绝不进入 Progress / Volume 控制区，也不悬浮覆盖控制条。 */
  selectorExtra?: React.ReactNode
}

function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds)) return '00:00'
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

/**
 * 播放状态（时间码 / 进度条）：独立小组件，只订阅 video 元素事件。
 * 播放中 timeupdate 4×/s 的重渲染只发生在这个小组件内部，
 * 不再带动整个预览组件（视频层 / 封面 / HUD 按钮 / 箭头…）一起重渲染。
 */
function PlaybackStatus({
  videoRef,
  ready,
  onSeekingChange,
}: {
  videoRef: RefObject<HTMLVideoElement | null>
  /** 视频元素是否已挂载（懒加载 / 失败时会变化） */
  ready: boolean
  /** 拖动进度条时通知外层：拖动期间控制栏不能被隐藏计时器收起 */
  onSeekingChange?: (seeking: boolean) => void
}) {
  const { t } = useUI()
  const trackRef = useRef<HTMLDivElement>(null)
  const [time, setTime] = useState(0)
  const [progress, setProgress] = useState(0)
  const [duration, setDuration] = useState(0)

  useEffect(() => {
    const v = videoRef.current
    if (!v || !ready) return
    const onTime = () => {
      setTime(v.currentTime)
      if (v.duration) setProgress(v.currentTime / v.duration)
    }
    const onMeta = () => setDuration(v.duration || 0)
    /* 换源 / 清空时归零 */
    const onReset = () => {
      setTime(0)
      setProgress(0)
      setDuration(0)
    }
    v.addEventListener('timeupdate', onTime)
    v.addEventListener('loadedmetadata', onMeta)
    v.addEventListener('emptied', onReset)
    return () => {
      v.removeEventListener('timeupdate', onTime)
      v.removeEventListener('loadedmetadata', onMeta)
      v.removeEventListener('emptied', onReset)
    }
  }, [videoRef, ready])

  /* 进度条：点击 / 拖动跳转 */
  const seekFromEvent = (e: React.PointerEvent<HTMLDivElement>) => {
    const v = videoRef.current
    const el = trackRef.current
    if (!v || !el || !v.duration || !Number.isFinite(v.duration)) return
    const rect = el.getBoundingClientRect()
    const ratio = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width))
    v.currentTime = ratio * v.duration
  }
  const onSeekDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return
    e.preventDefault()
    e.currentTarget.setPointerCapture(e.pointerId)
    onSeekingChange?.(true)
    seekFromEvent(e)
  }
  const onSeekMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.currentTarget.hasPointerCapture(e.pointerId)) seekFromEvent(e)
  }
  const onSeekUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId)
    }
    onSeekingChange?.(false)
  }
  const onSeekCancel = () => onSeekingChange?.(false)

  return (
    <>
      <span className={styles.timecode}>
        {formatTime(time)} / {duration ? formatTime(duration) : '--:--'}
      </span>
      <div
        ref={trackRef}
        className={styles.progressTrack}
        role="slider"
        aria-label={t('播放进度', 'Playback progress')}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(progress * 100)}
        onPointerDown={onSeekDown}
        onPointerMove={onSeekMove}
        onPointerUp={onSeekUp}
        onPointerCancel={onSeekCancel}
        data-cursor="link"
      >
        <span className={styles.progressFill} style={{ transform: `scaleX(${progress})` }} />
      </div>
    </>
  )
}

/**
 * 媒体窗口：视频（支持播放列表）+ 封面 + 设计化占位三级回落。
 *
 * 资源缺失时的表现是这个组件的核心职责：
 * video 加载失败 → 用封面图；封面图也失败 → 用 CSS 占位底板。
 * 任何情况下都不会出现浏览器的破图图标，替换真实资源后无需改动结构。
 *
 * 播放控制：
 * - 多条视频时在 HUD 底部显示视频选择条，点击直接切换；
 * - play 按钮为暂停/播放切换（不再每次重新播放）；
 * - 进度条可点击 / 拖动跳转；
 * - loopVideo=false 时单条播完自动切下一条，全部播完回到第一条。
 */
export function VideoPreview({
  video,
  videos,
  videoIndex,
  onVideoChange,
  cover,
  alt,
  indexLabel,
  category,
  status,
  mode = 'hover',
  loopVideo = true,
  showMeta = true,
  lazy = true,
  aspect = '16 / 9',
  className = '',
  children,
  selectorExtra,
}: VideoPreviewProps) {
  const wrapRef = useRef<HTMLDivElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  /* 记录按下位置：点按视频本体切换播放/暂停，拖拽切项目时不误触 */
  const downPointRef = useRef({ x: 0, y: 0 })
  const { t } = useUI()
  const { soundOn, setSoundOn, volume, setVolume } = usePlayback()
  /* 局部声音：播放器内的音量条 / 静音按钮只影响当前视频（局部覆盖），
     全局 soundOn 由导航栏总开关控制 —— 默认静音，点开才出声。 */
  const [localMuted, setLocalMuted] = useState(false)
  const [localVolume, setLocalVolume] = useState<number | null>(null)
  const effVolume = localVolume ?? volume
  const muted = !soundOn || localMuted

  /* 播放列表：videos 优先，否则单条 video */
  const sources = useMemo(
    () => (videos && videos.length > 0 ? videos : video ? [video] : []),
    [videos, video]
  )

  /* 受控 / 非受控下标 */
  const [internalIndex, setInternalIndex] = useState(0)
  const isControlled = videoIndex !== undefined
  const index = Math.min(isControlled ? videoIndex : internalIndex, Math.max(0, sources.length - 1))
  const changeIndex = useCallback(
    (i: number) => {
      if (isControlled) onVideoChange?.(i)
      else setInternalIndex(i)
    },
    [isControlled, onVideoChange]
  )

  const currentSrc = sources.length > 0 ? sources[index] : undefined

  const [inView, setInView] = useState(!lazy)
  const [videoFailed, setVideoFailed] = useState(() => sources.length === 0)
  const [coverFailed, setCoverFailed] = useState(!cover)
  const [playing, setPlaying] = useState(false)
  /* 全屏状态：跟随浏览器 fullscreenchange 同步（ESC 退出也由该事件驱动） */
  const [isFullscreen, setIsFullscreen] = useState(false)

  /* ---------- 控制栏显隐（首次 3 秒展示，之后按交互淡出） ----------
     startedRef：视频是否已真正开始播放（onPlaying）。
     - 视频还在加载 / 未开播时控制栏保持可见，不启动隐藏计时（req: loading 时不要开始计时）；
     - 一旦开始播放，展示 3 秒后自动淡出；
     - 拖动进度条期间（seekingRef）隐藏计时器一律挂起，防止拖动中控制栏消失。 */
  const [controlsVisible, setControlsVisible] = useState(true)
  const controlsTimerRef = useRef<number | undefined>(undefined)
  const startedRef = useRef(false)
  const seekingRef = useRef(false)
  const hideControls = useCallback(() => {
    if (seekingRef.current) return
    if (controlsTimerRef.current !== undefined) {
      clearTimeout(controlsTimerRef.current)
      controlsTimerRef.current = undefined
    }
    setControlsVisible(false)
  }, [])
  /* 显示控制栏并启动（或重置）隐藏计时器；ms=0 / 未开播时仅保持可见不启动计时 */
  const showControlsTemporarily = useCallback(
    (ms?: number) => {
      if (controlsTimerRef.current !== undefined) {
        clearTimeout(controlsTimerRef.current)
        controlsTimerRef.current = undefined
      }
      setControlsVisible(true)
      if (seekingRef.current) return
      const delay = ms ?? (startedRef.current ? 3000 : 0)
      if (delay > 0) {
        controlsTimerRef.current = window.setTimeout(hideControls, delay)
      }
    },
    [hideControls]
  )
  /* 拖动进度条：期间挂起隐藏计时，结束后恢复 3 秒展示 */
  const handleSeekingChange = useCallback(
    (seeking: boolean) => {
      seekingRef.current = seeking
      if (seeking) {
        if (controlsTimerRef.current !== undefined) {
          clearTimeout(controlsTimerRef.current)
          controlsTimerRef.current = undefined
        }
        setControlsVisible(true)
      } else {
        showControlsTemporarily()
      }
    },
    [showControlsTemporarily]
  )
  /* 真正开始播放（onPlaying）：标记已开播并启动 3 秒隐藏计时 */
  const handlePlaying = useCallback(() => {
    startedRef.current = true
    setPlaying(true)
    showControlsTemporarily()
  }, [showControlsTemporarily])
  /* 组件卸载：清理隐藏计时器 */
  useEffect(() => {
    return () => {
      if (controlsTimerRef.current !== undefined) clearTimeout(controlsTimerRef.current)
    }
  }, [])

  /* 视频首次进入可视区域：控制栏展示 3 秒 */
  useEffect(() => {
    if (inView) showControlsTemporarily()
  }, [inView, showControlsTemporarily])

  /* 切换视频：清理旧计时器并重新展示 3 秒 */
  useEffect(() => {
    showControlsTemporarily()
  }, [currentSrc, showControlsTemporarily])

  /* m3u8 走 hls.js，其余走原生 src；加载失败时回落到封面/占位。
     懒加载时 video 元素在 inView 后才挂载，因此把 src 依赖绑定到 showVideo，
     元素挂载后 effect 才会真正挂载视频源。 */
  useHlsVideo(videoRef, inView && !videoFailed ? currentSrc : undefined, () => setVideoFailed(true))

  /* 切换视频时重置播放态（进度 / 时长由 PlaybackStatus 随 video 事件自同步） */
  useEffect(() => {
    setPlaying(false)
    setVideoFailed(false)
  }, [currentSrc])

  /* 全局声音开关 / 局部音量 / 局部静音变化时同步到当前 video 元素 */
  useEffect(() => {
    const v = videoRef.current
    if (!v) return
    v.volume = effVolume
    v.muted = muted
  }, [effVolume, muted, inView, videoFailed])

  /* 全屏状态跟随：点按钮进入 / 点按钮或按 ESC 退出（ESC 为浏览器原生行为） */
  useEffect(() => {
    const onFsChange = () => setIsFullscreen(document.fullscreenElement === wrapRef.current)
    document.addEventListener('fullscreenchange', onFsChange)
    return () => document.removeEventListener('fullscreenchange', onFsChange)
  }, [])

  /* 自动播放模式：进入 auto（如卡片从不活动变为活动）时拉起播放。
     元素已存在时 autoPlay 属性不生效，必须显式 play()。
     同时声明全局播放权：暂停其他卡片正在播放的视频，避免声音叠加。 */
  useEffect(() => {
    const v = videoRef.current
    if (!v || mode !== 'auto' || videoFailed) return
    claimPlayback(v)
    v.play().catch(() => {
      /* 播放被拦截时静默处理：由 playing 状态回落封面 */
    })
  }, [mode, currentSrc, inView, videoFailed])

  /* ---------- 懒加载：进入视口才请求资源 ---------- */
  useEffect(() => {
    if (!lazy || inView) return
    const el = wrapRef.current
    if (!el) return
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setInView(true)
          io.disconnect()
        }
      },
      { rootMargin: '240px' }
    )
    io.observe(el)
    return () => io.disconnect()
  }, [lazy, inView])

  /* ---------- 播放列表：循环播放由 loop 属性接管（不触发 ended）；
     非循环时单条播完切下一条（ended 事件 + near-end 位置兜底） ---------- */
  const indexRef = useRef(index)
  indexRef.current = index
  const sourcesRef = useRef(sources)
  sourcesRef.current = sources
  const loopRef = useRef(loopVideo)
  loopRef.current = loopVideo
  /* 防止 near-end 兜底在换源前被 timeupdate 多次触发 */
  const advancedRef = useRef(false)

  const advanceToNext = useCallback(() => {
    if (loopRef.current || advancedRef.current) return
    const list = sourcesRef.current
    if (list.length > 1) {
      advancedRef.current = true
      changeIndex((indexRef.current + 1) % list.length)
    }
  }, [changeIndex])

  useEffect(() => {
    const v = videoRef.current
    if (!v) return
    const onEnded = () => advanceToNext()
    v.addEventListener('ended', onEnded)
    return () => v.removeEventListener('ended', onEnded)
    /* inView / videoFailed 会决定 video 元素是否挂载：懒加载时元素在 inView 后才出现，
       这里必须随二者重跑才能在元素挂载后真正挂上 ended 监听 */
  }, [advanceToNext, inView, videoFailed])

  /* 换源时复位防重复标志 */
  useEffect(() => {
    advancedRef.current = false
  }, [currentSrc])

  /* 末尾自动切下一条：部分浏览器原生 HLS 播到结尾不触发 ended，用位置逼近判断完成。
     时间码 / 进度显示已拆到 PlaybackStatus，这里不再 setState。 */
  useEffect(() => {
    const v = videoRef.current
    if (!v) return
    const onTime = () => {
      const d = v.duration
      if (d && !loopRef.current && !v.paused && v.currentTime >= d - 0.3) {
        advanceToNext()
      }
    }
    v.addEventListener('timeupdate', onTime)
    return () => v.removeEventListener('timeupdate', onTime)
  }, [inView, videoFailed, advanceToNext])

  const play = () => {
    const v = videoRef.current
    if (!v || videoFailed) return
    claimPlayback(v)
    v.play()
      .then(() => setPlaying(true))
      .catch(() => {
        // 自动播放被拦截时静默回落到封面，不打断浏览
        setPlaying(false)
      })
  }

  const pauseAndReset = () => {
    const v = videoRef.current
    if (!v || videoFailed) return
    v.pause()
    releasePlayback(v)
    v.currentTime = 0
    setPlaying(false)
  }

  /** 暂停 / 播放切换：暂停时不重置进度，恢复播放从原位置继续 */
  const togglePlay = () => {
    const v = videoRef.current
    if (!v || videoFailed || !currentSrc) return
    if (v.paused) {
      play()
    } else {
      v.pause()
      releasePlayback(v)
      setPlaying(false)
    }
    showControlsTemporarily()
  }

  /** 全屏切换：点按钮进入，再点按钮或按 ESC 退出 */
  const toggleFullscreen = () => {
    const el = wrapRef.current
    if (!el) return
    if (document.fullscreenElement === el) {
      document.exitFullscreen().catch(() => {
        /* 退出全屏被拒绝时静默处理 */
      })
    } else {
      el.requestFullscreen().catch(() => {
        /* 全屏被拒绝（如不在用户手势内）时静默处理 */
      })
    }
  }

  const handleEnter = () => {
    if (mode === 'hover') play()
  }
  const handleLeave = () => {
    if (mode === 'hover') pauseAndReset()
  }

  /* 鼠标进入 / 移动预览区：显示控制栏并重置 3 秒计时 */
  const handlePointerEnter = () => {
    handleEnter()
    showControlsTemporarily()
  }
  /* 鼠标离开预览区：不立刻消失，约 1 秒后淡出（重新进入会取消） */
  const handlePointerLeave = () => {
    handleLeave()
    if (controlsTimerRef.current !== undefined) {
      clearTimeout(controlsTimerRef.current)
      controlsTimerRef.current = undefined
    }
    controlsTimerRef.current = window.setTimeout(hideControls, 1000)
  }

  /* 进度条点击/拖动逻辑已拆到 PlaybackStatus（独立订阅 video 事件，避免整组件重渲染） */

  /* 音量条：点击 / 拖动调节音量。既写入当前视频的局部音量，也同步到全局音量，
     这样同一次浏览会话内切换案例 / 切换播放器时仍保持用户调整后的值（首次取消静音才回 75%）。
     拖动即表示用户想听声音，若全局开关还关着则一并打开。 */
  const volumeRef = useRef<HTMLDivElement>(null)
  const setVolumeFromEvent = (e: React.PointerEvent<HTMLDivElement>) => {
    const el = volumeRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const ratio = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width))
    setLocalVolume(ratio)
    setVolume(ratio)
    if (!soundOn) setSoundOn(true)
    showControlsTemporarily()
  }

  /** 播放器内声音开关：切换当前视频的局部静音；取消静音时若全局关着则打开全局 */
  const toggleLocalSound = () => {
    if (muted) {
      setLocalMuted(false)
      if (!soundOn) setSoundOn(true)
    } else {
      setLocalMuted(true)
    }
    showControlsTemporarily()
  }
  const onVolumeDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return
    e.preventDefault()
    e.currentTarget.setPointerCapture(e.pointerId)
    setVolumeFromEvent(e)
  }
  const onVolumeMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.currentTarget.hasPointerCapture(e.pointerId)) setVolumeFromEvent(e)
  }
  const onVolumeUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId)
    }
  }

  /* 卸载时释放全局播放权 */
  useEffect(() => {
    return () => {
      const v = videoRef.current
      if (v) releasePlayback(v)
    }
  }, [])

  /* 失活暂停：卡片从 active（auto）变为非 active（hover）时，立即暂停当前视频。
     首页轮播切项目时，旧活动卡的视频会因此停掉，避免与新卡视频叠声。 */
  const prevModeRef = useRef(mode)
  useEffect(() => {
    const v = videoRef.current
    if (v && prevModeRef.current === 'auto' && mode !== 'auto') {
      v.pause()
      releasePlayback(v)
      setPlaying(false)
    }
    prevModeRef.current = mode
  }, [mode])

  /* 离屏暂停：预览滚出视口后暂停视频，避免后台继续解码占资源；
     回到视口不自动恢复（由 hover/点击/auto 模式接管），保证不会多卡同时出声。
     注意：IntersectionObserver 的 isIntersecting 在页面转场动画期间会被
     clip-path 揭示（PageTransition 对内容裁切）误判为「不可见」，
     因此 pause 前必须用 getBoundingClientRect 二次确认元素真的滚出了视口，
     否则刚自动播放的视频会在转场中被立刻暂停（SPA 进入子模块时 autoplay 失效的根因）。 */
  useEffect(() => {
    const el = wrapRef.current
    if (!el) return
    let io: IntersectionObserver | undefined
    if (typeof IntersectionObserver !== 'undefined') {
      io = new IntersectionObserver(
        (entries) => {
          if (entries.some((e) => e.isIntersecting)) return
          /* 二次确认：clip-path/transform 动画期间 IO 会误报，用真实几何位置判断 */
          const rect = el.getBoundingClientRect()
          const vh = window.innerHeight || document.documentElement.clientHeight
          const margin = 200
          if (rect.bottom > -margin && rect.top < vh + margin) return
          const v = videoRef.current
          if (v && !v.paused) {
            v.pause()
            releasePlayback(v)
            setPlaying(false)
          }
        },
        { rootMargin: '200px' }
      )
      io.observe(el)
    }
    return () => io?.disconnect()
  }, [])

  /* 浏览器标签页切到后台：暂停非必要媒体，避免后台持续解码 */
  useEffect(() => {
    const onVis = () => {
      if (!document.hidden) return
      const v = videoRef.current
      if (v && !v.paused) {
        v.pause()
        releasePlayback(v)
        setPlaying(false)
      }
    }
    document.addEventListener('visibilitychange', onVis)
    return () => document.removeEventListener('visibilitychange', onVis)
  }, [])

  const showVideo = inView && !videoFailed && !!currentSrc
  const showCover = !coverFailed && (!playing || mode === 'hover')
  const showFallback = videoFailed && coverFailed

  return (
    <>
      <div
        ref={wrapRef}
        className={`${styles.wrap} ${className}`}
        style={{ aspectRatio: aspect }}
        onPointerEnter={handlePointerEnter}
        onPointerMove={() => showControlsTemporarily()}
        onPointerLeave={handlePointerLeave}
        onPointerDown={(e) => {
          downPointRef.current = { x: e.clientX, y: e.clientY }
        }}
        onClick={(e) => {
          /* 点按视频本体切换播放/暂停（hover 模式由悬停接管，交互元素与拖拽不触发） */
          if (mode === 'hover') return
          const t = e.target as HTMLElement
          if (t.closest('button, a, input, select, [role="slider"]')) return
          const dx = e.clientX - downPointRef.current.x
          const dy = e.clientY - downPointRef.current.y
          if (Math.hypot(dx, dy) > 12) return
          togglePlay()
        }}
        data-cursor={videoFailed ? undefined : 'video'}
        data-cursor-state={playing ? 'playing' : 'paused'}
      >
        {/* 视频层：auto 模式换源/暂停未真正播放时透明（videoIdle），
            露出封面层避免黑帧跳闪；hover 模式封面常显在视频上不受影响 */}
        {showVideo && (
          <video
            ref={videoRef}
            className={`${styles.video} ${mode === 'auto' && !playing ? styles.videoIdle : ''}`}
            poster={coverFailed ? undefined : siteAsset(cover)}
            muted={muted}
            loop={loopVideo}
            playsInline
            preload="metadata"
            autoPlay={mode === 'auto'}
            aria-label={alt}
            onError={() => setVideoFailed(true)}
            onPlaying={handlePlaying}
          />
        )}

        {/* 封面层：视频未播放时可见 */}
        {showCover && (
          <img
            className={`${styles.cover} ${playing ? styles.coverHidden : ''}`}
            src={siteAsset(cover)}
            alt={alt}
            loading={lazy ? 'lazy' : 'eager'}
            decoding="async"
            onError={() => setCoverFailed(true)}
          />
        )}

        {/* 占位底板：视频与封面都不可用时 */}
        {showFallback && (
          <div className={`media-fallback ${styles.fallback}`} role="img" aria-label={alt}>
            {indexLabel && <span className={styles.fallbackIndex}>{indexLabel}</span>}
            <span className={styles.fallbackNote}>
              <i className={styles.fallbackDot} />
              {t('MEDIA PENDING / 待替换素材', 'MEDIA PENDING / PLACEHOLDER')}
            </span>
          </div>
        )}

        {/* 压暗与颗粒，保证叠加文字可读 */}
        <div className={styles.veil} aria-hidden="true" />
        <div className={`scanlines ${styles.scan}`} aria-hidden="true" />
        <div className={`noise ${styles.grain}`} aria-hidden="true" />

        {/* HUD 信息层：
            顶部信息条（.hudTop：分类/状态/全屏）固定在顶部，
            底部区域（.hudBottomArea）在底部依次排布：控制行（.hudControls：播放/时间/进度/音量，
            首次展示后按交互淡出）与 VIDEO 选择条（.pickerRow，始终可见）。
            进度条因此始终位于视频底部（不再因 flex 顺序跑到顶部）。 */}
        {showMeta && (
          <div className={styles.hud}>
            <div
              className={`${styles.hudTop} ${
                controlsVisible ? styles.hudTopShow : ''
              }`}
            >
              {category && <span className={styles.hudTag}>{category}</span>}
              <div className={styles.hudActions}>
                {status && (
                  <span className={styles.hudStatus}>
                    <i className={styles.hudDot} />
                    {status}
                  </span>
                )}
                {/* 全屏：点按钮进入，再点按钮或按 ESC 退出 */}
                <button
                  type="button"
                  className={styles.fsBtn}
                  onClick={(e) => {
                    e.stopPropagation()
                    showControlsTemporarily()
                    toggleFullscreen()
                  }}
                  aria-label={
                    isFullscreen ? t('退出全屏', 'Exit fullscreen') : t('全屏', 'Fullscreen')
                  }
                  data-cursor="link"
                >
                  {isFullscreen ? (
                    <Minimize size={11} strokeWidth={2.2} />
                  ) : (
                    <Maximize size={11} strokeWidth={2.2} />
                  )}
                </button>
              </div>
            </div>

            <div className={styles.hudBottomArea}>
              <div
                className={`${styles.hudControls} ${
                  controlsVisible ? styles.hudControlsShow : ''
                }`}
              >
                <div className={styles.hudBottom}>
                  <button
                    type="button"
                    className={`${styles.playIcon} ${styles.playBtn}`}
                    onClick={(e) => {
                      e.stopPropagation()
                      togglePlay()
                    }}
                    aria-label={playing ? t('暂停', 'Pause') : t('播放', 'Play')}
                    data-cursor="link"
                  >
                    {playing ? (
                      <Pause size={11} strokeWidth={2.4} fill="currentColor" />
                    ) : (
                      <Play size={11} strokeWidth={2.4} fill="currentColor" />
                    )}
                  </button>
                  {/* 时间码 + 进度条：独立小组件，播放时 4×/s 更新只影响它自己 */}
                  <PlaybackStatus
                    videoRef={videoRef}
                    ready={showVideo}
                    onSeekingChange={handleSeekingChange}
                  />
                  {/* 音量：开关按钮 + 调节条（局部控制当前视频，导航栏为全局总开关） */}
                  <div className={styles.volumeGroup}>
                    <button
                      type="button"
                      className={styles.volumeBtn}
                      onClick={(e) => {
                        e.stopPropagation()
                        toggleLocalSound()
                      }}
                      aria-label={muted ? t('取消静音', 'Unmute') : t('静音', 'Mute')}
                      aria-pressed={!muted}
                      data-cursor="link"
                    >
                      {!muted && effVolume > 0 ? (
                        <Volume2 size={12} strokeWidth={2.2} />
                      ) : (
                        <VolumeX size={12} strokeWidth={2.2} />
                      )}
                    </button>
                    <div
                      ref={volumeRef}
                      className={styles.volumeTrack}
                      role="slider"
                      aria-label={t('音量', 'Volume')}
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-valuenow={Math.round(effVolume * 100)}
                      onPointerDown={onVolumeDown}
                      onPointerMove={onVolumeMove}
                      onPointerUp={onVolumeUp}
                      data-cursor="link"
                    >
                      <span
                        className={styles.volumeFill}
                        style={{ transform: `scaleX(${effVolume})` }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* 视频选择条（Video Index 层）：多条视频时显示 VIDEO 序号按钮；
                  有 selectorExtra（如跨作品扁平计数）时即使单条也渲染该行。
                  始终可见、独立于 Playback Controls 行，Progress/Volume 永不与之重叠。 */}
              {(sources.length > 1 || selectorExtra != null) && (
                <div className={styles.pickerRow}>
                  {sources.length > 1 && (
                    <span className={styles.pickerLabel}>{t('视频 / VIDEO', 'VIDEO')}</span>
                  )}
                  {sources.length > 1 && (
                    <div className={styles.pickerList}>
                      {sources.map((_src, i) => (
                        <button
                          key={i}
                          type="button"
                          className={`${styles.pickBtn} ${i === index ? styles.pickBtnOn : ''}`}
                          onClick={() => {
                            changeIndex(i)
                            showControlsTemporarily()
                          }}
                          aria-current={i === index ? 'true' : undefined}
                          aria-label={`${t('视频', 'Video')} ${i + 1}`}
                          data-cursor="link"
                        >
                          {String(i + 1).padStart(2, '0')}
                        </button>
                      ))}
                    </div>
                  )}
                  {selectorExtra != null && (
                    <span className={styles.pickerExtra}>{selectorExtra}</span>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* 四角定位线 */}
        <span className={styles.frame} aria-hidden="true">
          <i /> <i /> <i /> <i />
        </span>

        {children}
      </div>
    </>
  )
}
