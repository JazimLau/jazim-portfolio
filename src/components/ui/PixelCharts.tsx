import { useEffect, useId, useMemo, useRef, useState } from 'react'
import { projectVideoCount, projects } from '../../data/projects'
import { timeline } from '../../data/timeline'
import { skillSystems } from '../../data/skills'
import { tools } from '../../data/profile'
import { indexStats } from '../../data/navigation'
import { lt } from '../../data/i18n'
import type { LT, MaybeLT } from '../../data/i18n'
import type { ProjectFilterId } from '../../data/types'
import { useUI } from '../../context/UIContext'
import { gsap } from '../../lib/gsap'
import styles from './PixelCharts.module.css'

type ChartKind = 'donut' | 'bars' | 'line' | 'timeline' | 'tools' | 'none'

interface ChartDatum {
  /** 图例标签（双语：中文模式显示中文） */
  label: LT
  value: number
  accent: string
}

/** 右上角核心数值 chip：可引用 indexStats 下标，或直接写死一组数值 */
type ChipSource = number | { value: string; label: LT; accent: 'lime' | 'purple' | 'orange' | 'blue' }

const ACCENTS = {
  lime: 'var(--accent-lime)',
  purple: 'var(--accent-purple)',
  orange: 'var(--accent-orange)',
  blue: 'var(--accent-blue)',
}

/** 工具链状态 → 展示文案与强调色（兼容 CORE / PROFICIENT 两种命名） */
const STATE_META: Record<string, { label: LT; accent: string }> = {
  CORE: { label: lt('核心', 'CORE'), accent: ACCENTS.lime },
  PROFICIENT: { label: lt('熟练', 'PROFICIENT'), accent: ACCENTS.purple },
  WORKING: { label: lt('使用中', 'WORKING'), accent: ACCENTS.blue },
  PRACTICE: { label: lt('实践中', 'PRACTICE'), accent: ACCENTS.orange },
  LEARNING: { label: lt('学习中', 'LEARNING'), accent: ACCENTS.purple },
}

interface ChartConfig {
  kind: ChartKind
  title: [string, string]
  /** 右上角核心数值 chips：indexStats 下标或自定义数值 */
  chips: ChipSource[]
}

const CONFIG: Record<string, ChartConfig> = {
  'node-home': { kind: 'donut', title: ['作品类型分布', 'PROJECT MIX'], chips: [1, 2, 4] },
  'node-profile': {
    kind: 'tools',
    title: ['工具链', 'TOOL PROFICIENCY'],
    /* 不再展示“熟练 X / 使用中 X”数量型 chips：直接列具体软件 + 状态 */
    chips: [],
  },
  'node-timeline': {
    kind: 'timeline',
    title: ['影响力里程碑', 'IMPACT MILESTONES'],
    chips: [3, 1, 2],
  },
  'node-skills': {
    kind: 'bars',
    title: ['技能总类', 'SKILL SYSTEMS'],
    chips: [
      { value: '06', label: { cn: '技能系统', en: 'SYSTEMS' }, accent: 'purple' },
      { value: '44', label: { cn: '技能节点', en: 'SKILL NODES' }, accent: 'lime' },
    ],
  },
  'node-projects': {
    kind: 'bars',
    title: ['作品分类数量', 'MISSIONS BY CATEGORY'],
    chips: [
      { value: '05', label: { cn: '精选项目', en: 'FEATURED' }, accent: 'purple' },
      { value: '03', label: { cn: '视频设计', en: 'VIDEO' }, accent: 'orange' },
      { value: '01', label: { cn: '雷火产品动效', en: 'LEIHUO' }, accent: 'lime' },
      { value: '01', label: { cn: '游戏UI', en: 'GAME UI' }, accent: 'blue' },
    ],
  },
  /* CONTACT 模块：删除图表图标，上半部分居中展示联系信息 */
  'node-contact': { kind: 'none', title: ['联系方式', 'CONTACT CHANNELS'], chips: [] },
}

/** 模块目录右侧图表的入场动画：只在会话内首次出现时播放一次，之后切换模块/回看不再重放。
    会话标志在挂载 effect 中置位，避免 StrictMode 双重渲染把首帧误判为已播放。 */
let chartsPlayed = false

/** 按作品分类统计一级项目视频总数（互斥口径，四类加总 = 全站总数）：
    leihuo / game-ui / social 各按自身分类统计；
    video 只统计「游戏广告 + 游戏宣发」（不含 social），避免 social 被重复计入。 */
function categoryVideoCount(id: ProjectFilterId) {
  return projects
    .filter((p) => (id === 'video' ? p.categories.includes('promo') || p.categories.includes('ad') : p.categories.includes(id)))
    .reduce((sum, p) => sum + projectVideoCount(p), 0)
}

/** 各模块图表数据源 */
function useChartData(variant: string): ChartDatum[] {
  return useMemo(() => {
    switch (variant) {
      case 'node-home':
      case 'node-projects':
      case 'node-contact': {
        /* 作品类型分布：按实时视频数量从少到多排列（稳定排序，数量相同保持原始顺序）。
           圆环分段与 legend 共用同一 data 数组，颜色随排序同步，比例本身不变。 */
        return [
          { label: lt('游戏社媒', 'SOCIAL'), value: categoryVideoCount('social'), accent: ACCENTS.purple },
          { label: lt('雷火产品动效', 'LEIHUO'), value: categoryVideoCount('leihuo'), accent: ACCENTS.lime },
          { label: lt('游戏UI', 'GAME UI'), value: categoryVideoCount('game-ui'), accent: ACCENTS.blue },
          { label: lt('视频设计', 'VIDEO'), value: categoryVideoCount('video'), accent: ACCENTS.orange },
        ].sort((a, b) => a.value - b.value)
      }
      case 'node-profile': {
        /* 工具链改为直接列出具体软件 + 状态（TOOL PROFICIENCY），不再统计数量分布 */
        return []
      }
      case 'node-skills': {
        /* 技能总类：六大技能系统的节点数量（合计 44） */
        return skillSystems.map((s) => ({
          label: s.nameZh,
          value: s.nodes.length,
          accent: s.accent,
        }))
      }
      case 'node-timeline': {
        const years: Record<string, number> = {}
        timeline.forEach((e) => {
          const y = e.period.split('.')[0]?.trim()
          if (y) years[y] = (years[y] ?? 0) + 1
        })
        return Object.keys(years)
          .sort()
          .map((y, i) => ({
            label: lt(y, y),
            value: years[y],
            accent: [ACCENTS.lime, ACCENTS.purple, ACCENTS.blue, ACCENTS.orange, ACCENTS.lime][i % 5],
          }))
      }
      default:
        return []
    }
  }, [variant])
}

/**
 * Index 右侧的「精选数据图表」区 —— 纯像素风（像素边框 / 网格背景 / 系统标签 / 加载动画 / Hover 高亮）。
 * 每个模块切换不同的图表类型：圆环 / 条形 / 折线 / 里程碑时间线，避免千篇一律。
 */
export function PixelCharts({ variant }: { variant: string }) {
  const { t } = useUI()
  const cfg = CONFIG[variant] ?? CONFIG['node-home']
  const data = useChartData(variant)
  /* 容器 noEntry 类：会话内首次（圆环）动画播放完成、chartsPlayed 置位后，
     之后的切换/回看都不再播放图表入场动画。 */
  /* PROJECTS 模块：右上角核心数值从项目数据动态计算（一级项目视频总数 + 各分类），不写死 */
  const chips =
    variant === 'node-projects'
      ? ([
          {
            value: String(projects.reduce((s, p) => s + projectVideoCount(p), 0)),
            label: { cn: '视频总数', en: 'VIDEOS TOTAL' },
            accent: 'purple' as const,
          },
          { value: String(categoryVideoCount('social')), label: { cn: '游戏社媒', en: 'SOCIAL' }, accent: 'lime' as const },
          { value: String(categoryVideoCount('leihuo')), label: { cn: '雷火产品动效', en: 'LEIHUO' }, accent: 'blue' as const },
          { value: String(categoryVideoCount('game-ui')), label: { cn: '游戏UI', en: 'GAME UI' }, accent: 'orange' as const },
          { value: String(categoryVideoCount('video')), label: { cn: '视频设计', en: 'VIDEO' }, accent: 'purple' as const },
        ] as { value: MaybeLT; label: LT; accent: 'lime' | 'purple' | 'orange' | 'blue' }[])
      : (cfg.chips
          .map((src) => {
            if (typeof src === 'number') return indexStats[src]
            return src
          })
          .filter(Boolean) as { value: MaybeLT; label: LT; accent: 'lime' | 'purple' | 'orange' | 'blue' }[])

  /* CONTACT 模块不渲染图表，详情上半部分由 CSS 居中 */
  if (cfg.kind === 'none') return null

  return (
    <div className={`${styles.charts} ${chartsPlayed ? styles.noEntry : ''}`}>
      <div className={styles.chartsHead}>
        <span className={styles.chartsLabel}>
          <i aria-hidden="true" />
          {t(cfg.title[0], cfg.title[1])}
        </span>
        <div className={styles.chips}>
          {chips.map((s) => (
            <span key={`${s.value}-${s.label.en}`} className={styles.chip} data-accent={s.accent}>
              <b>
                {typeof s.value === 'string' ? s.value : t(s.value.cn, s.value.en)}
              </b>
              <span>{t(s.label.cn, s.label.en)}</span>
            </span>
          ))}
        </div>
      </div>

      <div className={styles.chartsBody}>
        {cfg.kind === 'donut' && <Donut data={data} />}
        {cfg.kind === 'bars' && <Bars data={data} />}
        {cfg.kind === 'line' && <Line data={data} />}
        {cfg.kind === 'timeline' && <Milestones />}
        {cfg.kind === 'tools' && <Tools />}
      </div>
    </div>
  )
}

/* ══════════════ 工具链：具体软件 + 能力状态（TOOL PROFICIENCY） ══════════════
   直接读取 profile.tools 真实数据，每行 = 软件名 + 像素状态徽章。
   不做“熟练 X 个 / 实践中 X 个”这类数量型展示。 */

function Tools() {
  const { t } = useUI()
  return (
    <ul className={styles.tools}>
      {tools.map((tool) => {
        const meta = STATE_META[tool.state] ?? {
          label: lt(tool.state, tool.state),
          accent: ACCENTS.purple,
        }
        return (
          <li key={tool.name} className={styles.toolRow}>
            <span className={styles.toolName}>
              {tool.name}
              <i className={styles.toolRole}>{tool.role}</i>
            </span>
            <span
              className={styles.toolBadge}
              style={{ ['--ba' as string]: meta.accent }}
            >
              {t(meta.label.cn, meta.label.en)}
            </span>
          </li>
        )
      })}
    </ul>
  )
}

/* ══════════════ 圆环图（donut） ══════════════ */

function Donut({ data }: { data: ChartDatum[] }) {
  const { t } = useUI()
  /* 圆环中心 TOTAL 直接取全站视频总数：四类分类为互斥口径，加总与总数一致；
     新增项目时自动更新，不依赖手工加总。 */
  const total = projects.reduce((s, p) => s + projectVideoCount(p), 0) || 1
  const R = 40
  const C = 2 * Math.PI * R
  const svgRef = useRef<SVGSVGElement>(null)
  const centerRef = useRef<HTMLDivElement>(null)
  /* 会话内只播一次：module 变量做会话记忆，useState 让播放完成后的终态
     同步驱动 React 重渲染（避免 module 变量不触发渲染导致的状态不一致）。 */
  const [played, setPlayed] = useState(chartsPlayed)

  /* 入场：分段淡入 + 圆环按角度绘制增长。
     注意：动画不动 transform —— 渲染层旋转由 SVG 属性 rotate(-90 60 60) 全程承担，
     GSAP 的 scale/svgOrigin 与已有 transform 合成会在 SVG 上产生圆心漂移（垂直偏移），
     因此缩放动画被移除，圆心在任何时刻都保持在原位。 */
  useEffect(() => {
    const svg = svgRef.current
    if (!svg || played) return
    const segs = Array.from(svg.querySelectorAll<SVGCircleElement>(`[class*="${styles.donutSeg}"]`))
    const ctx = gsap.context(() => {
      gsap.fromTo(
        segs,
        { opacity: 0 },
        {
          opacity: 0.92,
          strokeDashoffset: (_i, el) => -parseFloat((el as SVGCircleElement).dataset.target || '0'),
          duration: 0.8,
          ease: 'steps(6)',
          stagger: 0.12,
          overwrite: 'auto',
          onComplete: () => {
            chartsPlayed = true
            setPlayed(true)
          },
        }
      )
      gsap.fromTo(
        centerRef.current,
        { opacity: 0 },
        {
          opacity: 1,
          duration: 0.4,
          delay: 0.5,
          ease: 'steps(4)',
          overwrite: 'auto',
          clearProps: 'opacity',
        }
      )
    }, svg)
    /* 用 kill 而非 revert：动画完成后 cleanup 不应把终态回滚为初始态
       （revert 会在 [played] 变化触发 cleanup 时把 opacity 覆盖回 0） */
    return () => ctx.kill()
  }, [played])

  let offset = 0
  /* 会话内首次（圆环）动画播放完成、played 置位后，直接渲染终态 */
  const noEntry = played

  return (
    <div className={styles.donut}>
      <div className={styles.donutWrap}>
        <svg ref={svgRef} viewBox="0 0 120 120" className={styles.donutSvg} role="img" aria-label="donut chart">
          <circle
            cx="60"
            cy="60"
            r={R}
            fill="none"
            stroke="rgba(255,255,255,0.06)"
            strokeWidth="9"
          />
          {data.map((d, i) => {
            const len = (d.value / total) * C
            const seg = (
              <circle
                key={d.label.en}
                cx="60"
                cy="60"
                r={R}
                fill="none"
                strokeWidth="9"
                strokeLinecap="butt"
                strokeDasharray={`${len} ${C - len}`}
                strokeDashoffset={noEntry ? -offset : -(offset + len)}
                /* 旋转由 SVG 属性承担（渲染层终态正确）；动画期间 GSAP 以 svgOrigin 重写单一矩阵 */
                transform="rotate(-90 60 60)"
                className={styles.donutSeg}
                data-target={offset}
                data-len={len}
                data-i={i}
                style={{
                  stroke: d.accent,
                  opacity: noEntry ? 0.92 : 0,
                }}
              >
                <title>{d.label.en}</title>
              </circle>
            )
            offset += len
            return seg
          })}
        </svg>
        <div className={styles.donutCenter} ref={centerRef} style={{ opacity: noEntry ? 1 : 0 }}>
          <b>{total}</b>
          <span>{data.length > 0 ? t('总计', 'TOTAL') : ''}</span>
        </div>
      </div>
      <ul className={styles.donutLegend}>
        {data.map((d) => (
          <li key={d.label.en} style={{ ['--lg' as string]: d.accent }}>
            <i aria-hidden="true" />
            <span>{t(d.label.cn, d.label.en)}</span>
            <b>{d.value}</b>
          </li>
        ))}
      </ul>
    </div>
  )
}

/* ══════════════ 条形图（bars） ══════════════ */

function Bars({ data }: { data: ChartDatum[] }) {
  const { t } = useUI()
  const [hover, setHover] = useState<number | null>(null)
  const max = Math.max(...data.map((d) => d.value), 1)
  return (
    <ul className={styles.bars}>
      {data.map((d, i) => (
        <li
          key={d.label.en}
          className={`${styles.barRow} ${hover === i ? styles.barRowOn : ''}`}
          style={{ ['--i' as string]: i }}
          onPointerEnter={() => setHover(i)}
          onPointerLeave={() => setHover(null)}
        >
          <span className={styles.barLabel}>{t(d.label.cn, d.label.en)}</span>
          <span className={styles.barTrack}>
            <i
              className={styles.barFill}
              style={{
                ['--bw' as string]: `${(d.value / max) * 100}%`,
                ['--ba' as string]: d.accent,
              }}
            />
          </span>
          <b className={styles.barValue}>{d.value}</b>
          {hover === i && (
            <span className={styles.barTooltip} aria-hidden="true">
              <b>{t(d.label.cn, d.label.en)}</b>
              <i>{d.value}</i>
            </span>
          )}
        </li>
      ))}
    </ul>
  )
}

/* ══════════════ 折线 / 面积图（line） ══════════════ */

function Line({ data }: { data: ChartDatum[] }) {
  const { t } = useUI()
  const gradId = useId()
  const max = Math.max(...data.map((d) => d.value), 1)
  const W = 300
  const H = 96
  const PAD = 12
  const pts = data.map((d, i) => ({
    x: PAD + (i * (W - PAD * 2)) / Math.max(data.length - 1, 1),
    y: H - PAD - (d.value / max) * (H - PAD * 2),
  }))
  const path = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ')
  const area = `${path} L${pts[pts.length - 1].x.toFixed(1)},${H - PAD} L${pts[0].x.toFixed(1)},${H - PAD} Z`

  return (
    <div className={styles.line}>
      <svg viewBox={`0 0 ${W} ${H}`} className={styles.lineSvg} role="img" aria-label="line chart" preserveAspectRatio="none">
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--accent-lime)" stopOpacity="0.32" />
            <stop offset="100%" stopColor="var(--accent-lime)" stopOpacity="0" />
          </linearGradient>
        </defs>
        {[0.25, 0.5, 0.75].map((f) => (
          <line
            key={f}
            x1={PAD}
            x2={W - PAD}
            y1={H - f * (H - PAD * 2) - PAD}
            y2={H - f * (H - PAD * 2) - PAD}
            stroke="rgba(255,255,255,0.05)"
            strokeDasharray="3 4"
          />
        ))}
        <path d={area} fill={`url(#${gradId})`} />
        <path
          d={path}
          fill="none"
          stroke="var(--accent-lime)"
          strokeWidth="2"
          strokeLinejoin="miter"
          strokeLinecap="square"
          className={styles.linePath}
        />
        {pts.map((p, i) => (
          <circle
            key={data[i].label.en}
            cx={p.x}
            cy={p.y}
            r="3"
            fill="#070b09"
            stroke={data[i].accent}
            strokeWidth="2"
            className={styles.lineDot}
            style={{ ['--i' as string]: i }}
          />
        ))}
      </svg>
      <ul className={styles.lineLabels}>
        {data.map((d) => (
          <li key={d.label.en}>
            <b>{t(d.label.cn, d.label.en)}</b>
            <span>{d.value}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

/* ══════════════ 里程碑时间线（timeline） ══════════════ */

function Milestones() {
  const { t } = useUI()
  const marks = useMemo(
    () =>
      [...timeline]
        .sort((a, b) => a.period.localeCompare(b.period))
        .map((e) => ({
          year: e.period.split('.')[0]?.trim() ?? '—',
          org: t(e.org.cn, e.org.en),
          role: t(e.role.cn, e.role.en),
          /* 进行中的经历（2026 网易雷火）：橙色高亮 + 呼吸 */
          active: e.status === 'ACTIVE',
        })),
    [t]
  )

  return (
    <div className={styles.milestones}>
      <div className={styles.milestoneTrack}>
        <i className={styles.milestoneFill} aria-hidden="true" />
        {marks.map((m, i) => (
          <span
            key={`${m.year}-${i}`}
            className={`${styles.milestoneDot} ${
              m.active ? styles.milestoneDotActive : ''
            }`}
            style={{ ['--i' as string]: i }}
          >
            <b>{m.year}</b>
            <span>{m.org}</span>
            <em>{m.role}</em>
          </span>
        ))}
      </div>
    </div>
  )
}
