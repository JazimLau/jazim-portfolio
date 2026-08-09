/* =========================================================================
   types.ts — 全站内容的数据契约
   所有文案都从 data/ 读取，组件不硬编码内容。
   面向用户的中文文案统一用 LT（见 i18n.ts）承载中英两版。
   ========================================================================= */

import type { LT, MaybeLT } from './i18n'

/** 项目筛选分类。新增分类时同步更新 projects.ts 的 filters 与 skills.ts 的 linkedFilter */
export type ProjectFilterId =
  | 'featured'
  | 'leihuo'
  | 'game-ui'
  | 'video'
  | 'promo'
  | 'ad'
  | 'social'

/** 内容优先级：1 = 雷火端外 / UI 动效（最高权重，卡片最大），3 = 次要内容 */
export type ProjectPriority = 1 | 2 | 3

export type ProjectStatus = 'ONGOING' | 'DELIVERED' | 'STUDY' | 'ARCHIVE' | 'LEARNING'

export interface ProjectMetric {
  /** 等宽代号，始终英文 */
  label: string
  /** 指标值（双语：中文模式显示中文，如「已交付 / DELIVERED」） */
  value: MaybeLT
}

/** 详情页的一个章节。三种呈现方式按需组合：段落 / 列表 / 流程 */
export interface ProjectSection {
  id: string
  /** 英文大标题，始终英文 */
  label: string
  /** 副标题（双语） */
  labelZh: LT
  body?: LT[]
  list?: LT[]
  flow?: LT[]
}

/** 精选项目下的子层级案例（如雷火端外的具体产品 / UI动效的引擎分类） */
export interface ProjectCase {
  id: string
  /** 案例名（双语） */
  name: LT
  /** 产品名（双语，可选）：与案例名不同时（如案例是活动名）显示为「产品名-案例名」 */
  product?: LT
  /** 平台 / 产品标签（双语） */
  meta: LT
  /** 案例描述（双语） */
  description: LT
  /** 英文技术标签 */
  tags: string[]
  /** 完成时间（双语，可选）——缺失时查看器显示项目年份占位 */
  date?: LT
  /** 职责（双语，可选）——缺失时查看器显示占位 */
  role?: LT
  /** 案例作品图集（多张 = 多个页面，左右翻页查看），缺失时查看器显示占位 */
  gallery?: string[]
  /** 案例视频路径（可选），存在时优先展示视频 */
  video?: string
  /** 案例多视频（可选）：存在时查看器用左右箭头在多条视频间切换，优先级高于 gallery */
  videos?: string[]
  /** 案例内按活动展开的项目作品（可选）：存在时子模块页按活动筛选视频，每个活动名下可挂多条视频 */
  works?: CaseWork[]
  /** 案例独立详情（可选）：存在时子项目详情页展示 01—07 完整章节，不再复用父级项目介绍 */
  detail?: CaseDetail
  /** 卡面「类型」（双语，可选）：存在时子案例卡不再复用父级 category */
  projectType?: LT
  /** 卡面「职责」（双语，可选）：存在时子案例卡不再复用父级 role */
  responsibility?: LT[]
  /** 任务数据-主要类型（双语，可选）：任务数据第二格的值，缺省从类型派生 */
  mainType?: LT
  /** 任务数据-交付状态（双语，可选）：缺省「已交付」 */
  deliveryStatus?: LT
  /** 任务数据-上线表现（双语，可选）：缺省随一级模块（雷火=高还原 等） */
  launchStatus?: LT
  /** 状态角标文案（双语，可选）：覆盖卡面状态文字（如 UE 的「持续学习」） */
  statusLabel?: LT
}

/** 子项目独立详情章节。标题可覆盖（如 UE5 的「学习方向 / STUDY FOCUS」、两个引擎实践的「实践内容 / PRACTICE」）；
    delivery 缺省时不展示该章节；studyTech 用于展示「学习技术 / TECH STUDY」。 */
export interface CaseDetail {
  /** 01 项目背景（双语） */
  background: LT
  /** 02 动效目标（双语列表）；标题可覆盖（如 UE5 用「学习方向 / STUDY FOCUS」） */
  objectives: LT[]
  objectivesTitle?: [string, string]
  /** 03 我的职责（双语）；标题可覆盖（如「实践内容 / PRACTICE」） */
  role: LT
  roleTitle?: [string, string]
  /** 04 制作流程（双语步骤列表） */
  process: LT[]
  /** 05 交付方式（双语列表，可选）：缺省则不展示该章节 */
  delivery?: LT[]
  /** 06 最终呈现（双语） */
  result: LT
  /** 07 使用工具（平铺列表） */
  tools: string[]
  /** 学习技术标签（双语，可选）：如 UE5 的「学习技术 / TECH STUDY」 */
  studyTech?: LT[]
  studyTechTitle?: [string, string]
}

/** 案例内的一个活动项目：一个项目名对应一组作品视频（如「仲夏祥瑞」下挂 2 条视频） */
export interface CaseWork {
  id: string
  /** 活动项目名（双语），如 武道大会 / 仲夏祥瑞 */
  name: LT
  /** 该活动的视频列表（m3u8） */
  videos: string[]
  /** 顶部简介（双语，可选）：存在时覆盖案例级 description，使每个子项目顶部简介完全独立 */
  description?: LT
  /** 平台 / 产品标签（双语，可选）：覆盖案例级 meta */
  meta?: LT
  /** 完成时间（双语，可选）：覆盖案例级 date */
  date?: LT
  /** 职责（双语，可选）：覆盖案例级 role */
  role?: LT
  /** 英文技术标签（可选）：覆盖案例级 tags */
  tags?: string[]
  /** 活动项目独立详情（可选）：存在时子项目详情页展示 01—07，不再继承案例/父级介绍 */
  detail?: CaseDetail
}

export interface Project {
  id: string
  slug: string
  /** 显示用序号，例如 '01' */
  index: string
  /** 英文项目名，始终英文 */
  title: string
  /** 中文项目名（双语） */
  titleZh: LT
  /** 卡面上显示的类别文本（双语） */
  category: LT
  /** 参与筛选的分类标签 */
  categories: ProjectFilterId[]
  year: string
  featured: boolean
  priority: ProjectPriority
  status: ProjectStatus
  description: LT
  role: LT[]
  /** 工具名，始终原文 */
  tools: string[]
  /** 工具分组（可选）：存在时详情页 TOOLSET 按组分开展示，否则平铺 tools */
  toolGroups?: {
    /** 分组名（英文代号，如 MAIN / 3D / AIGC） */
    label: string
    /** 分组名中文 */
    labelZh: LT
    items: string[]
  }[]
  /** 卡面技术标签，始终英文 */
  services: string[]
  /** 封面图路径，缺失时组件回落到 CSS 占位背景 */
  cover: string
  /** 预览视频路径，缺失时组件回落到 CSS 占位背景 */
  video: string
  /** 多视频集（可选）：存在时详情页 Hero 用左右箭头在多个视频间切换；缺省回落到 [video] */
  videos?: string[]
  /** 详情页图集，缺失时同样回落占位 */
  gallery: string[]
  metrics: ProjectMetric[]
  sections: ProjectSection[]
  /** 该项目的强调色（CSS 变量名） */
  accent: string
  /** 精选项目的子层级案例：存在时 VIEW CASE 打开案例查看器而非详情页 */
  cases?: ProjectCase[]
  /** 当该展示项是某个子层级案例时，记录其 case id（用于跳转到案例查看器） */
  caseId?: string
  /** 状态角标文案（双语，可选）：覆盖卡面 / 详情页状态文字（如 UE 的「持续学习」） */
  statusLabel?: LT
}

/* ---------- Timeline ---------- */

export interface TimelineEntry {
  id: string
  index: string
  period: string
  org: LT
  role: LT
  dept?: LT
  /** MISSION = 实习经历；TRAINING = 项目培训经历 */
  kind: 'MISSION' | 'TRAINING'
  /** 状态代号，始终英文 */
  status: string
  duties: LT[]
  /** 能力关键词（双语：中文模式显示中文） */
  keywords: LT[]
  results: LT[]
  /** 该经历最值得强调的成果关键词（站点 lime 描边 + 动效强调），会在 duties/results
   *  文案里按子串匹配高亮——不是单独的展示项，双语各自填对应语言里实际出现的词。 */
  highlight?: LT[]
  /** 职责分组（可选）：存在时按组渲染，取代平铺的 duties 列表 */
  dutyGroups?: { code: string; label: LT; items: LT[] }[]
  /** 数据结果卡（可选）：数字在上方、远大于职责文字的统计卡片，存在时取代 results 列表 */
  resultStats?: {
    value: string
    /** 统计卡标签（双语：中文模式显示中文） */
    label: LT
    /** 用于入场/悬停数字刷新的数值，纯文本型可不填 */
    numeric?: number
    suffix?: string
  }[]
}

/** 两类经历在年份列上的显示标签 */
export const TIMELINE_KIND_LABEL: Record<TimelineEntry['kind'], LT> = {
  MISSION: { cn: '实习经历', en: 'INTERNSHIP' },
  TRAINING: { cn: '项目培训经历', en: 'PROJECT TRAINING' },
}

/* ---------- Skills ---------- */

export type SkillState = 'PROFICIENT' | 'PRACTICE' | 'LEARNING'

export interface SkillNode {
  name: LT
  state: SkillState
}

export interface SkillSystem {
  id: string
  index: string
  /** 系统代号，始终英文 */
  code: string
  nameZh: LT
  summary: LT
  /** 该系统整体状态 */
  state: SkillState
  nodes: SkillNode[]
  /** 点击该系统时，Projects 模块过滤到的分类 */
  linkedFilter: ProjectFilterId
  accent: string
}

/* ---------- Profile ---------- */

export interface AbilityBlock {
  index: string
  title: LT
  /** 英文代号，始终英文 */
  titleEn: string
  body: LT
}

/* ---------- 导航 ---------- */

export interface NavItem {
  id: string
  index: string
  /** 导航文字：双语（CN 下显示中文，EN 下显示英文）。
   *  纯字符串时保持英文，如 IndexNode 的英文代号。 */
  label: MaybeLT
  /** 对应页面上的 section id；ARCHIVE 复用 projects 区块并预设筛选 */
  target: string
  filter?: ProjectFilterId
}

export interface IndexNode extends NavItem {
  iconKey: 'home' | 'profile' | 'timeline' | 'skills' | 'projects' | 'contact'
  brief: LT
  /** 卡面精简内容标签（1–2 条），概括该模块内部有什么，不只是图标 + 标题 */
  preview: LT[]
}

/** Index 模块核心数据总览的一条（数字面板） */
export interface IndexStat {
  id: string
  /** 面板序号，例如 'D-01' */
  index: string
  /** 大数字显示（双语：中文 '2200W+' / 英文 '22M+'），例如 '04' / '75+' */
  value: MaybeLT
  /** 数据名（双语） */
  label: LT
  /** 数据构成说明（双语） */
  note: LT
  /** 强调色 */
  accent: 'lime' | 'purple' | 'orange' | 'blue'
}
