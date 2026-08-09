import styles from './StatusBadge.module.css'

export type BadgeTone = 'neutral' | 'lime' | 'purple' | 'orange' | 'pink'

interface StatusBadgeProps {
  label: string
  tone?: BadgeTone
  /** 是否显示呼吸状态灯 */
  live?: boolean
  className?: string
}

/** 统一的状态标签：等宽字 + 状态灯。颜色不是唯一信息载体，文字本身已说明状态。 */
export function StatusBadge({
  label,
  tone = 'neutral',
  live = false,
  className = '',
}: StatusBadgeProps) {
  return (
    <span className={`${styles.badge} ${styles[tone]} ${className}`}>
      <i className={`${styles.dot} ${live ? styles.live : ''}`} aria-hidden="true" />
      <span className={styles.text}>{label}</span>
    </span>
  )
}
