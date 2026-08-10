import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { ChevronLeft, ChevronRight, GripHorizontal } from 'lucide-react'
import {
  filterProjects,
  getDisplayItems,
  level2Meta,
  projectFilters,
  projectSubFilters,
  projectVideoCount,
  subFilterVideoCount,
  TRACK_META,
} from '../../data/projects'
import type { ProjectFilterId } from '../../data/types'
import { gsap } from '../../lib/gsap'
import { useGsapContext } from '../../hooks/useGsapContext'
import { useReducedMotion, useIsCompact } from '../../hooks/useReducedMotion'
import { useUI } from '../../context/UIContext'
import { EASE, TRIGGER } from '../../lib/motion'
import { SectionHeader } from '../layout/SectionHeader'
import { ProjectCard } from '../ui/ProjectCard'
import { PixelSceneBackground } from '../ui/PixelSceneBackground'
import { SystemDivider } from '../ui/SystemDivider'
import type { CardPosition } from '../ui/ProjectCard'
import styles from './Projects.module.css'

interface ProjectsProps {
  filter: ProjectFilterId | 'all'
  onFilterChange: (f: ProjectFilterId | 'all') => void
}

/** 卡片占舞台宽度的比例（留出两侧相邻卡片的露出部分） */
const CARD_RATIO = 0.78
const GAP = 26
const DRAG_THRESHOLD = 70

/**
 * Projects —— 未来项目数据库。
 * 一次突出一个项目，相邻项目在左右边缘露出，形成可切换的项目序列。
 * 四种切换方式：滚轮、拖拽、左右箭头、键盘方向键。
 * 切换时当前卡片先横向压缩再滑出，下一张从相反方向展开，
 * 背景超大项目编号同步切换。
 */
export function Projects({ filter, onFilterChange }: ProjectsProps) {
  const rootRef = useRef<HTMLElement>(null)
  const stageRef = useRef<HTMLDivElement>(null)
  const trackRef = useRef<HTMLDivElement>(null)
  const ghostRef = useRef<HTMLSpanElement>(null)
  const subGridRef = useRef<HTMLDivElement>(null)

  const reduced = useReducedMotion()
  const isCompact = useIsCompact()
  const { t, tx, lang, projectsState, setProjectsState } = useUI()

  const [stageWidth, setStageWidth] = useState(0)
  /* 从详情页返回时恢复进入前的卡片位置 */
  const [active, setActive] = useState(() => Math.max(0, projectsState.index))
  /* 活动卡的受控视频序号：从案例返回时恢复离开前的 activeVideoIndex；
     用户主动切换产品 / 模块时归零（与"从案例返回"两个行为严格区分）。 */
  const [videoIndex, setVideoIndex] = useState(() => Math.max(0, projectsState.videoIndex ?? 0))
  const [dragging, setDragging] = useState(false)

  const wheelAcc = useRef(0)
  const wheelLock = useRef(false)
  const dragStart = useRef(0)
  const dragDelta = useRef(0)
  const prevActive = useRef(0)
  /* 主动切换产品时重置视频到第一条（挂载恢复现场状态时不重置） */
  const prevActiveForVideo = useRef(active)
  useEffect(() => {
    if (prevActiveForVideo.current !== active) {
      prevActiveForVideo.current = active
      setVideoIndex(0)
    }
  }, [active])
  /* 记录上一次筛选，只在筛选真正变化时回到第一张（挂载恢复现场状态时不重置） */
  const prevFilterRef = useRef(filter)
  /* 展示列表：有子案例的模块始终展示整个模块的全部作品，
     左右切换键可在模块内自由浏览全部作品。 */
  const list = getDisplayItems(filter, 'all')
  const total = list.length
  const current = list[Math.min(active, Math.max(0, total - 1))]

  const subFilters = projectSubFilters[filter as ProjectFilterId]
  /* 二级筛选高亮跟随当前卡片：滚轮 / 拖拽 / 箭头 / 圆点切换项目时，
     筛选按钮随当前项目变色，不再固定停在「全部」。
     当前卡片命中某子筛选项就点亮对应 chip；否则（无子筛选模块 / 卡片不映射）回落「全部」。 */
  const activeSub = subFilters?.some((sf) => sf.id === current?.caseId)
    ? (current?.caseId as string)
    : 'all'

  /* 当前一级分类的下一层元数据：雷火/广告=PRODUCT，UI=MODULE，宣发/社媒=CASE */
  const subMeta = level2Meta(filter as ProjectFilterId)

  /* 手机端 Product Rail：活动产品按钮自动横向滚动到可见（只滚 Rail，不滚页面）。
     用 getBoundingClientRect 相对滚动容器计算，避免 offsetLeft 相对 offsetParent 的偏差。 */
  useEffect(() => {
    const grid = subGridRef.current
    if (!grid) return
    const on = grid.querySelector<HTMLElement>(`.${styles.subChipOn}`)
    if (!on) return
    const gridRect = grid.getBoundingClientRect()
    const onRect = on.getBoundingClientRect()
    const relLeft = onRect.left - gridRect.left + grid.scrollLeft
    const target = relLeft - (grid.clientWidth - onRect.width) / 2
    grid.scrollTo({ left: Math.max(0, target), behavior: reduced ? 'auto' : 'smooth' })
  }, [activeSub, reduced])

  /* 首次浏览引导：会话内只提示一次，1.5～2s 后弱化（prefers-reduced-motion 时保持静态） */
  const [guideOn, setGuideOn] = useState(false)
  useEffect(() => {
    if (reduced) {
      setGuideOn(true)
      return
    }
    try {
      if (sessionStorage.getItem('jazim-projects-guide')) return
      sessionStorage.setItem('jazim-projects-guide', '1')
    } catch {
      /* 隐私模式忽略 */
    }
    setGuideOn(true)
    const timer = window.setTimeout(() => setGuideOn(false), 2000)
    return () => window.clearTimeout(timer)
  }, [reduced])

  /* 下级内容提示：当前模块下方确有案例 / 视频 / 任务数据时显示，
     用户向下滚动进入内容后淡出（滚回顶部重新出现）。 */
  const currentHasSubContent =
    !!current &&
    ((current.cases?.length ?? 0) > 0 ||
      (current.videos?.length ?? 0) > 0 ||
      !!current.video)
  const [scrolledAway, setScrolledAway] = useState(false)
  useEffect(() => {
    const root = rootRef.current
    if (!root) return
    const onScroll = () => {
      /* 值不变时返回旧值，React 自动跳过重渲染：避免每个滚动帧都重建整个 Projects */
      const next = root.getBoundingClientRect().top < -window.innerHeight * 0.3
      setScrolledAway((prev) => (prev === next ? prev : next))
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll()
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  /* ---------- 舞台尺寸测量 ---------- */
  useLayoutEffect(() => {
    const stage = stageRef.current
    if (!stage) return
    const measure = () => setStageWidth(stage.clientWidth)
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(stage)
    return () => ro.disconnect()
  }, [])

  /* ---------- 切换筛选时回到第一张（仅当筛选真的变化，挂载恢复现场不重置） ---------- */
  useEffect(() => {
    if (prevFilterRef.current !== filter) {
      prevFilterRef.current = filter
      setActive(0)
      prevActive.current = 0
    }
  }, [filter])

  /* ---------- 点击二级筛选：把当前卡片定位到对应作品（高亮由当前卡片派生，自动跟随） ----------
     在点击时直接计算目标位置，避免用 useEffect 异步定位带来的时序竞态。
     定位后左右切换键仍可在模块内自由浏览全部作品。 */
  const selectSub = (id: string) => {
    const idx =
      id === 'all'
        ? 0
        : Math.max(0, list.findIndex((p) => p.id.endsWith(`-${id}`)))
    setActive(idx)
    prevActive.current = idx
  }

  /* 移动端：卡片占满安全区（与 CSS @media(max-width:767px) 的 100% slot / 0 gap 一致），
     轮播数学改用全宽 + 无间距，避免 JS 定位与 CSS 宽度不一致导致卡片偏移。 */
  const ratio = isCompact ? 1 : CARD_RATIO
  const cardWidth = stageWidth * ratio
  const step = cardWidth + (isCompact ? 0 : GAP)
  /** 让 active 卡片居中的位移 */
  const baseOffset = (stageWidth - cardWidth) / 2

  const go = useCallback(
    (dir: number) => {
      setActive((prev) => Math.min(total - 1, Math.max(0, prev + dir)))
    },
    [total]
  )

  /* ---------- 轨道位移 + 卡片状态 ---------- */
  useEffect(() => {
    const track = trackRef.current
    if (!track || !stageWidth || !total) return

    const targetX = baseOffset - active * step
    const dir = active >= prevActive.current ? 1 : -1
    const cards = track.querySelectorAll<HTMLElement>(`.${styles.slot}`)

    /* 移动端：跳过 scaleX/位移入场动画（effect 重跑会 kill 进行中的 tween，
       卡片可能卡在 scaleX<1 的中间态，实测 matrix(0.9495,..) 残留），
       直接用 gsap.set 定位 + 全显 —— 内容立即可见、位置准确。 */
    if (reduced || isCompact) {
      gsap.set(track, { x: targetX })
      cards.forEach((el, i) => {
        /* x:0 必须显式复位：旧动画若被 kill 可能残留 translateX */
        gsap.set(el, { scaleX: 1, x: 0, opacity: i === active ? 1 : 0.35, filter: 'none' })
      })
      prevActive.current = active
      return
    }

    const tl = gsap.timeline()

    // 轨道滑动
    tl.to(track, { x: targetX, duration: 0.95, ease: 'power4.out' }, 0)

    cards.forEach((el, i) => {
      const offset = i - active
      const abs = Math.abs(offset)
      const isActive = abs === 0

      if (isActive) {
        // 进入卡片：从相反方向、略微展开的状态归位
        tl.fromTo(
          el,
          { scaleX: 0.93, x: dir * 26 },
          { scaleX: 1, x: 0, duration: 0.95, ease: 'power4.out' },
          0
        ).to(el, { opacity: 1, filter: 'blur(0px)', duration: 0.6, ease: 'power2.out' }, 0)
      } else {
        // 离开 / 相邻卡片：横向压缩并降低对比
        tl.to(
          el,
          {
            scaleX: abs === 1 ? 0.9 : 0.82,
            x: 0,
            opacity: abs === 1 ? 0.3 : 0.12,
            filter: `blur(${Math.min(3, abs * 1.6)}px)`,
            duration: 0.8,
            ease: 'power3.out',
          },
          0
        )
      }
    })

    /* 背景超大编号切换 */
    const ghost = ghostRef.current
    if (ghost && current) {
      tl.fromTo(
        ghost,
        { yPercent: dir * 34, opacity: 0 },
        { yPercent: 0, opacity: 1, duration: 0.85, ease: 'expo.out' },
        0
      )
    }

    prevActive.current = active
    return () => {
      tl.kill()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, stageWidth, total, reduced, isCompact, filter])

  /* ---------- 滚轮切换（安全区限定 + 边界放行） ----------
     只有鼠标位于"当前活动项目卡显示区域"内时，滚轮才拦截用于切换项目；
     活动卡之外的页面边缘（安全区）滚轮一律放行，让原生滚动正常翻页，
     避免"鼠标在边缘滚动却永远在切项目、无法滑到下一页"的问题。 */
  useEffect(() => {
    const stage = stageRef.current
    if (!stage) return

    const onWheel = (e: WheelEvent) => {
      // ── 安全区判断：鼠标必须在活动项目卡显示区域内 ──
      const track = trackRef.current
      const slot = track?.querySelectorAll<HTMLElement>(`.${styles.slot}`)[active]
      if (!slot) return
      const rect = slot.getBoundingClientRect()
      // 少量内缩容差，卡边缘 8px 内视为安全区，避免贴边误触
      const pad = 8
      const inCard =
        e.clientX >= rect.left + pad &&
        e.clientX <= rect.right - pad &&
        e.clientY >= rect.top &&
        e.clientY <= rect.bottom
      if (!inCard) return

      const delta = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY
      const dir = delta > 0 ? 1 : -1
      const atBoundary = (dir > 0 && active >= total - 1) || (dir < 0 && active <= 0)
      if (atBoundary) return

      e.preventDefault()
      e.stopPropagation()

      if (wheelLock.current) return
      wheelAcc.current += Math.abs(delta)
      if (wheelAcc.current > 48) {
        wheelAcc.current = 0
        wheelLock.current = true
        go(dir)
        window.setTimeout(() => {
          wheelLock.current = false
        }, 260)
      }
    }

    stage.addEventListener('wheel', onWheel, { passive: false })
    return () => stage.removeEventListener('wheel', onWheel)
  }, [active, total, go])

  /* ---------- 拖拽切换 ---------- */
  const onPointerDown = (e: React.PointerEvent) => {
    if (total <= 1) return
    // 按下目标为可交互元素（按钮 / 链接 / 标签等）时不启动拖拽，
    // 避免 setPointerCapture 与轨道位移吞掉按钮的 click 事件
    const target = e.target as HTMLElement
    if (target.closest('button, a, input, select, textarea, [role="tab"], [data-cursor="link"]')) return
    dragStart.current = e.clientX
    dragDelta.current = 0
    setDragging(true)
    ;(e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId)
  }

  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragging) return
    dragDelta.current = e.clientX - dragStart.current
    const track = trackRef.current
    if (!track) return
    // 跟手位移，带阻尼
    gsap.set(track, { x: baseOffset - active * step + dragDelta.current * 0.55 })
  }

  const endDrag = () => {
    if (!dragging) return
    setDragging(false)
    const d = dragDelta.current
    if (Math.abs(d) > DRAG_THRESHOLD) {
      go(d < 0 ? 1 : -1)
    } else {
      // 未达阈值：弹回当前位置
      const track = trackRef.current
      if (track) {
        gsap.to(track, {
          x: baseOffset - active * step,
          duration: 0.6,
          ease: 'power3.out',
        })
      }
    }
    dragDelta.current = 0
  }

  /* ---------- 键盘 ---------- */
  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowRight') {
      e.preventDefault()
      go(1)
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault()
      go(-1)
    }
  }

  /* ---------- 筛选器入场 ---------- */
  useGsapContext(
    () => {
      if (reduced) return
      // 注意：ScrollTrigger 在页面加载早期（fonts.ready refresh 竞态）可能创建失败，
      // 此时 from 动画会把元素永久留在 from 态。因此逐条 try/catch，
      // 失败时用 gsap.set 直接落到可见终态，避免舞台/筛选器永久不可见。
      try {
        gsap.from(`.${styles.chip}`, {
          yPercent: 110,
          opacity: 0,
          duration: 0.55,
          ease: EASE.element,
          stagger: 0.045,
          scrollTrigger: { trigger: `.${styles.filters}`, start: TRIGGER.start, once: true },
        })
      } catch (err) {
        console.warn('[Projects] chip intro failed, falling back:', err)
        gsap.set(`.${styles.chip}`, { yPercent: 0, opacity: 1 })
      }
      try {
        gsap.from(`.${styles.stage}`, {
          clipPath: 'inset(0% 0% 100% 0%)',
          duration: 1.3,
          ease: EASE.media,
          scrollTrigger: { trigger: `.${styles.stage}`, start: 'top 88%', once: true },
        })
      } catch (err) {
        console.warn('[Projects] stage intro failed, falling back:', err)
        gsap.set(`.${styles.stage}`, { clipPath: 'inset(0% 0% 0% 0%)' })
      }
    },
    [reduced],
    rootRef
  )

  const positionOf = (i: number): CardPosition => {
    if (i === active) return 'active'
    if (i === active - 1) return 'prev'
    if (i === active + 1) return 'next'
    return 'far'
  }

  return (
    <section
      id="projects"
      ref={rootRef}
      className={`section ${styles.root}`}
      aria-label={t('精选项目', 'Selected projects')}
    >
      <div className={`grid-bg ${styles.grid}`} aria-hidden="true" />
      <PixelSceneBackground variant="projects" />

      {/* 背景超大编号 */}
      <span ref={ghostRef} className={styles.ghost} aria-hidden="true">
        {current?.index ?? '00'}
      </span>

      <div className={`shell ${styles.shell}`}>
        <SectionHeader
          index="05"
          code="SELECTED MISSIONS"
          titleEn="PROJECTS"
          titleZh={t('精选项目', 'Selected projects')}
          description={t(
            '按内容方向组织：雷火产品动效与游戏UI动效练习各自独立成块，视频设计下设游戏广告视频、游戏宣发视频、游戏社媒视频三个模块。点击 VIEW CASE 可展开各方向下的子层级案例或视频占位。',
            'Organized by content direction: Leihuo motion and game UI motion studies each stand as their own block, while video design splits into three modules — game ad films, game promotion films and game social videos. Select VIEW CASE to expand sub-level cases or video placeholders.'
          )}
        />

        {/* ══════════ 一级项目视频总数统计 ══════════ */}
        <div className={styles.totalBar}>
          <div className={styles.totalStat}>
            <span className={styles.totalBig}>
              {String(
                filterProjects('all').reduce((s, p) => s + projectVideoCount(p), 0)
              ).padStart(2, '0')}
            </span>
            <span className={styles.totalLabel}>
              {t('视频总数', 'VIDEOS TOTAL')}
            </span>
          </div>
          <div className={styles.totalBreaks} aria-hidden="true">
            {projectFilters
              .filter((f) => f.id !== 'all')
              .map((f) => {
                /* 各分类下全部一级项目的视频总数（不展开二级案例） */
                const count = filterProjects(f.id).reduce(
                  (s, p) => s + projectVideoCount(p),
                  0
                )
                return (
                  <span key={f.id} className={styles.totalChip}>
                    <span className={styles.totalChipZh}>{tx(f.labelZh)}</span>
                    <span className={styles.totalChipCount}>
                      {String(count).padStart(2, '0')}
                    </span>
                  </span>
                )
              })}
          </div>
        </div>

        {/* ══════════ 筛选模块 ══════════ */}
        <div className={styles.filterPanel}>
          <div className={styles.panelTop}>
            <span className={styles.moduleTag}>
              FILTER / {t('筛选项目', 'Filter projects')}
            </span>
            {/* 首次浏览引导：TRACK → PRODUCT → CASE，出现约 2s 后弱化 */}
            <div
              className={`${styles.guide} ${guideOn ? styles.guideOn : ''}`}
              aria-hidden={!guideOn}
            >
              <b>{t('TRACK', 'TRACK')}</b>
              <i aria-hidden="true">↓</i>
              <b>{t('PRODUCT', 'PRODUCT')}</b>
              <i aria-hidden="true">↓</i>
              <b>{t('CASE', 'CASE')}</b>
              <span>{t('01 选方向 · 02 选产品 · 03 看案例', '01 TRACK · 02 PRODUCT · 03 CASE')}</span>
            </div>
          </div>

          {/* 层级标签：LEVEL 01 TRACK（当前方向）+ 下一层 PRODUCT / MODULE / CASE */}
          <div
            className={`${styles.levelTags} ${
              subFilters ? styles.levelTagsWithSub : ''
            }`}
          >
            <span className={`${styles.levelTag} ${styles.levelTagOn}`}>
              <b>LEVEL {String(TRACK_META.level).padStart(2, '0')}</b>
              <span>
                {tx(TRACK_META.code)} / {tx(TRACK_META.label)}
              </span>
            </span>
            {subFilters && (
              <span className={styles.levelTag}>
                <b>LEVEL {String(subMeta.level).padStart(2, '0')}</b>
                <span>
                  {tx(subMeta.code)} / {tx(subMeta.label)}
                </span>
              </span>
            )}
          </div>

          {/* ─── 二级筛选：提示位于 LEVEL 02 标签正下方（6~10px），
              产品选择器使用横向 Grid（桌面 4~5 / 行），不用纵向列表 ─── */}
          {subFilters && (
            <div
              className={styles.subLevel}
              role="group"
              aria-label={tx(subMeta.label)}
            >
              {subMeta.hint && (
                <span className={styles.subHint}>
                  <i aria-hidden="true">→</i>
                  {tx(subMeta.hint)}
                  {subMeta.level === 2 && subMeta.code.cn === 'PRODUCT' && (
                    <span className={styles.subHintTag}>
                      SELECT PRODUCT <i aria-hidden="true">→</i>
                    </span>
                  )}
                </span>
              )}
              <div ref={subGridRef} className={styles.subGrid}>
                {subFilters.map((sf, i) => {
                  /* 数字 = 该项目视频总数（新增/上传视频后自动同步） */
                  const count = subFilterVideoCount(filter as ProjectFilterId, sf.id)
                  const isOn = activeSub === sf.id
                  return (
                    <button
                      key={sf.id}
                      type="button"
                      className={`${styles.subChip} ${isOn ? styles.subChipOn : ''}`}
                      aria-pressed={isOn}
                      onClick={() => selectSub(sf.id)}
                      data-cursor="link"
                    >
                      <span className={styles.subIndex}>{String(i).padStart(2, '0')}</span>
                      <span className={styles.subLabel}>{t(sf.label.cn, sf.label.en)}</span>
                      <span className={styles.subCount}>{String(count).padStart(2, '0')}</span>
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          <div className={styles.filterBar}>
          <div className={styles.filters} role="tablist" aria-label={t('项目筛选', 'Project filters')}>
            {projectFilters.map((f) => {
              const count = getDisplayItems(f.id, 'all').length
              const isOn = filter === f.id
              return (
                <button
                  key={f.id}
                  type="button"
                  role="tab"
                  aria-selected={isOn}
                  className={`${styles.chip} ${isOn ? styles.chipOn : ''}`}
                  onClick={() => onFilterChange(f.id)}
                  disabled={count === 0}
                  data-cursor={count === 0 ? 'disabled' : 'link'}
                >
                  <span className={styles.chipLabel}>{f.label}</span>
                  <span className={styles.chipZh}>{tx(f.labelZh)}</span>
                  <span className={styles.chipCount}>{String(count).padStart(2, '0')}</span>
                </button>
              )
            })}
          </div>

          <div className={styles.counter}>
            <span className={styles.counterNow}>
              {String(Math.min(active + 1, total)).padStart(2, '0')}
            </span>
            <span className={styles.counterSep}>/</span>
            <span className={styles.counterAll}>{String(total).padStart(2, '0')}</span>
          </div>
          </div>

          {/* 下级内容提示：仅当当前模块下方确有案例 / 视频 / 任务数据时显示。
              中文：↓ 下方查看项目案例（练习模块为「下方查看练习案例」）
              英文：SCROLL FOR CASES ↓ / SCROLL FOR PRACTICE ↓
              用户向下滚动进入内容后淡出，prefers-reduced-motion 时静态。 */}
          {currentHasSubContent && (
            <div
              className={`${styles.scrollHint} ${scrolledAway ? styles.scrollHintOff : ''}`}
              aria-hidden={scrolledAway}
            >
              <span className={styles.scrollHintLine}>
                {lang === 'CN' && (
                  <i className={styles.scrollHintArrow} aria-hidden="true">↓</i>
                )}
                <b>
                  {filter === 'game-ui'
                    ? t('下方查看练习案例', 'SCROLL FOR PRACTICE')
                    : t('下方查看项目案例', 'SCROLL FOR CASES')}
                </b>
                {lang !== 'CN' && (
                  <i className={styles.scrollHintArrow} aria-hidden="true">↓</i>
                )}
              </span>
            </div>
          )}
        </div>

        {/* ══════════ 选择项目模块 ══════════ */}
        <div className={styles.selectPanel}>
          <span className={styles.moduleTag}>
            SELECT / {t('选择项目', 'Select project')}
          </span>
          <div
            ref={stageRef}
            className={`${styles.stage} ${dragging ? styles.stageDragging : ''}`}
          tabIndex={0}
          role="group"
          aria-label={t('项目序列，使用左右方向键切换', 'Project sequence — use the left and right arrow keys')}
          onKeyDown={onKeyDown}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
          onPointerLeave={endDrag}
          data-cursor="drag"
        >
          <div
            ref={trackRef}
            className={styles.track}
            style={{ gap: `${isCompact ? 0 : GAP}px` }}
          >
            {list.map((p, i) => (
              <div
                key={p.id}
                className={styles.slot}
                style={{ flex: `0 0 ${ratio * 100}%` }}
              >
                <ProjectCard
                  project={p}
                  position={positionOf(i)}
                  onFocus={() => setActive(i)}
                  onOpenCase={(caseId?: string) => {
                    /* 保存轮播现场：filter / subFilter / 卡片序号 / activeVideo / 滚动位置，
                       从详情页 / 案例页返回时恢复。从一级卡片的二级产品条进入时
                       以目标产品卡为准（而非当前一级卡片）。
                       videoIndex 一律原样保存，返回时精确恢复到离开前的视频
                       （含从二级产品条进入的情形，满足「返回恢复 VIDEO 02」验收）。
                       主动切换产品（点二级筛选）时的归零由本组件 prevActiveForVideo
                       逻辑独立负责，与返回恢复互不干扰。 */
                    const targetIdx = caseId
                      ? Math.max(0, list.findIndex((x) => x.caseId === caseId))
                      : active
                    setProjectsState({
                      filter,
                      subFilter: caseId ?? activeSub,
                      index: targetIdx,
                      videoIndex,
                      scrollY: window.scrollY,
                    })
                  }}
                  /* 活动卡的预览视频：受控 videoIndex 由本组件统一管理。
                     左右箭头与底部视频选择条共用同一个 activeVideoIndex。 */
                  videoIndex={i === active ? videoIndex : undefined}
                  onVideoChange={i === active ? setVideoIndex : undefined}
                  onPrevVideo={
                    i === active
                      ? () =>
                          setVideoIndex(
                            (v) =>
                              (v - 1 + (current?.videos?.length ?? 1)) %
                              (current?.videos?.length ?? 1)
                          )
                      : undefined
                  }
                  onNextVideo={
                    i === active
                      ? () => setVideoIndex((v) => (v + 1) % (current?.videos?.length ?? 1))
                      : undefined
                  }
                />
              </div>
            ))}
          </div>

          {total === 0 && (
            <p className={styles.empty}>
              {t(
                '该分类下暂无项目，请切换筛选条件。',
                'No projects in this category yet — try another filter.'
              )}
            </p>
          )}
        </div>

        {/* ══════════ 控制条（上一个在左 / 下一个在右） ══════════ */}
        <div className={styles.controls}>
          <button
            type="button"
            className={`${styles.navBtn} ${styles.navBtnPrev}`}
            onClick={() => go(-1)}
            disabled={active <= 0}
            aria-label={t('上一个项目', 'Previous project')}
            data-cursor={active <= 0 ? 'disabled' : 'link'}
          >
            <ChevronLeft size={17} />
          </button>

          <div className={styles.progress}>
            {list.map((p, i) => (
              <button
                key={p.id}
                type="button"
                className={`${styles.pip} ${i === active ? styles.pipOn : ''}`}
                onClick={() => setActive(i)}
                aria-label={t(`切换到 ${tx(p.titleZh)}`, `Go to ${p.title}`)}
                aria-current={i === active ? 'true' : undefined}
              />
            ))}
          </div>

          <span className={styles.dragHint}>
            <GripHorizontal size={13} />
            {t('DRAG / SCROLL / ← → 切换项目', 'DRAG / SCROLL / ← → TO SWITCH')}
          </span>

          <button
            type="button"
            className={`${styles.navBtn} ${styles.navBtnNext}`}
            onClick={() => go(1)}
            disabled={active >= total - 1}
            aria-label={t('下一个项目', 'Next project')}
            data-cursor={active >= total - 1 ? 'disabled' : 'link'}
          >
            <ChevronRight size={17} />
          </button>
        </div>
        </div>
      </div>

      {/* 系统分割带 */}
      <SystemDivider variant="projects" />
    </section>
  )
}
