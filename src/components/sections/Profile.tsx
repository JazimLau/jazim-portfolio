import { useRef } from 'react'
import {
  Box,
  Boxes,
  Download,
  Figma,
  Film,
  Gamepad2,
  Image as ImageIcon,
  Sparkles,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import {
  abilityBlocks,
  classInfo,
  education,
  playerData,
  profile,
  profileIntro,
  researchTags,
  tools,
} from '../../data/profile'
import { gsap } from '../../lib/gsap'
import { useGsapContext } from '../../hooks/useGsapContext'
import { useReducedMotion } from '../../hooks/useReducedMotion'
import { useUI } from '../../context/UIContext'
import { EASE, TRIGGER } from '../../lib/motion'
import { SectionHeader } from '../layout/SectionHeader'
import { MagneticButton } from '../ui/MagneticButton'
import { RevealText } from '../ui/RevealText'
import { PixelSceneBackground } from '../ui/PixelSceneBackground'
import { SystemDivider } from '../ui/SystemDivider'
import styles from './Profile.module.css'

const TOOL_ICONS: Record<string, LucideIcon> = {
  'After Effects': Film,
  Photoshop: ImageIcon,
  Figma: Figma,
  Blender: Box,
  'Unreal Engine 5': Gamepad2,
  Unity: Boxes,
  Noiz: Sparkles,
}

/**
 * 工具状态中文映射。data-state 仍保留英文值（用于 CSS 状态配色），
 * 仅展示文案中文化：熟练 / 使用中 / 实践中 / 学习中。
 */
const TOOL_STATE_CN: Record<string, string> = {
  PROFICIENT: '熟练',
  WORKING: '使用中',
  PRACTICE: '实践中',
  LEARNING: '学习中',
}

/**
 * Profile —— 角色档案。
 * 上半：左侧正文 / 职业状态 / 能力标签分组，右侧 PLAYER DATA 档案面板。
 * 中部：5 张能力档案卡（两列不对称，MOTION DESIGN 更宽）。
 * 下半：TOOLSET（状态 PROFICIENT/WORKING/PRACTICE/LEARNING）+ DOWNLOAD CV。
 */
export function Profile() {
  const rootRef = useRef<HTMLElement>(null)
  const reduced = useReducedMotion()
  const { t, tx } = useUI()

  useGsapContext(
    () => {
      if (reduced) return

      /* 职业状态三行：逐行进入（整体提速约 25%） */
      gsap.from(`.${styles.classRow}`, {
        yPercent: 90,
        opacity: 0,
        duration: 0.45,
        ease: EASE.element,
        stagger: 0.08,
        scrollTrigger: { trigger: `.${styles.classBlock}`, start: TRIGGER.start, once: true },
      })

      /* PLAYER DATA 档案面板：单 timeline —— 遮罩展开 → 边框绘制 → 内容逐项显现
         避免原实现中 playerPanel(clipPath+opacity) 与 playerRow(xPercent+opacity)
         双层 opacity 叠加造成的进场频闪：遮罩只动 clipPath，内容再逐项显现 */
      const panelTl = gsap.timeline({
        scrollTrigger: { trigger: `.${styles.panelCol}`, start: TRIGGER.start, once: true },
        defaults: { ease: EASE.element },
      })

      // ① 遮罩展开：clipPath 从右向左展开，全程不动 opacity（提速约 25%）
      panelTl.fromTo(
        `.${styles.playerPanel}`,
        { clipPath: 'inset(0% 100% 0% 0%)' },
        {
          clipPath: 'inset(0% 0% 0% 0%)',
          duration: 0.68,
          ease: EASE.media,
          clearProps: 'clipPath', // 展开完成后恢复 CSS 中的像素切角 polygon
        },
        0
      )
      // ② 边框绘制：面板描边层从上向下展开
      panelTl.fromTo(
        `.${styles.panelFrame}`,
        { scaleY: 0 },
        { scaleY: 1, duration: 0.35, ease: EASE.transition },
        0.42
      )
      // ③ 内容逐项显现：面板头 → 数据行 → 面板脚
      panelTl.fromTo(
        `.${styles.panelHead}`,
        { y: 12, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.28 },
        0.54
      )
      panelTl.fromTo(
        `.${styles.playerRow}`,
        { x: 14, opacity: 0 },
        { x: 0, opacity: 1, duration: 0.28, stagger: 0.03 },
        0.66
      )
      panelTl.fromTo(
        `.${styles.panelFoot}`,
        { y: 8, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.24 },
        '>-0.04'
      )

      /* 能力档案卡：先线条、后内容（保持层级与顺序感，整体提速约 25%） */
      gsap.utils.toArray<HTMLElement>(`.${styles.abilityItem}, .${styles.abilityWide}`).forEach((item) => {
        const tl = gsap.timeline({
          scrollTrigger: { trigger: item, start: 'top 88%', once: true },
        })
        tl.from(item.querySelector(`.${styles.abilityRule}`), {
          scaleX: 0,
          duration: 0.42,
          ease: EASE.transition,
        })
          .from(
            item.querySelectorAll(`.${styles.abilityHead} > *`),
            { yPercent: 110, duration: 0.52, stagger: 0.05, ease: EASE.element },
            0.06
          )
          .from(
            item.querySelector(`.${styles.abilityBody}`),
            { opacity: 0, x: 24, duration: 0.52, ease: EASE.element },
            0.15
          )
      })

      /* 工具：依次进入（提速约 25%） */
      gsap.from(`.${styles.tool}`, {
        yPercent: 60,
        opacity: 0,
        duration: 0.45,
        ease: EASE.element,
        stagger: 0.05,
        scrollTrigger: { trigger: `.${styles.toolsRow}`, start: TRIGGER.start, once: true },
      })
    },
    [reduced],
    rootRef
  )

  return (
    <section
      id="profile"
      ref={rootRef}
      className={`section ${styles.root}`}
      aria-label={t('角色档案', 'Player profile')}
    >
      <div className={`grid-bg ${styles.grid}`} aria-hidden="true" />
      <PixelSceneBackground variant="profile" />

      <div className="shell">
        <SectionHeader
          index="03"
          code="CHARACTER PROFILE"
          titleEn="PLAYER PROFILE"
          titleZh={t('角色档案', 'Character file')}
          size="compact"
        />

        {/* ══════════ 上半：左右分栏 ══════════ */}
        <div className={styles.top}>
          {/* 左：正文 + 职业状态 + 能力标签分组 */}
          <div className={styles.left}>
            <div className={styles.intro}>
              {profileIntro.map((p, i) => (
                <RevealText
                  key={i}
                  as="p"
                  mode="lines"
                  text={tx(p)}
                  className={styles.introText}
                  triggerStart="top 88%"
                />
              ))}
            </div>

            <div className={styles.classBlock}>
              {classInfo.map((row) => (
                <div key={row.key.en} className={styles.classRow}>
                  <span className={styles.classKey}>{t(row.key.cn, row.key.en)}</span>
                  <b className={styles.classValue}>{tx(row.value)}</b>
                </div>
              ))}
            </div>

          </div>

          {/* 右：PLAYER DATA 档案面板 */}
          <div className={styles.panelCol}>
            <div className={styles.playerPanel}>
              {/* 边框绘制层：进场时自上而下展开 */}
              <span className={styles.panelFrame} aria-hidden="true" />
              {/* 面板装饰：编号 / ACTIVE / 十字定位 / 坐标 */}
              <span className={styles.panelIndex}>PF-03</span>
              <span className={styles.panelActive}>
                <i aria-hidden="true" />
                {t('运行中', 'ACTIVE')}
              </span>
              <span className={styles.panelCrossH} aria-hidden="true" />
              <span className={styles.panelCrossV} aria-hidden="true" />
              <span className={styles.panelCoords}>X:0240 Y:0196</span>

              <div className={styles.panelHead}>
                <span className={styles.panelHeadTitle}>PLAYER DATA</span>
                <span className={styles.panelHeadSeq}>FILE 03/07</span>
              </div>

              <dl className={styles.playerList}>
                {playerData.map((row) => (
                  <div key={row.code} className={styles.playerRow}>
                    <dt>{t(row.label.cn, row.label.en)}</dt>
                    <dd>{tx(row.value)}</dd>
                  </div>
                ))}
              </dl>

              <div className={styles.panelFoot}>
                <span className={styles.panelLoaded}>
                  <i aria-hidden="true" />
                  PROFILE LOADED
                </span>
                <span className={styles.panelBuild}>{profile.build}</span>
              </div>
            </div>
          </div>
        </div>

        {/* ══════════ 能力档案卡：5 张，两列不对称 ══════════ */}
        <div className={styles.abilities}>
          {abilityBlocks.map((block) => (
            <article
              key={block.index}
              className={
                block.index === '01' ? styles.abilityWide : styles.abilityItem
              }
            >
              <span className={styles.abilityRule} aria-hidden="true" />
              <div className={styles.abilityHead}>
                <span className={styles.abilityIndex}>{block.index}</span>
                <h3 className={styles.abilityTitle}>{tx(block.title)}</h3>
                <span className={styles.abilityEn}>{block.titleEn}</span>
              </div>
              <p className={styles.abilityBody}>{tx(block.body)}</p>
            </article>
          ))}
        </div>

        {/* ══════════ 下半：EDUCATION + TOOLSET + CV ══════════ */}
        <div className={styles.lower}>
          {/* 教育背景：硕士 / 本科两段紧凑卡（完整课程与论文由简历承担） */}
          <div className={styles.eduBlock}>
            <span className={styles.blockLabel}>
              EDUCATION / {t('教育背景', 'Education')}
            </span>
            <div className={styles.eduGrid}>
              {education.map((e) => (
                <article key={e.school.en} className={styles.eduCard}>
                  <span className={styles.eduHead}>
                    <b>{t(e.degree.cn, e.degree.en)}</b>
                    <span className={styles.eduPeriod}>{e.period}</span>
                  </span>
                  <span className={styles.eduSchool}>{t(e.school.cn, e.school.en)}</span>
                  <span className={styles.eduMajor}>{t(e.major.cn, e.major.en)}</span>
                  <span className={styles.eduMeta}>
                    <span>GPA {e.gpa}</span>
                    <i aria-hidden="true" />
                    <span>{e.top}</span>
                  </span>
                  {e.research && (
                    <span className={styles.eduResearch}>
                      {t('研究方向', 'RESEARCH')}：{t(e.research.cn, e.research.en)}
                    </span>
                  )}
                </article>
              ))}
            </div>
            <div className={styles.eduTags}>
              {researchTags.map((tag) => (
                <span key={tag}>{tag}</span>
              ))}
            </div>
          </div>

          <div className={styles.toolsBlock}>
            <span className={styles.blockLabel}>
              TOOLSET / {t('工具链', 'Toolchain')}
            </span>
            <ul className={styles.toolsRow}>
              {tools.map((tool) => {
                const Icon = TOOL_ICONS[tool.name] ?? Sparkles
                return (
                  <li key={tool.name} className={styles.tool}>
                    <span className={styles.toolIcon}>
                      <Icon size={16} strokeWidth={1.7} />
                    </span>
                    <span className={styles.toolText}>
                      <span className={styles.toolName}>{tool.name}</span>
                      <span className={styles.toolRole}>{tool.role}</span>
                    </span>
                    <span className={styles.toolState} data-state={tool.state}>
                      {t(TOOL_STATE_CN[tool.state] ?? tool.state, tool.state)}
                    </span>
                  </li>
                )
              })}
            </ul>
          </div>

          <MagneticButton
            variant="primary"
            size="lg"
            arrow
            href={profile.cvPath}
            download
            className={styles.cvBtn}
            ariaLabel={t('下载简历 PDF', 'Download CV as PDF')}
          >
            <Download size={13} strokeWidth={2.2} />
            {t('简历下载', 'DOWNLOAD CV.PDF')}
          </MagneticButton>
        </div>

        {/* 系统分割带 */}
        <SystemDivider variant="profile" />
      </div>
    </section>
  )
}
