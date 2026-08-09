import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Menu, Volume2, VolumeX, X } from 'lucide-react'
import { navItems } from '../../data/navigation'
import { profile } from '../../data/profile'
import { LANG_META, resolveLT } from '../../data/i18n'
import type { Lang } from '../../data/i18n'
import { scrollToId } from '../../lib/smoothScroll'
import { usePlayback } from '../../context/PlaybackContext'
import { useUI } from '../../context/UIContext'
import { MagneticButton } from '../ui/MagneticButton'
import styles from './Navbar.module.css'

const LANGS: Lang[] = ['CN', 'EN']

interface NavbarProps {
  /** 当前所在区块 id */
  active?: string
}

/**
 * 固定导航栏。
 * 高亮不只是文字变色：当前项有胶囊背景 + 顶部扫描线 + 左侧坐标点。
 * hover 时文字横向错位、底部短线从中心向两侧展开、并显示章节编号。
 * 滚动后导航栏轻微压缩。
 */
export function Navbar({ active = 'home' }: NavbarProps) {
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  /* PROJECTS 点击反馈：VIEW WORK → OPENING（约 180ms） */
  const [opening, setOpening] = useState(false)
  const { lang, requestLang, switching, ready, t } = useUI()
  const { soundOn, setSoundOn, volume } = usePlayback()
  const navigate = useNavigate()
  const location = useLocation()
  const onHome = location.pathname === '/'

  useEffect(() => {
    /* 值不变时返回旧值，React 自动跳过重渲染：避免每个滚动帧都重建导航栏 */
    const onScroll = () => {
      const next = window.scrollY > 40
      setScrolled((prev) => (prev === next ? prev : next))
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // 路由变化时收起移动端菜单
  useEffect(() => {
    setMenuOpen(false)
  }, [location.pathname])

  const goTo = (target: string) => {
    setMenuOpen(false)
    if (onHome) {
      scrollToId(target)
    } else {
      // 详情页 / 404 上点击导航：先回首页，再由 HomePage 完成滚动
      navigate('/', { state: { scrollTo: target } })
    }
  }

  return (
    <>
      <header
        className={`${styles.nav} ${scrolled ? styles.scrolled : ''} ${
          ready ? styles.navReady : styles.navHidden
        }`}
        role="banner"
      >
        <div className={`${styles.inner} shell`}>
          {/* ─────────── 左：个人标识 ─────────── */}
          <button
            type="button"
            className={styles.brand}
            onClick={() => goTo('home')}
            aria-label={t('返回首页', 'Back to top')}
          >
            <span className={styles.badge} aria-hidden="true">
              {profile.initials}
            </span>
            <span className={styles.brandText}>
              {/* 主行始终是当前语言的写法，另一种写法作为副行保留 */}
              <span className={styles.brandZh}>{t(profile.name, profile.nameEn)}</span>
              <span className={styles.brandEn}>{t(profile.nameEn, profile.name)}</span>
            </span>
            <span className={styles.build} aria-hidden="true">
              {profile.build}
            </span>
          </button>

          {/* ─────────── 中：章节导航 ─────────── */}
          <nav className={styles.center} aria-label={t('章节导航', 'Section navigation')}>
            <ul className={styles.list}>
              {navItems.map((item) => {
                const isActive = onHome && active === item.target
                return (
                  <li key={item.id}>
                    <button
                      type="button"
                      className={`${styles.link} ${isActive ? styles.linkActive : ''}`}
                      onClick={() => {
                        /* PROJECTS：点击时 VIEW WORK → OPENING 短暂反馈（150~200ms） */
                        if (item.id === 'projects' && !opening) {
                          setOpening(true)
                          window.setTimeout(() => setOpening(false), 180)
                        }
                        goTo(item.target)
                      }}
                      aria-current={isActive ? 'true' : undefined}
                      data-cursor="select"
                    >
                      <span className={styles.capsule} aria-hidden="true" />
                      <span className={styles.coordDot} aria-hidden="true" />
                      <span className={styles.linkNum} aria-hidden="true">
                        {item.index}
                      </span>
                      <span className={styles.linkText}>
                        <span className={styles.linkLabel}>{resolveLT(item.label, lang)}</span>
                      </span>
                      {/* PROJECTS 提示态：小型像素点 + VIEW WORK，克制脉冲。
                          em 内部分两段：中等桌面（≤1400px）只保留 VIEW → 缩短占位 */}
                      {item.id === 'projects' && (
                        <span className={styles.workHint} aria-hidden="true">
                          <i className={styles.workDot} />
                          <em>
                            {opening ? 'OPENING' : 'VIEW'}
                            {!opening && <span className={styles.workHintTail}> WORK</span>}
                          </em>
                          <b>→</b>
                        </span>
                      )}
                      <span className={styles.underline} aria-hidden="true" />
                    </button>
                  </li>
                )
              })}
            </ul>
          </nav>

          {/* ─────────── 右：功能区 ─────────── */}
          <div className={styles.right}>
            {/* 分段式语言开关：点哪个就切到哪个，滑块负责视觉过渡，
                真正的文案替换由 LangTransition 在遮罩最深处完成 */}
            <div
              className={styles.langToggle}
              role="group"
              aria-label={t('语言切换', 'Language switch')}
            >
              <span
                className={styles.langMarker}
                data-pos={lang}
                aria-hidden="true"
              />
              {LANGS.map((code) => {
                const isOn = lang === code
                return (
                  <button
                    key={code}
                    type="button"
                    className={`${styles.langBtn} ${isOn ? styles.langOn : styles.langOff}`}
                    onClick={() => requestLang(code)}
                    disabled={switching}
                    aria-pressed={isOn}
                    aria-label={
                      isOn
                        ? t(
                            `当前语言：${LANG_META[code].label.cn}`,
                            `Current language: ${LANG_META[code].label.en}`
                          )
                        : t(
                            `切换到${LANG_META[code].label.cn}`,
                            `Switch to ${LANG_META[code].label.en}`
                          )
                    }
                    data-cursor="link"
                  >
                    {code}
                  </button>
                )
              })}
            </div>

            {/* 声音开关：全局视频音量总开关 */}
            <button
              type="button"
              className={`${styles.soundBtn} ${soundOn ? styles.soundOn : ''}`}
              onClick={() => setSoundOn(!soundOn)}
              aria-label={soundOn ? t('关闭声音', 'Turn sound off') : t('打开声音', 'Turn sound on')}
              aria-pressed={soundOn}
              data-cursor="link"
            >
              {soundOn && volume > 0 ? (
                <Volume2 size={15} strokeWidth={2} />
              ) : (
                <VolumeX size={15} strokeWidth={2} />
              )}
              <span className={styles.soundText}>
                {soundOn ? t('声音', 'SOUND') : t('静音', 'MUTED')}
              </span>
            </button>

            <MagneticButton
              variant="primary"
              size="sm"
              arrow
              onClick={() => goTo('contact')}
              className={styles.contactBtn}
              ariaLabel={t('跳转到联系方式', 'Jump to contact section')}
            >
              {t('联系我', 'CONTACT ME')}
            </MagneticButton>

            <button
              type="button"
              className={styles.menuBtn}
              onClick={() => setMenuOpen((v) => !v)}
              aria-label={menuOpen ? t('关闭菜单', 'Close menu') : t('打开菜单', 'Open menu')}
              aria-expanded={menuOpen}
            >
              {menuOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </div>

        <span className={styles.baseline} aria-hidden="true" />
      </header>

      {/* ─────────── 窄屏简化菜单 ─────────── */}
      <div
        className={`${styles.mobileMenu} ${menuOpen ? styles.mobileOpen : ''}`}
        aria-hidden={!menuOpen}
      >
        <ul>
          {navItems.map((item) => (
            <li key={item.id}>
              <button type="button" onClick={() => goTo(item.target)}>
                <span className={styles.mobileNum}>{item.index}</span>
                <span>{resolveLT(item.label, lang)}</span>
                {item.id === 'projects' && (
                  <span className={styles.mobileHint}>VIEW WORK →</span>
                )}
              </button>
            </li>
          ))}
        </ul>
        <div className={styles.mobileFoot}>
          <span>{profile.email}</span>
          <span>{profile.build}</span>
        </div>
      </div>
    </>
  )
}
