import { useRef, useState } from 'react'
import { Activity, GraduationCap } from 'lucide-react'
import { timeline } from '../../data/timeline'
import { TIMELINE_KIND_LABEL } from '../../data/types'
import type { TimelineEntry } from '../../data/types'
import { gsap, ScrollTrigger } from '../../lib/gsap'
import { useGsapContext } from '../../hooks/useGsapContext'
import { useReducedMotion } from '../../hooks/useReducedMotion'
import { useUI } from '../../context/UIContext'
import { DUR, EASE, STAGGER } from '../../lib/motion'
import { SectionHeader } from '../layout/SectionHeader'
import { PixelSceneBackground } from '../ui/PixelSceneBackground'
import { SystemDivider } from '../ui/SystemDivider'
import styles from './Timeline.module.css'

const missions = timeline.filter((e) => e.kind === 'MISSION')
const trainings = timeline.filter((e) => e.kind === 'TRAINING')

/** 经历状态 → 中文名（中文模式下展示） */
const STATUS_CN: Record<string, string> = {
  ACTIVE: '进行中',
  COMPLETE: '已完成',
  TRAINING: '培训中',
}

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/** 把文案里命中 terms 的子串包成金色强调 <mark>，其余原样返回 */
function renderHighlighted(text: string, terms: string[]) {
  const cleaned = terms.filter(Boolean)
  if (cleaned.length === 0) return text
  const pattern = new RegExp(`(${cleaned.map(escapeRegExp).join('|')})`, 'g')
  return text.split(pattern).map((chunk, i) =>
    cleaned.includes(chunk) ? (
      <mark key={i} className={styles.highlight}>
        {chunk}
      </mark>
    ) : (
      chunk
    )
  )
}

/**
 * Timeline —— 任务路径。
 * 不是传统的"中间一根线、左右交替卡片"简历模板：
 * 左列是年份坐标，中列是随滚动逐段点亮的路径，右列是任务详情。
 * 节点到达视口中心时激活，详情通过遮罩揭示，关键词 stagger 进入。
 * kind 区分实习经历与项目培训经历：腾讯光子属于后者，
 * 不与实习经历共享中列路径，单独成一个板块，视觉上明确独立开。
 */
export function Timeline() {
  const rootRef = useRef<HTMLElement>(null)
  const [activeId, setActiveId] = useState(timeline[0]?.id ?? '')
  const reduced = useReducedMotion()
  const { t, tx, txList, lang } = useUI()

  useGsapContext(
    () => {
      if (reduced) return

      /* 路径随滚动绘制（只覆盖实习经历，培训经历没有共享路径） */
      gsap.fromTo(
        `.${styles.pathFill}`,
        { scaleY: 0 },
        {
          scaleY: 1,
          ease: 'none',
          transformOrigin: 'top center',
          scrollTrigger: {
            trigger: `.${styles.entries}`,
            start: 'top 62%',
            end: 'bottom 72%',
            scrub: 0.7,
          },
        }
      )

      /* 每个节点：到达视口中心时激活 */
      gsap.utils.toArray<HTMLElement>(`.${styles.entry}`).forEach((entry) => {
        const id = entry.dataset.entry ?? ''

        ScrollTrigger.create({
          trigger: entry,
          start: 'top 62%',
          end: 'bottom 58%',
          onToggle: (self) => {
            if (self.isActive) setActiveId(id)
          },
        })

        /* 详情遮罩揭示 + 关键词依次进入 */
        const tl = gsap.timeline({
          scrollTrigger: { trigger: entry, start: 'top 84%', once: true },
        })

        tl.from(entry.querySelector(`.${styles.year}`), {
          xPercent: -60,
          opacity: 0,
          duration: DUR.element,
          ease: EASE.title,
        })
          .from(
            entry.querySelector(`.${styles.marker}`),
            { scale: 0, duration: 0.5, ease: EASE.media },
            0.1
          )
          .from(
            entry.querySelector(`.${styles.detailInner}`),
            {
              /* 拆到没有静态 clip-path 的内层上跑，纯 inset() 数字补间，
                 不会再跟外层 .detail 的切角 polygon() 打架插出乱码中间态。 */
              clipPath: 'inset(0% 100% 0% 0%)',
              duration: 1.1,
              ease: EASE.media,
            },
            0.14
          )
          .from(
            entry.querySelectorAll(`.${styles.dutyItem}`),
            { xPercent: 6, opacity: 0, duration: 0.5, stagger: 0.05, ease: EASE.element },
            0.42
          )
          .from(
            entry.querySelectorAll(`.${styles.keyword}`),
            { yPercent: 120, opacity: 0, duration: 0.5, stagger: STAGGER.tags, ease: EASE.element },
            0.5
          )
          .from(
            entry.querySelectorAll(`.${styles.resultItem}, .${styles.resultStatCard}`),
            { opacity: 0, y: 12, duration: 0.5, stagger: 0.06, ease: EASE.element },
            0.6
          )

        /* 数据结果卡：入场时数字从 0 快速刷到目标值 */
        const statCards = entry.querySelectorAll<HTMLElement>(`.${styles.resultStatCard}`)
        statCards.forEach((card, si) => {
          const valueEl = card.querySelector<HTMLElement>(`.${styles.resultStatValue}`)
          const target = Number(valueEl?.dataset.numeric ?? '0')
          const suffix = valueEl?.dataset.suffix ?? ''
          if (valueEl && target > 0) {
            const counter = { v: 0 }
            tl.to(
              counter,
              {
                v: target,
                duration: 0.85,
                ease: 'power2.out',
                onUpdate: () => {
                  valueEl.textContent = `${Math.round(counter.v)}${suffix}`
                },
              },
              0.65 + si * 0.09
            )
          }
        })
      })

      /* 数据结果卡 hover：数字快速刷新一次（从低位跳回目标值） */
      gsap.utils.toArray<HTMLElement>(`.${styles.resultStatCard}`).forEach((card) => {
        const valueEl = card.querySelector<HTMLElement>(`.${styles.resultStatValue}`)
        if (!valueEl) return
        const target = Number(valueEl.dataset.numeric ?? '0')
        const suffix = valueEl.dataset.suffix ?? ''
        let tween: ReturnType<typeof gsap.to> | null = null
        const run = (from: number) => {
          if (tween) tween.kill()
          const counter = { v: from }
          tween = gsap.to(counter, {
            v: target,
            duration: 0.4,
            ease: 'power3.out',
            onUpdate: () => {
              valueEl.textContent = `${Math.round(counter.v)}${suffix}`
            },
          })
        }
        card.addEventListener('mouseenter', () => run(Math.round(target * 0.3)))
        card.addEventListener('focusin', () => run(Math.round(target * 0.3)))
      })
    },
    [reduced],
    rootRef
  )

  const renderEntry = (entry: TimelineEntry) => {
    const isActive = activeId === entry.id
    const isTraining = entry.kind === 'TRAINING'
    const duties = txList(entry.duties)
    const results = txList(entry.results)
    const highlightTerms = txList(entry.highlight ?? [])
    const hasDutyGroups = !!entry.dutyGroups?.length
    const hasResultStats = !!entry.resultStats?.length

    return (
      <article
        key={entry.id}
        data-entry={entry.id}
        className={`${styles.entry} ${isActive ? styles.entryActive : ''} ${
          isTraining ? styles.entryTraining : ''
        }`}
      >
        {/* ─── 左：年份坐标 ─── */}
        <div className={styles.yearCol}>
          <div className={styles.year}>
            <span className={styles.yearIndex}>{entry.index}</span>
            <span className={styles.yearPeriod}>{entry.period}</span>
            {/* 经历类型写全称，不只靠颜色区分实习与培训 */}
            <span className={styles.yearKind}>
              {isTraining ? (
                <GraduationCap size={13} strokeWidth={2} />
              ) : (
                <Activity size={13} strokeWidth={2} />
              )}
              {tx(TIMELINE_KIND_LABEL[entry.kind])}
            </span>
          </div>
        </div>

        {/* ─── 中：节点标记 ─── */}
        <div className={styles.markerCol}>
          <span className={styles.marker}>
            <i className={styles.markerCore} aria-hidden="true" />
            <i className={styles.markerRing} />
          </span>
        </div>

        {/* ─── 右：任务详情 ─── */}
        <div className={styles.detail}>
          <div className={styles.detailInner}>
            <header className={styles.detailHead}>
              <div className={styles.headInfo}>
                {/* 四层信息：机构 → 岗位 → 部门 → 周期 + 状态 */}
                <h3 className={styles.org}>{tx(entry.org)}</h3>
                <p className={styles.role}>{tx(entry.role)}</p>
                {entry.dept && (
                  <p className={styles.deptLine}>
                    <span className={styles.deptTag}>{t('部门', 'DEPT')}</span>
                    {tx(entry.dept)}
                  </p>
                )}
                <p className={styles.metaLine}>
                  <span className={styles.metaPeriod}>{entry.period}</span>
                  {/* 进行中（2026 网易雷火）的状态点：橙色 + 呼吸光环 */}
                  <span
                    className={`${styles.status} ${
                      entry.status === 'ACTIVE' ? styles.statusLive : ''
                    } ${entry.status === 'COMPLETE' ? styles.statusDone : ''}`}
                  >
                    <i className={styles.statusDot} />
                    {lang === 'CN' ? STATUS_CN[entry.status] ?? entry.status : entry.status}
                  </span>
                </p>
              </div>
            </header>

            {/* 工作内容：有分组按两组渲染，否则平铺 */}
            <div className={styles.block}>
              <span className={styles.blockLabel}>
                DUTIES / {t('工作内容', 'Responsibilities')}
              </span>
              {hasDutyGroups ? (
                <div className={styles.dutyGroups}>
                  {entry.dutyGroups!.map((group) => (
                    <div key={group.code} className={styles.dutyGroup}>
                      <span className={styles.dutyGroupLabel}>
                        <i className={styles.dutyGroupTick} aria-hidden="true" />
                        {t(group.label.cn, group.label.en)}
                      </span>
                      <ul className={styles.duties}>
                        {txList(group.items).map((d) => (
                          <li key={d} className={styles.dutyItem}>
                            <i className={styles.dutyTick} />
                            {renderHighlighted(d, highlightTerms)}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              ) : (
                <ul className={styles.duties}>
                  {duties.map((d) => (
                    <li key={d} className={styles.dutyItem}>
                      <i className={styles.dutyTick} />
                      {renderHighlighted(d, highlightTerms)}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* 关键词 */}
            <div className={styles.block}>
              <span className={styles.blockLabel}>
                KEYWORDS / {t('能力关键词', 'Ability keywords')}
              </span>
              <ul className={styles.keywords}>
                {entry.keywords.map((k) => (
                  <li key={k.en} className={styles.keyword}>
                    {tx(k)}
                  </li>
                ))}
              </ul>
            </div>

            {/* 成果：有数据卡按大数字结果卡渲染，否则保留原列表 */}
            <div className={styles.block}>
              <span className={styles.blockLabel}>RESULTS / {t('成果', 'Outcomes')}</span>
              {hasResultStats ? (
                <ul className={styles.resultStats}>
                  {entry.resultStats!.map((s) => (
                    <li key={s.label.en} className={styles.resultStatCard}>
                      <span
                        className={styles.resultStatValue}
                        data-numeric={s.numeric ?? 0}
                        data-suffix={s.suffix ?? ''}
                      >
                        {s.value}
                        {s.suffix ?? ''}
                      </span>
                      <span className={styles.resultStatLabel}>
                        {t(s.label.cn, s.label.en)}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <ul className={styles.results}>
                  {results.map((r) => (
                    <li key={r} className={styles.resultItem}>
                      {renderHighlighted(r, highlightTerms)}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      </article>
    )
  }

  return (
    <section
      id="timeline"
      ref={rootRef}
      className={`section ${styles.root}`}
      aria-label={t('履历记录', 'Mission log')}
    >
      <div className={`grid-bg ${styles.grid}`} aria-hidden="true" />
      <div className={`noise ${styles.noise}`} aria-hidden="true" />
      <PixelSceneBackground variant="timeline" />

      <div className={`shell ${styles.shell}`}>
        <SectionHeader
          index="04"
          code="MISSION LOG"
          titleEn="TIMELINE"
          titleZh={t('履历记录', 'Mission log')}
        />

        <div className={styles.entries}>
          {/* 中列路径：只贯穿实习经历，培训经历不共享这条线 */}
          <div className={styles.path} aria-hidden="true">
            <span className={styles.pathTrack} />
            <span className={styles.pathFill} />
          </div>

          {missions.map(renderEntry)}
        </div>

        {/* 项目培训经历：独立板块，不挂在实习经历的中列路径上，
            视觉上明确是另一条记录，不是同一条实习履历的延伸 */}
        {trainings.length > 0 && (
          <div className={styles.trainingSection}>
            <div className={styles.trainingHead}>
              <GraduationCap size={15} strokeWidth={2} />
              <span className={styles.trainingLabel}>{tx(TIMELINE_KIND_LABEL.TRAINING)}</span>
              <span className={styles.trainingHint}>
                {t('与实习经历分开统计', 'Tracked separately from internship record')}
              </span>
            </div>
            <div className={styles.trainingEntries}>{trainings.map(renderEntry)}</div>
          </div>
        )}

        {/* 系统分割带 */}
        <SystemDivider variant="timeline" />
      </div>
    </section>
  )
}
