import { useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import type { LT } from '../../data/i18n'
import type { Project } from '../../data/types'
import {
  caseDisplayName,
  level2Meta,
  orderCasesBySubFilter,
  trackFilterOf,
  videoOwnerMap,
} from '../../data/projects'
import { METRIC_CN, PROJECT_STATUS_CN } from '../../data/labels'
import { useUI } from '../../context/UIContext'
import { MagneticButton } from './MagneticButton'
import { VideoNavButton } from './VideoNav'
import { VideoPreview } from './VideoPreview'
import styles from './ProjectCard.module.css'

export type CardPosition = 'active' | 'prev' | 'next' | 'far'

interface ProjectCardProps {
  project: Project
  position: CardPosition
  /** 点击非当前卡片时切到该卡片 */
  onFocus?: () => void
  /** 点击 VIEW CASE 进入详情前回调（保存轮播现场状态，返回时恢复）。
   *  caseId：从一级卡片的二级产品条进入对应产品案例时传该产品 id；
   *  直接通过当前卡片的 VIEW CASE 进入时不传（以当前卡片为目标）。 */
  onOpenCase?: (caseId?: string) => void
  /** 受控视频序号（仅活动卡传入）：底部视频选择条与左右箭头共用同一个 activeVideoIndex，
   *  由 Projects 统一管理，支持从案例返回时恢复离开前的视频。 */
  videoIndex?: number
  onVideoChange?: (i: number) => void
  /** 预览视频左右箭头（仅活动卡且当前卡片有多条视频时显示），只切换 activeVideoIndex，
   *  绝不切换 PRODUCT / 项目大类。 */
  onPrevVideo?: () => void
  onNextVideo?: () => void
}

const STATUS_TONE: Record<Project['status'], string> = {
  ONGOING: styles.statusOngoing,
  DELIVERED: styles.statusDelivered,
  STUDY: styles.statusStudy,
  ARCHIVE: styles.statusArchive,
  LEARNING: styles.statusStudy,
}

/**
 * 项目卡：横向大卡 + 不规则切角 + 侧边信息面板。
 * priority 决定视觉权重 —— 优先级 1（雷火产品动效 / UI动效）字号与信息量最大。
 * VIEW CASE 统一进入项目详情页（子层级案例在详情页内以查看器呈现）。
 */
export function ProjectCard({
  project,
  position,
  onFocus,
  onOpenCase,
  videoIndex,
  onVideoChange,
  onPrevVideo,
  onNextVideo,
}: ProjectCardProps) {
  const isActive = position === 'active'
  /* 点击反馈：短暂显示 SELECTED（border→紫 / marker→lime / 一条扫描线） */
  const [flash, setFlash] = useState(false)
  const flashTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const triggerFlash = () => {
    setFlash(true)
    if (flashTimer.current) clearTimeout(flashTimer.current)
    flashTimer.current = setTimeout(() => setFlash(false), 220)
  }
  const { t, tx, txList, lang } = useUI()
  const cn = lang === 'CN'
  const titleZh = tx(project.titleZh)
  /* 三级信息架构：一级 = TRACK / 作品方向；子案例卡 = CASE / 项目案例 */
  const isCase = !!project.caseId
  const subMeta = level2Meta(trackFilterOf(project))

  /* 受控视频序号：活动卡由 Projects 统一管理（切换产品时归零、从案例返回时恢复） */
  const activeVideoIndex = videoIndex ?? 0
  /* 视频源 → 所属子模块案例 id */
  const videoOwner = useMemo(() => videoOwnerMap(project), [project])
  /* 视频源 → 活动项目名（work name）：预览 HUD 显示当前视频名称，随 activeVideoIndex 更新 */
  const videoWorkLabel = useMemo(() => {
    const map: Record<string, LT> = {}
    ;(project.cases ?? []).forEach((c) => {
      ;(c.works ?? []).forEach((w) => {
        w.videos.forEach((v) => {
          map[v] = w.name
        })
      })
    })
    return map
  }, [project])
  const currentOwner = project.videos?.[activeVideoIndex]
    ? videoOwner[project.videos[activeVideoIndex]]
    : undefined
  const currentVideoLabel = project.videos?.[activeVideoIndex]
    ? videoWorkLabel[project.videos[activeVideoIndex]]
    : undefined
  /* 状态文字：案例级 statusLabel 优先（如 UE 的「持续学习」），否则中文模式显示中文 */
  const statusText = project.statusLabel
    ? tx(project.statusLabel)
    : cn
      ? PROJECT_STATUS_CN[project.status] ?? project.status
      : project.status

  const classes = [
    styles.card,
    styles[`p${project.priority}`],
    styles[position],
    isActive ? styles.isActive : '',
    flash ? styles.cardFlash : '',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <article
      className={classes}
      style={{ ['--card-accent' as string]: project.accent }}
      aria-hidden={!isActive}
      onClick={!isActive ? onFocus : undefined}
      onPointerDown={!isActive ? triggerFlash : undefined}
      data-cursor={isActive ? undefined : 'open'}
    >
      {/* 点击选中反馈：短扫描线 + SELECTED */}
      {flash && (
        <>
          <span className={styles.selectedScan} aria-hidden="true" />
          <span className={styles.selectedTag}>{t('已选中', 'SELECTED')}</span>
        </>
      )}
      {/* 背景超大编号 */}
      <span className={styles.ghostIndex} aria-hidden="true">
        {project.index}
      </span>

      {/* 动态坐标线 */}
      <span className={styles.coords} aria-hidden="true">
        <i />
        <i />
      </span>

      <div className={styles.grid}>
        {/* ─────────── 左：信息 ─────────── */}
        <div className={styles.info}>
          <header className={styles.head}>
            <span className={styles.index}>
              {isCase ? t('CASE / 案例', 'CASE') : t('TRACK / 方向', 'TRACK')} {project.index}
            </span>
            <span className={`${styles.status} ${STATUS_TONE[project.status]}`}>
              <i className={styles.statusDot} />
              {statusText}
            </span>
          </header>

          {/* 层级标签：一级 = TRACK / 作品方向，子案例 = CASE / 项目案例 */}
          {isCase ? (
            <span className={styles.levelTag}>
              <b>LEVEL 03</b> {t('CASE / 项目案例', 'CASE')}
            </span>
          ) : (
            <span className={styles.levelTag}>
              <b>LEVEL 01</b> {t('TRACK / 作品方向', 'TRACK')}
            </span>
          )}

          <h3 className={styles.title}>{project.title}</h3>
          <p className={styles.titleZh}>{titleZh}</p>

          {/* 中间空位：项目服务标签 + 类型/职责信息 */}
          <ul className={styles.tagRow}>
            {project.services.slice(0, 3).map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ul>

          <dl className={styles.metaRows}>
            <div className={styles.metaRow}>
              <dt>{t('类型', 'TYPE')}</dt>
              <dd>{tx(project.category)}</dd>
            </div>
            <div className={styles.metaRow}>
              <dt>{t('职责', 'ROLE')}</dt>
              <dd>{txList(project.role).slice(0, 3).join(' · ')}</dd>
            </div>
          </dl>

          <div className={styles.cta}>
            <MagneticButton
              to={
                project.caseId
                  ? `/projects/${project.slug}/case/${project.caseId}`
                  : `/projects/${project.slug}`
              }
              variant="primary"
              size="md"
              arrow
              cursorLabel="VIEW"
              onClick={() => onOpenCase?.()}
              ariaLabel={
                isCase
                  ? t(`查看案例详情：${titleZh}`, `View case study: ${project.title}`)
                  : t(`查看作品方向：${titleZh}`, `View track: ${project.title}`)
              }
            >
              {isCase ? t('查看案例', 'VIEW CASE') : t('查看项目', 'VIEW PROJECTS')}
            </MagneticButton>
          </div>
        </div>

        {/* ─────────── 右：媒体 + 侧边面板 ─────────── */}
        <div className={styles.media}>
          {/* 一级项目卡片的二级项目筛选：放在预览视频上方，随当前卡片（项目）更新。
              层级：LEVEL 02 标签 → 提示（标签正下方）→ 产品横向 Grid */}
          {isActive && !project.caseId && project.cases && project.cases.length > 0 && (
            <div className={styles.subModuleBar}>
              <span className={styles.subModuleLabel}>
                LEVEL {String(subMeta.level).padStart(2, '0')} / {tx(subMeta.code)} /{' '}
                {tx(subMeta.label)}
              </span>
              {subMeta.hint && (
                <span className={styles.subModuleHint}>
                  <i aria-hidden="true">→</i>
                  {tx(subMeta.hint)}
                </span>
              )}
              <div className={styles.subModuleList}>
                {orderCasesBySubFilter(project).map((c, ci) => (
                  <Link
                    key={c.id}
                    to={`/projects/${project.slug}/case/${c.id}`}
                    className={`${styles.subModuleChip} ${
                      currentOwner === c.id ? styles.subModuleChipOn : ''
                    }`}
                    onClick={() => onOpenCase?.(c.id)}
                    onPointerDown={triggerFlash}
                    data-cursor="open"
                  >
                    <span className={styles.subModuleIndex}>{String(ci + 1).padStart(2, '0')}</span>
                    <span>{tx(caseDisplayName(c))}</span>
                  </Link>
                ))}
              </div>
            </div>
          )}

          <VideoPreview
            /* 活动卡：自动播放 + 按顺序播放全部视频（单条不循环），底部显示视频选择条；
               非活动卡：保持悬停播放，避免多张卡片同时出声 / 同时播放。
               受控 videoIndex 由 Projects 统一管理：底部视频选择条与左右箭头共用，
               切换产品时归零、从案例返回时恢复。 */
            videos={isActive ? project.videos : undefined}
            video={project.video}
            videoIndex={
              isActive && project.videos && project.videos.length > 0
                ? activeVideoIndex
                : undefined
            }
            onVideoChange={
              isActive && project.videos && project.videos.length > 0 ? onVideoChange : undefined
            }
            cover={project.cover}
            alt={t(`${titleZh} 项目预览`, `${project.title} project preview`)}
            indexLabel={project.index}
            /* 预览标签显示当前视频的活动项目名（如 上博联动第四期），随 activeVideoIndex 更新 */
            category={tx(currentVideoLabel ?? project.category)}
            status={statusText}
            mode={isActive ? 'auto' : 'hover'}
            /* 首页卡片：视频播完自动切下一条（浏览全部视频），不循环；
               进入详情/案例页后才单条循环。非活动卡悬停预览保持单条循环。 */
            loopVideo={isActive ? false : true}
            lazy
            aspect="16 / 9"
            className={styles.videoBox}
          >
            {/* 视频预览旁的左右箭头：仅活动卡且当前卡片有多条视频时显示。
                只切换 activeVideoIndex（当前产品内部的视频），绝不切换 PRODUCT。 */}
            {isActive &&
              project.videos &&
              project.videos.length > 1 &&
              onPrevVideo &&
              onNextVideo && (
                <div className={styles.videoNav}>
                  <VideoNavButton
                    direction="prev"
                    onClick={onPrevVideo}
                    aria-label={t('上一个视频', 'Previous video')}
                  >
                    <ChevronLeft size={13} />
                  </VideoNavButton>
                  <VideoNavButton
                    direction="next"
                    onClick={onNextVideo}
                    aria-label={t('下一个视频', 'Next video')}
                  >
                    <ChevronRight size={13} />
                  </VideoNavButton>
                </div>
              )}
          </VideoPreview>

          {/* 侧边信息面板：项目数据（各产品独立，数量动态计算） */}
          <aside className={styles.sidePanel}>
            <span className={styles.sideTitle}>{t('项目数据', 'PROJECT DATA')}</span>
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
          </aside>
        </div>
      </div>

      {/* 扫描框 */}
      <span className={styles.scanFrame} aria-hidden="true">
        <i />
        <i />
        <i />
        <i />
      </span>
    </article>
  )
}
