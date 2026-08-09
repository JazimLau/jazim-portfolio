import { useEffect, useRef } from 'react'

/**
 * 低频"待机故障"动画：每隔随机 4–9s 给元素触发一次 80–220ms 的轻微错位 / 色偏。
 * - 不持续 glitch、不大幅抖动、不引起布局变化（仅 transform / filter）
 * - 触发类名 .is-idle-glitch（见 global.css 的 @keyframes idle-glitch）
 * - prefers-reduced-motion 时由调用方关闭（enabled=false）
 *
 * @param enabled  是否启用（reduced-motion 时传 false）
 * @param min/max  随机间隔范围（ms）
 */
export function useIdleGlitch<T extends HTMLElement>(
  enabled = true,
  min = 4000,
  max = 9000
) {
  const ref = useRef<T>(null)

  useEffect(() => {
    if (!enabled) return
    const el = ref.current
    if (!el) return

    let timer: number
    let clearTimer: number

    const trigger = () => {
      el.classList.add('is-idle-glitch')
      clearTimer = window.setTimeout(
        () => el.classList.remove('is-idle-glitch'),
        120 + Math.random() * 100
      )
      timer = window.setTimeout(trigger, min + Math.random() * (max - min))
    }

    // 等待 2–4s，避开组件入场动画后再开始调度
    timer = window.setTimeout(trigger, 2000 + Math.random() * 2000)

    return () => {
      clearTimeout(timer)
      clearTimeout(clearTimer)
      el.classList.remove('is-idle-glitch')
    }
  }, [enabled, min, max])

  return ref
}
