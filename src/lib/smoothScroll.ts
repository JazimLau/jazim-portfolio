/* =========================================================================
   lib/smoothScroll.ts — 原生滚动工具
   本轮性能优化：移除 Lenis 虚拟滚动，恢复浏览器原生滚动。
   - 不再拦截 wheel、不再常驻 gsap.ticker RAF（消除滚动「人为拖拽感」与主线程争抢）；
   - ScrollTrigger 直接跟随原生窗口滚动；
   - scrollToId / scrollToTop 使用原生 smooth 行为；
   - setScrollLocked 通过 body[data-locked] 全局样式（overflow:hidden）锁定滚动。
   保留与原模块一致的导出 API，调用方无需改动。
   ========================================================================= */

function prefersReduced(): boolean {
  if (typeof window === 'undefined') return false
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

/** 原生滚动下无需初始化；保留导出以兼容 App.tsx 调用。 */
export function initSmoothScroll(): void {
  /* 原生滚动：无需任何初始化 */
}

/** 原生滚动下无需清理；保留导出以兼容 App.tsx 调用。 */
export function destroySmoothScroll(): void {
  /* 原生滚动：无需清理 */
}

/** Opening 动画 / 详情面板打开时锁住滚动（body[data-locked] 全局样式驱动） */
export function setScrollLocked(locked: boolean): void {
  if (typeof document === 'undefined') return
  document.body.dataset.locked = String(locked)
}

/**
 * 滚动到指定区块（原生平滑滚动）。
 * offset 用于抵消固定导航栏高度。
 */
export function scrollToId(id: string, offset = -84): void {
  if (typeof document === 'undefined') return
  const el = document.getElementById(id)
  if (!el) return
  const top = el.getBoundingClientRect().top + window.scrollY + offset
  window.scrollTo({ top: Math.max(0, top), behavior: prefersReduced() ? 'auto' : 'smooth' })
}

/** 回到顶部 */
export function scrollToTop(immediate = false): void {
  if (typeof window === 'undefined') return
  window.scrollTo({ top: 0, behavior: immediate || prefersReduced() ? 'auto' : 'smooth' })
}
