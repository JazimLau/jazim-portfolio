import { useEffect, useRef } from 'react'
import { gsap } from '../lib/gsap'
import { useReducedMotion } from '../hooks/useReducedMotion'
import { useUI } from '../context/UIContext'
import { MagneticButton } from '../components/ui/MagneticButton'
import { profile } from '../data/profile'
import styles from './NotFoundPage.module.css'

/** 404 —— 信号丢失。保持与全站一致的系统终端语言。 */
export function NotFoundPage() {
  const rootRef = useRef<HTMLElement>(null)
  const reduced = useReducedMotion()
  const { t } = useUI()

  useEffect(() => {
    const root = rootRef.current
    if (!root || reduced) return

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: 'power4.out' } })
      tl.from(`.${styles.code}`, {
        xPercent: -30,
        scaleX: 0.7,
        clipPath: 'inset(0% 100% 0% 0%)',
        duration: 1.3,
      })
        .from(`.${styles.title}`, { yPercent: 120, duration: 0.85 }, 0.18)
        .from(`.${styles.text}`, { opacity: 0, y: 20, duration: 0.7 }, 0.34)
        .from(`.${styles.actions} > *`, { yPercent: 60, opacity: 0, duration: 0.6, stagger: 0.08 }, 0.44)
        .from(`.${styles.metaItem}`, { opacity: 0, duration: 0.4, stagger: 0.06 }, 0.5)

      // 一条循环扫描线，暗示"信号搜索中"
      gsap.fromTo(
        `.${styles.scan}`,
        { yPercent: -50 },
        { yPercent: 150, duration: 3.4, ease: 'none', repeat: -1 }
      )
    }, root)

    return () => ctx.revert()
  }, [reduced])

  return (
    <main ref={rootRef} className={styles.root}>
      <div className={`grid-bg ${styles.grid}`} aria-hidden="true" />
      <span className={styles.scan} aria-hidden="true" />
      <div className={`noise ${styles.noise}`} aria-hidden="true" />

      <div className={`${styles.inner} shell`}>
        <span className={styles.codeWrap}>
          <span className={styles.code}>404</span>
        </span>

        <span className={styles.titleWrap}>
          <h1 className={styles.title}>SIGNAL LOST</h1>
        </span>

        <p className={styles.text}>
          {t(
            '请求的模块不在当前构建中。可能是链接已失效，或者该内容尚未上线。',
            'The module you asked for is not in this build — the link may be stale, or the content is not published yet.'
          )}
          <br />
          <span className={styles.textEn}>THE REQUESTED MODULE IS NOT PART OF THIS BUILD.</span>
        </p>

        <div className={styles.actions}>
          <MagneticButton
            to="/"
            variant="solid"
            size="lg"
            arrow
            ariaLabel={t('返回首页', 'Back to home')}
          >
            BACK TO HOME
          </MagneticButton>
          <MagneticButton
            href={`mailto:${profile.email}`}
            variant="outline"
            size="lg"
            arrow
            ariaLabel={t('发送邮件', 'Send an email')}
          >
            REPORT ISSUE
          </MagneticButton>
        </div>

        <ul className={styles.meta}>
          <li className={styles.metaItem}>BUILD {profile.build}</li>
          <li className={styles.metaItem}>{profile.nameEn}</li>
          <li className={styles.metaItem}>GAME MOTION · VIDEO DESIGN</li>
        </ul>
      </div>
    </main>
  )
}
