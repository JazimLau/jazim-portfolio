import { useEffect, useRef, useState } from 'react'
import type { CSSProperties } from 'react'
import { useUI } from '../../context/UIContext'
import styles from './PixelPurge.module.css'

interface Particle {
  id: number
  /** 水平位置（px，相对监视器内容区） */
  x: number
  /** 垂直位置（px） */
  y: number
  /** 边长（px） */
  size: number
  color: 'lime' | 'purple' | 'orange' | 'blue'
  kind: 'block' | 'cross'
  /** 水平速度（px/s） */
  vx: number
  /** 垂直速度（px/s） */
  vy: number
  /** 自然漂浮的相位错开 */
  phase: number
  /** 漂浮频率 */
  freq: number
}

interface Burst {
  id: number
  x: number
  y: number
  color: string
  /** 消散方向随机种子 */
  seed: number
}

const COLORS = ['lime', 'purple', 'orange', 'blue'] as const
const SIZES = [6, 8, 10, 12]
/** 场内粒子数量（保持稳定） */
const TARGET = 8
/** 粒子之间的最小间距（px），避免过密 */
const MIN_DIST = 26

let uid = 0

function rand(min: number, max: number) {
  return Math.random() * (max - min) + min
}

/** 生成一个与已有粒子保持间距的新粒子（多次尝试，失败则接受随机位） */
function makeParticle(list: Particle[], w: number, h: number): Particle {
  const base: Pick<Particle, 'size' | 'color' | 'kind' | 'phase' | 'freq'> = {
    size: SIZES[Math.floor(rand(0, SIZES.length))],
    color: COLORS[Math.floor(rand(0, COLORS.length))],
    kind: Math.random() < 0.75 ? 'block' : 'cross',
    phase: rand(0, Math.PI * 2),
    freq: rand(0.4, 1.1),
  }
  for (let attempt = 0; attempt < 30; attempt++) {
    const cand: Particle = {
      ...base,
      id: ++uid,
      x: rand(base.size, w - base.size),
      y: rand(base.size, h - base.size),
      /* 全区域随机漂浮：速度大小随机、方向随机 */
      vx: rand(-28, 28),
      vy: rand(-24, 24),
    }
    if (list.every((o) => Math.hypot(o.x - cand.x, o.y - cand.y) >= MIN_DIST)) {
      return cand
    }
  }
  return {
    ...base,
    id: ++uid,
    x: rand(base.size, w - base.size),
    y: rand(base.size, h - base.size),
    vx: rand(-28, 28),
    vy: rand(-24, 24),
  }
}

/**
 * 监视器内的「像素粒子清除」小游戏 —— 视觉增强，不喧宾夺主。
 * 粒子在全区域自然随机漂浮：直线运动 + 缓慢正弦扰动（自然轨迹），
 * 碰到边界自动反向；点击粒子触发像素爆点碎裂消散，并自动补充，
 * 保持场内数量稳定；hover 时提示「点击清除信号 / 清理异常粒子」。
 */
export function PixelPurge() {
  const { t } = useUI()
  const [particles, setParticles] = useState<Particle[]>([])
  const [bursts, setBursts] = useState<Burst[]>([])
  const [purged, setPurged] = useState(0)
  const [hover, setHover] = useState(false)

  const rootRef = useRef<HTMLDivElement>(null)
  /* 粒子元素引用：RAF 直接写 transform（不触发 React 渲染） */
  const elRefs = useRef(new Map<number, HTMLButtonElement>())
  /* 粒子物理状态：由 RAF 内部维护，不再 60fps setState */
  const simRef = useRef<Map<number, Particle>>(new Map())
  /* 内容区尺寸缓存（resize 时更新） */
  const sizeRef = useRef({ w: 320, h: 240 })

  /* 初始生成（依赖内容区尺寸） */
  useEffect(() => {
    const el = rootRef.current
    const w = el?.clientWidth ?? 320
    const h = el?.clientHeight ?? 240
    sizeRef.current = { w, h }
    const list: Particle[] = []
    while (list.length < TARGET) list.push(makeParticle(list, w, h))
    simRef.current = new Map(list.map((p) => [p.id, p]))
    setParticles(list)

    const onResize = () => {
      const r = rootRef.current
      if (r) sizeRef.current = { w: r.clientWidth, h: r.clientHeight }
    }
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  /* 自然漂浮动画：直线运动 + 正弦扰动，碰边界反向。
     性能：RAF 只直写每个粒子元素的 --px/--py（transform 层），
     不调用 React setState，不再每帧重建 8 个按钮；
     滚动离开监视器（IntersectionObserver）后自动暂停 60fps 循环。 */
  useEffect(() => {
    let raf = 0
    let last = performance.now()
    let floatT = 0
    let running = false

    const step = (now: number) => {
      raf = 0
      if (!running) return
      const dt = Math.min((now - last) / 1000, 0.05)
      last = now
      floatT += dt
      const { w, h } = sizeRef.current

      simRef.current.forEach((p) => {
        let { x, y, vx, vy } = p
        x += vx * dt
        y += vy * dt
        x += Math.sin(floatT * p.freq + p.phase) * 0.35
        y += Math.cos(floatT * p.freq * 0.9 + p.phase) * 0.35
        if (x <= p.size) {
          x = p.size
          vx = Math.abs(vx)
        } else if (x >= w - p.size) {
          x = w - p.size
          vx = -Math.abs(vx)
        }
        if (y <= p.size) {
          y = p.size
          vy = Math.abs(vy)
        } else if (y >= h - p.size) {
          y = h - p.size
          vy = -Math.abs(vy)
        }
        p.x = x
        p.y = y
        p.vx = vx
        p.vy = vy
        const el = elRefs.current.get(p.id)
        if (el) {
          el.style.setProperty('--px', `${x}px`)
          el.style.setProperty('--py', `${y}px`)
        }
      })
      raf = requestAnimationFrame(step)
    }

    const start = () => {
      if (running) return
      running = true
      last = performance.now()
      if (!raf) raf = requestAnimationFrame(step)
    }
    const stop = () => {
      running = false
      if (raf) {
        cancelAnimationFrame(raf)
        raf = 0
      }
    }

    let io: IntersectionObserver | undefined
    if (typeof IntersectionObserver !== 'undefined' && rootRef.current) {
      io = new IntersectionObserver(
        (entries) => {
          if (entries.some((e) => e.isIntersecting)) start()
          else stop()
        },
        { rootMargin: '120px' }
      )
      io.observe(rootRef.current)
    } else {
      start()
    }

    return () => {
      stop()
      io?.disconnect()
    }
  }, [])

  const purge = (id: number) => {
    const target = simRef.current.get(id)
    if (!target) return

    /* 像素爆点：保留最近 6 个，防止数组无限增长 */
    setBursts((prev) => [
      ...prev.slice(-5),
      { id: ++uid, x: target.x, y: target.y, color: target.color, seed: Math.random() },
    ])
    setPurged((c) => c + 1)
    /* 消除后立刻补一个新粒子，保持数量稳定（同步更新物理模拟与渲染列表） */
    const { w, h } = sizeRef.current
    const rest = [...simRef.current.values()].filter((p) => p.id !== id)
    const fresh = makeParticle(rest, w, h)
    simRef.current = new Map([...rest, fresh].map((p) => [p.id, p]))
    setParticles((prev) => [...prev.filter((p) => p.id !== id), fresh])
  }

  const removeBurst = (bid: number) =>
    setBursts((prev) => prev.filter((b) => b.id !== bid))

  return (
    <div
      ref={rootRef}
      className={styles.game}
      onPointerEnter={() => setHover(true)}
      onPointerLeave={() => setHover(false)}
    >
      <span className={`${styles.hint} ${hover ? styles.hintOn : ''}`}>
        <b>{t('点击清除信号', 'SIGNAL CLEAR')}</b>
        <span>{t('清理异常粒子', 'CLICK TO PURGE')}</span>
      </span>

      <span className={styles.score}>
        <i aria-hidden="true" />
        {t('已清除', 'PURGED')} {String(purged).padStart(2, '0')}
      </span>

      {particles.map((p) => (
        <button
          key={p.id}
          type="button"
          className={`${styles.particle} ${styles[p.color]} ${styles[p.kind]}`}
          ref={(el) => {
            if (el) elRefs.current.set(p.id, el)
            else elRefs.current.delete(p.id)
          }}
          style={
            {
              '--px': `${p.x}px`,
              '--py': `${p.y}px`,
              '--ps': `${p.size}px`,
              '--pd': `${(p.phase / 2).toFixed(2)}s`,
            } as CSSProperties
          }
          onClick={() => purge(p.id)}
          aria-label="purge signal particle"
        />
      ))}

      {bursts.map((b) => (
        <span
          key={b.id}
          className={`${styles.burst} ${styles[b.color]}`}
          style={
            { '--bx': `${b.x}px`, '--by': `${b.y}px` } as CSSProperties
          }
          onAnimationEnd={() => removeBurst(b.id)}
          aria-hidden="true"
        >
          {Array.from({ length: 8 }).map((_, i) => {
            const ang = (i / 8) * Math.PI * 2 + b.seed * 3
            const dist = 6 + b.seed * 14
            return (
              <i
                key={i}
                style={
                  {
                    '--dx': `${Math.cos(ang) * dist}px`,
                    '--dy': `${Math.sin(ang) * dist}px`,
                    '--dd': `${(b.seed * 2 + i * 0.11) % 0.22}s`,
                  } as CSSProperties
                }
              />
            )
          })}
        </span>
      ))}
    </div>
  )
}
