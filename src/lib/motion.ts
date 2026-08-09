/* =========================================================================
   lib/motion.ts — 动效参数规范
   spec 第十六节的参数集中在这里。所有区块引用同一套时长与缓动，
   保证"每个模块动态语言不同，但整体节奏统一"。
   禁用 bounce / elastic / back，避免廉价弹跳感。
   ========================================================================= */

export const EASE = {
  /** 主标题：收尾极缓，力量感来自位移幅度而非回弹 */
  title: 'power4.out',
  /** 卡片与常规元素 */
  element: 'power3.out',
  /** 图片、视频揭示 */
  media: 'expo.out',
  /** 进出场对称的转场 */
  transition: 'power3.inOut',
  /** Opening 使用 */
  opening: 'power4.out',
  openingInOut: 'power3.inOut',
} as const

export const DUR = {
  titleIn: 1.5,
  titleInSlow: 1.8,
  element: 1.15,
  media: 1.7,
  quick: 0.5,
  transition: 0.75,
} as const

export const STAGGER = {
  chars: 0.03,
  cards: 0.14,
  tags: 0.06,
  lines: 0.1,
} as const

/** 章节大标题的初始状态：大幅位移 + 横向压缩 + clip-path 收拢 */
export const TITLE_FROM = {
  xPercent: -24,
  scaleX: 0.66,
  clipPath: 'inset(0% 100% 0% 0%)',
} as const

export const TITLE_TO = {
  xPercent: 0,
  scaleX: 1,
  clipPath: 'inset(0% 0% 0% 0%)',
  duration: DUR.titleIn,
  ease: EASE.title,
} as const

/** ScrollTrigger 的通用触发点：元素进入视口下方 82% 时开始 */
export const TRIGGER = {
  start: 'top 82%',
  startLate: 'top 70%',
  once: true,
} as const

/** 统一的媒体揭示：斜切遮罩 + 轻微放大回正 */
export const MEDIA_REVEAL_FROM = {
  clipPath: 'polygon(0 0, 0 0, 0 100%, 0 100%)',
  scale: 1.14,
} as const

export const MEDIA_REVEAL_TO = {
  clipPath: 'polygon(0 0, 100% 0, 100% 100%, 0 100%)',
  scale: 1,
  duration: DUR.media,
  ease: EASE.media,
} as const
