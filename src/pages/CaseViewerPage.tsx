import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, ArrowRight, ArrowUp, ChevronLeft, ChevronRight, Wrench } from 'lucide-react'
import {
  caseCoverPath,
  caseDisplayName,
  getDisplayItems,
  getProjectBySlug,
  level2Meta,
  orderCasesBySubFilter,
  trackFilterOf,
} from '../data/projects'
import { PROJECT_STATUS_CN } from '../data/labels'
import { gsap } from '../lib/gsap'
import { useGsapContext } from '../hooks/useGsapContext'
import { useReducedMotion } from '../hooks/useReducedMotion'
import { DUR, EASE, STAGGER } from '../lib/motion'
import { useUI } from '../context/UIContext'
import { scrollToTop } from '../lib/smoothScroll'
import { VideoPreview } from '../components/ui/VideoPreview'
import { VideoNavButton } from '../components/ui/VideoNav'
import { MagneticButton } from '../components/ui/MagneticButton'
import { PixelSceneBackground } from '../components/ui/PixelSceneBackground'
import styles from './CaseViewerPage.module.css'

/** 案例媒体轮播中的一项：优先视频，否则用图集单张作封面 */
interface MediaItem {
  key: string
  video?: string
  cover?: string
}

/**
 * 子模块案例查看页 /projects/:slug/case/:caseId
 * 展示某个具体案例（如炉石传说）的名称、描述、元数据，
 * 以及该案例内的不同活动作品图集 / 视频，左右按钮循环切换。
 */
export function CaseViewerPage() {
  const { slug, caseId } = useParams<{ slug: string; caseId: string }>()
  const { t, tx, txList, lang, setProjectsState } = useUI()
  const cn = lang === 'CN'
  const navigate = useNavigate()
  const rootRef = useRef<HTMLElement>(null)
  const reduced = useReducedMotion()

  const project = getProjectBySlug(slug)
  /* 案例顺序跟随二级筛选顺序，保证「上一个/下一个案例」与筛选页顺序一致 */
  const orderedCases = useMemo(() => orderCasesBySubFilter(project), [project])
  const caseIndex = orderedCases.findIndex((c) => c.id === caseId)
  const projectCase = caseIndex >= 0 ? orderedCases[caseIndex] : undefined

  /* 案例内的活动项目（works）：存在时按活动筛选视频，每条视频循环播放 */
  const works = projectCase?.works ?? []
  const hasWorks = works.length > 0

  /* ---------- works 模式：当前活动 + 当前活动内视频 ---------- */
  const [workIdx, setWorkIdx] = useState(0)
  const [videoIdx, setVideoIdx] = useState(0)
  const totalVideos = hasWorks ? works.reduce((s, w) => s + w.videos.length, 0) : 0
  const workOffsets = useMemo(() => {
    const off: number[] = []
    let acc = 0
    for (const w of works) {
      off.push(acc)
      acc += w.videos.length
    }
    return off
  }, [works])
  const currentWork = works[Math.min(workIdx, Math.max(0, works.length - 1))]
  const currentVideos = currentWork?.videos ?? []
  const flatIndex =
    (workOffsets[Math.min(workIdx, Math.max(0, works.length - 1))] ?? 0) + videoIdx

  /* 左右箭头：在案例全部视频间循环切换（跨活动，播完当前活动自动进入下一个） */
  const goVideo = useCallback(
    (dir: number) => {
      if (!hasWorks || totalVideos <= 0) return
      const next = (flatIndex + dir + totalVideos) % totalVideos
      let w = 0
      while (w < works.length - 1 && next >= workOffsets[w + 1]) w++
      setWorkIdx(w)
      setVideoIdx(next - workOffsets[w])
    },
    [hasWorks, totalVideos, works, workOffsets, flatIndex]
  )

  /* 活动筛选：切到指定活动并回到该活动第一条视频 */
  const selectWork = useCallback((w: number) => {
    setWorkIdx(w)
    setVideoIdx(0)
  }, [])

  /* ---------- 无 works 的案例：图集轮播 ---------- */
  const mediaItems = useMemo<MediaItem[]>(() => {
    if (!project || !projectCase) return []
    const items: MediaItem[] = []
    const caseVideos =
      projectCase.videos && projectCase.videos.length > 0
        ? projectCase.videos
        : projectCase.video
          ? [projectCase.video]
          : []
    caseVideos.forEach((v, i) => {
      items.push({ key: `video-${i}`, video: v, cover: caseCoverPath(project, projectCase) })
    })
    ;(projectCase.gallery ?? []).forEach((g, i) => {
      items.push({ key: `slide-${i}`, video: undefined, cover: g })
    })
    if (items.length === 0) items.push({ key: 'cover', video: undefined, cover: project.cover })
    return items
  }, [project, projectCase])

  const [itemIndex, setItemIndex] = useState(0)
  const goItem = (dir: number) =>
    setItemIndex((i) => (i + dir + mediaItems.length) % Math.max(mediaItems.length, 1))

  /* 统一切换：works 案例切视频，图集案例切页 */
  const goDir = useCallback(
    (dir: number) => {
      if (hasWorks) goVideo(dir)
      else goItem(dir)
    },
    [hasWorks, goVideo]
  )

  /* 切换案例时把媒体重置回第一张 / 第一条。
     回到页面顶部由 ScrollManager 统一处理（进入新 case 路由时绘制前回顶），
     这里不再各自写 scrollTo，避免与返回恢复逻辑抢滚动。 */
  useEffect(() => {
    setItemIndex(0)
    setWorkIdx(0)
    setVideoIdx(0)
  }, [slug, caseId])

  /* Hero 入场动画：标题、meta、视频预览依次揭示（与详情页一致） */
  useGsapContext(
    () => {
      if (reduced || !project) return
      const tl = gsap.timeline({ delay: 0.1 })
      tl.from(`.${styles.heroIndex}`, {
        xPercent: -40,
        opacity: 0,
        duration: DUR.element,
        ease: EASE.title,
      })
        .from(
          `.${styles.heroTitle}`,
          {
            xPercent: -16,
            scaleX: 0.76,
            clipPath: 'inset(0% 100% 0% 0%)',
            duration: DUR.titleInSlow,
            ease: EASE.title,
          },
          0.05
        )
        .from(
          `.${styles.heroZh}`,
          { yPercent: 120, duration: DUR.element, ease: EASE.element },
          0.3
        )
        .from(
          `.${styles.metaItem}`,
          { yPercent: 110, opacity: 0, duration: 0.6, stagger: STAGGER.tags, ease: EASE.element },
          0.4
        )
        .from(
          `.${styles.heroMedia}`,
          {
            clipPath: 'polygon(0 0, 0 0, 0 100%, 0 100%)',
            scale: 1.06,
            duration: DUR.media,
            ease: EASE.media,
          },
          0.24
        )
    },
    [reduced, slug, caseId],
    rootRef
  )

  /* 同级案例导航：当前产品有多个作品时，在其内部按作品切换（不改 URL，仅切 workIdx）；
     否则在父模块的「同级案例」间切换（改 URL）。顺序跟随二级筛选。
     第一个「上一个」与最后一个「下一个」禁用，不做无限循环。 */
  const navList = works.length > 1 ? works : orderedCases
  const navIsWork = works.length > 1
  const navIndex = navIsWork ? workIdx : caseIndex
  const totalNav = navList.length
  const prevNav = navIndex > 0 ? navList[navIndex - 1] : undefined
  const nextNav = navIndex >= 0 && navIndex < totalNav - 1 ? navList[navIndex + 1] : undefined

  /* 键盘：← → 在同级案例间切换（输入框聚焦时不触发） */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement | null
      if (
        el &&
        (el.tagName === 'INPUT' ||
          el.tagName === 'TEXTAREA' ||
          el.tagName === 'SELECT' ||
          el.isContentEditable)
      )
        return
      if (e.key === 'ArrowRight' && nextNav) {
        e.preventDefault()
        if (navIsWork) {
          selectWork(navIndex + 1)
          scrollToTop(true)
        } else {
          navigate(`/projects/${slug}/case/${nextNav.id}`, { replace: true })
        }
      } else if (e.key === 'ArrowLeft' && prevNav) {
        e.preventDefault()
        if (navIsWork) {
          selectWork(navIndex - 1)
          scrollToTop(true)
        } else {
          navigate(`/projects/${slug}/case/${prevNav.id}`, { replace: true })
        }
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [prevNav, nextNav, navIsWork, navIndex, selectWork, slug, navigate])

  /* 返回：有应用内进入历史 → 回上一层（恢复原 filter / product / video / 滚动）；
     直接 URL 打开（React Router 初始 location.key 为 'default'，无应用内导航）
     → 回退到所属 PRODUCT / TRACK（仍然不回首页顶部）。 */
  const location = useLocation()
  const [canGoBack] = useState(() => location.key !== 'default')
  const goBack = useCallback(() => {
    if (canGoBack) {
      navigate(-1)
      return
    }
    if (project) {
      const f = trackFilterOf(project)
      const items = getDisplayItems(f, 'all')
      const idx = caseId ? Math.max(0, items.findIndex((p) => p.caseId === caseId)) : 0
      setProjectsState({
        filter: f,
        subFilter: caseId ?? 'all',
        index: idx,
        videoIndex: 0,
        scrollY: null,
      })
      navigate('/', { state: { scrollTo: 'projects' } })
    } else {
      navigate('/')
    }
  }, [canGoBack, navigate, project, caseId, setProjectsState])

  /* ---------- 案例不存在 ---------- */
  if (!project || !projectCase) {
    return (
      <main className={styles.root}>
        <div className="shell">
          <span className={styles.missingCode}>ERROR / 404</span>
          <h1 className={styles.missingTitle}>CASE NOT FOUND</h1>
          <p className={styles.missingText}>
            {t('没有找到该案例，它可能已被移除。', 'This case could not be found. It may have been removed.')}
          </p>
          <MagneticButton to="/" variant="primary" size="lg" arrow>
            {t('返回项目库', 'BACK TO PROJECTS')}
          </MagneticButton>
        </div>
      </main>
    )
  }

  const caseName = tx(projectCase.name)
  /* 面包屑当前级：有活动项目时用当前活动名（如 上博联动第四期），否则用案例名 */
  const crumbCurrentName = hasWorks && currentWork ? currentWork.name : projectCase.name
  /* 是否存在 PRODUCT / MODULE 层：雷火 / 广告 = PRODUCT，游戏UI = MODULE；宣发 / 社媒无此层 */
  const hasProductLayer = level2Meta(trackFilterOf(project)).level === 2
  /* 作品标题：有活动项目时用当前活动名（如 仲夏祥瑞），否则用案例名 */
  const titleName = hasWorks && currentWork ? currentWork.name : projectCase.name
  const workNameEn = titleName.en
  const workNameZh = tx(titleName)

  /* 顶部简介 / 元数据：work 级优先，缺失时回落 case 级，使每个子项目顶部信息完全独立 */
  const heroDesc = currentWork?.description ?? projectCase.description
  const heroMeta = currentWork?.meta ?? projectCase.meta
  const heroDate = currentWork?.date ?? projectCase.date
  const heroRole = currentWork?.role ?? projectCase.role
  const heroTags = currentWork?.tags ?? projectCase.tags

  /* 子项目独立详情：优先取当前活动（work）的 detail，其次取案例（case）级 detail。
     每个子项目拥有自己的 01—07 章节，不继承父级项目介绍；缺少 detail 时正文留空。 */
  const detail = (hasWorks && currentWork?.detail) || projectCase?.detail

  return (
    <main ref={rootRef} className={styles.root} style={{ ['--accent' as string]: project.accent }}>
      <div className={`grid-bg ${styles.grid}`} aria-hidden="true" />
      <div className={`noise ${styles.noise}`} aria-hidden="true" />
      <PixelSceneBackground variant="projectDetail" />

      {/* ══════════════ HERO ══════════════ */}
      <header className={`${styles.hero} shell`}>
        {/* 返回：回到上一层（CASE → PRODUCT），恢复原 filter / product / 滚动；
           直接 URL 打开时回退到所属一级分类 */}
        <button type="button" className={styles.back} data-cursor="link" onClick={goBack}>
          <ArrowLeft size={13} strokeWidth={2.2} />
          {t('返回', 'BACK')}
        </button>

        {/* 可点击层级面包屑：项目库 / TRACK / PRODUCT·MODULE（仅真实存在时）/ 当前 CASE·WORK */}
        <nav className={styles.crumb} aria-label={t('面包屑导航', 'Breadcrumb')}>
          {/* 项目库 → Projects 总览 */}
          <Link
            to="/"
            state={{ scrollTo: 'projects', projectsOverview: true }}
            onClick={() =>
              setProjectsState({
                filter: 'all',
                subFilter: 'all',
                index: 0,
                videoIndex: 0,
                scrollY: null,
              })
            }
            data-cursor="link"
          >
            {t('项目库', 'PROJECTS')}
          </Link>
          <i aria-hidden="true">/</i>
          {/* 一级 TRACK → Projects 对应模块（保持该一级筛选激活） */}
          <Link
            to="/"
            state={{ scrollTo: 'projects' }}
            onClick={() => {
              const f = trackFilterOf(project)
              setProjectsState({
                filter: f,
                subFilter: 'all',
                index: 0,
                videoIndex: 0,
                scrollY: null,
              })
            }}
            data-cursor="link"
          >
            {tx(project.titleZh)}
          </Link>
          {/* PRODUCT / MODULE 层：仅真实存在该层级时显示（雷火/广告/游戏UI），点击回到对应产品卡 */}
          {hasProductLayer && (
            <>
              <i aria-hidden="true">/</i>
              <Link
                to="/"
                state={{ scrollTo: 'projects' }}
                onClick={() => {
                  const f = trackFilterOf(project)
                  const items = getDisplayItems(f, 'all')
                  const idx = caseId
                    ? Math.max(0, items.findIndex((p) => p.caseId === caseId))
                    : 0
                  setProjectsState({
                    filter: f,
                    subFilter: caseId ?? 'all',
                    index: idx,
                    videoIndex: 0,
                    scrollY: null,
                  })
                }}
                data-cursor="link"
              >
                {tx(caseDisplayName(projectCase))}
              </Link>
            </>
          )}
          <i aria-hidden="true">/</i>
          {/* 当前 CASE / WORK：当前页面，不可点击 */}
          <span className={styles.crumbCurrent}>{tx(crumbCurrentName)}</span>
        </nav>

        <div className={styles.heroGrid}>
          <div className={styles.heroText}>
            <span className={styles.heroIndex}>
              {t('案例', 'CASE')} {String(caseIndex + 1).padStart(2, '0')}
            </span>

            <h1 className={styles.heroTitleWrap}>
              <span className={styles.heroTitle}>{workNameEn}</span>
            </h1>

            <span className={styles.heroZhWrap}>
              <span className={styles.heroZh}>{workNameZh}</span>
            </span>

            <p className={styles.heroDesc}>{tx(heroDesc)}</p>

            <ul className={styles.meta}>
              <li className={styles.metaItem}>
                <span className={styles.metaKey}>{t('平台', 'PLATFORM')}</span>
                <span className={styles.metaVal}>{tx(heroMeta)}</span>
              </li>
              {heroDate && (
                <li className={styles.metaItem}>
                  <span className={styles.metaKey}>{t('时间', 'DATE')}</span>
                  <span className={styles.metaVal}>{tx(heroDate)}</span>
                </li>
              )}
              {heroRole && (
                <li className={styles.metaItem}>
                  <span className={styles.metaKey}>{t('职责', 'ROLE')}</span>
                  <span className={styles.metaVal}>{tx(heroRole)}</span>
                </li>
              )}
              <li className={styles.metaItem}>
                <span className={styles.metaKey}>{t('标签', 'TAGS')}</span>
                <span className={styles.metaVal}>{heroTags.join(' / ')}</span>
              </li>
            </ul>
          </div>

          {/* 案例作品区：有活动项目 → 活动视频播放器（循环播放，左右箭头跨活动切换）；
              无活动项目 → 图集轮播 */}
          <div className={styles.heroMedia}>
            {/* 同级案例导航（紧凑）：在当前产品 / 模块内部切换，不跳出所属一级分类。
                有多个作品的产品（如魔兽世界的 4 个项目案例）按作品切换；
                单作品 / 无作品的案例按父模块的同级案例切换。 */}
            <nav
              className={styles.caseNav}
              aria-label={t('案例导航', 'Case navigation')}
            >
              {prevNav ? (
                navIsWork ? (
                  <button
                    type="button"
                    className={`${styles.caseNavBtn} ${styles.caseNavPrev} ${styles.caseNavAction}`}
                    onClick={() => {
                      selectWork(navIndex - 1)
                      scrollToTop(true)
                    }}
                    data-cursor="link"
                  >
                    <ArrowLeft size={13} strokeWidth={2.2} />
                    <span className={styles.caseNavName}>{tx(prevNav.name)}</span>
                  </button>
                ) : (
                  <Link
                    replace
                    to={`/projects/${slug}/case/${prevNav.id}`}
                    className={`${styles.caseNavBtn} ${styles.caseNavPrev}`}
                    data-cursor="link"
                  >
                    <ArrowLeft size={13} strokeWidth={2.2} />
                    <span className={styles.caseNavName}>{tx(prevNav.name)}</span>
                  </Link>
                )
              ) : (
                <span className={`${styles.caseNavBtn} ${styles.caseNavPrev} ${styles.caseNavDisabled}`} aria-disabled="true">
                  <ArrowLeft size={13} strokeWidth={2.2} />
                </span>
              )}

              <span className={styles.caseNavCount}>
                {String(Math.max(navIndex + 1, 0)).padStart(2, '0')} /{' '}
                {String(totalNav).padStart(2, '0')}
              </span>

              {nextNav ? (
                navIsWork ? (
                  <button
                    type="button"
                    className={`${styles.caseNavBtn} ${styles.caseNavNext} ${styles.caseNavAction}`}
                    onClick={() => {
                      selectWork(navIndex + 1)
                      scrollToTop(true)
                    }}
                    data-cursor="link"
                  >
                    <span className={styles.caseNavName}>{tx(nextNav.name)}</span>
                    <ArrowRight size={13} strokeWidth={2.2} />
                  </button>
                ) : (
                  <Link
                    replace
                    to={`/projects/${slug}/case/${nextNav.id}`}
                    className={`${styles.caseNavBtn} ${styles.caseNavNext}`}
                    data-cursor="link"
                  >
                    <span className={styles.caseNavName}>{tx(nextNav.name)}</span>
                    <ArrowRight size={13} strokeWidth={2.2} />
                  </Link>
                )
              ) : (
                <span className={`${styles.caseNavBtn} ${styles.caseNavNext} ${styles.caseNavDisabled}`} aria-disabled="true">
                  <ArrowRight size={13} strokeWidth={2.2} />
                </span>
              )}
            </nav>

            {hasWorks ? (
              <VideoPreview
                key={projectCase.id}
                videos={currentVideos}
                videoIndex={videoIdx}
                onVideoChange={setVideoIdx}
                cover={caseCoverPath(project, projectCase)}
                alt={t(
                  `${workNameZh} 视频 ${videoIdx + 1}`,
                  `${workNameEn} video ${videoIdx + 1}`
                )}
                indexLabel={project.index}
                category={tx(projectCase.meta)}
                status={cn ? PROJECT_STATUS_CN[project.status] ?? project.status : project.status}
                mode="auto"
                loopVideo
                lazy={false}
                aspect="16 / 9"
                selectorExtra={
                  totalVideos > 1
                    ? `${String(flatIndex + 1).padStart(2, '0')} / ${String(totalVideos).padStart(2, '0')}`
                    : undefined
                }
              />
            ) : (
              <VideoPreview
                key={projectCase.id}
                video={mediaItems[itemIndex]?.video ?? project.video}
                cover={mediaItems[itemIndex]?.cover ?? project.cover}
                alt={t(
                  `${caseName} 作品 ${itemIndex + 1}`,
                  `${projectCase.name.en} work ${itemIndex + 1}`
                )}
                indexLabel={project.index}
                category={tx(projectCase.meta)}
                status={cn ? PROJECT_STATUS_CN[project.status] ?? project.status : project.status}
                mode="hover"
                lazy={false}
                aspect="16 / 9"
                selectorExtra={
                  mediaItems.length > 1
                    ? `${String(itemIndex + 1).padStart(2, '0')} / ${String(mediaItems.length).padStart(2, '0')}`
                    : undefined
                }
              />
            )}

            {hasWorks ? (
              totalVideos > 1 && (
                <>
                  <VideoNavButton
                    direction="prev"
                    onClick={() => goDir(-1)}
                    aria-label={t('上一个作品', 'Previous work')}
                  >
                    <ChevronLeft size={18} />
                  </VideoNavButton>
                  <VideoNavButton
                    direction="next"
                    onClick={() => goDir(1)}
                    aria-label={t('下一个作品', 'Next work')}
                  >
                    <ChevronRight size={18} />
                  </VideoNavButton>
                </>
              )
            ) : (
              mediaItems.length > 1 && (
                <>
                  <VideoNavButton
                    direction="prev"
                    onClick={() => goItem(-1)}
                    aria-label={t('上一个作品', 'Previous work')}
                  >
                    <ChevronLeft size={18} />
                  </VideoNavButton>
                  <VideoNavButton
                    direction="next"
                    onClick={() => goItem(1)}
                    aria-label={t('下一个作品', 'Next work')}
                  >
                    <ChevronRight size={18} />
                  </VideoNavButton>
                </>
              )
            )}
          </div>
        </div>

        {/* 活动项目筛选：对项目内的项目进行筛选（如魔兽世界下的仲夏祥瑞 / 海象人抽奖）。
            即使只有一个项目也显示，为后续新增项目预留按钮。 */}
        {hasWorks && (
          <div className={styles.workBar} role="group" aria-label={t('项目筛选', 'Campaign filter')}>
            <span className={styles.workLabel}>
              {tx(caseDisplayName(projectCase))}
              <i className={styles.workSep} aria-hidden="true" />
              {t('项目案例', 'CASE')}
            </span>
            <div className={styles.workList}>
              {works.map((w, wi) => (
                <button
                  key={w.id}
                  type="button"
                  className={`${styles.workChip} ${wi === workIdx ? styles.workChipOn : ''}`}
                  onClick={() => selectWork(wi)}
                  aria-pressed={wi === workIdx}
                  data-cursor="link"
                >
                  <span className={styles.workIndex}>{String(wi + 1).padStart(2, '0')}</span>
                  <span>{tx(w.name)}</span>
                  {/* 数量 = 本项目视频总数（新增视频后自动同步） */}
                  <span className={styles.workCount}>{String(totalVideos).padStart(2, '0')}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </header>

      {/* ══════════════ 章节：子项目独立详情（编号动态，按数据决定展示） ══════════════ */}
      <div className={`${styles.body} shell`}>
        {detail ? (
          (() => {
            /* 收集实际要渲染的章节块；缺失章节（如 delivery）自动跳过，编号动态递增 */
            const delivery = detail.delivery
            const studyTech = detail.studyTech
            const blocks: {
              key: string
              titleZh: string
              titleEn: string
              render: () => React.ReactNode
            }[] = []
            blocks.push({
              key: 'background',
              titleZh: '项目背景',
              titleEn: 'PROJECT BACKGROUND',
              render: () => <p className={styles.para}>{tx(detail.background)}</p>,
            })
            blocks.push({
              key: 'objectives',
              titleZh: detail.objectivesTitle?.[0] ?? '动效目标',
              titleEn: detail.objectivesTitle?.[1] ?? 'MOTION OBJECTIVE',
              render: () => (
                <ul className={styles.bullets}>
                  {txList(detail.objectives).map((item) => (
                    <li key={item} className={styles.bullet}>
                      <i className={styles.bulletTick} />
                      {item}
                    </li>
                  ))}
                </ul>
              ),
            })
            blocks.push({
              key: 'role',
              titleZh: detail.roleTitle?.[0] ?? '我的职责',
              titleEn: detail.roleTitle?.[1] ?? 'MY ROLE',
              render: () => <p className={styles.para}>{tx(detail.role)}</p>,
            })
            blocks.push({
              key: 'process',
              titleZh: '制作流程',
              titleEn: 'PROCESS',
              render: () => (
                <ol className={styles.flow}>
                  {txList(detail.process).map((step, si, arr) => (
                    <li key={step} className={styles.flowStep}>
                      <span className={styles.flowNum}>{String(si + 1).padStart(2, '0')}</span>
                      <span className={styles.flowText}>{step}</span>
                      {si < arr.length - 1 && (
                        <ArrowRight className={styles.flowArrow} size={13} aria-hidden="true" />
                      )}
                    </li>
                  ))}
                </ol>
              ),
            })
            if (delivery && delivery.length > 0) {
              blocks.push({
                key: 'delivery',
                titleZh: '交付方式',
                titleEn: 'DELIVERY',
                render: () => (
                  <ul className={styles.bullets}>
                    {txList(delivery).map((item) => (
                      <li key={item} className={styles.bullet}>
                        <i className={styles.bulletTick} />
                        {item}
                      </li>
                    ))}
                  </ul>
                ),
              })
            }
            blocks.push({
              key: 'result',
              titleZh: '最终呈现',
              titleEn: 'FINAL RESULT',
              render: () => <p className={styles.para}>{tx(detail.result)}</p>,
            })
            blocks.push({
              key: 'tools',
              titleZh: '使用工具',
              titleEn: 'TOOLSET',
              render: () => (
                <ul className={styles.tools}>
                  {detail.tools.map((tool) => (
                    <li key={tool} className={styles.tool}>
                      <Wrench size={12} strokeWidth={2} />
                      {tool}
                    </li>
                  ))}
                </ul>
              ),
            })
            if (studyTech && studyTech.length > 0) {
              blocks.push({
                key: 'studyTech',
                titleZh: detail.studyTechTitle?.[0] ?? '学习技术',
                titleEn: detail.studyTechTitle?.[1] ?? 'TECH STUDY',
                render: () => (
                  <ul className={styles.tools}>
                    {txList(studyTech).map((tool) => (
                      <li key={tool} className={styles.tool}>
                        <Wrench size={12} strokeWidth={2} />
                        {tool}
                      </li>
                    ))}
                  </ul>
                ),
              })
            }
            return blocks.map((block, i) => (
              <section key={block.key} className={styles.block}>
                <span className={styles.blockRule} aria-hidden="true" />
                <div className={styles.blockHead}>
                  <span className={styles.blockIndex}>{String(i + 1).padStart(2, '0')}</span>
                  <h2 className={styles.blockTitle}>
                    {cn ? block.titleZh : block.titleEn}
                  </h2>
                  <span className={styles.blockZh}>
                    {cn ? block.titleEn : block.titleZh}
                  </span>
                </div>
                <div className={styles.blockBody}>{block.render()}</div>
              </section>
            ))
          })()
        ) : (
          /* 无 detail 时正文留空：不复制父级项目介绍 */
          <p className={styles.noDetail}>
            {t(
              '该项目的详细说明整理中。',
              'Detailed description for this project is being prepared.'
            )}
          </p>
        )}
      </div>

      {/* ══════════════ PREV / NEXT CASE（同级切换，首尾禁用不循环） ══════════════ */}
      {totalNav > 1 && (prevNav || nextNav) && (
        <section className={styles.nextNav}>
          <div className="shell">
            <div className={styles.nextGrid}>
              {prevNav ? (
                navIsWork ? (
                  <button
                    type="button"
                    className={`${styles.nextInner} ${styles.nextInnerPrev} ${styles.nextAction}`}
                    onClick={() => {
                      selectWork(navIndex - 1)
                      scrollToTop(true)
                    }}
                    data-cursor="label"
                    data-cursor-label="PREV"
                  >
                    <span className={styles.nextLabel}>
                      {t('PREVIOUS CASE', 'PREVIOUS CASE')}
                    </span>
                    <div className={styles.nextRow}>
                      <ArrowLeft className={styles.nextArrow} size={30} strokeWidth={1.6} />
                      <span className={styles.nextIndex}>{String(navIndex).padStart(2, '0')}</span>
                      <span className={styles.nextText}>
                        <span className={styles.nextTitle}>{prevNav.name.en}</span>
                        <span className={styles.nextZh}>{tx(prevNav.name)}</span>
                      </span>
                    </div>
                  </button>
                ) : (
                  <Link
                    replace
                    to={`/projects/${slug}/case/${prevNav.id}`}
                    className={`${styles.nextInner} ${styles.nextInnerPrev}`}
                    data-cursor="label"
                    data-cursor-label="PREV"
                  >
                    <span className={styles.nextLabel}>
                      {t('PREVIOUS CASE', 'PREVIOUS CASE')}
                    </span>
                    <div className={styles.nextRow}>
                      <ArrowLeft className={styles.nextArrow} size={30} strokeWidth={1.6} />
                      <span className={styles.nextIndex}>{String(navIndex).padStart(2, '0')}</span>
                      <span className={styles.nextText}>
                        <span className={styles.nextTitle}>{prevNav.name.en}</span>
                        <span className={styles.nextZh}>{tx(prevNav.name)}</span>
                      </span>
                    </div>
                  </Link>
                )
              ) : (
                <span className={`${styles.nextInner} ${styles.nextInnerPrev} ${styles.nextInnerDisabled}`} aria-disabled="true">
                  <span className={styles.nextLabel}>
                    {t('FIRST CASE', 'FIRST CASE')}
                  </span>
                  <div className={styles.nextRow}>
                    <ArrowLeft className={styles.nextArrow} size={30} strokeWidth={1.6} />
                    <span className={styles.nextIndex}>—</span>
                    <span className={styles.nextText}>
                      <span className={styles.nextTitle}>{t('NO PREVIOUS', 'NO PREVIOUS')}</span>
                      <span className={styles.nextZh}>{t('当前产品内的第一个案例', 'FIRST CASE IN THIS PRODUCT')}</span>
                    </span>
                  </div>
                </span>
              )}

              {nextNav ? (
                navIsWork ? (
                  <button
                    type="button"
                    className={`${styles.nextInner} ${styles.nextAction}`}
                    onClick={() => {
                      selectWork(navIndex + 1)
                      scrollToTop(true)
                    }}
                    data-cursor="label"
                    data-cursor-label="NEXT"
                  >
                    <span className={styles.nextLabel}>
                      {t('NEXT CASE', 'NEXT CASE')}
                    </span>
                    <div className={styles.nextRow}>
                      <span className={styles.nextIndex}>{String(navIndex + 2).padStart(2, '0')}</span>
                      <span className={styles.nextText}>
                        <span className={styles.nextTitle}>{nextNav.name.en}</span>
                        <span className={styles.nextZh}>{tx(nextNav.name)}</span>
                      </span>
                      <ArrowRight className={styles.nextArrow} size={30} strokeWidth={1.6} />
                    </div>
                  </button>
                ) : (
                  <Link
                    replace
                    to={`/projects/${slug}/case/${nextNav.id}`}
                    className={styles.nextInner}
                    data-cursor="label"
                    data-cursor-label="NEXT"
                  >
                    <span className={styles.nextLabel}>
                      {t('NEXT CASE', 'NEXT CASE')}
                    </span>
                    <div className={styles.nextRow}>
                      <span className={styles.nextIndex}>{String(navIndex + 2).padStart(2, '0')}</span>
                      <span className={styles.nextText}>
                        <span className={styles.nextTitle}>{nextNav.name.en}</span>
                        <span className={styles.nextZh}>{tx(nextNav.name)}</span>
                      </span>
                      <ArrowRight className={styles.nextArrow} size={30} strokeWidth={1.6} />
                    </div>
                  </Link>
                )
              ) : (
                <span className={`${styles.nextInner} ${styles.nextInnerDisabled}`} aria-disabled="true">
                  <span className={styles.nextLabel}>
                    {t('LAST CASE', 'LAST CASE')}
                  </span>
                  <div className={styles.nextRow}>
                    <span className={styles.nextIndex}>—</span>
                    <span className={styles.nextText}>
                      <span className={styles.nextTitle}>{t('NO NEXT', 'NO NEXT')}</span>
                      <span className={styles.nextZh}>{t('当前产品内的最后一个案例', 'LAST CASE IN THIS PRODUCT')}</span>
                    </span>
                    <ArrowRight className={styles.nextArrow} size={30} strokeWidth={1.6} />
                  </div>
                </span>
              )}
            </div>
          </div>
        </section>
      )}

      {/* ══════════════ 底部退出栏 ══════════════ */}
      <div className={styles.exitBar}>
        <button type="button" className={styles.back} onClick={goBack} data-cursor="link">
          <ArrowLeft size={13} strokeWidth={2.2} />
          {t('返回', 'BACK')}
        </button>
        <button type="button" className={styles.back} onClick={() => scrollToTop()} data-cursor="link">
          <ArrowUp size={13} strokeWidth={2.2} />
          {t('返回顶部', 'BACK TO TOP')}
        </button>
      </div>
    </main>
  )
}
