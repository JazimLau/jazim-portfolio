import { useEffect, useRef } from 'react'
import type { ReactNode } from 'react'
import { useLocation } from 'react-router-dom'
import { gsap, repairScrollTriggerGuard } from '../../lib/gsap'
import { useReducedMotion } from '../../hooks/useReducedMotion'
import styles from './PageTransition.module.css'

interface PageTransitionProps {
  children: ReactNode
  /** 首页在 Opening 动画期间不需要额外转场 */
  skip?: boolean
}

/**
 * 转场结束后统一刷新 ScrollTrigger 并修复被卡住的内部刷新守卫。
 * 双 rAF 延迟：等 React 提交、新页面动效创建完成后再刷新，
 * 避免 refresh 与 ScrollTrigger 创建同帧竞态（reading 'end' 报错）。
 * repairScrollTriggerGuard 内部自洽 try/catch，绝不抛错。
 */
function safeRefresh(): void {
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      repairScrollTriggerGuard()
    })
  })
}

/**
 * 转场结束信号。首页返回时的 scrollToId 依赖它：
 * 等内容 clip-path/transform 清除、ScrollTrigger 刷新完成后再滚动，
 * 否则 transform 未清除时测量偏移、且与 scrollToTop(true) 抢滚动。
 */
function dispatchTransitionComplete(): void {
  window.dispatchEvent(new CustomEvent('jazim:transition-complete'))
}

/**
 * 路由切换转场。
 * 遮罩自下向上覆盖再自上退出，同时新页面内容做 clip-path 揭示。
 * 切换后回到页面顶部并刷新 ScrollTrigger，避免详情页沿用上一页的滚动位置。
 */
export function PageTransition({ children, skip = false }: PageTransitionProps) {
  const location = useLocation()
  const overlayRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const labelRef = useRef<HTMLSpanElement>(null)
  const reduced = useReducedMotion()
  const firstRender = useRef(true)

  useEffect(() => {
    const overlay = overlayRef.current
    const content = contentRef.current
    if (!overlay || !content) return

    /* 滚动位置由 ScrollManager（useLayoutEffect，绘制前）+ HomePage 统一管理，
       这里不再干预滚动，避免与返回恢复 / 区块定位抢滚动。 */

    if (reduced || skip) {
      gsap.set(overlay, { autoAlpha: 0 })
      firstRender.current = false
      safeRefresh()
      dispatchTransitionComplete()
      return
    }

    // 首次挂载不做内容揭示：首页由 Opening 负责入场，
    // 且此时给 .content 加 clip-path 会连带裁掉 Opening 的固定定位遮罩。
    if (firstRender.current) {
      gsap.set(overlay, { autoAlpha: 0 })
      firstRender.current = false
      safeRefresh()
      dispatchTransitionComplete()
      return
    }

    // 用 context 包裹，卸载时 revert 会清掉所有内联样式，
    // 避免残留值在下一次运行中被 from() 当成动画终点。
    const ctx = gsap.context(() => {
      // refresh 延迟到下一帧，避免与新页面挂载时同步创建的 ScrollTrigger 同帧竞态
      const tl = gsap.timeline({
        onComplete: () => {
          safeRefresh()
          dispatchTransitionComplete()
        },
      })

      gsap.set(overlay, { autoAlpha: 1, scaleY: 1, transformOrigin: 'bottom center' })

      tl.to(labelRef.current, { autoAlpha: 1, duration: 0.18 })
        .to(overlay, {
          scaleY: 0,
          transformOrigin: 'top center',
          duration: 0.78,
          ease: 'power4.inOut',
        })
        .to(labelRef.current, { autoAlpha: 0, duration: 0.2 }, '<')
        // 起止值都显式写出，绝不依赖"当前值"，并在结束后清除内联 clip-path
        .fromTo(
          content,
          { yPercent: 6, clipPath: 'inset(0% 0% 100% 0%)' },
          {
            yPercent: 0,
            clipPath: 'inset(0% 0% 0% 0%)',
            duration: 0.9,
            ease: 'expo.out',
            clearProps: 'clipPath,transform',
          },
          '<0.1'
        )
        .set(overlay, { autoAlpha: 0 })
    })

    return () => {
      ctx.revert()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname, location.state])

  return (
    <>
      <div ref={overlayRef} className={styles.overlay} aria-hidden="true">
        <span ref={labelRef} className={styles.label}>
          LOADING MODULE
        </span>
      </div>
      <div ref={contentRef} className={styles.content}>
        {children}
      </div>
    </>
  )
}
