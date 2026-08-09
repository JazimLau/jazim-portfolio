import { useEffect, useRef } from 'react'
import type { CSSProperties } from 'react'
import { useReducedMotion } from '../../hooks/useReducedMotion'
import styles from './PixelField.module.css'

/**
 * 全站统一像素背景层（fixed 置于内容之下）。
 * 组合：主网格 + 次级细网格 + 像素点阵 + 信号块 + 扫描层 + 坐标定位。
 * 鼠标交互（桌面端）：像素层轻微视差位移；点击空白产生像素波纹。
 * 不阻挡点击（pointer-events: none），事件在 window 级监听。
 */

/** 确定性点阵位置（避免每次渲染随机闪烁） */
const DOTS: { x: number; y: number; size: number; delay: number; dur: number; color: string }[] = []
for (let i = 0; i < 36; i++) {
  DOTS.push({
    x: (i * 37 + 11) % 100,
    y: (i * 53 + 23) % 100,
    size: i % 4 === 0 ? 3 : 2,
    delay: (i % 9) * 0.6,
    dur: 4 + (i % 5) * 0.8,
    color: i % 6 === 0 ? 'var(--accent-lime)' : 'rgba(242, 243, 235, 0.5)',
  })
}

const SIGNALS: { x: number; y: number; size: number; color: string; dur: number }[] = [
  { x: 16, y: 24, size: 8, color: 'rgba(184,255,61,0.25)', dur: 3.4 },
  { x: 83, y: 62, size: 6, color: 'rgba(91,200,255,0.28)', dur: 4.2 },
  { x: 68, y: 14, size: 5, color: 'rgba(255,107,61,0.28)', dur: 3.8 },
  { x: 30, y: 80, size: 7, color: 'rgba(117,87,255,0.3)', dur: 4.6 },
  { x: 92, y: 30, size: 4, color: 'rgba(184,255,61,0.2)', dur: 5.1 },
]

export function PixelField() {
  const layerRef = useRef<HTMLDivElement>(null)
  const rippleRef = useRef<HTMLSpanElement>(null)
  const reduced = useReducedMotion()

  useEffect(() => {
    if (reduced || typeof window === 'undefined') return
    let raf = 0
    let idleTimer: number | undefined
    const target = { x: 0, y: 0 }
    const cur = { x: 0, y: 0 }

    /* 视差 RAF 只在鼠标移动期间运行，停止移动约 500ms 后自动暂停，
       避免全屏固定层在页面静止时仍持续每帧写入样式（整站性能） */
    const tick = () => {
      cur.x += (target.x - cur.x) * 0.08
      cur.y += (target.y - cur.y) * 0.08
      const layer = layerRef.current
      if (layer) {
        layer.style.setProperty('--px', `${(cur.x * -10).toFixed(1)}px`)
        layer.style.setProperty('--py', `${(cur.y * -8).toFixed(1)}px`)
      }
      raf = requestAnimationFrame(tick)
    }
    const stop = () => {
      if (raf) {
        cancelAnimationFrame(raf)
        raf = 0
      }
    }
    const kick = () => {
      if (idleTimer) clearTimeout(idleTimer)
      if (!raf) raf = requestAnimationFrame(tick)
      idleTimer = window.setTimeout(() => {
        stop()
        if (idleTimer) {
          clearTimeout(idleTimer)
          idleTimer = undefined
        }
      }, 500)
    }

    const onMove = (e: PointerEvent) => {
      target.x = e.clientX / window.innerWidth - 0.5
      target.y = e.clientY / window.innerHeight - 0.5
      kick()
    }
    const onClick = (e: PointerEvent) => {
      const t = e.target as HTMLElement
      if (t && t.closest('button, a, input, textarea, [role="button"], [data-cursor]')) return
      const ripple = rippleRef.current
      if (!ripple) return
      ripple.style.left = `${e.clientX}px`
      ripple.style.top = `${e.clientY}px`
      ripple.classList.remove(styles.rippleOn)
      void ripple.offsetWidth
      ripple.classList.add(styles.rippleOn)
    }

    window.addEventListener('pointermove', onMove, { passive: true })
    window.addEventListener('pointerdown', onClick)
    return () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerdown', onClick)
      stop()
      if (idleTimer) clearTimeout(idleTimer)
    }
  }, [reduced])

  return (
    <div className={styles.field} aria-hidden="true">
      <div ref={layerRef} className={styles.layer}>
        {DOTS.map((d) => (
          <span
            key={`${d.x}-${d.y}`}
            className={styles.dot}
            style={
              {
                left: `${d.x}%`,
                top: `${d.y}%`,
                width: d.size,
                height: d.size,
                background: d.color,
                '--delay': `${d.delay}s`,
                '--dur': `${d.dur}s`,
              } as CSSProperties
            }
          />
        ))}
        {SIGNALS.map((s, i) => (
          <span
            key={i}
            className={styles.signal}
            style={
              {
                left: `${s.x}%`,
                top: `${s.y}%`,
                width: s.size,
                height: s.size,
                background: s.color,
                '--dur': `${s.dur}s`,
              } as CSSProperties
            }
          />
        ))}
      </div>

      <span className={styles.scan} />

      {/* 坐标定位元素（左下角 BUILD 坐标在滚动时会被内容遮挡成半截，移除） */}
      <span className={`${styles.coord} ${styles.coordTL}`}>X:0042 Y:0196</span>
      <span className={`${styles.coord} ${styles.coordTR}`}>GRID 048</span>
      <span className={`${styles.coord} ${styles.coordBR}`}>SYS // ONLINE</span>
      <span className={styles.crossTL} aria-hidden="true" />
      <span className={styles.crossBR} aria-hidden="true" />

      <span ref={rippleRef} className={styles.ripple} aria-hidden="true" />
    </div>
  )
}
