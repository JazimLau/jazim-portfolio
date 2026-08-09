import { useEffect, useRef, useState } from 'react'
import { ChevronDown, Play } from 'lucide-react'
import { gsap, ScrollTrigger } from '../../lib/gsap'
import { profile } from '../../data/profile'
import { scrollToId } from '../../lib/smoothScroll'
import { useReducedMotion, useIsCompact } from '../../hooks/useReducedMotion'
import { useIdleGlitch } from '../../hooks/useIdleGlitch'
import { useUI } from '../../context/UIContext'
import { MagneticButton } from '../ui/MagneticButton'
import { StatusBadge } from '../ui/StatusBadge'
import { PixelPurge } from '../ui/PixelPurge'
import { PixelSceneBackground } from '../ui/PixelSceneBackground'
import styles from './Hero.module.css'

interface HeroProps {
  /** Opening 结束后才播放首屏动画 */
  play: boolean
  /** 递增该值会重播一次简化版标题动画（Contact 的 BACK TO TOP 使用） */
  replayKey?: number
}

/** 监视器与标题之间的轻量系统信息：当前专注 / 正在精进 / 当前状态 */
const SYSTEM_MODULES: {
  code: string
  label: [string, string]
  items: [string, string][]
}[] = [
  {
    code: 'FOCUS',
    label: ['当前专注', 'Current Focus'],
    items: [
      ['游戏UI动效', 'Game UI motion'],
      ['端外产品动态设计', 'Off-client product motion'],
      ['视频视觉表达', 'Video storytelling'],
    ],
  },
  {
    code: 'LEVELING',
    label: ['正在精进', 'Leveling Up'],
    items: [
      ['UE5 动效实现', 'UE5 motion'],
      ['Unity UI 动效', 'Unity UI motion'],
      ['AIGC 动效工作流', 'AIGC workflow'],
    ],
  },
  {
    code: 'STATUS',
    label: ['当前状态', 'Current Status'],
    items: [
      ['雷火动效实习', 'Leihuo motion intern'],
      ['设计学硕士在读', 'MA Design student'],
      ['开放交流与岗位沟通', 'Open to chat & roles'],
    ],
  },
]

/* ══════════════ 监视器实时时钟（独立小组件） ══════════════
   每秒只重渲染自己显示的两个文本节点，不再带动整个 Hero（左侧标题/系统卡/CTA…）
   一起重渲染，避免每秒一次的大范围 React render。 */

/** 北京时间 hh:mm:ss */
function RecTime() {
  const [text, setText] = useState('00:00:00')
  useEffect(() => {
    const fmt = () => {
      const parts = new Intl.DateTimeFormat('en-GB', {
        timeZone: 'Asia/Shanghai',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
      }).formatToParts(new Date())
      const g = (type: string) => parts.find((p) => p.type === type)?.value ?? '00'
      return `${g('hour')}:${g('minute')}:${g('second')}`
    }
    setText(fmt())
    const id = window.setInterval(() => setText(fmt()), 1000)
    return () => window.clearInterval(id)
  }, [])
  return <span className={styles.recTime}>{text}</span>
}

/** 北京时间 yyyy / mm / dd + 个人系统编号 */
function CoordsDate() {
  const [text, setText] = useState('---- / -- / --')
  useEffect(() => {
    const fmt = () => {
      const parts = new Intl.DateTimeFormat('en-CA', {
        timeZone: 'Asia/Shanghai',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      }).formatToParts(new Date())
      const g = (type: string) => parts.find((p) => p.type === type)?.value ?? '--'
      return `${g('year')} / ${g('month')} / ${g('day')}`
    }
    setText(fmt())
    const id = window.setInterval(() => setText(fmt()), 1000)
    return () => window.clearInterval(id)
  }, [])
  return <span className={styles.coords}>{text} / JL-2027</span>
}

/**
 * Hero 首屏 —— 未来像素游戏界面。
 * 左右分栏：左侧 56% 身份信息（标题三行 + 署名 + 定位 + CTA），
 * 右侧 44% 一个 MOTION MONITOR 系统监视器（项目档案数据 + 进度 + 能力状态）。
 * 标题三行以不同方向进入/离开；监视器以切角遮罩揭示。
 */
export function Hero({ play, replayKey = 0 }: HeroProps) {
  const rootRef = useRef<HTMLElement>(null)
  const bgRef = useRef<HTMLDivElement>(null)
  const fgRef = useRef<HTMLDivElement>(null)
  const monitorRef = useRef<HTMLDivElement>(null)

  const reduced = useReducedMotion()
  const isCompact = useIsCompact()
  const { t, tx } = useUI()

  /* 主标题三行的低频待机故障动画（首页标题稍强，reduced-motion 关闭） */
  const line1Ref = useIdleGlitch<HTMLSpanElement>(!reduced)
  const line2Ref = useIdleGlitch<HTMLSpanElement>(!reduced)
  const line3Ref = useIdleGlitch<HTMLSpanElement>(!reduced)

  /* 首页总作品集监视器使用自己的 metadata（不继承具体项目，避免口径偏移） */

  /* ══════════════ 入场动画 ══════════════ */
  useEffect(() => {
    const root = rootRef.current
    if (!root || !play) return
    if (reduced) return

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: 'power4.out' } })

      tl.fromTo(
        `.${styles.kicker}`,
        { clipPath: 'inset(0% 100% 0% 0%)' },
        { clipPath: 'inset(0% 0% 0% 0%)', duration: 0.7, ease: 'power3.inOut' }
      )
        // 三行主标题：不同方向、不同压缩量，到位后不弹跳
        .fromTo(
          `.${styles.line1}`,
          { xPercent: -26, scaleX: 0.74, clipPath: 'inset(0% 100% 0% 0%)' },
          { xPercent: 0, scaleX: 1, clipPath: 'inset(0% 0% 0% 0%)', duration: 1.25 },
          0.12
        )
        .fromTo(
          `.${styles.line2}`,
          { xPercent: 20, scaleX: 0.8, clipPath: 'inset(0% 0% 0% 100%)' },
          { xPercent: 0, scaleX: 1, clipPath: 'inset(0% 0% 0% 0%)', duration: 1.25 },
          0.24
        )
        .fromTo(
          `.${styles.line3}`,
          { xPercent: -14, scaleX: 0.86, clipPath: 'inset(0% 100% 0% 0%)' },
          { xPercent: 0, scaleX: 1, clipPath: 'inset(0% 0% 0% 0%)', duration: 1.25 },
          0.36
        )
        .fromTo(
          `.${styles.nameBlock} > *`,
          { yPercent: 130 },
          { yPercent: 0, duration: 0.8, stagger: 0.08 },
          0.55
        )
        .fromTo(
          `.${styles.desc} > span`,
          { yPercent: 110 },
          { yPercent: 0, duration: 0.9, stagger: 0.08, ease: 'power3.out' },
          0.62
        )
        .fromTo(
          `.${styles.disciplines} li`,
          { yPercent: 120 },
          { yPercent: 0, duration: 0.6, stagger: 0.05, ease: 'power3.out' },
          0.72
        )
        .fromTo(
          `.${styles.ctaRow} > *`,
          { yPercent: 60, clipPath: 'inset(0% 0% 100% 0%)' },
          { yPercent: 0, clipPath: 'inset(0% 0% 0% 0%)', duration: 0.7, stagger: 0.08 },
          0.82
        )
        // 监视器：切角遮罩 + 面板进入
        .fromTo(
          `.${styles.monitor}`,
          { clipPath: 'inset(0% 100% 0% 0%)', xPercent: 10 },
          { clipPath: 'inset(0% 0% 0% 0%)', xPercent: 0, duration: 1.1 },
          0.5
        )
        // 监视器数据行
        .fromTo(
          `.${styles.dataRow}`,
          { xPercent: 8, opacity: 0 },
          { xPercent: 0, opacity: 1, duration: 0.55, stagger: 0.07, ease: 'power3.out' },
          0.68
        )
        // 监视器能力状态
        .fromTo(
          `.${styles.capability}`,
          { yPercent: 100 },
          { yPercent: 0, duration: 0.5, stagger: 0.06, ease: 'power3.out' },
          0.9
        )
        // 进度条加载
        .fromTo(
          `.${styles.progressFill}`,
          { scaleX: 0 },
          { scaleX: 1, duration: 1.1, ease: 'power2.inOut' },
          0.75
        )
        .fromTo(
          `.${styles.badges} > *`,
          { autoAlpha: 0, y: 8 },
          { autoAlpha: 1, y: 0, duration: 0.4, stagger: 0.07 },
          1.05
        )
        .fromTo(
          `.${styles.statusItem}`,
          { yPercent: 110 },
          { yPercent: 0, duration: 0.55, stagger: 0.06, ease: 'power3.out' },
          1.12
        )
    }, root)

    return () => ctx.revert()
  }, [play, reduced])

  /* ══════════════ 简化版标题重播（BACK TO TOP 后） ══════════════ */
  useEffect(() => {
    const root = rootRef.current
    if (!root || replayKey === 0 || reduced) return

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: 'power4.out' } })
      tl.fromTo(
        `.${styles.line1}`,
        { xPercent: -18, scaleX: 0.82, clipPath: 'inset(0% 100% 0% 0%)' },
        { xPercent: 0, scaleX: 1, clipPath: 'inset(0% 0% 0% 0%)', duration: 0.8 },
        0
      )
        .fromTo(
          `.${styles.line2}`,
          { xPercent: 15, scaleX: 0.86, clipPath: 'inset(0% 0% 0% 100%)' },
          { xPercent: 0, scaleX: 1, clipPath: 'inset(0% 0% 0% 0%)', duration: 0.8 },
          0.08
        )
        .fromTo(
          `.${styles.line3}`,
          { xPercent: -10, scaleX: 0.9, clipPath: 'inset(0% 100% 0% 0%)' },
          { xPercent: 0, scaleX: 1, clipPath: 'inset(0% 0% 0% 0%)', duration: 0.8 },
          0.16
        )
        .fromTo(
          `.${styles.kicker}`,
          { clipPath: 'inset(0% 100% 0% 0%)' },
          { clipPath: 'inset(0% 0% 0% 0%)', duration: 0.5, ease: 'power3.inOut' },
          0
        )
    }, root)

    return () => ctx.revert()
  }, [replayKey, reduced])

  /* ══════════════ 滚动离场：背景放大 + 标题分向退出 + 监视器上移 ══════════════ */
  useEffect(() => {
    const root = rootRef.current
    if (!root || !play || reduced) return

    let ctx: gsap.Context | undefined

    const timer = gsap.delayedCall(1.8, () => {
      ctx = gsap.context(() => {
        gsap.fromTo(
          `.${styles.bgInner}`,
          { scale: 1 },
          {
            scale: 1.06,
            immediateRender: false,
            ease: 'none',
            scrollTrigger: {
              trigger: root,
              start: 'top top',
              end: 'bottom top',
              scrub: 0.6,
            },
          }
        )

        gsap.fromTo(
          `.${styles.line1}`,
          { xPercent: 0 },
          {
            xPercent: -10,
            immediateRender: false,
            ease: 'none',
            scrollTrigger: { trigger: root, start: 'top top', end: 'bottom top', scrub: 0.8 },
          }
        )
        gsap.fromTo(
          `.${styles.line2}`,
          { xPercent: 0 },
          {
            xPercent: 12,
            immediateRender: false,
            ease: 'none',
            scrollTrigger: { trigger: root, start: 'top top', end: 'bottom top', scrub: 0.8 },
          }
        )
        gsap.fromTo(
          `.${styles.line3}`,
          { xPercent: 0, yPercent: 0 },
          {
            xPercent: -6,
            yPercent: 8,
            immediateRender: false,
            ease: 'none',
            scrollTrigger: { trigger: root, start: 'top top', end: 'bottom top', scrub: 0.8 },
          }
        )
        gsap.fromTo(
          `.${styles.monitorCol}`,
          { yPercent: 0 },
          {
            yPercent: -14,
            immediateRender: false,
            ease: 'none',
            scrollTrigger: { trigger: root, start: 'top top', end: 'bottom top', scrub: 0.8 },
          }
        )
      }, root)
    })

    return () => {
      timer.kill()
      ctx?.revert()
      ScrollTrigger.refresh()
    }
  }, [play, reduced])

  /* ══════════════ 鼠标分层视差（幅度很小：标题 ≤2px / 监视器 ≤5px） ══════════════ */
  useEffect(() => {
    const root = rootRef.current
    const bg = bgRef.current
    const fg = fgRef.current
    const monitor = monitorRef.current
    if (!root || !bg || !fg || !monitor) return
    if (reduced || isCompact) return

    const bgX = gsap.quickTo(bg, 'x', { duration: 1.1, ease: 'power3.out' })
    const bgY = gsap.quickTo(bg, 'y', { duration: 1.1, ease: 'power3.out' })
    const fgX = gsap.quickTo(fg, 'x', { duration: 0.9, ease: 'power3.out' })
    const fgY = gsap.quickTo(fg, 'y', { duration: 0.9, ease: 'power3.out' })
    const mX = gsap.quickTo(monitor, 'x', { duration: 0.9, ease: 'power3.out' })
    const mY = gsap.quickTo(monitor, 'y', { duration: 0.9, ease: 'power3.out' })

    const onMove = (e: PointerEvent) => {
      const rect = root.getBoundingClientRect()
      const nx = (e.clientX - rect.left) / rect.width - 0.5
      const ny = (e.clientY - rect.top) / rect.height - 0.5

      // 背景位移最大，前景标题 ≤2px，监视器 ≤5px，形成轻微分层
      bgX(nx * -20)
      bgY(ny * -14)
      fgX(nx * 4)
      fgY(ny * 2)
      mX(nx * -5)
      mY(ny * -3)
    }

    const onLeave = () => {
      bgX(0)
      bgY(0)
      fgX(0)
      fgY(0)
      mX(0)
      mY(0)
    }

    root.addEventListener('pointermove', onMove)
    root.addEventListener('pointerleave', onLeave)
    return () => {
      root.removeEventListener('pointermove', onMove)
      root.removeEventListener('pointerleave', onLeave)
    }
  }, [reduced, isCompact])

  return (
    <section id="home" ref={rootRef} className={styles.hero} aria-label={t('首页', 'Home')}>
      {/* ══════════ 背景：纯 CSS 设计化底板（渐变 + 像素网格 + 噪点 + 扫描线） ══════════ */}
      <div ref={bgRef} className={styles.bg} aria-hidden="true">
        <div className={styles.bgInner}>
          <div className={`media-fallback ${styles.bgFallback}`} />
        </div>
        {/* 压暗、渐变与颗粒，保证文字可读 */}
        <div className={styles.bgVeil} />
        <div className={`grid-bg ${styles.bgGrid}`} />
        <div className={`noise ${styles.bgNoise}`} />
        <div className={`scanlines ${styles.bgScan}`} />
      </div>

      {/* 大尺度像素场景背景：左侧阶梯块 + 右上监视器区 + 信号轨道 */}
      <PixelSceneBackground variant="hero" />

      {/* ══════════ 前景：左 56% 身份信息 / 右 44% MOTION MONITOR ══════════ */}
      <div ref={fgRef} className={`${styles.content} shell`}>
        <div className={styles.grid}>
          {/* ────────── 左侧：身份信息 ────────── */}
          <div className={styles.infoCol}>
            <h1 className={styles.title}>
              <span className={styles.titleLine}>
                <span ref={line1Ref} className={`${styles.line1} ${styles.lineName}`}>
                  JAZIM
                </span>
              </span>
              <span className={styles.titleLine}>
                <span ref={line2Ref} className={`${styles.line2} ${styles.lineName}`}>
                  LAU
                </span>
              </span>
              <span className={styles.titleLine}>
                <span ref={line3Ref} className={`${styles.line3} ${styles.accentLine}`}>
                  PORTFOLIO
                </span>
              </span>
            </h1>

            {/* 小型身份标签：中文姓名 / 品牌名（不与主标题竞争） */}
            <div className={styles.nameBlock}>
              <span className={styles.nameAlt}>
                <i className={styles.nameRule} aria-hidden="true" />
                {t('刘俊熙 / JAZIM LAU', 'JAZIM LAU / Liu Junxi')}
              </span>
            </div>

            <p className={styles.roleZh}>{tx(profile.roleZh)}</p>

            <p className={styles.desc}>
              <span>{tx(profile.positioningShort)}</span>
            </p>

            <ul className={styles.disciplines}>
              {profile.disciplines.map((d) => (
                <li key={d}>{d}</li>
              ))}
            </ul>

            {/* 轻量系统信息：当前专注 / 正在精进 / 当前状态 —— 填充标题与监视器之间的留白 */}
            <div className={styles.systemInfo}>
              {SYSTEM_MODULES.map((mod) => (
                <div key={mod.code} className={styles.sysCard}>
                  <span className={styles.sysHead}>
                    <span className={styles.sysCode}>{mod.code}</span>
                    <span className={styles.sysLight} aria-hidden="true" />
                    <span className={styles.sysLabel}>
                      {t(mod.label[0], mod.label[1])}
                    </span>
                  </span>
                  <ul className={styles.sysList}>
                    {mod.items.map(([cn, en]) => (
                      <li key={cn}>
                        {t(cn, en)}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            <div className={styles.ctaRow}>
              <MagneticButton
                variant="outline"
                size="lg"
                arrow
                className={styles.heroCta}
                href={profile.cvPath}
                download
                ariaLabel={t('下载简历 PDF', 'Download CV as PDF')}
              >
                {t('简历下载', 'DOWNLOAD CV')}
              </MagneticButton>
              <MagneticButton
                variant="outline"
                size="lg"
                arrow
                className={styles.heroCta}
                onClick={() => scrollToId('contact')}
                ariaLabel={t('联系我', 'Contact me')}
              >
                {t('联系我', 'CONTACT ME')}
              </MagneticButton>
            </div>
          </div>

          {/* ────────── 右侧：MOTION MONITOR 系统监视器 ────────── */}
          <div className={styles.monitorCol}>
            {/* PLAYER PROFILE / 2027：右上角 HUD 标签，位于监视器上方（右对齐） */}
            <span className={styles.kicker}>{profile.kicker}</span>
            <div ref={monitorRef} className={styles.monitor}>
              {/* 四角定位线 */}
              <i className={styles.corner} aria-hidden="true" />
              <i className={styles.corner} aria-hidden="true" />
              <i className={styles.corner} aria-hidden="true" />
              <i className={styles.corner} aria-hidden="true" />
              {/* 坐标文字：实时日期 + 个人系统编号（独立组件，每秒只刷新自身） */}
              <CoordsDate />

              {/* 顶栏 */}
              <div className={styles.monitorTop}>
                <span className={styles.monitorTitle}>MOTION MONITOR</span>
                <span className={styles.rec}>
                  <i className={styles.recDot} />
                  REC <RecTime />
                </span>
              </div>

              {/* 画面：像素粒子消除小游戏 + 网格框 */}
              <div className={styles.screen}>
                <span className={styles.screenTag}>
                  {t('动效信号', 'MOTION SIGNAL')}
                </span>
                <span className={styles.screenMark}>JL</span>
                <PixelPurge />
                <span className={styles.screenSafe} aria-hidden="true" />
                <span className={styles.screenFrame} aria-hidden="true" />
              </div>

              {/* 项目档案数据 */}
              <dl className={styles.data}>
                <div className={styles.dataRow}>
                  <dt>{t('项目编号', 'PROJECT ID')}</dt>
                  <dd>GMD-01</dd>
                </div>
                <div className={styles.dataRow}>
                  <dt>{t('项目名称', 'NAME')}</dt>
                  <dd>{t('游戏动效作品集', 'GAME MOTION PORTFOLIO')}</dd>
                </div>
                <div className={`${styles.dataRow} ${styles.catRow}`}>
                  <dt>{t('类别', 'CATEGORY')}</dt>
                  <dd>{t('UI 动效 / 游戏动态设计 / 视频设计', 'UI MOTION / GAME MOTION / VIDEO')}</dd>
                </div>
                <div className={styles.dataRow}>
                  <dt>{t('年份', 'YEAR')}</dt>
                  <dd>2026</dd>
                </div>
                <div className={styles.dataRow}>
                  <dt>{t('状态', 'STATUS')}</dt>
                  <dd className={styles.statusOn}>{t('进行中', 'ONGOING')}</dd>
                </div>
                <div className={styles.dataRow}>
                  <dt>{t('可预览', 'READY-PREVIEW')}</dt>
                  <dd>{t('就绪', 'READY')}</dd>
                </div>
              </dl>

              {/* 像素进度条：纯 UI 装饰（满格），不标注职业数据型百分比 */}
              <div className={styles.progress}>
                <span className={styles.progressLabel}>PORTFOLIO STATUS</span>
                <span className={styles.progressTrack}>
                  <i className={styles.progressFill} />
                </span>
                <span className={styles.progressPct}>READY</span>
              </div>

              {/* 底部操作 + 能力状态 */}
              <div className={styles.monitorFoot}>
                <button
                  type="button"
                  className={styles.playBtn}
                  onClick={() => scrollToId('projects')}
                  aria-label={t('查看项目', 'Play preview')}
                >
                  <Play size={12} strokeWidth={2.4} />
                  <span>{t('查看项目', 'PLAY PREVIEW')}</span>
                </button>
              </div>

              <ul className={styles.capabilities}>
                <li className={styles.capability}>
                  <b>{t('UI动效', 'UI MOTION')}</b>
                  <span>— {t('核心', 'CORE')}</span>
                </li>
                <li className={styles.capability}>
                  <b>{t('视频设计', 'VIDEO DESIGN')}</b>
                  <span>— {t('熟练', 'PROFICIENT')}</span>
                </li>
                <li className={styles.capability}>
                  <b>{t('引擎实践', 'ENGINE PRACTICE')}</b>
                  <span>— {t('实践中', 'PRACTICE')}</span>
                </li>
              </ul>
            </div>

            {/* 监视器下方状态补充：MOTION SYSTEM ONLINE · STUDENT / INTERN · BASED IN GBA
                （正常文档流，与监视器左右边界对齐，不属于左侧正文） */}
            <div className={styles.badges}>
              {profile.statuses.slice(0, 3).map((s) => (
                <StatusBadge
                  key={s.label}
                  label={s.label}
                  tone={s.tone}
                  live={s.tone === 'lime'}
                />
              ))}
            </div>
          </div>
        </div>

        {/* ══════════ 底部状态栏（全宽系统状态条） ══════════ */}
        <div className={styles.statusBar}>
          {profile.heroStatusBar.map((item, i) => (
            <span key={item} className={styles.statusItem}>
              {i === 0 && <i className={`dot dot-breathe ${styles.statusDot}`} />}
              {item}
              {i === profile.heroStatusBar.length - 1 && (
                <ChevronDown size={12} className={styles.scrollIcon} />
              )}
            </span>
          ))}
        </div>
      </div>
    </section>
  )
}
