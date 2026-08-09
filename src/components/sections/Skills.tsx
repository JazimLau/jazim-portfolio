import { useEffect, useRef, useState } from 'react'
import { Minus, Plus, Square } from 'lucide-react'
import { skillStateMeta, skillSystems } from '../../data/skills'
import type { ProjectFilterId, SkillState } from '../../data/types'
import { gsap } from '../../lib/gsap'
import { useGsapContext } from '../../hooks/useGsapContext'
import { useReducedMotion, useIsCompact } from '../../hooks/useReducedMotion'
import { useUI } from '../../context/UIContext'
import { EASE, TRIGGER } from '../../lib/motion'
import { SectionHeader } from '../layout/SectionHeader'
import { MagneticButton } from '../ui/MagneticButton'
import { PixelSceneBackground } from '../ui/PixelSceneBackground'
import { SystemDivider } from '../ui/SystemDivider'
import styles from './Skills.module.css'

interface SkillsProps {
  /** 点击能力系统时联动 Projects 的筛选 */
  onFilterProjects: (filter: ProjectFilterId) => void
}

const STATE_CLASS: Record<SkillState, string> = {
  PROFICIENT: styles.stProficient,
  PRACTICE: styles.stPractice,
  LEARNING: styles.stLearning,
}

/** 能力进度条填充宽度：按状态等级映射（像素风轨道） */
const LEVEL_FILL: Record<SkillState, string> = {
  PROFICIENT: '100%',
  PRACTICE: '66%',
  LEARNING: '33%',
}

/**
 * Skills —— 能力矩阵。
 * 不使用"AE 90%"式虚假进度条：用 PROFICIENT / PRACTICE / LEARNING 三种状态、
 * 节点数量与关联项目类型来表达能力。
 * 模块展开显示技能节点；鼠标移动时模块内部连接线缓慢漂移；
 * 点击 FILTER PROJECTS 会把 Projects 模块过滤到对应类别。
 */
export function Skills({ onFilterProjects }: SkillsProps) {
  const rootRef = useRef<HTMLElement>(null)
  const [openId, setOpenId] = useState<string>(skillSystems[0]?.id ?? '')
  const [activeNode, setActiveNode] = useState<string | null>(null)
  const reduced = useReducedMotion()
  const isCompact = useIsCompact()
  const { t, tx, lang } = useUI()

  useGsapContext(
    () => {
      if (reduced) return

      /* 第一批内容（状态图例）：区块顶部进入视口即开始入场，
         到达 Skills 时图例已在 100~250ms 内进入，不再出现长时间空内容。 */
      gsap.from(`.${styles.legendItem}`, {
        y: 14,
        opacity: 0,
        duration: 0.42,
        stagger: 0.06,
        ease: EASE.element,
        scrollTrigger: { trigger: rootRef.current, start: 'top 80%', once: true },
      })

      /* 能力模块：
         首个子模块（index 0）跟随区块顶部入场（与 SectionHeader / 状态图例同时开始），
         进入能力系统页时最先入场，避免到达时模块区仍是折叠的空内容、让人以为没内容；
         其余模块各自进入视口时入场（start 90%，比原 95% 更早、入场更明显）。
         入场使用 transform + opacity（GPU 合成属性）而非 clip-path，
         避免 6 个模块同时做裁剪动画触发逐帧重绘导致卡顿。 */
      gsap.utils.toArray<HTMLElement>(`.${styles.module}`).forEach((mod, i) => {
        const tl = gsap.timeline({
          scrollTrigger:
            i === 0
              ? { trigger: rootRef.current, start: TRIGGER.start, once: true }
              : { trigger: mod, start: 'top 90%', once: true },
          delay: i * 0.05,
        })

        tl.from(mod, {
          scaleY: 0,
          opacity: 0,
          transformOrigin: '50% 100%',
          duration: 0.62,
          ease: EASE.media,
          clearProps: 'transform,opacity',
        })
          .from(
            mod.querySelectorAll(`.${styles.modHead} > *`),
            { yPercent: 110, duration: 0.5, stagger: 0.05, ease: EASE.element },
            0.22
          )
          .from(
            mod.querySelectorAll(`.${styles.line}`),
            { scaleX: 0, duration: 0.55, stagger: 0.04, ease: EASE.transition },
            0.28
          )
      })
    },
    [reduced],
    rootRef
  )

  /* 展开面板：摘要、节点、底部用 GSAP stagger 入场（模块进入视口时触发）；
     图标展开旋转 90° / 收起归零，动画结束交给 CSS（.modOpen 保持 90°） */
  useEffect(() => {
    if (reduced || !rootRef.current) return
    const root = rootRef.current

    const mod = root.querySelector<HTMLElement>(`.${styles.modOpen}`)
    if (!mod) return

    // 图标：展开模块旋转 90°，其余归零
    root
      .querySelectorAll<HTMLElement>(`.${styles.modToggle}`)
      .forEach((t) => {
        const target = t.closest(`.${styles.modOpen}`) ? 90 : 0
        gsap.to(t, {
          rotate: target,
          duration: 0.38,
          ease: EASE.element,
          overwrite: 'auto',
          clearProps: 'transform',
        })
      })

    const body = mod.querySelector(`.${styles.modBody}`)
    if (!body) return

    const summary = body.querySelector<HTMLElement>(`.${styles.modSummary}`)
    const nodes = body.querySelectorAll<HTMLElement>(`.${styles.node}`)
    const foot = body.querySelector<HTMLElement>(`.${styles.modFoot}`)

    const tl = gsap.timeline({
      defaults: { ease: EASE.element, overwrite: 'auto' },
      scrollTrigger: {
        trigger: mod,
        start: 'top 85%',
        once: true,
      },
    })

    if (summary) {
      tl.fromTo(
        summary,
        { y: 12, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.45, clearProps: 'opacity,transform' },
        0
      )
    }
    if (nodes.length) {
      tl.fromTo(
        nodes,
        { y: 18, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.5,
          stagger: 0.04,
          clearProps: 'opacity,transform',
        },
        0.08
      )
    }
    if (foot) {
      tl.fromTo(
        foot,
        { y: 12, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.4, clearProps: 'opacity,transform' },
        0.16
      )
    }

    return () => {
      tl.scrollTrigger?.kill()
      tl.kill()
    }
  }, [openId, reduced])

  /* 鼠标移动时连接线缓慢漂移。
     quickTo 每个 web 只维护一条 tween，pointermove 仅更新目标值，
     避免高频创建/销毁动画对象造成卡顿。 */
  const webMovers = useRef(new Map<SVGSVGElement, { x: gsap.QuickToFunc; y: gsap.QuickToFunc }>())

  useEffect(() => {
    if (reduced || !rootRef.current) return
    const map = webMovers.current
    map.clear()
    rootRef.current.querySelectorAll<SVGSVGElement>(`.${styles.web}`).forEach((web) => {
      map.set(web, {
        x: gsap.quickTo(web, 'x', { duration: 1.4, ease: 'power3.out' }),
        y: gsap.quickTo(web, 'y', { duration: 1.4, ease: 'power3.out' }),
      })
    })
  }, [reduced])

  const handleModuleMove = (e: React.PointerEvent<HTMLElement>) => {
    if (reduced || isCompact) return
    const mod = e.currentTarget
    const web = mod.querySelector<SVGSVGElement>(`.${styles.web}`)
    if (!web) return
    const mover = webMovers.current.get(web)
    if (!mover) return
    const rect = mod.getBoundingClientRect()
    const nx = (e.clientX - rect.left) / rect.width - 0.5
    const ny = (e.clientY - rect.top) / rect.height - 0.5
    mover.x(nx * 26)
    mover.y(ny * 18)
  }

  const handleModuleLeave = (e: React.PointerEvent<HTMLElement>) => {
    if (reduced || isCompact) return
    const web = e.currentTarget.querySelector<SVGSVGElement>(`.${styles.web}`)
    if (!web) return
    const mover = webMovers.current.get(web)
    if (mover) {
      mover.x(0)
      mover.y(0)
    }
  }

  /* 展开 / 收起：React 切换 hidden，内容入场由上方 useEffect 用 GSAP 驱动 */
  const toggle = (id: string) => {
    setOpenId((prev) => (prev === id ? '' : id))
  }

  /* 点击能力节点：切换激活态 + 触觉反馈。
     背景色由 CSS transition 缓动到对应状态色，GSAP 只负责按下时的位移反馈。 */
  const activateNode = (el: HTMLLIElement, key: string) => {
    setActiveNode((prev) => (prev === key ? null : key))
    if (reduced) return
    gsap.fromTo(
      el,
      { y: -3 },
      { y: 0, duration: 0.55, ease: EASE.element, overwrite: 'auto' }
    )
  }

  return (
    <section
      id="skills"
      ref={rootRef}
      className={`section ${styles.root}`}
      aria-label={t('能力系统', 'Ability systems')}
    >
      <div className={`grid-bg ${styles.grid}`} aria-hidden="true" />
      <PixelSceneBackground variant="skills" />

      <div className={`shell ${styles.shell}`}>
        <SectionHeader
          index="05"
          code="ABILITY MATRIX"
          titleEn="SKILLS"
          titleZh={t('能力系统', 'Ability systems')}
          accent="var(--accent-purple)"
        />

        {/* 状态图例：颜色不是唯一提示，文字同时说明（按当前语言单显，不中英混排） */}
        <div className={styles.legend}>
          {(Object.keys(skillStateMeta) as SkillState[]).map((key) => (
            <span key={key} className={`${styles.legendItem} ${STATE_CLASS[key]}`}>
              <Square size={7} strokeWidth={0} fill="currentColor" />
              {lang === 'CN'
                ? tx(skillStateMeta[key].labelZh)
                : skillStateMeta[key].label}
            </span>
          ))}
        </div>

        <div className={styles.matrix}>
          {skillSystems.map((sys) => {
            const isOpen = openId === sys.id
            return (
              <section
                key={sys.id}
                className={`${styles.module} ${isOpen ? styles.modOpen : ''}`}
                style={{ ['--mod-accent' as string]: sys.accent }}
                onPointerMove={handleModuleMove}
                onPointerLeave={handleModuleLeave}
              >
                {/* 内部连接线（漂移） */}
                <svg
                  className={styles.web}
                  viewBox="0 0 400 200"
                  preserveAspectRatio="none"
                  aria-hidden="true"
                >
                  <line className={styles.line} x1="0" y1="40" x2="400" y2="24" />
                  <line className={styles.line} x1="0" y1="120" x2="400" y2="150" />
                  <line className={styles.line} x1="60" y1="0" x2="120" y2="200" />
                  <line className={styles.line} x1="300" y1="0" x2="250" y2="200" />
                </svg>

                {/* ─── 模块头 ─── */}
                <button
                  type="button"
                  className={styles.modHead}
                  onClick={() => toggle(sys.id)}
                  aria-expanded={isOpen}
                  aria-controls={`skill-panel-${sys.id}`}
                  data-cursor="link"
                >
                  <span className={styles.modIndex}>{sys.index}</span>
                  <span className={styles.modTitles}>
                    <span className={styles.modCode}>
                      {lang === 'CN' ? tx(sys.nameZh) : sys.code}
                    </span>
                    {lang === 'EN' && (
                      <span className={styles.modZh}>{tx(sys.nameZh)}</span>
                    )}
                  </span>
                  <span className={styles.modStateWrap}>
                    <span
                      className={`${styles.modState} ${STATE_CLASS[sys.state]}`}
                    >
                      {lang === 'CN'
                        ? tx(skillStateMeta[sys.state].labelZh)
                        : skillStateMeta[sys.state].label}
                    </span>
                    {/* 像素风能力进度条：统一左起点 / 右终点 / 轨道高度 */}
                    <span className={styles.modBar} aria-hidden="true">
                      <span
                        className={styles.modBarFill}
                        style={{ width: LEVEL_FILL[sys.state] }}
                      />
                    </span>
                  </span>
                  <span className={styles.modCount}>
                    {String(sys.nodes.length).padStart(2, '0')}
                    <i>{lang === 'CN' ? '节点' : 'NODES'}</i>
                  </span>
                  <span className={styles.modToggle} aria-hidden="true">
                    {isOpen ? <Minus size={15} /> : <Plus size={15} />}
                  </span>
                </button>

                {/* ─── 展开内容 ─── */}
                <div
                  id={`skill-panel-${sys.id}`}
                  className={styles.modBody}
                  hidden={!isOpen}
                >
                  <p className={styles.modSummary}>{tx(sys.summary)}</p>

                  <ul className={styles.nodes}>
                    {sys.nodes.map((node, i) => {
                      const name = tx(node.name)
                      const key = `${sys.id}/${name}`
                      const isActive = activeNode === key
                      return (
                        <li
                          key={name}
                          className={`${styles.node} ${STATE_CLASS[node.state]} ${
                            isActive ? styles.nodeActive : ''
                          }`}
                          style={{ ['--i' as string]: String(i) }}
                          role="button"
                          tabIndex={0}
                          aria-pressed={isActive}
                          data-cursor="link"
                          onClick={(e) => activateNode(e.currentTarget, key)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault()
                              activateNode(e.currentTarget, key)
                            }
                          }}
                        >
                          <span className={styles.nodeDot} aria-hidden="true" />
                          <span className={styles.nodeName}>{name}</span>
                          <span className={styles.nodeState}>
                            {lang === 'CN'
                              ? tx(skillStateMeta[node.state].labelZh)
                              : node.state}
                          </span>
                        </li>
                      )
                    })}
                  </ul>

                  <div className={styles.modFoot}>
                    <MagneticButton
                      variant="outline"
                      size="sm"
                      arrow
                      accent="var(--accent-purple)"
                      onClick={() => onFilterProjects(sys.linkedFilter)}
                      ariaLabel={t(
                        `筛选 ${tx(sys.nameZh)} 相关项目`,
                        `Filter projects related to ${sys.code}`
                      )}
                    >
                      {t('筛选项目', 'FILTER PROJECTS')}
                    </MagneticButton>
                    <span className={styles.modFootHint}>
                      {t(
                        `过滤作品库到 ${tx(sys.nameZh)} 相关项目`,
                        `Narrow the project database to ${sys.code}`
                      )}
                    </span>
                  </div>
                </div>
              </section>
            )
          })}
        </div>

        {/* 系统分割带 */}
        <SystemDivider variant="skills" />
      </div>
    </section>
  )
}
