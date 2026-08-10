import { useUI } from '../../context/UIContext'
import { useReducedMotion } from '../../hooks/useReducedMotion'
import styles from './SystemDivider.module.css'

/**
 * SystemDivider —— 全站统一"系统分割带"。
 * 上层：当前模块状态标签（身份 / 状态灯 / 状态文案）
 * 下层：页面方向、当前模块关键词、滚动提示
 * 像素风：分段线 + 方形状态灯 + 断续轨道 + 系统编号 + 低频扫描。
 * 每个区块使用不同文案，复用同一组件。
 */

export type DividerVariant =
  | 'index'
  | 'profile'
  | 'timeline'
  | 'skills'
  | 'projects'
  | 'contact'

interface DividerConfig {
  code: string
  upper: [string, string][]
  lower: [string, string][]
}

const CONFIG: Record<DividerVariant, DividerConfig> = {
  index: {
    code: 'SYS-02',
    upper: [
      ['索引系统在线', 'INDEX ONLINE'],
      ['05 个模块', '05 MODULES'],
      ['数据已载入', 'DATA LOADED'],
    ],
    lower: [
      ['选择模块进入', 'Select a module to enter'],
      ['模块数据总控台', 'MODULE CONSOLE'],
      ['向下浏览', 'SCROLL'],
    ],
  },
  profile: {
    code: 'SYS-03',
    upper: [
      ['档案系统在线', 'PROFILE ONLINE'],
      ['角色资料已载入', 'DATA LOADED'],
      ['能力档案已载入', 'ABILITIES LOADED'],
    ],
    lower: [
      ['继续查看履历记录', 'View timeline'],
      ['档案扫描系统', 'FILE SCAN'],
      ['向下浏览', 'SCROLL'],
    ],
  },
  timeline: {
    code: 'SYS-04',
    upper: [
      ['履历记录在线', 'LOG ONLINE'],
      ['当前节点已激活', 'NODE ACTIVE'],
      ['记录同步完成', 'SYNCED'],
    ],
    lower: [
      ['向下查看其他经历', 'View more entries'],
      ['任务路径', 'MISSION PATH'],
      ['向下浏览', 'SCROLL'],
    ],
  },
  skills: {
    code: 'SYS-05',
    upper: [
      ['能力矩阵在线', 'MATRIX ONLINE'],
      ['节点已连接', 'NODES LINKED'],
      ['当前分类已激活', 'ACTIVE'],
    ],
    lower: [
      ['继续查看能力系统', 'View ability systems'],
      ['能力网络', 'SKILL NETWORK'],
      ['向下浏览', 'SCROLL'],
    ],
  },
  projects: {
    code: 'SYS-05',
    upper: [
      ['项目数据库在线', 'DB ONLINE'],
      ['当前项目已载入', 'PROJECT LOADED'],
      ['预览系统就绪', 'PREVIEW READY'],
    ],
    lower: [
      ['滚动或切换项目', 'Scroll or switch project'],
      ['任务终端', 'MISSION TERMINAL'],
      ['向下浏览', 'SCROLL'],
    ],
  },
  contact: {
    code: 'SYS-06',
    upper: [
      ['通讯系统在线', 'COMM ONLINE'],
      ['联系通道可用', 'CHANNELS OPEN'],
      ['合作状态开放', 'OPEN FOR WORK'],
    ],
    lower: [
      ['返回顶部', 'Back to top'],
      ['通讯终端', 'COMM TERMINAL'],
      ['向上返回', 'BACK TO TOP'],
    ],
  },
}

export function SystemDivider({ variant }: { variant: DividerVariant }) {
  const { t } = useUI()
  const reduced = useReducedMotion()
  const cfg = CONFIG[variant]

  return (
    <div className={styles.divider} data-variant={variant} aria-hidden="true">
      {/* 上部像素分段线 + 状态标签 */}
      <div className={styles.upper}>
        <span className={styles.rule} aria-hidden="true" />
        {cfg.upper.map(([cn, en]) => (
          <span key={cn} className={styles.tag}>
            <i className={styles.light} />
            {t(cn, en)}
          </span>
        ))}
        <span className={styles.code}>{cfg.code}</span>
      </div>

      {/* 下部断续轨道 + 方向提示 */}
      <div className={styles.lower}>
        <span className={`${styles.track} ${reduced ? '' : styles.trackLive}`}>
          <i className={styles.trackPulse} />
        </span>
        <div className={styles.hints}>
          {cfg.lower.map(([cn, en]) => (
            <span key={cn} className={styles.hint}>
              <i className={styles.hintDot} />
              {t(cn, en)}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}
