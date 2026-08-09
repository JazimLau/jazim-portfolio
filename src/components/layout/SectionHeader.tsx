import { useRef } from 'react'
import { gsap } from '../../lib/gsap'
import { useGsapContext } from '../../hooks/useGsapContext'
import { useReducedMotion } from '../../hooks/useReducedMotion'
import { useIdleGlitch } from '../../hooks/useIdleGlitch'
import { DUR, EASE, STAGGER, TRIGGER } from '../../lib/motion'
import styles from './SectionHeader.module.css'

interface SectionHeaderProps {
  /** 章节编号，例如 '03' */
  index: string
  /** 章节代号，例如 'CHARACTER PROFILE' */
  code: string
  /** 英文大标题 */
  titleEn: string
  /** 中文标题 */
  titleZh: string
  description?: string
  align?: 'left' | 'center'
  className?: string
  /** 强调色（CSS 变量值），默认 --accent-purple */
  accent?: string
  /** 紧凑尺寸：减小大标题字号与间距，让首屏更快露出核心正文（Profile 使用） */
  size?: 'default' | 'compact'
}

/**
 * 统一的章节抬头。
 * 大标题从视口外大幅进入（-22vw）+ 横向压缩归位 + clip-path 揭示，
 * 到位后不弹跳；编号、代号按不同时间差进入。
 * 中文副标题不再另起一段，改成贴在英文大标题右下角的描边小角标。
 */
export function SectionHeader({
  index,
  code,
  titleEn,
  titleZh,
  description,
  align = 'left',
  className = '',
  accent,
  size = 'default',
}: SectionHeaderProps) {
  const rootRef = useRef<HTMLDivElement>(null)
  const reduced = useReducedMotion()
  const titleRef = useIdleGlitch<HTMLSpanElement>(!reduced)

  useGsapContext(
    () => {
      if (reduced) return

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: rootRef.current,
          start: TRIGGER.start,
          once: true,
        },
      })

      tl.from(`.${styles.kicker} > *`, {
        yPercent: 130,
        duration: DUR.element,
        ease: EASE.element,
        stagger: STAGGER.tags,
      })
        .from(
          `.${styles.titleInner}`,
          {
            xPercent: -22,
            scaleX: 0.68,
            clipPath: 'inset(0% 100% 0% 0%)',
            duration: DUR.titleInSlow,
            ease: EASE.title,
          },
          0.06
        )
        .from(
          `.${styles.zh}`,
          {
            xPercent: 8,
            clipPath: 'inset(0% 0% 0% 100%)',
            duration: DUR.element,
            ease: EASE.media,
          },
          0.36
        )
        .from(
          `.${styles.zhRule}`,
          { scaleX: 0, duration: DUR.transition, ease: EASE.transition },
          0.32
        )

      if (description) {
        tl.from(
          `.${styles.desc}`,
          { yPercent: 40, opacity: 0, duration: DUR.element, ease: EASE.element },
          0.42
        )
      }
    },
    [reduced, description],
    rootRef
  )

  return (
    <div
      ref={rootRef}
      className={`${styles.root} ${align === 'center' ? styles.center : ''} ${
        size === 'compact' ? styles.compact : ''
      } ${className}`}
      style={accent ? { ['--section-accent' as string]: accent } : undefined}
    >
      <div className={styles.kicker}>
        <span className={styles.index}>{index}</span>
        <span className={styles.slash}>/</span>
        <span className={styles.code}>{code}</span>
      </div>

      <div className={styles.titleWrap}>
        <h2 className={styles.title}>
          <span ref={titleRef} className={styles.titleInner}>
            {titleEn}
          </span>
        </h2>

        <div className={styles.zhCorner}>
          <i className={styles.zhRule} aria-hidden="true" />
          <span className={styles.zh}>{titleZh}</span>
        </div>
      </div>

      {description && <p className={styles.desc}>{description}</p>}
    </div>
  )
}
