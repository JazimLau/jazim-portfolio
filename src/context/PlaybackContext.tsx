import { createContext, useContext, useMemo, useState } from 'react'
import type { ReactNode } from 'react'

/**
 * 播放器全局声音状态（与 UI 语言/就绪等状态分离）。
 * 独立 Context 的目的：拖动音量条 / 切换静音时，只重渲染真正关心声音的组件
 * （Navbar 声音开关、VideoPreview 播放器），避免整个站点所有 useUI 消费者
 * （Hero / Profile / Timeline / Skills / Projects / Contact …）一起重渲染。
 */

interface PlaybackContextValue {
  /** 全局声音开关：所有视频播放器共享（导航栏与播放器 HUD 联动） */
  soundOn: boolean
  setSoundOn: (v: boolean) => void
  /** 全局音量：0 — 1，所有播放器共享 */
  volume: number
  setVolume: (v: number) => void
}

const PlaybackContext = createContext<PlaybackContextValue | null>(null)

export function PlaybackProvider({ children }: { children: ReactNode }) {
  /* 声音默认关闭 + 首次取消静音音量 75%：都只在当前会话内保持，
     重新打开网站一律回到静音（浏览器自动播放策略也更友好）。
     用户手动拖动音量后保持自己的值，不再强制回 75%。 */
  const [soundOn, setSoundOn] = useState<boolean>(false)
  const [volume, setVolume] = useState<number>(0.75)

  const value = useMemo(
    () => ({ soundOn, setSoundOn, volume, setVolume }),
    [soundOn, volume]
  )

  return <PlaybackContext.Provider value={value}>{children}</PlaybackContext.Provider>
}

export function usePlayback(): PlaybackContextValue {
  const ctx = useContext(PlaybackContext)
  if (!ctx) throw new Error('usePlayback 必须在 PlaybackProvider 内使用')
  return ctx
}
