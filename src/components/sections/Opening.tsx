import { useEffect, useRef, useState } from 'react'
import { gsap } from '../../lib/gsap'
import { setScrollLocked } from '../../lib/smoothScroll'
import { useReducedMotion } from '../../hooks/useReducedMotion'
import { profile } from '../../data/profile'
import styles from './Opening.module.css'

const SESSION_KEY = 'jl-intro-played-v1'

interface OpeningProps {
  onComplete: () => void
}

/**
 * Opening Animation —— 四阶段、总时长约 2.4s。
 *
 * 阶段1 0.00–0.40  扫描线掠过 + INITIALIZING MOTION SYSTEM + 计数 00→100
 * 阶段2 0.40–1.10  多块遮罩分区退出，背景被揭开，定位线与坐标文字出现
 * 阶段3 0.80–1.60  JAZIM LAU 从 scaleX 0.35 与负字距展开归位
 * 阶段4 1.50–2.20  职位切入、导航归位、状态标签依次出现
 *
 * 缓动只用 power3.inOut / power4.out / expo.out，不使用 bounce / elastic / back。
 * 二次访问（sessionStorage 命中）走 0.5s 快速转场。
 * 任何时候都可以按 SKIP INTRO 立即结束。
 */
export function Opening({ onComplete }: OpeningProps) {
  const rootRef = useRef<HTMLDivElement>(null)
  const counterRef = useRef<HTMLSpanElement>(null)
  const tlRef = useRef<gsap.core.Timeline | null>(null)
  const [done, setDone] = useState(false)
  const reduced = useReducedMotion()

  useEffect(() => {
    const root = rootRef.current
    if (!root) return

    const alreadyPlayed =
      typeof sessionStorage !== 'undefined' && sessionStorage.getItem(SESSION_KEY) === '1'

    const finish = () => {
      try {
        sessionStorage.setItem(SESSION_KEY, '1')
      } catch {
        // 隐私模式下 sessionStorage 可能不可用，忽略即可
      }
      setScrollLocked(false)
      setDone(true)
      onComplete()
    }

    // reduced-motion：不播放，直接进入可操作状态
    if (reduced) {
      finish()
      return
    }

    setScrollLocked(true)

    const ctx = gsap.context(() => {
      /* ---------- 二次访问：0.5s 快速转场 ---------- */
      if (alreadyPlayed) {
        const quick = gsap.timeline({ onComplete: finish })
        quick
          .to(`.${styles.quickBar}`, {
            scaleX: 1,
            duration: 0.26,
            ease: 'power3.inOut',
            transformOrigin: 'left center',
          })
          .to(root, { autoAlpha: 0, duration: 0.24, ease: 'power2.out' }, '+=0.02')
        tlRef.current = quick
        return
      }

      /* ---------- 首次访问：完整 Opening ---------- */
      const counter = { value: 0 }
      const tl = gsap.timeline({ onComplete: finish })
      tlRef.current = tl

      /* 阶段 1 — 扫描线 + 状态文字 + 计数 */
      tl.set(root, { autoAlpha: 1})
        .fromTo(
          `.${styles.scanline}`,
          { scaleX: 0, transformOrigin: 'left center' },
          { scaleX: 1, duration: 0.34, ease: 'power3.inOut' },
          0
        )
        .from(`.${styles.bootText}`, { autoAlpha: 0, x: -12, duration: 0.26 }, 0.06)
        .to(
          counter,
          {
            value: 100,
            duration: 0.62,
            ease: 'power2.inOut',
            onUpdate: () => {
              if (counterRef.current) {
                counterRef.current.textContent = String(Math.round(counter.value)).padStart(2, '0')
              }
            },
          },
          0.04
        )

      /* 阶段 2 — 分区遮罩退出，背景揭开 */
      tl.to(
        `.${styles.shutterUp}`,
        { yPercent: -101, duration: 0.72, ease: 'power4.out', stagger: 0.07 },
        0.4
      )
        .to(
          `.${styles.shutterDown}`,
          { yPercent: 101, duration: 0.72, ease: 'power4.out', stagger: 0.07 },
          0.44
        )
        .to(
          `.${styles.shutterSide}`,
          { xPercent: 101, duration: 0.68, ease: 'power4.out' },
          0.5
        )
        .from(
          `.${styles.guide}`,
          { scaleX: 0, scaleY: 0, duration: 0.6, ease: 'expo.out', stagger: 0.05 },
          0.62
        )
        .from(
          `.${styles.coordText}`,
          { autoAlpha: 0, duration: 0.3, stagger: 0.06 },
          0.7
        )

      /* 阶段 3 — JAZIM LAU 从压缩状态展开 */
      tl.fromTo(
        `.${styles.name}`,
        { scaleX: 0.35, letterSpacing: '-0.22em', xPercent: -6, opacity: 0.2 },
        {
          scaleX: 1,
          letterSpacing: '-0.03em',
          xPercent: 0,
          opacity: 1,
          duration: 0.8,
          ease: 'power4.out',
        },
        0.8
      ).fromTo(
        `.${styles.nameMask}`,
        { clipPath: 'inset(0% 100% 0% 0%)' },
        { clipPath: 'inset(0% 0% 0% 0%)', duration: 0.76, ease: 'power3.inOut' },
        0.8
      )

      /* 阶段 4 — 职位切入 + 状态标签 */
      tl.fromTo(
        `.${styles.role}`,
        { clipPath: 'inset(0% 0% 0% 100%)', xPercent: 4 },
        { clipPath: 'inset(0% 0% 0% 0%)', xPercent: 0, duration: 0.5, ease: 'expo.out' },
        1.5
      )
        .from(
          `.${styles.tag}`,
          { autoAlpha: 0, y: 10, duration: 0.32, stagger: 0.07, ease: 'power3.out' },
          1.62
        )
        .to(`.${styles.skip}`, { autoAlpha: 0, duration: 0.2 }, 1.9)
        .to(
          root,
          { autoAlpha: 0, duration: 0.42, ease: 'power3.inOut' },
          2.0
        )
    }, root)

    return () => {
      ctx.revert()
      setScrollLocked(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reduced])

  /** 跳过：立即结束时间轴并解锁 */
  const handleSkip = () => {
    const tl = tlRef.current
    if (tl) {
      tl.progress(1)
      tl.kill()
    }
    setScrollLocked(false)
    try {
      sessionStorage.setItem(SESSION_KEY, '1')
    } catch {
      /* noop */
    }
    setDone(true)
    onComplete()
  }

  if (done) return null

  return (
    <div ref={rootRef} className={styles.root} role="presentation">
      {/* 被遮罩揭开的背景 */}
      <div className={styles.backdrop} aria-hidden="true">
        <div className={`media-fallback ${styles.backdropMedia}`} />
        <div className={`grid-bg ${styles.backdropGrid}`} />
        <div className={`noise ${styles.backdropNoise}`} />
      </div>

      {/* 分区遮罩 */}
      <div className={styles.shutters} aria-hidden="true">
        <span className={styles.shutterUp} />
        <span className={styles.shutterUp} />
        <span className={styles.shutterDown} />
        <span className={styles.shutterDown} />
        <span className={styles.shutterSide} />
      </div>

      {/* 定位线与坐标文字 */}
      <div className={styles.guides} aria-hidden="true">
        <span className={styles.guide} />
        <span className={styles.guide} />
        <span className={styles.guide} />
        <span className={`${styles.coordText} ${styles.coordTL}`}>X 0.000 / Y 0.000</span>
        <span className={`${styles.coordText} ${styles.coordTR}`}>FRAME 001 / 24FPS</span>
        <span className={`${styles.coordText} ${styles.coordBR}`}>BUILD {profile.build}</span>
      </div>

      {/* 扫描线 */}
      <span className={styles.scanline} aria-hidden="true" />
      <span className={styles.quickBar} aria-hidden="true" />

      {/* 中央标题 */}
      <div className={styles.center}>
        <span className={styles.nameMask}>
          <span className={styles.name}>JAZIM LAU</span>
        </span>
        <span className={styles.role}>{profile.roleEn}</span>
      </div>

      {/* 左下启动状态 */}
      <div className={styles.boot}>
        <span className={styles.bootText}>INITIALIZING MOTION SYSTEM</span>
        <span className={styles.counter}>
          <span ref={counterRef}>00</span>
          <i>/100</i>
        </span>
      </div>

      {/* 右下状态标签 */}
      <div className={styles.tags}>
        <span className={styles.tag}>MOTION SYSTEM ONLINE</span>
        <span className={styles.tag}>ASSETS LOADED</span>
        <span className={styles.tag}>READY</span>
      </div>

      <button type="button" className={styles.skip} onClick={handleSkip}>
        SKIP INTRO
      </button>
    </div>
  )
}
