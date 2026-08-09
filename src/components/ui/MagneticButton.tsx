import { useRef } from 'react'
import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { gsap } from '../../lib/gsap'
import { useIsTouch, useReducedMotion } from '../../hooks/useReducedMotion'
import styles from './MagneticButton.module.css'

type Variant = 'primary' | 'outline' | 'ghost' | 'solid'
type Size = 'sm' | 'md' | 'lg'

interface MagneticButtonProps {
  children: ReactNode
  /** 站内路由跳转 */
  to?: string
  /** 站外链接 / mailto / 文件下载 */
  href?: string
  onClick?: () => void
  variant?: Variant
  size?: Size
  /** 显示从左侧切入的箭头 */
  arrow?: boolean
  download?: boolean
  newTab?: boolean
  full?: boolean
  disabled?: boolean
  className?: string
  ariaLabel?: string
  /** 自定义光标在此按钮上显示的文字 */
  cursorLabel?: string
  type?: 'button' | 'submit'
  /** 强调色（CSS 变量值），覆盖默认的 --btn-accent */
  accent?: string
}

/** 磁吸位移上限（px）—— spec 要求不超过 8px */
const MAX_OFFSET = 8

/**
 * 全站统一按钮。
 * - 鼠标接近时轻微磁吸，离开平滑归位
 * - 背景具有方向性填充（从指针进入的一侧展开）
 * - 箭头从左侧切入，文字同时右移
 * - 四角定位线展开，而不是简单的 scale(1.05)
 * - 键盘 focus 可用且样式与 hover 一致
 * - 触摸设备与 reduced-motion 下自动关闭磁吸
 */
export function MagneticButton({
  children,
  to,
  href,
  onClick,
  variant = 'outline',
  size = 'md',
  arrow = false,
  download = false,
  newTab = false,
  full = false,
  disabled = false,
  className = '',
  ariaLabel,
  cursorLabel,
  type = 'button',
  accent,
}: MagneticButtonProps) {
  const rootRef = useRef<HTMLElement | null>(null)
  const reduced = useReducedMotion()
  const isTouch = useIsTouch()
  const magnetEnabled = !reduced && !isTouch && !disabled

  const handleMove = (e: React.PointerEvent) => {
    const el = rootRef.current
    if (!el || !magnetEnabled) return

    const rect = el.getBoundingClientRect()
    const relX = (e.clientX - rect.left) / rect.width - 0.5
    const relY = (e.clientY - rect.top) / rect.height - 0.5

    gsap.to(el, {
      x: relX * MAX_OFFSET * 2,
      y: relY * MAX_OFFSET,
      duration: 0.5,
      ease: 'power3.out',
      overwrite: 'auto',
    })

    // 方向性填充：从指针进入的那一侧展开
    el.style.setProperty('--fill-origin', relX < 0 ? 'left center' : 'right center')
  }

  const handleLeave = () => {
    const el = rootRef.current
    if (!el || !magnetEnabled) return
    gsap.to(el, { x: 0, y: 0, duration: 0.75, ease: 'power3.out', overwrite: 'auto' })
  }

  const classes = [
    styles.btn,
    styles[variant],
    styles[size],
    full ? styles.full : '',
    disabled ? styles.disabled : '',
    className,
  ]
    .filter(Boolean)
    .join(' ')

  const inner = (
    <>
      <span className={styles.fill} aria-hidden="true" />
      <span className={styles.sweep} aria-hidden="true" />
      <span className={styles.corners} aria-hidden="true">
        <i /> <i /> <i /> <i />
      </span>
      {arrow && (
        <span className={styles.arrow} aria-hidden="true">
          <ArrowRight size={14} strokeWidth={2.2} />
        </span>
      )}
      <span className={styles.label}>{children}</span>
    </>
  )

  const shared = {
    className: classes,
    onPointerMove: handleMove,
    onPointerLeave: handleLeave,
    'aria-label': ariaLabel,
    'data-cursor': disabled ? 'disabled' : cursorLabel ? 'label' : 'link',
    'data-cursor-label': cursorLabel,
    style: accent ? { ['--btn-accent' as string]: accent } : undefined,
  }

  if (to && !disabled) {
    return (
      <Link
        {...shared}
        to={to}
        ref={rootRef as React.Ref<HTMLAnchorElement>}
        onClick={onClick}
      >
        {inner}
      </Link>
    )
  }

  if (href && !disabled) {
    return (
      <a
        {...shared}
        href={href}
        download={download || undefined}
        target={newTab ? '_blank' : undefined}
        rel={newTab ? 'noreferrer noopener' : undefined}
        ref={rootRef as React.Ref<HTMLAnchorElement>}
        onClick={onClick}
      >
        {inner}
      </a>
    )
  }

  return (
    <button
      {...shared}
      type={type}
      disabled={disabled}
      onClick={onClick}
      ref={rootRef as React.Ref<HTMLButtonElement>}
    >
      {inner}
    </button>
  )
}
