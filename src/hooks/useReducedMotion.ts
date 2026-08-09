import { useEffect, useState } from 'react'

/**
 * 监听任意媒体查询，SSR / 首帧安全。
 * 用于响应式关闭自定义光标与复杂视差。
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() => {
    if (typeof window === 'undefined') return false
    return window.matchMedia(query).matches
  })

  useEffect(() => {
    const mql = window.matchMedia(query)
    const onChange = (e: MediaQueryListEvent) => setMatches(e.matches)
    setMatches(mql.matches)
    mql.addEventListener('change', onChange)
    return () => mql.removeEventListener('change', onChange)
  }, [query])

  return matches
}

/** 是否请求了减弱动效 */
export function useReducedMotion(): boolean {
  return useMediaQuery('(prefers-reduced-motion: reduce)')
}

/** 是否为触摸为主的设备 */
export function useIsTouch(): boolean {
  return useMediaQuery('(hover: none), (pointer: coarse)')
}

/** 是否为需要关闭自定义光标 / 复杂视差的窄屏 */
export function useIsCompact(): boolean {
  return useMediaQuery('(max-width: 768px)')
}
