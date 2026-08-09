/* =========================================================================
   lib/gsap.ts — GSAP 统一注册入口
   全站只在这里注册插件，其他文件从这里 import，避免重复注册与 SSR 问题。
   ========================================================================= */

import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

/** 全站默认缓动：偏 out、无回弹 */
gsap.defaults({ ease: 'power3.out', duration: 0.8 })

ScrollTrigger.config({
  // 移动端地址栏收缩不触发 refresh，避免抖动
  ignoreMobileResize: true,
})

let guardsReady = false

/**
 * 修复 ScrollTrigger 内部刷新守卫被卡住的问题。
 *
 * SPA 路由切换时，新页面在 mount 期用 `gsap.from(...) + scrollTrigger` 创建动画，
 * ScrollTrigger 构造器会同步触发一次 refresh()。若恰逢上一页的 trigger 处于
 * "等待 1 tick 初始化"（end 尚未算出）的状态，refresh 内部的递归强制刷新会一路
 * 推进直到越界，抛 "Cannot read properties of undefined (reading 'end')"。
 * 该异常会把模块内部的 `_refreshing` 守卫卡在 truthy：此后每一次 refresh() 都在
 * 入口处直接 return（第 1298 行），所有 trigger 的 start/end 永远停留在构造初值 0。
 * 而 `once: true` 的 trigger 在 start=0 时会被当成"已滚过起点"，立即 progress=1
 * 自毁却从不播放动画 —— from() 元素于是永久停在隐藏态，章节/卡片内容"消失"，
 * 只有整页刷新（模块状态重置）才能恢复。
 *
 * 解法：逐个用 force 参数强制 refresh（force 绕过被卡住的守卫，成功的刷新会把
 * `_refreshing` 归零），守卫解开后整页 refresh 就能正常重算所有 trigger 位置。
 * 全程 try/catch，绝不抛错。
 */
/** ScrollTrigger 运行时 API 比官方类型定义更宽（enabled 属性、refresh 的 force 参数未在 .d.ts 暴露），用运行时形状做一次窄化转型。 */
interface ScrollTriggerRuntime {
  enabled: boolean
  readonly start: number
  readonly end: number
  refresh(soft?: number, force?: number): void
}

export function repairScrollTriggerGuard(): void {
  // 第一阶段：常规 refresh。守卫正常时这里就能修好全部位置。
  try {
    ScrollTrigger.refresh()
  } catch {
    /* 竞态下偶发抛错，忽略 */
  }

  // 第二阶段：检测守卫是否被卡住 —— enabled 的 trigger 仍停留在构造初值：
  // start=0，end 未计算（timeline trigger 为 0，tween trigger 为 undefined）。
  const wedged = ScrollTrigger.getAll()
    .filter((t) => (t as unknown as ScrollTriggerRuntime).enabled && t.start === 0 && !t.end)
  if (wedged.length === 0) return

  // 强制逐个刷新：force 参数绕过 `_refreshing` 守卫。只要有一个成功，守卫就归零。
  for (const t of wedged) {
    try {
      ;(t as unknown as ScrollTriggerRuntime).refresh(0, 1)
    } catch {
      /* 单个失败不致命，继续下一个 */
    }
  }

  // 守卫已解开，再整体刷新一次，让所有 trigger 重新计算位置并触发本应触发的动画。
  try {
    ScrollTrigger.refresh()
  } catch {
    /* noop */
  }
}

/**
 * 全局动效守卫：
 * 1. 页面回到前台时恢复全局时间轴并刷新 ScrollTrigger（浏览器原生会暂停后台标签的
 *    rAF，GSAP 时间轴会自然停滞；若手动 pause，在暂停期间创建的新动画会卡死在
 *    from 态且无法恢复，造成内容永久不可见 —— 因此这里只做"恢复"不做"暂停"）。
 * 2. 字体加载完成后刷新 ScrollTrigger，修正因字体替换导致的位置偏移。
 *    注意：必须延迟到双 rAF 之后执行，避开组件 mount 期 gsap.from + scrollTrigger
 *    的创建竞态 —— 否则 ScrollTrigger.refresh 遍历 _triggers 时可能读到尚未初始化
 *    的实例，抛出 "Cannot read properties of undefined (reading 'end')"，导致 from
 *    动画创建失败、元素永久停留在 from 态（例如 Projects 舞台整块不可见）。
 *    统一走 repairScrollTriggerGuard：既刷新位置，也兜底解除被卡住的刷新守卫。
 */
export function initGlobalMotionGuards(): void {
  if (guardsReady || typeof document === 'undefined') return
  guardsReady = true

  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) {
      try {
        gsap.globalTimeline.resume()
      } catch {
        /* noop */
      }
      requestAnimationFrame(() => {
        repairScrollTriggerGuard()
      })
    }
  })

  if ('fonts' in document) {
    document.fonts.ready
      .then(() => {
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            repairScrollTriggerGuard()
          })
        })
      })
      .catch(() => {})
  }
}

export { gsap, ScrollTrigger }
