import type { ReactNode } from 'react'
import styles from './VideoNav.module.css'

interface VideoNavButtonProps {
  /** prev=左箭头（上一个视频），next=右箭头（下一个视频） */
  direction: 'prev' | 'next'
  onClick?: () => void
  disabled?: boolean
  'aria-label'?: string
  children: ReactNode
}

/**
 * 视频预览左右切换箭头按钮 —— Projects 卡片 / Case 详情 / Detail 详情
 * 三处共用的唯一实现，杜绝各页面独立补丁导致的跳位与不一致。
 *
 * 稳定性约束：
 * - 固定 44×44 命中区，box-sizing:border-box、padding:0、display:grid 居中；
 * - 绝对定位 left/right 12px + top:50% + transform:translateY(-50%) 恒定不变，
 *   hover/active/focus 全部重新断言该 transform，按钮框永不位移；
 * - data-video-nav 显式隔离全局 `button:active { transform: translateY(1px) }`
 *   对绝对定位按钮的污染（点击跳位根因）；
 * - hover / press 反馈只作用于内部 .arrowIcon（translateX ±2px / opacity），
 *   绝不改变按钮自身的 transform / width / height / padding / border-width。
 */
export function VideoNavButton({
  direction,
  onClick,
  disabled,
  'aria-label': ariaLabel,
  children,
}: VideoNavButtonProps) {
  return (
    <button
      type="button"
      data-video-nav=""
      className={`${styles.videoNavBtn} ${
        direction === 'prev' ? styles.videoNavBtnPrev : styles.videoNavBtnNext
      }`}
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      data-cursor={disabled ? 'disabled' : 'link'}
    >
      <span className={styles.arrowIcon} aria-hidden="true">
        {children}
      </span>
    </button>
  )
}
