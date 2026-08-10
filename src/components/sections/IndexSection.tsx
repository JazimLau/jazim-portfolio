import { useCallback, useEffect, useRef, useState } from 'react'
import { Eye } from 'lucide-react'
import { indexNodes, indexStats } from '../../data/navigation'
import { maskPhone, maskWechat, profile } from '../../data/profile'
import type { IndexNode, IndexStat, ProjectFilterId } from '../../data/types'
import { resolveLT } from '../../data/i18n'
import { useReducedMotion } from '../../hooks/useReducedMotion'
import { SectionHeader } from '../layout/SectionHeader'
import { MagneticButton } from '../ui/MagneticButton'
import { PixelCharts } from '../ui/PixelCharts'
import { PixelSceneBackground } from '../ui/PixelSceneBackground'
import { SystemDivider } from '../ui/SystemDivider'
import { useUI } from '../../context/UIContext'
import styles from './IndexSection.module.css'

interface IndexSectionProps {
  /** 节点跳转（带筛选时同时设置 Projects 筛选） */
  onNavigate: (target: string, filter?: ProjectFilterId) => void
}

/** 取节点标签的英文代号（纯字符串时原样返回） */
const labelEn = (n: IndexNode): string =>
  typeof n.label === 'string' ? n.label : n.label.en
/** 取节点标签的中文名（纯字符串时原样返回） */
const labelCn = (n: IndexNode): string =>
  typeof n.label === 'string' ? n.label : n.label.cn

/** 部分模块的补充信息卡（每卡：代号 + 双语标签 + 双语条目列表） */
const MODULE_EXTRA: Record<string, { code: string; label: [string, string]; items: [string, string][] }[]> = {
  'node-home': [
    {
      code: 'MODULES',
      label: ['模块组成', 'Modules'],
      items: [
        ['身份定位', 'Identity'],
        ['动效监视器', 'Motion monitor'],
        ['作品入口', 'Works entry'],
      ],
    },
    {
      code: 'FOCUS',
      label: ['当前方向', 'Focus'],
      items: [
        ['游戏UI动效', 'Game UI motion'],
        ['视频设计', 'Video design'],
        ['引擎实践', 'Engine practice'],
      ],
    },
    {
      code: 'GUIDE',
      label: ['访问指引', 'Guide'],
      items: [
        ['查看精选项目', 'View featured'],
        ['浏览履历与项目', 'Timeline & projects'],
        ['建立联系', 'Get in touch'],
      ],
    },
  ],
  'node-contact': [
    {
      code: 'LEVELING',
      label: ['当前精进方向', 'Leveling Up'],
      items: [
        ['游戏UI动效', 'Game UI motion'],
        ['KV主视觉动效', 'KV motion'],
        ['页面交互动效', 'Page interaction'],
        ['UE5 / Unity 引擎', 'UE5 / Unity'],
        ['实时特效', 'Real-time VFX'],
        ['AIGC 工作流', 'AIGC workflow'],
      ],
    },
    {
      code: 'STATUS',
      label: ['当前状态', 'Status'],
      items: [
        ['持续更新作品集', 'Updating portfolio'],
        ['强化引擎落地能力', 'Engine delivery'],
        ['补充实时特效案例', 'Adding VFX cases'],
        ['开放交流与岗位沟通', 'Open to chat & roles'],
      ],
    },
    {
      code: 'TOPICS',
      label: ['欢迎交流', 'Open Topics'],
      items: [
        ['游戏动效设计', 'Game motion'],
        ['端外页面动效', 'Off-client motion'],
        ['作品集反馈', 'Portfolio feedback'],
        ['项目协作', 'Collaboration'],
        ['实习和校招机会', 'Internships & roles'],
      ],
    },
  ],
}

/** 区块入场动画：会话内只播放一次。隐藏态由 React 渲染（CSS 类），
    gsap 用 to 在滚动进入时动画到自然态 —— React 管理隐藏态，StrictMode 重渲染
    不会抹掉 gsap 的 from 内联样式，入场动画稳定可见。 */
let indexEntrancePlayed = false

/**
 * Index —— 系统目录。
 * 上半：6 项核心数据总览（数字面板，像素状态条 + LIVE 状态）。
 * 下半：大型游戏菜单式模块目录（01 HOME ~ 06 CONTACT），
 *      左侧列表点击切换模块，右侧显示当前模块简介 / 关键词 / ENTER MODULE，
 *      点击 ENTER MODULE 后 0.25s 像素扫描遮罩覆盖，随后滚动到目标区块。
 */
export function IndexSection({ onNavigate }: IndexSectionProps) {
  const rootRef = useRef<HTMLElement>(null)
  const [active, setActive] = useState(0)
  const [scan, setScan] = useState(false)
  /* CONTACT 模块的隐私信息：手机号 / 微信默认掩码，点击小眼睛切换 */
  const [showPhone, setShowPhone] = useState(false)
  const [showWechat, setShowWechat] = useState(false)
  const reduced = useReducedMotion()
  const { t, tx, txList, lang } = useUI()
  /* 入场是否已播放：未播放时渲染隐藏态（CSS 类），播放完成后再置为已播 */
  const [entered, setEntered] = useState(() => reduced || indexEntrancePlayed)

  const total = indexNodes.length
  const node = indexNodes[active]

  const go = useCallback((i: number) => setActive(Math.min(total - 1, Math.max(0, i))), [total])

  /* ---------- 进入目标模块：0.25s 像素扫描遮罩后滚动 ---------- */
  const handleEnter = useCallback(
    (i: number) => {
      if (scan) return
      const target = indexNodes[i]
      setScan(true)
      window.setTimeout(() => {
        onNavigate(target.target, target.filter)
        setScan(false)
      }, 280)
    },
    [scan, onNavigate]
  )

  /* ---------- 区块入场 ----------
     滚动进入视口时触发一次（IntersectionObserver）。隐藏态与入场动画都由
     React 控制的 CSS 类切换驱动（Hidden → In），不依赖 gsap 内联样式，
     StrictMode 重渲染不会抹掉入场动画。 */
  useEffect(() => {
    const root = rootRef.current
    if (!root || reduced || indexEntrancePlayed) return
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          indexEntrancePlayed = true
          setEntered(true)
          io.disconnect()
        }
      },
      { threshold: 0.12 }
    )
    io.observe(root)
    return () => io.disconnect()
  }, [reduced])

  return (
    <section
      id="index"
      ref={rootRef}
      className={`section ${styles.root}`}
      aria-label={t('系统索引', 'System index')}
    >
      {/* 极低透明度的截图拼贴底纹 */}
      <div className={styles.collage} aria-hidden="true">
        <span />
        <span />
        <span />
        <span />
      </div>
      <div className={`grid-bg ${styles.grid}`} aria-hidden="true" />

      {/* 大尺度像素场景背景：左侧目录轨道 + 右上数据区 */}
      <PixelSceneBackground variant="index" />

      {/* 点击进入时的全屏像素扫描遮罩 */}
      {scan && <span className={styles.scanOverlay} aria-hidden="true" />}

      <div className="shell">
        <SectionHeader
          index="02"
          code="SYSTEM DIRECTORY"
          titleEn="INDEX"
          titleZh={t('快速访问系统模块', 'Jump to any system module')}
        />

        <p className={`${styles.intro} ${entered ? styles.introIn : styles.introHidden}`}>
          {t(
            '全局索引。核心数据总览与模块目录 —— 直接进入任意系统模块。',
            'Global index. Core data overview and module directory — jump straight into any system module.'
          )}
        </p>

        {/* ══════════ 核心数据总览：6 项数字面板 ══════════ */}
        <div className={styles.stats} aria-label={t('核心数据总览', 'Core data overview')}>
          {indexStats.map((s: IndexStat, idx) => (
            <div
              key={s.id}
              className={`${styles.statCard} ${entered ? styles.statCardIn : styles.statCardHidden}`}
              data-accent={s.accent}
              style={{ ['--i' as string]: idx }}
            >
              <div className={styles.statHead}>
                <span className={styles.statIndex}>{s.index}</span>
                <span className={styles.statState}>
                  <i />
                  {t('运行中', 'LIVE')}
                </span>
              </div>
              <span className={styles.statValue}>
                {typeof s.value === 'string' ? s.value : s.value[lang === 'CN' ? 'cn' : 'en']}
              </span>
              <span className={styles.statLabel}>{t(s.label.cn, s.label.en)}</span>
              <p className={styles.statNote}>{t(s.note.cn, s.note.en)}</p>
              <span className={styles.statBar}>
                <i />
              </span>
            </div>
          ))}
        </div>

        {/* ══════════ 模块目录：左列表 + 右详情 ══════════ */}
        <div className={styles.menu}>
          <div className={styles.menuCol}>
            <span className={styles.colLabel}>{t('模块目录', 'MODULE DIRECTORY')}</span>
            <div className={styles.menuList} role="listbox" aria-label={t('系统模块目录', 'System module directory')}>
              {indexNodes.map((n, i) => {
                const isActive = i === active
                return (
                  <div
                    key={n.id}
                    role="option"
                    aria-selected={isActive}
                    className={`${styles.menuItem} ${isActive ? styles.menuItemActive : ''} ${
                      entered ? styles.menuItemIn : styles.menuItemHidden
                    }`}
                    style={{ ['--i' as string]: i }}
                    /* 整行点击仍是切换模块（保持原交互） */
                    onClick={() => go(i)}
                    onKeyDown={(e) => {
                      if (e.target !== e.currentTarget) return
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        go(i)
                      }
                    }}
                    tabIndex={0}
                    data-cursor="select"
                  >
                    <span className={styles.menuIndex}>{n.index}</span>
                    <span className={styles.menuLabel}>
                      <span className={styles.menuLabelEn}>{labelEn(n)}</span>
                      {/* 英文模式下目录栏保持全英文，不显示中文副标签 */}
                      {lang === 'CN' && (
                        <span className={styles.menuLabelZh}>{labelCn(n)}</span>
                      )}
                    </span>
                    {/* 当前模块：右侧「进入 →」为真实跳转控件（Enter / Space 原生可用） */}
                    {isActive ? (
                      <button
                        type="button"
                        className={styles.menuEnter}
                        onClick={(e) => {
                          e.stopPropagation()
                          handleEnter(i)
                        }}
                        aria-label={t(
                          `进入 ${lang === 'CN' ? labelCn(n) : labelEn(n)} 模块`,
                          `Enter the ${labelEn(n)} module`
                        )}
                        data-cursor="open"
                      >
                        {t('进入', 'ENTER')}
                        <i aria-hidden="true">→</i>
                      </button>
                    ) : (
                      <span className={styles.menuState} aria-hidden="true">
                        ◌
                      </span>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          {/* 当前模块详情：不重挂载，入场动画只在页面加载时播一次，切换模块不再重放 */}
          <div className={styles.detailCol}>
            <div
              className={`${styles.detailInner} ${
                node.id === 'node-contact' ? styles.detailCentered : ''
              }`}
            >
              <div className={styles.detailTop}>
                <span className={styles.detailIndex}>{node.index}</span>
                <span className={styles.detailTag}>{t('当前模块', 'CURRENT MODULE')}</span>
              </div>
              <h3 className={styles.detailTitle}>{resolveLT(node.label, lang)}</h3>
              <p className={styles.detailBrief}>{tx(node.brief)}</p>
              {node.id === 'node-contact' ? (
                <ul className={styles.contactList}>
                  {/* 邮箱：可直接显示，点击 mailto */}
                  <li className={styles.contactRow}>
                    <span className={styles.contactLabel}>{t('邮箱', 'EMAIL')}</span>
                    <a
                      className={styles.contactValue}
                      href={`mailto:${profile.email}`}
                      data-cursor="link"
                    >
                      {profile.email}
                    </a>
                  </li>
                  {/* 手机：默认掩码，小眼睛切换 */}
                  <li className={styles.contactRow}>
                    <span className={styles.contactLabel}>{t('手机', 'PHONE')}</span>
                    <span className={styles.contactValueRow}>
                      <b className={styles.contactValue}>
                        {showPhone ? profile.phone : maskPhone(profile.phone)}
                      </b>
                      <button
                        type="button"
                        className={styles.eyeBtn}
                        onClick={() => setShowPhone((v) => !v)}
                        aria-label={showPhone ? t('隐藏手机号', 'Hide phone') : t('显示手机号', 'Reveal phone')}
                        aria-pressed={showPhone}
                        data-cursor="link"
                      >
                        <Eye size={12} strokeWidth={2} />
                      </button>
                    </span>
                  </li>
                  {/* 微信：默认掩码，小眼睛切换 */}
                  <li className={styles.contactRow}>
                    <span className={styles.contactLabel}>{t('微信', 'WECHAT')}</span>
                    <span className={styles.contactValueRow}>
                      <b className={styles.contactValue}>
                        {showWechat ? profile.wechat : maskWechat(profile.wechat)}
                      </b>
                      <button
                        type="button"
                        className={styles.eyeBtn}
                        onClick={() => setShowWechat((v) => !v)}
                        aria-label={showWechat ? t('隐藏微信号', 'Hide WeChat') : t('显示微信号', 'Reveal WeChat')}
                        aria-pressed={showWechat}
                        data-cursor="link"
                      >
                        <Eye size={12} strokeWidth={2} />
                      </button>
                    </span>
                  </li>
                </ul>
              ) : (
                <ul className={styles.keywords}>
                  {txList(node.preview).map((k) => (
                    <li key={k}>{k}</li>
                  ))}
                </ul>
              )}

              {/* 补充信息卡：HOME / CONTACT 模块的组成、方向与指引 */}
              {MODULE_EXTRA[node.id] && (
                <div className={styles.moduleExtra}>
                  {MODULE_EXTRA[node.id].map((card) => (
                    <div key={card.code} className={styles.extraCard}>
                      <span className={styles.extraHead}>
                        <b className={styles.extraCode}>{card.code}</b>
                        <i className={styles.extraLight} aria-hidden="true" />
                        <span className={styles.extraLabel}>
                          {t(card.label[0], card.label[1])}
                        </span>
                      </span>
                      <ul className={styles.extraList}>
                        {card.items.map(([cn, en]) => (
                          <li key={cn}>{t(cn, en)}</li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              )}

              {/* 精选数据图表：随当前模块切换不同图表类型 */}
              <PixelCharts variant={node.id} />

              <div className={styles.detailFoot}>
                <MagneticButton
                  variant="primary"
                  size="md"
                  arrow
                  onClick={() => handleEnter(active)}
                  className={styles.enterBtn}
                  ariaLabel={t(
                    `进入 ${resolveLT(node.label, lang)} 模块`,
                    `Enter the ${resolveLT(node.label, lang)} module`
                  )}
                >
                  {t('进入模块', 'ENTER MODULE')}
                </MagneticButton>
                <span className={styles.detailSeq}>
                  {String(active + 1).padStart(2, '0')} / {String(total).padStart(2, '0')}
                </span>
              </div>
            </div>
          </div>
        </div>

        <p className={styles.hint}>
          {t(
            '点击左侧列表切换模块 · 点击 ENTER MODULE 进入',
            'Click the left list to switch modules · click ENTER MODULE to jump'
          )}
        </p>

        {/* 系统分割带 */}
        <SystemDivider variant="index" />
      </div>
    </section>
  )
}
