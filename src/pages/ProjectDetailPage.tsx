import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, ArrowRight, ArrowUp, ChevronLeft, ChevronRight, Wrench } from 'lucide-react'
import {
  caseDisplayName,
  getNextProject,
  getPrevProject,
  getProjectBySlug,
  level2Meta,
  orderCasesBySubFilter,
  trackFilterOf,
  videoOwnerMap,
} from '../data/projects'
import { METRIC_CN, PROJECT_STATUS_CN } from '../data/labels'
import { gsap } from '../lib/gsap'
import { useGsapContext } from '../hooks/useGsapContext'
import { useReducedMotion } from '../hooks/useReducedMotion'
import { useUI } from '../context/UIContext'
import { scrollToTop } from '../lib/smoothScroll'
import { DUR, EASE, STAGGER } from '../lib/motion'
import { MagneticButton } from '../components/ui/MagneticButton'
import { VideoNavButton } from '../components/ui/VideoNav'
import { VideoPreview } from '../components/ui/VideoPreview'
import { PixelSceneBackground } from '../components/ui/PixelSceneBackground'
import styles from './ProjectDetailPage.module.css'

/** 服务列表代码 → 中文名（中文模式下展示） */
const SERVICE_CN: Record<string, string> = {
  'KV MOTION': 'KV 动效',
  'H5 MOTION': 'H5 动效',
  'UI MOTION': 'UI 动效',
  INTERACTION: '交互动效',
  'FEEDBACK DESIGN': '反馈设计',
  VFX: '特效',
  'ASSET DELIVERY': '资源交付',
  QA: '上线走查',
  'AD FILM': '广告片',
  'MOTION GRAPHICS': '动态包装',
  EDITING: '剪辑',
  PROMOTION: '宣发',
  'SOCIAL VIDEO': '社媒视频',
  'SHORT-FORM': '短视频',
  'PAGE MOTION': '页面动效',
  'UI MOTION PREVIS': 'UI 动效预演',
  '3D ADAPTATION': '三维资源适配',
  'MOTION PREVIS': '动效预演',
  'REAL-TIME FX': '实时特效',
  'ENGINE PRACTICE': '引擎实践',
}

/**
 * 项目详情页 /projects/:slug
 * 章节内容全部来自 data/projects.ts 的 sections 字段：
 * body → 段落，list → 要点，flow → 流程条。
 * 每个章节都有独立的 ScrollTrigger 动效；图集缺失时回落到占位底板。
 */
export function ProjectDetailPage() {
  const { slug } = useParams<{ slug: string }>()
  const rootRef = useRef<HTMLDivElement>(null)
  const reduced = useReducedMotion()
  const { t, tx, txList, lang } = useUI()
  const cn = lang === 'CN'

  const project = getProjectBySlug(slug)

  /* Hero 媒体：项目全部视频（含子模块案例视频），每条独立无缝循环播放，
     切换用左右箭头或底部视频选择条；当前视频归属的子模块用于筛选条高亮跟随。 */
  const { heroVideos } = useMemo(() => {
    const owner = videoOwnerMap(project)
    const labels: Record<string, string> = {}
    ;(project?.cases ?? []).forEach((c) => {
      const cv =
        c.works && c.works.length > 0
          ? c.works.flatMap((w) => w.videos)
          : c.videos && c.videos.length > 0
            ? c.videos
            : c.video
              ? [c.video]
              : []
      cv.forEach((v) => {
        labels[v] = tx(caseDisplayName(c))
      })
    })
    const list =
      project && project.videos && project.videos.length > 0
        ? project.videos
        : project
          ? project.video
            ? [project.video]
            : []
          : []
    return {
      heroVideos: list.map((src) => ({
        src,
        caseId: owner[src],
        label: labels[src] ?? project?.title ?? '',
      })),
    }
  }, [project, tx])

  const [videoIndex, setVideoIndex] = useState(0)
  const goVideo = (dir: number) =>
    setVideoIndex((i) => (i + dir + heroVideos.length) % Math.max(heroVideos.length, 1))

  /* 切换到下一个项目时把媒体也重置回第一个 */
  useEffect(() => {
    setVideoIndex(0)
  }, [slug])

  /* 当前视频归属的子模块（用于筛选条高亮）；无归属时不高亮任何子模块 */
  const currentOwner = heroVideos[videoIndex]?.caseId
  const currentLabel = heroVideos[videoIndex]?.label ?? project?.title ?? ''

  useGsapContext(
    () => {
      if (reduced || !project) return

      /* Hero */
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

      /* 各章节 */
      gsap.utils.toArray<HTMLElement>(`.${styles.block}`).forEach((block) => {
        const inner = gsap.timeline({
          scrollTrigger: { trigger: block, start: 'top 85%', once: true },
        })

        const rule = block.querySelector(`.${styles.blockRule}`)
        const head = block.querySelectorAll(`.${styles.blockHead} > *`)
        const paras = block.querySelectorAll(`.${styles.para}, .${styles.bullet}`)
        const steps = block.querySelectorAll(`.${styles.flowStep}`)

        if (rule) {
          inner.from(rule, { scaleX: 0, duration: 0.6, ease: EASE.transition })
        }
        if (head.length) {
          inner.from(
            head,
            { yPercent: 120, duration: 0.7, stagger: 0.06, ease: EASE.element },
            0.06
          )
        }
        if (paras.length) {
          inner.from(
            paras,
            { opacity: 0, x: 22, duration: 0.65, stagger: 0.07, ease: EASE.element },
            0.2
          )
        }
        if (steps.length) {
          inner.from(
            steps,
            { yPercent: 60, opacity: 0, duration: 0.55, stagger: 0.06, ease: EASE.element },
            0.24
          )
        }
      })

      /* 指标计数 */
      gsap.utils.toArray<HTMLElement>(`.${styles.metric}`).forEach((m, i) => {
        gsap.from(m, {
          yPercent: 40,
          opacity: 0,
          duration: 0.7,
          ease: EASE.element,
          delay: i * 0.07,
          scrollTrigger: { trigger: `.${styles.metrics}`, start: 'top 88%', once: true },
        })
      })

      /* PREV / NEXT PROJECT */
      gsap.from(`.${styles.nextInner}`, {
        yPercent: 30,
        clipPath: 'inset(0% 0% 100% 0%)',
        duration: 1.1,
        ease: EASE.media,
        scrollTrigger: { trigger: `.${styles.nextNav}`, start: 'top 88%', once: true },
      })
    },
    [reduced, slug],
    rootRef
  )

  /* ---------- 未找到项目 ---------- */
  if (!project) {
    return (
      <main className={styles.missing}>
        <div className="shell">
          <span className={styles.missingCode}>ERROR / 404</span>
          <h1 className={styles.missingTitle}>PROJECT NOT FOUND</h1>
          <p className={styles.missingText}>
            {t('没有找到 slug 为 ', 'No project matches the slug ')}
            <code>{slug}</code>
            {t(
              ' 的项目。它可能已被重命名或移除。',
              '. It may have been renamed or removed.'
            )}
          </p>
          <MagneticButton to="/" variant="primary" size="lg" arrow>
            BACK TO HOME
          </MagneticButton>
        </div>
      </main>
    )
  }

  const prev = getPrevProject(project.slug)
  const next = getNextProject(project.slug)
  const titleZh = tx(project.titleZh)
  const categoryText = tx(project.category)
  /* LEVEL 02 标签：雷火/广告=PRODUCT，UI=MODULE，宣发/社媒=CASE */
  const subMeta = level2Meta(trackFilterOf(project))

  return (
    <main ref={rootRef} className={styles.root} style={{ ['--accent' as string]: project.accent }}>
      <div className={`grid-bg ${styles.grid}`} aria-hidden="true" />
      <div className={`noise ${styles.noise}`} aria-hidden="true" />
      <PixelSceneBackground variant="projectDetail" />

      {/* ══════════════ HERO ══════════════ */}
      <header className={`${styles.hero} shell`}>
        <Link to="/" className={styles.back} data-cursor="link" state={{ scrollTo: 'projects' }}>
          <ArrowLeft size={13} strokeWidth={2.2} />
          {t('返回项目库', 'BACK TO PROJECTS')}
        </Link>

        <div className={styles.heroGrid}>
          <div className={styles.heroText}>
            <span className={styles.heroIndex}>
              {t('作品方向 / TRACK', 'TRACK')} {project.index}
            </span>

            <h1 className={styles.heroTitleWrap}>
              <span className={styles.heroTitle}>{project.title}</span>
            </h1>

            <span className={styles.heroZhWrap}>
              <span className={styles.heroZh}>{titleZh}</span>
            </span>

            <p className={styles.heroDesc}>{tx(project.description)}</p>

            <ul className={styles.meta}>
              <li className={styles.metaItem}>
                <span className={styles.metaKey}>{t('年份', 'YEAR')}</span>
                <span className={styles.metaVal}>{project.year}</span>
              </li>
              <li className={styles.metaItem}>
                <span className={styles.metaKey}>{t('类别', 'CATEGORY')}</span>
                <span className={styles.metaVal}>{categoryText}</span>
              </li>
              <li className={styles.metaItem}>
                <span className={styles.metaKey}>{t('状态', 'STATUS')}</span>
                <span className={styles.metaVal}>
                  {cn ? PROJECT_STATUS_CN[project.status] ?? project.status : project.status}
                </span>
              </li>
              <li className={styles.metaItem}>
                <span className={styles.metaKey}>{t('服务', 'SERVICES')}</span>
                <span className={styles.metaVal}>
                  {(cn
                    ? project.services.map((s) => SERVICE_CN[s] ?? s)
                    : project.services
                  ).join(' / ')}
                </span>
              </li>
            </ul>
          </div>

          {/* 二级项目（子模块）筛选 + 项目 Hero 媒体：筛选放在预览视频上方 */}
          <div className={styles.heroMediaCol}>
            {project.cases && project.cases.length > 0 && (
              <div className={styles.subModuleBar}>
                <span className={styles.subModuleLabel}>
                  LEVEL {String(subMeta.level).padStart(2, '0')} / {tx(subMeta.code)} /{' '}
                  {tx(subMeta.label)}
                </span>
                <div className={styles.subModuleList}>
                  {orderCasesBySubFilter(project).map((c, ci) => (
                    <Link
                      key={c.id}
                      to={`/projects/${project.slug}/case/${c.id}`}
                      className={`${styles.subModuleChip} ${
                        currentOwner === c.id ? styles.subModuleChipOn : ''
                      }`}
                      data-cursor="link"
                    >
                      <span className={styles.subModuleIndex}>
                        {String(ci + 1).padStart(2, '0')}
                      </span>
                      <span>{tx(caseDisplayName(c))}</span>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            <div className={styles.heroMedia}>
              <VideoPreview
                /* 每条视频独立无缝循环播放，切换用左右箭头或底部视频选择条；
                   支持暂停/播放切换与进度条拖动 */
                videos={heroVideos.length ? heroVideos.map((v) => v.src) : undefined}
                videoIndex={heroVideos.length ? videoIndex : undefined}
                onVideoChange={heroVideos.length ? setVideoIndex : undefined}
                video={heroVideos.length ? undefined : project.video}
                cover={project.cover}
                alt={t(`${titleZh} · ${currentLabel}`, `${project.title} · ${currentLabel}`)}
                indexLabel={project.index}
                category={categoryText}
                status={cn ? PROJECT_STATUS_CN[project.status] ?? project.status : project.status}
                mode="auto"
                loopVideo
                lazy={false}
                selectorExtra={
                  heroVideos.length > 1
                    ? `${String(videoIndex + 1).padStart(2, '0')} / ${String(heroVideos.length).padStart(2, '0')}`
                    : undefined
                }
              />

              {heroVideos.length > 1 && (
                <>
                  <VideoNavButton
                    direction="prev"
                    onClick={() => goVideo(-1)}
                    aria-label={t('上一个作品', 'Previous work')}
                  >
                    <ChevronLeft size={18} />
                  </VideoNavButton>
                  <VideoNavButton
                    direction="next"
                    onClick={() => goVideo(1)}
                    aria-label={t('下一个作品', 'Next work')}
                  >
                    <ChevronRight size={18} />
                  </VideoNavButton>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* ══════════════ 章节 ══════════════ */}
      <div className={`${styles.body} shell`}>
        {project.sections.map((section, i) => (
          <section key={section.id} className={styles.block}>
            <span className={styles.blockRule} aria-hidden="true" />
            <div className={styles.blockHead}>
              <span className={styles.blockIndex}>{String(i + 1).padStart(2, '0')}</span>
              {/* 中文模式：主标题显示中文，副标题回退英文；英文模式保持原样 */}
              <h2 className={styles.blockTitle}>
                {cn ? tx(section.labelZh) : section.label}
              </h2>
              <span className={styles.blockZh}>
                {cn ? section.label : tx(section.labelZh)}
              </span>
            </div>

            <div className={styles.blockBody}>
              {section.body &&
                txList(section.body).map((p) => (
                  <p key={p} className={styles.para}>
                    {p}
                  </p>
                ))}

              {section.list && (
                <ul className={styles.bullets}>
                  {txList(section.list).map((item) => (
                    <li key={item} className={styles.bullet}>
                      <i className={styles.bulletTick} />
                      {item}
                    </li>
                  ))}
                </ul>
              )}

              {/* 流程条 */}
              {section.flow && (
                <ol className={styles.flow}>
                  {txList(section.flow).map((step, si, arr) => (
                    <li key={step} className={styles.flowStep}>
                      <span className={styles.flowNum}>{String(si + 1).padStart(2, '0')}</span>
                      <span className={styles.flowText}>{step}</span>
                      {si < arr.length - 1 && (
                        <ArrowRight className={styles.flowArrow} size={13} aria-hidden="true" />
                      )}
                    </li>
                  ))}
                </ol>
              )}
            </div>
          </section>
        ))}

        {/* ══════════════ 工具 ══════════════ */}
        <section className={styles.block}>
          <span className={styles.blockRule} aria-hidden="true" />
          <div className={styles.blockHead}>
            <span className={styles.blockIndex}>
              {String(project.sections.length + 1).padStart(2, '0')}
            </span>
            <h2 className={styles.blockTitle}>{t('使用工具', 'TOOLS')}</h2>
            <span className={styles.blockZh}>{t('TOOLSET', '工具链')}</span>
          </div>
          <div className={styles.blockBody}>
            {project.toolGroups ? (
              <div className={styles.toolGroups}>
                {project.toolGroups.map((group) => (
                  <div key={group.label} className={styles.toolGroup}>
                    <span className={styles.toolGroupLabel}>
                      <b>{group.label}</b>
                      <span>{t(group.labelZh.cn, group.labelZh.en)}</span>
                    </span>
                    <ul className={styles.tools}>
                      {group.items.map((tool) => (
                        <li key={tool} className={styles.tool}>
                          <Wrench size={12} strokeWidth={2} />
                          {tool}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            ) : (
              <ul className={styles.tools}>
                {project.tools.map((tool) => (
                  <li key={tool} className={styles.tool}>
                    <Wrench size={12} strokeWidth={2} />
                    {tool}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>

        {/* ══════════════ 成果指标 ══════════════ */}
        {project.metrics.length > 0 && (
          <section className={styles.block}>
            <span className={styles.blockRule} aria-hidden="true" />
            <div className={styles.blockHead}>
              <span className={styles.blockIndex}>
                {String(project.sections.length + 2).padStart(2, '0')}
              </span>
              <h2 className={styles.blockTitle}>{t('最终成果', 'FINAL RESULT')}</h2>
              <span className={styles.blockZh}>{t('FINAL RESULTS', '最终成果')}</span>
            </div>
            <ul className={styles.metrics}>
              {project.metrics.map((m) => (
                <li key={m.label} className={styles.metric}>
                  <span className={styles.metricValue}>{tx(m.value)}</span>
                  <span className={styles.metricLabel}>
                    {cn ? METRIC_CN[m.label] ?? m.label : m.label}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>

      {/* ══════════════ PREV / NEXT PROJECT ══════════════ */}
      <section className={styles.nextNav}>
        <div className="shell">
          <div className={styles.nextGrid}>
            <Link
              to={`/projects/${prev.slug}`}
              className={`${styles.nextInner} ${styles.nextInnerPrev}`}
              data-cursor="label"
              data-cursor-label="PREV"
            >
              <span className={styles.nextLabel}>
                {t('PREVIOUS PROJECT', 'PREVIOUS PROJECT')}
              </span>
              <div className={styles.nextRow}>
                <ArrowLeft className={styles.nextArrow} size={30} strokeWidth={1.6} />
                <span className={styles.nextIndex}>{prev.index}</span>
                <span className={styles.nextText}>
                  <span className={styles.nextTitle}>{prev.title}</span>
                  <span className={styles.nextZh}>{tx(prev.titleZh)}</span>
                </span>
              </div>
            </Link>

            <Link
              to={`/projects/${next.slug}`}
              className={styles.nextInner}
              data-cursor="label"
              data-cursor-label="NEXT"
            >
              <span className={styles.nextLabel}>
                {t('NEXT PROJECT', 'NEXT PROJECT')}
              </span>
              <div className={styles.nextRow}>
                <span className={styles.nextIndex}>{next.index}</span>
                <span className={styles.nextText}>
                  <span className={styles.nextTitle}>{next.title}</span>
                  <span className={styles.nextZh}>{tx(next.titleZh)}</span>
                </span>
                <ArrowRight className={styles.nextArrow} size={30} strokeWidth={1.6} />
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* ══════════════ 底部退出栏：返回项目列表 / 回到最顶 ══════════════ */}
      <div className={styles.exitBar}>
        <Link
          to="/"
          className={styles.back}
          state={{ scrollTo: 'projects' }}
          data-cursor="link"
        >
          <ArrowLeft size={13} strokeWidth={2.2} />
          {t('返回项目库', 'BACK TO PROJECTS')}
        </Link>
        <button
          type="button"
          className={styles.back}
          onClick={() => scrollToTop()}
          data-cursor="link"
        >
          <ArrowUp size={13} strokeWidth={2.2} />
          {t('返回顶部', 'BACK TO TOP')}
        </button>
      </div>
    </main>
  )
}
