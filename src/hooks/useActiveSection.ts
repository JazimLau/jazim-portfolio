import { useEffect, useState } from 'react'
import { ScrollTrigger } from '../lib/gsap'

/**
 * 当前所在区块检测。
 * 用 ScrollTrigger 而非 IntersectionObserver，直接跟随原生窗口滚动值，
 * 不会出现导航高亮与实际位置错位。
 *
 * @param ids      区块 id 列表（顺序即页面顺序）
 * @param enabled  Opening 结束后再启用，避免初始化时误判
 */
export function useActiveSection(ids: string[], enabled = true): string {
  const [active, setActive] = useState<string>(ids[0] ?? '')
  const key = ids.join('|')

  useEffect(() => {
    if (!enabled) return

    const triggers: ScrollTrigger[] = []

    ids.forEach((id) => {
      const el = document.getElementById(id)
      if (!el) return
      triggers.push(
        ScrollTrigger.create({
          trigger: el,
          start: 'top 45%',
          end: 'bottom 45%',
          onToggle: (self) => {
            if (self.isActive) setActive(id)
          },
        })
      )
    })

    // 区块高度依赖字体与图片，挂载后刷新一次
    const raf = requestAnimationFrame(() => ScrollTrigger.refresh())

    return () => {
      cancelAnimationFrame(raf)
      triggers.forEach((t) => t.kill())
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, enabled])

  return active
}
