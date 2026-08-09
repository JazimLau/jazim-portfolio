/**
 * 项目状态 / 成果指标标签 → 中文名（中文模式下展示）。
 * ProjectDetailPage 与 ProjectCard 共用，避免两处重复定义。
 */

/** 项目状态 → 中文名（中文模式下展示） */
export const PROJECT_STATUS_CN: Record<string, string> = {
  ONGOING: '进行中',
  DELIVERED: '已交付',
  STUDY: '练习中',
  ARCHIVE: '已归档',
  LEARNING: '持续更新',
}

/** 成果指标标签 → 中文名（中文模式下展示） */
export const METRIC_CN: Record<string, string> = {
  PROJECTS: '项目数',
  'MOTION ASSETS': '动效资源',
  'ON-TIME': '按期交付',
  FIDELITY: '还原度',
  STUDIES: '练习数',
  FOCUS: '专注方向',
  ENGINE: '引擎',
  CONTENTS: '内容数',
  COMPLETION: '完播率',
  VIEWS: '播放量',
  LIKES: '点赞量',
  /* 雷火一级任务数据（最新版简历口径） */
  'MOTION MODULES': '动态模块',
  LAUNCHED: '已上线',
  'UI PREVIEWS': 'UI 预演',
  'AIGC PROJECTS': 'AIGC 项目',
  'FIRST-DRAFT PASS': '一稿过率',
  /* 社媒 / 宣发一级指标 */
  'SELECTED CASES': '精选案例',
  'CONTENT PRODUCED': '参与内容',
  'TOTAL VIEWS': '累计播放',
  'TOTAL LIKES': '累计点赞',
  /* 产品级任务数据：数量动态计算，其余为状态型信息（不虚构百分比） */
  'CASE COUNT': '项目案例',
  'MAIN TYPE': '主要类型',
  DELIVERY: '交付状态',
  LAUNCH: '上线表现',
}
