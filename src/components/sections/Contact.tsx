import { useRef, useState } from 'react'
import {
  ArrowUp,
  Download,
  ExternalLink,
  Eye,
  Mail,
  MessageSquare,
  Phone,
  RadioTower,
} from 'lucide-react'
import { maskPhone, maskWechat, profile } from '../../data/profile'
import { gsap } from '../../lib/gsap'
import { useGsapContext } from '../../hooks/useGsapContext'
import { useReducedMotion } from '../../hooks/useReducedMotion'
import { useUI } from '../../context/UIContext'
import { scrollToTop } from '../../lib/smoothScroll'
import { EASE, TRIGGER } from '../../lib/motion'
import { MagneticButton } from '../ui/MagneticButton'
import { PixelSceneBackground } from '../ui/PixelSceneBackground'
import { SystemDivider } from '../ui/SystemDivider'
import styles from './Contact.module.css'

interface ContactProps {
  /** 回到顶部后触发 Hero 简化版标题重播 */
  onReturnHome: () => void
}

const FOOTER_ITEMS = [
  `CURRENT BUILD ${profile.build}`,
  profile.nameEn,
  'GAME MOTION · VIDEO DESIGN',
  'DESIGNED & DEVELOPED WITH REACT',
  'ALL RIGHTS RESERVED',
]

/** tel: 链接要纯数字，页面显示保留空格分组 */
const PHONE_HREF = profile.phone.replace(/[^\d+]/g, '')

/**
 * Contact —— 全屏收尾页。
 * 背景是超出屏幕的巨大 CONTACT 文字、缓慢移动的坐标线与跟随鼠标的小范围光照。
 * 页面底部有系统关闭式动画。
 * BACK TO TOP 会先显示 RETURNING TO HOME 遮罩，再平滑回到顶部并重播 Hero 标题。
 * 手机号默认掩码，点击后才显露完整号码并变成可拨打链接。
 */
export function Contact({ onReturnHome }: ContactProps) {
  const rootRef = useRef<HTMLElement>(null)
  const [returning, setReturning] = useState(false)
  const [phoneShown, setPhoneShown] = useState(false)
  const [wechatShown, setWechatShown] = useState(false)
  const reduced = useReducedMotion()
  const { t } = useUI()

  /* ---------- 入场动画 ----------
     轻量入场：标题 → 说明 → 联系通道（stagger）→ CTA → 底部状态。
     单卡动画 opacity 0→1 + y 12~18px→0，整体约 1.0s 完成；
     触发点提前到区块顶部进入视口（top 92%）即开始，直接进入时不延迟。
     prefers-reduced-motion 时跳过（元素保持可见）。 */
  useGsapContext(
    () => {
      if (reduced) return

      const tl = gsap.timeline({
        scrollTrigger: { trigger: rootRef.current, start: 'top 92%', once: true },
        defaults: { ease: EASE.element },
      })

      tl.from(`.${styles.kicker}`, {
        clipPath: 'inset(0% 100% 0% 0%)',
        duration: 0.5,
        ease: EASE.transition,
      })
        .from(
          `.${styles.titleA}`,
          {
            xPercent: -24,
            scaleX: 0.7,
            clipPath: 'inset(0% 100% 0% 0%)',
            duration: 0.6,
            ease: EASE.title,
          },
          0.05
        )
        .from(
          `.${styles.titleB}`,
          {
            xPercent: 20,
            scaleX: 0.76,
            clipPath: 'inset(0% 0% 0% 100%)',
            duration: 0.6,
            ease: EASE.title,
          },
          0.14
        )
        .from(
          `.${styles.zhRule}`,
          { scaleX: 0, duration: 0.5, ease: EASE.transition },
          0.16
        )
        .from(
          `.${styles.zh}`,
          { y: 14, opacity: 0, duration: 0.45 },
          0.2
        )
        .from(
          `.${styles.copy} > *`,
          { y: 14, opacity: 0, duration: 0.5, stagger: 0.08 },
          0.22
        )
        /* 联系通道卡片：opacity 0→1 + y 12~18px→0，stagger 依次进入。
           与标题/kicker 一致使用 gsap.from（fromTo 在此 ScrollTrigger 时间线中
           不会渲染起始态，导致卡片"静态出现"）。结束用 clearProps 清掉 transform，
           避免内联 transform 覆盖卡片的 CSS hover 位移。 */
        .from(
          `.${styles.channel}`,
          { opacity: 0, y: 16, duration: 0.5, stagger: 0.08, clearProps: 'transform' },
          0.24
        )
        .from(
          `.${styles.actions} > *`,
          { opacity: 0, y: 14, duration: 0.45, stagger: 0.07, clearProps: 'transform' },
          0.5
        )
        .from(
          `.${styles.footItem}`,
          { y: 12, opacity: 0, duration: 0.4, stagger: 0.05, clearProps: 'transform' },
          0.64
        )

      /* 底部系统状态文字（底部线保持完整像素虚线，不再被 scrub 收拢成不可见） */
      gsap.from(`.${styles.shutdownText}`, {
        opacity: 0,
        letterSpacing: '0.6em',
        duration: 1,
        ease: EASE.media,
        scrollTrigger: { trigger: `.${styles.shutdown}`, start: TRIGGER.start, once: true },
      })

      /* 背景巨大文字缓慢横移 */
      gsap.to(`.${styles.bigWord}`, {
        xPercent: -6,
        ease: 'none',
        scrollTrigger: {
          trigger: rootRef.current,
          start: 'top bottom',
          end: 'bottom top',
          scrub: 1.2,
        },
      })
    },
    [reduced],
    rootRef
  )

  /* ---------- BACK TO TOP ---------- */
  const handleBackToTop = () => {
    setReturning(true)
    window.setTimeout(() => {
      scrollToTop()
    }, 260)
    window.setTimeout(() => {
      setReturning(false)
      onReturnHome()
    }, reduced ? 400 : 1500)
  }

  return (
    <section
      id="contact"
      ref={rootRef}
      className={`${styles.root} section-full`}
      aria-label={t('联系方式', 'Contact')}
    >
      {/* ══════════ 背景 ══════════ */}
      <span className={styles.bigWord} aria-hidden="true">
        CONTACT
      </span>

      <div className={styles.coordLines} aria-hidden="true">
        <span />
        <span />
        <span />
        <span />
      </div>

      <div className={`grid-bg ${styles.grid}`} aria-hidden="true" />
      <div className={`noise ${styles.noise}`} aria-hidden="true" />
      <PixelSceneBackground variant="contact" />

      {/* ══════════ 内容 ══════════ */}
      <div className={`${styles.content} shell`}>
        <div className={styles.top}>
          <div className={styles.left}>
            <span className={styles.kicker}>07 / END OF TRANSMISSION</span>

            <div className={styles.titleWrap}>
              <h2 className={styles.title}>
                <span className={styles.titleLine}>
                  <span className={styles.titleA}>{t('建立', 'ESTABLISH')}</span>
                </span>
                <span className={styles.titleLine}>
                  <span className={styles.titleB}>{t('连接', 'CONNECTION')}</span>
                </span>
              </h2>

              <div className={styles.zhCorner}>
                <i className={styles.zhRule} aria-hidden="true" />
                {/* 中文模式：大标题中文 + 小型英文系统标签；英文模式：大标题英文 + 同义副标签 */}
                <span className={styles.zh}>{t('ESTABLISH CONNECTION', 'CONTACT CHANNEL')}</span>
              </div>
            </div>

            <div className={styles.copy}>
              <p className={styles.copyText}>
                {t('感谢浏览我的当前版本。', 'Thanks for going through this build.')}
                <br />
                {t(
                  '我仍在持续完善游戏UI动效、引擎实现与实时特效能力。',
                  'I keep pushing on game UI motion, engine implementation and real-time VFX.'
                )}
              </p>
              <p className={styles.copyEn}>READY FOR THE NEXT MISSION.</p>
            </div>
          </div>

          {/* ─── 联系渠道 ─── */}
          <div className={styles.right}>
            <span className={styles.channelHead}>
              {t('联系通道', 'CONTACT CHANNELS')}
            </span>

            <a
              className={styles.channel}
              href={`mailto:${profile.email}`}
              data-cursor="link"
            >
              <span className={styles.channelIcon}>
                <Mail size={15} strokeWidth={1.8} />
              </span>
              <span className={styles.channelText}>
                <span className={styles.channelLabel}>{t('邮箱', 'EMAIL')}</span>
                <span className={styles.channelValue}>{profile.email}</span>
              </span>
              <ExternalLink className={styles.channelArrow} size={13} />
            </a>

            {/* 手机号：默认掩码，点击才显露完整号码并变成拨号链接 */}
            <div className={`${styles.channel} ${styles.channelStatic}`}>
              <span className={styles.channelIcon}>
                <Phone size={15} strokeWidth={1.8} />
              </span>
              <span className={styles.channelText}>
                <span className={styles.channelLabel}>{t('手机', 'PHONE')}</span>
                {phoneShown ? (
                  <a
                    className={`${styles.channelValue} ${styles.channelLink}`}
                    href={`tel:${PHONE_HREF}`}
                    data-cursor="link"
                    aria-live="polite"
                  >
                    {profile.phone}
                  </a>
                ) : (
                  <span className={`${styles.channelValue} ${styles.channelMasked}`}>
                    {maskPhone(profile.phone)}
                  </span>
                )}
              </span>

              <button
                type="button"
                className={styles.revealBtn}
                onClick={() => setPhoneShown((v) => !v)}
                aria-label={
                  phoneShown
                    ? t('隐藏完整手机号', 'Hide full phone number')
                    : t('显示完整手机号', 'Reveal full phone number')
                }
                aria-pressed={phoneShown}
                data-cursor="link"
              >
                <Eye size={12} strokeWidth={2} />
                <span>{phoneShown ? t('隐藏', 'HIDE') : t('点击显示', 'REVEAL')}</span>
              </button>
            </div>

            <a
              className={styles.channel}
              href={profile.cvPath}
              download
              data-cursor="link"
            >
              <span className={styles.channelIcon}>
                <Download size={15} strokeWidth={1.8} />
              </span>
              <span className={styles.channelText}>
                <span className={styles.channelLabel}>{t('简历下载', 'RESUME')}</span>
                <span className={styles.channelValue}>{t('下载简历 PDF', 'DOWNLOAD CV')}</span>
              </span>
              <ExternalLink className={styles.channelArrow} size={13} />
            </a>

            {/* 微信 ID：默认掩码，点击才显露完整 ID */}
            <div className={`${styles.channel} ${styles.channelStatic}`}>
              <span className={styles.channelIcon}>
                <MessageSquare size={15} strokeWidth={1.8} />
              </span>
              <span className={styles.channelText}>
                <span className={styles.channelLabel}>{t('微信', 'WECHAT')}</span>
                {wechatShown ? (
                  <span className={styles.channelValue} aria-live="polite">
                    {profile.wechat}
                  </span>
                ) : (
                  <span className={`${styles.channelValue} ${styles.channelMasked}`}>
                    {maskWechat(profile.wechat)}
                  </span>
                )}
              </span>

              <button
                type="button"
                className={styles.revealBtn}
                onClick={() => setWechatShown((v) => !v)}
                aria-label={
                  wechatShown
                    ? t('隐藏完整微信号', 'Hide full WeChat ID')
                    : t('显示完整微信号', 'Reveal full WeChat ID')
                }
                aria-pressed={wechatShown}
                data-cursor="link"
              >
                <Eye size={12} strokeWidth={2} />
                <span>{wechatShown ? t('隐藏', 'HIDE') : t('点击显示', 'REVEAL')}</span>
              </button>
            </div>

            {/* 当前状态 */}
            <div className={`${styles.channel} ${styles.channelStatus}`}>
              <span className={styles.channelIcon}>
                <RadioTower size={15} strokeWidth={1.8} />
              </span>
              <span className={styles.channelText}>
                <span className={styles.channelLabel}>{t('当前状态', 'STATUS')}</span>
                <span className={styles.channelValue}>
                  {t('正在看机会', 'OPEN FOR OPPORTUNITIES')}
                </span>
              </span>
              <span className={styles.statusDot} aria-hidden="true" />
            </div>

            <p className={styles.privacy}>
              {t(
                '手机号默认以掩码显示，点小眼睛可随时显示或隐藏；微信号同样默认隐藏，可一键切换。',
                'The phone number is masked by default — toggle it with the eye icon anytime. The WeChat ID is hidden by default too, reveal or hide it with one click.'
              )}
            </p>
          </div>
        </div>

        {/* ─── 主要按钮 ─── */}
        <div className={styles.actions}>
          <MagneticButton
            variant="solid"
            size="lg"
            arrow
            href={`mailto:${profile.email}`}
            ariaLabel={t('发送邮件', 'Send an email')}
          >
            {t('发送邮件', 'SEND EMAIL')}
          </MagneticButton>
          <MagneticButton
            variant="outline"
            size="lg"
            arrow
            href={profile.cvPath}
            download
            ariaLabel={t('下载简历', 'Download CV')}
          >
            {t('下载简历', 'DOWNLOAD CV')}
          </MagneticButton>
          <MagneticButton
            variant="ghost"
            size="lg"
            arrow
            onClick={handleBackToTop}
            ariaLabel={t('回到页面顶部', 'Back to top of page')}
          >
            <ArrowUp size={13} strokeWidth={2.2} />
            {t('返回顶部', 'BACK TO TOP')}
          </MagneticButton>
        </div>

        {/* ─── 系统关闭动画 ─── */}
        <div className={styles.shutdown}>
          <span className={styles.shutdownLine} aria-hidden="true" />
          <span className={styles.shutdownText}>SYSTEM STANDBY</span>
        </div>

        {/* 系统分割带 */}
        <SystemDivider variant="contact" />

        {/* ─── 底部状态栏 ─── */}
        <footer className={styles.footer}>
          {FOOTER_ITEMS.map((item) => (
            <span key={item} className={styles.footItem}>
              {item}
            </span>
          ))}
        </footer>
      </div>

      {/* ══════════ 返回顶部遮罩 ══════════ */}
      <div
        className={`${styles.returnVeil} ${returning ? styles.returnOn : ''}`}
        aria-hidden={!returning}
      >
        <span className={styles.returnText}>RETURNING TO HOME</span>
        <span className={styles.returnBar} />
      </div>
    </section>
  )
}
