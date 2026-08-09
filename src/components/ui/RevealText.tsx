import { useEffect, useRef } from 'react'
import { gsap, ScrollTrigger } from '../../lib/gsap'
import { splitChars, splitLines } from '../../lib/splitText'
import { DUR, EASE, STAGGER, TRIGGER } from '../../lib/motion'
import { useReducedMotion } from '../../hooks/useReducedMotion'

type Mode = 'chars' | 'lines' | 'block'
type Tag = 'h1' | 'h2' | 'h3' | 'h4' | 'p' | 'span' | 'div'

interface RevealTextProps {
  text: string
  as?: Tag
  mode?: Mode
  className?: string
  delay?: number
  stagger?: number
  duration?: number
  ease?: string
  /** false 时不绑定 ScrollTrigger，改为挂载即播（Hero 等首屏内容用） */
  scrollTrigger?: boolean
  /** 外部控制播放时机：Opening 结束前保持 false */
  play?: boolean
  triggerStart?: string
}

/**
 * 文本揭示。三种模式对应 spec 第十六节的不同进场逻辑：
 *  chars — 逐字从遮罩下方推入，字符间有时间差（用于标题）
 *  lines — 按行遮罩揭开（用于正文），动画结束后还原 DOM，避免缩放溢出
 *  block — 整块 clip-path 揭示（用于短标签）
 *
 * 所有模式都不是简单的 opacity 0→1。
 * reduced-motion 时直接呈现最终状态，不做位移。
 */
export function RevealText({
  text,
  as = 'div',
  mode = 'chars',
  className = '',
  delay = 0,
  stagger,
  duration,
  ease,
  scrollTrigger = true,
  play = true,
  triggerStart = TRIGGER.start,
}: RevealTextProps) {
  const ref = useRef<HTMLElement>(null)
  const reduced = useReducedMotion()

  useEffect(() => {
    const el = ref.current
    if (!el || !play) return
    if (reduced) return

    let reverted = false
    const split = mode === 'chars' ? splitChars(el) : mode === 'lines' ? splitLines(el) : null

    const ctx = gsap.context(() => {
      const common = {
        delay,
        ease: ease ?? EASE.title,
        scrollTrigger: scrollTrigger
          ? { trigger: el, start: triggerStart, once: true }
          : undefined,
      }

      if (mode === 'chars' && split) {
        gsap.from(split.targets, {
          ...common,
          yPercent: 112,
          duration: duration ?? DUR.titleIn,
          stagger: stagger ?? STAGGER.chars,
        })
        return
      }

      if (mode === 'lines' && split) {
        gsap.from(split.targets, {
          ...common,
          yPercent: 108,
          duration: duration ?? DUR.element,
          stagger: stagger ?? STAGGER.lines,
          ease: ease ?? EASE.element,
          onComplete: () => {
            // 还原为原始文本节点，让后续窗口缩放正常重排
            if (!reverted) {
              reverted = true
              split.revert()
            }
          },
        })
        return
      }

      // block 模式：整块斜向遮罩揭示
      gsap.from(el, {
        ...common,
        clipPath: 'inset(0% 100% 0% 0%)',
        duration: duration ?? DUR.element,
        ease: ease ?? EASE.media,
      })
    }, el)

    return () => {
      ctx.revert()
      if (split && !reverted) split.revert()
      ScrollTrigger.refresh()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text, mode, play, reduced])

  // as 为动态标签，用 ElementType 保持 ref 透传且不牺牲语义化
  const Component = as as React.ElementType
  return (
    <Component ref={ref} className={className}>
      {text}
    </Component>
  )
}
