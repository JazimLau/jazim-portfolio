import { lt, type LT } from './i18n'

// Concise editorial summaries of the existing case descriptions in projects.ts.
// These describe design intent, not measured user-research outcomes.
export const rationales: Record<string, { label: LT; text: LT }[]> = {
  'leihuo-external-motion-system': [
    { label: lt('目标', 'Goal'), text: lt('在既有视觉稿上建立信息层级，让主视觉与关键操作被看见。', 'Build hierarchy on the existing visual design so the key visual and primary actions stand out.') },
    { label: lt('问题', 'Problem'), text: lt('官网、H5 与小程序的尺寸、资源预算和实现方式不同。', 'Sites, H5 campaigns and mini-programs differ in dimensions, asset budgets and implementation.') },
    { label: lt('判断', 'Decision'), text: lt('氛围服务内容与操作；动效复杂度需要服从性能和交付要求。', 'Atmosphere supports content and action; motion complexity follows performance and delivery constraints.') },
    { label: lt('动态策略', 'Motion strategy'), text: lt('拆解主视觉与反馈层 → AE 预演 → 分层输出与多端适配 → 上线走查。', 'Separate key visuals and feedback → AE previs → Layered export and device adaptation → Launch QA.') },
  ],
  'dialogue-wheel-previs': [
    { label: lt('目标', 'Goal'), text: lt('让选项、角色与轮盘共同表达角色形成思路的过程。', 'Connect options, the character and the wheel to express a thought taking shape.') },
    { label: lt('问题', 'Problem'), text: lt('多项选项与轮盘演出需要保持统一的视觉语言与清楚的确认反馈。', 'Multiple options and the wheel sequence need a shared visual language and clear confirmation feedback.') },
    { label: lt('判断', 'Decision'), text: lt('以思绪线串联交互；亮白保留选中逻辑，金色承担关键确认。', 'Use thought lines to connect interactions; keep white for selection and gold for key confirmation.') },
    { label: lt('动态策略', 'Motion strategy'), text: lt('角色对话 → 六项选项状态 → 思绪收束 → 轮盘生成与旋转 → 结果反馈。', 'Dialogue → Six option states → Thought convergence → Wheel formation and spin → Result feedback.') },
  ],
  'dialogue-wheel-whitebox': [
    { label: lt('目标', 'Goal'), text: lt('验证 AE 预演方案能否成为可操作的实时交互。', 'Validate that the AE previs can become an interactive real-time system.') },
    { label: lt('问题', 'Problem'), text: lt('线性时间轴无法直接处理玩家输入与控件状态。', 'A linear timeline alone cannot handle player input and widget states.') },
    { label: lt('判断', 'Decision'), text: lt('先验证 UMG 与蓝图中的状态和事件链路，再扩展视觉特效。', 'Validate UMG states and Blueprint events before expanding visual effects.') },
    { label: lt('动态策略', 'Motion strategy'), text: lt('对话结束开放 Check → 悬停 / 确认选项 → 启动轮盘 → 随机结果与加成反馈。', 'Dialogue unlocks Check → Option hover / confirm → Start wheel → Random result and bonus feedback.') },
  ],
}
