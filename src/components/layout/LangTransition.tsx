import { useEffect, useRef } from 'react'
import { gsap, ScrollTrigger } from '../../lib/gsap'
import { useReducedMotion } from '../../hooks/useReducedMotion'
import { useUI } from '../../context/UIContext'
import { LANG_META } from '../../data/i18n'
import styles from './LangTransition.module.css'

/** 遮罩竖条数量。奇数条能让中缝落在正中，收束时视觉更稳 */
const BANDS = 7

/**
 * 语言切换过渡。
 * 七条竖向面板自下而上错位覆盖，覆盖完成的瞬间才提交语言（commitLang），
 * 之后面板自上而下退出 —— 所以用户看到的是一次"系统换语言包"的动作，
 * 而不是文案在原地硬切。
 * 文案长度变化会影响布局，退出后统一 ScrollTrigger.refresh()。
 */
export function LangTransition() {
  const { pendingLang, commitLang, finishLangSwitch } = useUI()
  const rootRef = useRef<HTMLDivElement>(null)
  const bandsRef = useRef<HTMLSpanElement[]>([])
  const labelRef = useRef<HTMLDivElement>(null)
  const reduced = useReducedMotion()

  useEffect(() => {
    if (!pendingLang) return
    const root = rootRef.current
    const bands = bandsRef.current.filter(Boolean)
    if (!root || bands.length === 0) return

    /* 降级模式：不做位移动画，只用极短的暗场遮一下，避免闪烁 */
    if (reduced) {
      const ctx = gsap.context(() => {
        gsap.set(root, { autoAlpha: 1 })
        gsap.set(bands, { scaleY: 1, transformOrigin: 'center center' })
        gsap
          .timeline({
            onComplete: () => {
              ScrollTrigger.refresh()
              finishLangSwitch()
            },
          })
          .to(root, { autoAlpha: 1, duration: 0.14 })
          .add(commitLang)
          .to(root, { autoAlpha: 0, duration: 0.2 })
      })
      return () => {
        ctx.revert()
      }
    }

    const ctx = gsap.context(() => {
      gsap.set(root, { autoAlpha: 1 })
      gsap.set(bands, { scaleY: 0, transformOrigin: 'bottom center' })
      gsap.set(labelRef.current, { autoAlpha: 0, yPercent: 40 })

      const tl = gsap.timeline({
        onComplete: () => {
          // 中英文行高、字数不同，布局会变，必须重算所有触发点
          ScrollTrigger.refresh()
          finishLangSwitch()
        },
      })

      tl
        /* ── 覆盖 ── */
        .to(bands, {
          scaleY: 1,
          duration: 0.46,
          ease: 'power4.inOut',
          stagger: { each: 0.042, from: 'start' },
        })
        .to(
          labelRef.current,
          { autoAlpha: 1, yPercent: 0, duration: 0.34, ease: 'power3.out' },
          '-=0.2'
        )
        /* ── 完全遮住的瞬间换语言包 ── */
        .add(commitLang)
        .to(labelRef.current, { autoAlpha: 0, duration: 0.22, ease: 'power2.in' }, '+=0.1')
        /* ── 退出：换成上边缘为轴，形成"抽走"的方向感 ── */
        .set(bands, { transformOrigin: 'top center' })
        .to(bands, {
          scaleY: 0,
          duration: 0.56,
          ease: 'power4.inOut',
          stagger: { each: 0.038, from: 'end' },
        })
        .set(root, { autoAlpha: 0 })
    })

    return () => {
      ctx.revert()
    }
    // commitLang / finishLangSwitch 在一次切换内保持稳定，只以 pendingLang 为触发源
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingLang, reduced])

  const target = pendingLang ?? 'CN'

  return (
    <div ref={rootRef} className={styles.root} aria-hidden="true">
      <div className={styles.bands}>
        {Array.from({ length: BANDS }).map((_, i) => (
          <span
            key={i}
            className={styles.band}
            ref={(el) => {
              if (el) bandsRef.current[i] = el
            }}
          />
        ))}
      </div>

      <div ref={labelRef} className={styles.label}>
        <span className={styles.labelKicker}>SWITCHING LANGUAGE PACK</span>
        <span className={styles.labelCode}>{LANG_META[target].code}</span>
        <span className={styles.labelName}>
          {target === 'CN' ? LANG_META.CN.label.cn : LANG_META.EN.label.en}
        </span>
        <span className={styles.labelBar}>
          <i />
        </span>
      </div>
    </div>
  )
}
