import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { ChevronLeft, ChevronRight, X } from 'lucide-react'
import type { Project, ProjectCase } from '../../data/types'
import { gsap } from '../../lib/gsap'
import { useGsapContext } from '../../hooks/useGsapContext'
import { useReducedMotion } from '../../hooks/useReducedMotion'
import { usePlayback } from '../../context/PlaybackContext'
import { useUI } from '../../context/UIContext'
import { EASE } from '../../lib/motion'
import { useHlsVideo } from '../../hooks/useHlsVideo'
import { claimPlayback, pauseActiveVideo, releasePlayback } from '../../lib/videoMutex'
import styles from './CaseViewer.module.css'

interface CaseViewerProps {
  project: Project
  initialIndex?: number
  onClose: () => void
}

/**
 * CaseViewer —— 精选项目的子层级案例查看器（模态）。
 * 左侧为主内容区（当前案例的作品图集 / 视频 / 描述），右侧为可点击的目录列表；
 * 支持 ← → 键在作品页面间浏览（案例内多图翻页，翻到头自动进入下一个案例）、
 * Esc / 点击遮罩 / 关闭按钮退出。
 * 打开时锁定背景滚动；退出时播完关闭动画再回调 onClose。
 */
export function CaseViewer({ project, initialIndex = 0, onClose }: CaseViewerProps) {
  const rootRef = useRef<HTMLDivElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const descRef = useRef<HTMLParagraphElement>(null)
  const stageRef = useRef<HTMLDivElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const dirRef = useRef<HTMLOListElement>(null)
  const [index, setIndex] = useState(Math.min(initialIndex, (project.cases?.length ?? 1) - 1))
  const prevIndexRef = useRef(index)
  const [pageIndex, setPageIndex] = useState(0)
  const [imgFailed, setImgFailed] = useState(false)
  /** 当前页图片是否加载成功——成功前保持隐藏，避免失败图闪现 / 左右键跳闪 */
  const [imgLoaded, setImgLoaded] = useState(false)
  const [closing, setClosing] = useState(false)
  const reduced = useReducedMotion()
  const { t, tx, txList } = useUI()
  const { soundOn, volume } = usePlayback()

  const cases: ProjectCase[] = project.cases ?? []
  const total = cases.length
  const current = cases[index]
  /* m3u8 走 hls.js，其余走原生 src */
  useHlsVideo(videoRef, current?.video)
  const accent = project.accent
  /** 当前案例的作品图集（多张 = 多个页面） */
  const media = current?.gallery ?? []
  const mediaCount = media.length
  const descText = current ? tx(current.description) : ''

  /* ---------- 全局播放互斥：打开查看器时暂停后台其他视频，避免叠声 ---------- */
  useLayoutEffect(() => {
    pauseActiveVideo()
    return () => pauseActiveVideo()
  }, [])

  /* 查看器视频开始播放时声明全局播放权；卸载时释放 */
  useEffect(() => {
    const v = videoRef.current
    if (!v) return
    const onPlay = () => claimPlayback(v)
    const onPause = () => releasePlayback(v)
    v.addEventListener('play', onPlay)
    v.addEventListener('pause', onPause)
    return () => {
      v.removeEventListener('play', onPlay)
      v.removeEventListener('pause', onPause)
      releasePlayback(v)
    }
  }, [])

  /* 音量跟随全局：默认静音由 soundOn 控制，首次取消静音即 75%（见 UIContext） */
  useEffect(() => {
    const v = videoRef.current
    if (v) v.volume = volume
  }, [volume, index])

  /* ---------- 锁定背景滚动 + 焦点移入 ---------- */
  useLayoutEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    // 把焦点移到查看器自身，避免 ← → 键冒泡触发底层舞台的切换
    const root = rootRef.current
    if (root) {
      root.setAttribute('tabindex', '-1')
      root.focus({ preventScroll: true })
    }
    return () => {
      document.body.style.overflow = prev
    }
  }, [])

  /* ---------- 入场动画 ---------- */
  useGsapContext(
    () => {
      const root = rootRef.current
      const panel = panelRef.current
      if (!root || !panel) return

      if (reduced) {
        gsap.set(root, { autoAlpha: 1 })
        gsap.set(panel, { autoAlpha: 1 })
        return
      }

      gsap.fromTo(root, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.4, ease: 'power2.out', overwrite: 'auto' })
      gsap.fromTo(
        panel,
        { autoAlpha: 0, clipPath: 'inset(12% 6% 12% 6%)', scale: 0.97, y: 24 },
        {
          autoAlpha: 1,
          clipPath: 'inset(0% 0% 0% 0%)',
          scale: 1,
          y: 0,
          duration: 0.65,
          ease: EASE.media,
          delay: 0.08,
          overwrite: 'auto',
          // 兜底：无论任何原因导致动画被中断/异常，完成后强制落到可见终态
          onComplete: () => {
            const p = panelRef.current
            const r = rootRef.current
            if (p) gsap.set(p, { autoAlpha: 1, clipPath: 'inset(0% 0% 0% 0%)', scale: 1, y: 0 })
            if (r) gsap.set(r, { autoAlpha: 1 })
          }
        }
      )
      gsap.fromTo(
        panel.querySelectorAll(`.${styles.headInner} > *`),
        { yPercent: -120, opacity: 0 },
        { yPercent: 0, opacity: 1, duration: 0.5, stagger: 0.05, ease: EASE.element, delay: 0.18, overwrite: 'auto' }
      )
      gsap.fromTo(
        panel.querySelectorAll(`.${styles.dirItem}`),
        { x: 26, opacity: 0 },
        { x: 0, opacity: 1, duration: 0.45, stagger: 0.05, ease: EASE.element, delay: 0.3, overwrite: 'auto' }
      )
      gsap.fromTo(
        panel.querySelectorAll(`.${styles.footInner} > *`),
        { yPercent: 60, opacity: 0 },
        { yPercent: 0, opacity: 1, duration: 0.5, stagger: 0.06, ease: EASE.element, delay: 0.4, overwrite: 'auto' }
      )
    },
    [reduced],
    rootRef
  )

  /* ---------- 切换案例时的内容揭示 ----------
     与详情页章节动画对齐：顶部横线 scaleX 0→1 → 编号/标题/副标题
     yPercent 120 stagger → 段落与方块要点 opacity + x 依次滑入。
     inset 语法为 inset(top right bottom left)，
     初始 right:100% 表示右侧裁掉，内容自左侧开始显现 → 从左到右。 */
  useEffect(() => {
    const content = contentRef.current
    const desc = descRef.current
    if (!content || !desc) return

    // 减少动态：只保证文字可见，不拆字不动画
    if (reduced) {
      desc.textContent = descText
      return
    }

    // ① 内容整体：从左到右擦除揭示
    gsap.fromTo(
      content,
      { clipPath: 'inset(0% 100% 0% 0%)' },
      { clipPath: 'inset(0% 0% 0% 0%)', duration: 0.55, ease: EASE.media, overwrite: 'auto' }
    )

    // ② 顶部横线：scaleX 0 → 1（对齐详情页 blockRule）
    const rule = content.querySelector(`.${styles.contentRule}`)
    if (rule) {
      gsap.fromTo(
        rule,
        { scaleX: 0 },
        { scaleX: 1, duration: 0.6, ease: EASE.transition, delay: 0.1, overwrite: 'auto' }
      )
    }

    // ③ 编号 / 标题 / 中文副标题：yPercent 120 stagger（对齐详情页 blockHead）
    const head = content.querySelector(`.${styles.contentHead}`)
    if (head) {
      gsap.fromTo(
        head.children,
        { yPercent: 120, opacity: 0 },
        {
          yPercent: 0,
          opacity: 1,
          duration: 0.7,
          stagger: 0.06,
          ease: EASE.element,
          delay: 0.14,
          overwrite: 'auto',
        }
      )
    }

    // ④ 信息行 / 方块要点 / 标签：opacity + x 依次滑入（对齐详情页 para/bullet）
    const info = content.querySelector(`.${styles.caseInfo}`)
    const specs = content.querySelector(`.${styles.caseSpecs}`)
    const tags = content.querySelectorAll(`.${styles.tag}`)
    if (info) {
      gsap.fromTo(
        info,
        { opacity: 0, x: 22 },
        { opacity: 1, x: 0, duration: 0.65, ease: EASE.element, delay: 0.22, overwrite: 'auto' }
      )
    }
    if (specs) {
      gsap.fromTo(
        specs,
        { opacity: 0, x: 22 },
        { opacity: 1, x: 0, duration: 0.65, ease: EASE.element, delay: 0.3, overwrite: 'auto' }
      )
    }
    if (tags.length) {
      gsap.fromTo(
        tags,
        { opacity: 0, x: 22 },
        {
          opacity: 1,
          x: 0,
          duration: 0.6,
          stagger: 0.07,
          ease: EASE.element,
          delay: 0.36,
          overwrite: 'auto',
        }
      )
    }

    // ⑤ 描述文字：拆分为字符，GSAP 逐字从左到右滑入
    desc.textContent = ''
    const spans = Array.from(descText).map((ch) => {
      const s = document.createElement('span')
      s.textContent = ch
      s.style.display = 'inline-block'
      s.style.whiteSpace = 'pre'
      desc.appendChild(s)
      return s
    })
    if (spans.length) {
      gsap.fromTo(
        spans,
        { x: -16, opacity: 0 },
        { x: 0, opacity: 1, duration: 0.4, stagger: 0.02, ease: EASE.element, delay: 0.34, overwrite: 'auto' }
      )
    }
  }, [index, reduced, descText])

  /* ---------- stage 展示区切换动画（案例切换） ----------
     切换案例时，当前展示的内容（视频 / 图集 / 占位）整体从左到右擦除出现。
     注意：只依赖 index，不依赖 pageIndex / imgFailed——
     onError 失败回落会连续改写这两个状态，若纳入依赖会导致动画重复重播（跳闪）。 */
  useEffect(() => {
    const stage = stageRef.current
    if (!stage || reduced) return
    const el = stage.firstElementChild
    if (el && el instanceof HTMLElement) {
      gsap.fromTo(
        el,
        { clipPath: 'inset(0% 100% 0% 0%)' },
        { clipPath: 'inset(0% 0% 0% 0%)', duration: 0.55, ease: EASE.media, overwrite: 'auto' }
      )
    }
  }, [index, reduced])

  /* ---------- 占位回落动画 ----------
     图片全部加载失败回落占位时，大数字与提示文案错峰淡入上浮。 */
  useEffect(() => {
    const stage = stageRef.current
    if (!stage || reduced || !imgFailed) return
    const el = stage.firstElementChild
    if (!el || !(el instanceof HTMLElement) || !el.classList.contains(styles.stageGrid)) return
    const ghost = el.querySelector(`.${styles.stageGhost}`)
    const mark = el.querySelector(`.${styles.stageMark}`)
    if (ghost) {
      gsap.fromTo(
        ghost,
        { y: 26, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.55, ease: EASE.element, delay: 0.16, overwrite: 'auto' }
      )
    }
    if (mark) {
      gsap.fromTo(
        mark,
        { y: 12, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.45, ease: EASE.element, delay: 0.32, overwrite: 'auto' }
      )
    }
  }, [imgFailed, index, reduced])

  /* ---------- 目录激活项动画 ----------
     点击目录 / 切换案例时，当前激活项从左滑入 + 左侧指示条展开，
     背景色由 CSS transition 平滑过渡。首次挂载跳过（由入场动画处理）。 */
  useEffect(() => {
    const list = dirRef.current
    if (!list || reduced) return
    const first = prevIndexRef.current === index
    prevIndexRef.current = index
    if (first) return
    const active = list.querySelector(`.${styles.dirItemOn}`)
    if (active && active instanceof HTMLElement) {
      gsap.fromTo(
        active,
        { x: -10, opacity: 0.4, borderLeftWidth: 0 },
        { x: 0, opacity: 1, borderLeftWidth: 2, duration: 0.45, ease: EASE.element, overwrite: 'auto' }
      )
    }
  }, [index, reduced])

  /* ---------- 关闭流程 ---------- */
  const close = useCallback(() => {
    if (closing) return
    setClosing(true)
    const root = rootRef.current
    const panel = panelRef.current
    if (!root) {
      onClose()
      return
    }
    if (reduced) {
      onClose()
      return
    }
    // 兜底：关闭动画异常时也要保证 onClose 被调用，避免查看器永远无法关闭
    try {
      const tl = gsap.timeline({
        onComplete: onClose,
        onInterrupt: onClose,
      })
      tl.to(panel, {
        scale: 0.96,
        y: 14,
        clipPath: 'inset(8% 4% 8% 4%)',
        duration: 0.35,
        ease: 'power3.in',
        overwrite: 'auto',
      }).to(root, { autoAlpha: 0, duration: 0.3, ease: 'power2.in' }, 0.12)
    } catch (err) {
      console.warn('[CaseViewer] close animation failed, closing immediately:', err)
      onClose()
    }
  }, [closing, reduced, onClose])

  /**
   * 在作品页面间前进 / 后退：
   * 优先翻当前案例内的图集（多个页面），翻到头自动进入下一个案例（作品）。
   */
  const go = useCallback(
    (dir: number) => {
      // 案例内翻页（仅当存在图集且图片未全部加载失败）
      if (mediaCount > 0 && !imgFailed) {
        const nextPage = pageIndex + dir
        if (nextPage >= 0 && nextPage < mediaCount) {
          setPageIndex(nextPage)
          setImgFailed(false)
          setImgLoaded(false)
          return
        }
      }
      // 翻到头 / 尾 → 切换案例（作品），并回到该案例的第一页
      setIndex((i) => Math.min(total - 1, Math.max(0, i + dir)))
      setPageIndex(0)
      setImgFailed(false)
      setImgLoaded(false)
    },
    [mediaCount, pageIndex, total, imgFailed]
  )

  /** 目录 / 底部按钮：直接切换到指定案例（作品） */
  const select = useCallback(
    (i: number) => {
      setIndex(i)
      setPageIndex(0)
      setImgFailed(false)
      setImgLoaded(false)
    },
    []
  )

  /* ---------- 键盘 ---------- */
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        close()
      } else if (e.key === 'ArrowRight') {
        e.preventDefault()
        go(1)
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault()
        go(-1)
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [go, close])

  return (
    <div
      ref={rootRef}
      className={styles.backdrop}
      role="dialog"
      aria-modal="true"
      aria-label={t(`${tx(project.titleZh)} 子层级案例`, `${project.title} — sub-level cases`)}
      onClick={(e) => {
        if (e.target === e.currentTarget) close()
      }}
    >
      <div ref={panelRef} className={styles.panel} style={{ ['--viewer-accent' as string]: accent }}>
        {/* ────────── 顶栏 ────────── */}
        <header className={styles.head}>
          <div className={styles.headInner}>
            <span className={styles.headCode}>MISSION {project.index}</span>
            <span className={styles.headTitle}>{tx(project.titleZh)}</span>
            <span className={styles.headMeta}>
              {t('子层级案例', 'SUB-LEVEL CASES')} · {String(index + 1).padStart(2, '0')}/
              {String(total).padStart(2, '0')}
            </span>
          </div>
          <button
            type="button"
            className={styles.closeBtn}
            onClick={close}
            aria-label={t('关闭查看器', 'Close viewer')}
            data-cursor="link"
          >
            <X size={18} />
          </button>
        </header>

        {/* ────────── 主体两栏 ────────── */}
        <div className={styles.body}>
          {/* 左：主内容区 */}
          <div className={styles.main}>
            {/* 作品展示区：优先视频，其次图集（多个页面），无素材时回落占位 */}
            <div className={styles.stage} ref={stageRef}>
              {current.video ? (
                <video
                  ref={videoRef}
                  className={styles.stageVideo}
                  autoPlay
                  loop
                  muted={!soundOn}
                  playsInline
                  preload="metadata"
                />
              ) : mediaCount > 0 && !imgFailed ? (
                <div className={styles.stageGallery}>
                  <img
                    key={`${index}-${pageIndex}`}
                    className={`${styles.stageImg} ${imgLoaded ? styles.stageImgLoaded : ''}`}
                    src={media[Math.min(pageIndex, mediaCount - 1)]}
                    alt=""
                    draggable={false}
                    onLoad={() => setImgLoaded(true)}
                    onError={() => {
                      // 单张失败 → 跳过尝试下一张；全部失败 → 回落占位
                      if (pageIndex + 1 < mediaCount) {
                        setPageIndex(pageIndex + 1)
                        setImgLoaded(false)
                      } else {
                        setImgFailed(true)
                      }
                    }}
                  />
                  {mediaCount > 1 && imgLoaded && (
                    <>
                      <span className={styles.stagePageNum}>
                        {String(pageIndex + 1).padStart(2, '0')} / {String(mediaCount).padStart(2, '0')}
                      </span>
                      <button
                        type="button"
                        className={`${styles.stageArrow} ${styles.stageArrowLeft}`}
                        onClick={() => go(-1)}
                        disabled={pageIndex <= 0}
                        aria-label={t('上一张作品', 'Previous work')}
                        data-cursor="link"
                      >
                        <ChevronLeft size={18} />
                      </button>
                      <button
                        type="button"
                        className={`${styles.stageArrow} ${styles.stageArrowRight}`}
                        onClick={() => go(1)}
                        disabled={pageIndex >= mediaCount - 1}
                        aria-label={t('下一张作品', 'Next work')}
                        data-cursor="link"
                      >
                        <ChevronRight size={18} />
                      </button>
                    </>
                  )}
                </div>
              ) : (
                <div className={styles.stageGrid}>
                  <span className={styles.stageGhost}>{String(index + 1).padStart(2, '0')}</span>
                  <span className={styles.stageMark}>
                    {t('CASE PREVIEW / 待替换素材', 'CASE PREVIEW / PENDING MEDIA')}
                  </span>
                  <i className={styles.stageScan} />
                </div>
              )}
            </div>

            <div ref={contentRef} className={styles.content}>
              {/* 顶部横线：与详情页 blockRule 对齐 */}
              <span className={styles.contentRule} aria-hidden="true" />
              {/* 编号 + 标题 + 中文副标题：与详情页 blockHead 对齐 */}
              <div className={styles.contentHead}>
                <span className={styles.contentIndex}>
                  {String(index + 1).padStart(2, '0')}
                </span>
                <h4 className={styles.caseName}>{tx(current.name)}</h4>
                <span className={styles.contentZh}>
                  {current.meta ? tx(current.meta) : t('子层级案例', 'SUB-LEVEL CASE')}
                </span>
              </div>
              <dl className={styles.caseInfo}>
                <div className={styles.caseInfoItem}>
                  <dt>{t('完成时间', 'COMPLETED')}</dt>
                  <dd>{current.date ? tx(current.date) : t('待补充', 'TBD')}</dd>
                </div>
                <div className={styles.caseInfoItem}>
                  <dt>{t('职责', 'RESPONSIBILITY')}</dt>
                  <dd>{current.role ? tx(current.role) : t('待补充', 'TBD')}</dd>
                </div>
              </dl>
              <p ref={descRef} className={styles.caseDesc} />
              {/* 项目级职责与工具：与详情页 bullets 方块要点对齐 */}
              <ul className={styles.caseSpecs}>
                <li className={styles.caseSpecBlock}>
                  <i className={styles.caseSpecTick} aria-hidden="true" />
                  <span className={styles.caseSpecLabel}>
                    {t('MY ROLE / 职责', 'MY ROLE')}
                  </span>
                  <span className={styles.caseSpecText}>{txList(project.role).join(' · ')}</span>
                </li>
                <li className={styles.caseSpecBlock}>
                  <i className={styles.caseSpecTick} aria-hidden="true" />
                  <span className={styles.caseSpecLabel}>{t('TOOLS / 工具', 'TOOLS')}</span>
                  <span className={styles.caseSpecText}>{project.tools.join(' · ')}</span>
                </li>
              </ul>
              <ul className={styles.tags}>
                {current.tags.map((tag) => (
                  <li key={tag} className={styles.tag}>
                    {tag}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* 右：目录 */}
          <aside className={styles.dir}>
            <span className={styles.dirLabel}>
              {t('目录 / DIRECTORY', 'DIRECTORY')}
            </span>
            <ol className={styles.dirList} ref={dirRef}>
              {cases.map((c, i) => (
                <li key={c.id}>
                  <button
                    type="button"
                    className={`${styles.dirItem} ${i === index ? styles.dirItemOn : ''}`}
                    onClick={() => select(i)}
                    aria-current={i === index ? 'true' : undefined}
                    data-cursor="link"
                  >
                    <span className={styles.dirIndex}>{String(i + 1).padStart(2, '0')}</span>
                    <span className={styles.dirName}>{tx(c.name)}</span>
                  </button>
                </li>
              ))}
            </ol>
          </aside>
        </div>

        {/* ────────── 底栏 ────────── */}
        <footer className={styles.foot}>
          <div className={styles.footInner}>
            <span className={styles.hint}>
              {t('← → 切换作品 · Esc 关闭', '← → to browse · Esc to close')}
            </span>
            <div className={styles.navBtns}>
              <button
                type="button"
                className={styles.navBtn}
                onClick={() => go(-1)}
                disabled={index <= 0 && pageIndex <= 0}
                aria-label={t('上一个作品', 'Previous work')}
              >
                <ChevronLeft size={16} />
              </button>
              <button
                type="button"
                className={styles.navBtn}
                onClick={() => go(1)}
                disabled={index >= total - 1 && pageIndex >= mediaCount - 1}
                aria-label={t('下一个作品', 'Next work')}
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </footer>
      </div>
    </div>
  )
}
