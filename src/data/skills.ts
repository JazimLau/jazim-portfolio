import { lt } from './i18n'
import type { SkillSystem } from './types'

/**
 * 能力矩阵：五个系统。
 * 不使用"AE 90%"这类虚假进度条 —— 用 PROFICIENT / PRACTICE / LEARNING 三种状态、
 * 节点数量与关联项目来表达能力深度。
 * linkedFilter 决定点击该系统时 Projects 模块过滤到哪一类。
 */
export const skillSystems: SkillSystem[] = [
  {
    id: 'motion-design',
    index: '01',
    code: 'MOTION DESIGN',
    nameZh: lt('动效设计', 'Motion Design'),
    summary: lt(
      '围绕界面功能、视觉风格与场景氛围建立动态表现，是我的主线能力。',
      'Building motion around interface function, visual style and scene atmosphere — this is my core discipline.'
    ),
    state: 'PROFICIENT',
    linkedFilter: 'game-ui',
    accent: 'var(--accent-lime)',
    nodes: [
      { name: lt('游戏UI动效', 'Game UI motion'), state: 'PRACTICE' },
      { name: lt('KV主视觉动效', 'Key-visual animation'), state: 'PROFICIENT' },
      { name: lt('Slogan动态设计', 'Slogan motion design'), state: 'PROFICIENT' },
      { name: lt('按钮及状态反馈', 'Button and state feedback'), state: 'PROFICIENT' },
      { name: lt('界面入场和转场', 'Screen entrances and transitions'), state: 'PROFICIENT' },
      { name: lt('光效、粒子及氛围设计', 'Light, particle and atmosphere design'), state: 'PRACTICE' },
      { name: lt('动效节奏与层级控制', 'Timing and hierarchy control'), state: 'PROFICIENT' },
      { name: lt('引擎动效画面过渡', 'Engine motion transitions'), state: 'LEARNING' },
      { name: lt('Spine 动效', 'Spine motion'), state: 'LEARNING' },
    ],
  },
  {
    id: 'video-design',
    index: '02',
    code: 'VIDEO DESIGN',
    nameZh: lt('视频设计', 'Video Design'),
    summary: lt(
      '从脚本到成片的动态表达，覆盖宣发、广告与社媒三类内容形态。',
      'Motion storytelling from script to final cut, across promotion films, advertising and social content.'
    ),
    state: 'PROFICIENT',
    linkedFilter: 'ad',
    accent: 'var(--accent-pink)',
    nodes: [
      { name: lt('游戏宣发视频', 'Game promotion films'), state: 'PROFICIENT' },
      { name: lt('游戏广告视频', 'Game advertising video'), state: 'PROFICIENT' },
      { name: lt('新媒体社媒视频', 'Social-media video'), state: 'PROFICIENT' },
      { name: lt('剪辑与节奏设计', 'Editing and pacing'), state: 'PROFICIENT' },
      { name: lt('MG动态包装', 'Motion-graphic packaging'), state: 'LEARNING' },
      { name: lt('KV制作', 'Key-visual production'), state: 'LEARNING' },
      { name: lt('UI类视频动效', 'UI-style motion in video'), state: 'PROFICIENT' },
      { name: lt('动态合成', 'Motion compositing'), state: 'PRACTICE' },
      { name: lt('UE5 阵列变化', 'UE5 array motion'), state: 'LEARNING' },
    ],
  },
  {
    id: 'asset-production',
    index: '03',
    code: 'ASSET PRODUCTION',
    nameZh: lt('素材处理', 'Asset Production'),
    summary: lt(
      '把动效方案落成前端和引擎真正能接的资源，交付环节的可靠性来自这里。',
      'Turning motion concepts into resources front-end and engine teams can actually consume — this is where delivery reliability comes from.'
    ),
    state: 'PROFICIENT',
    linkedFilter: 'leihuo',
    accent: 'var(--accent-orange)',
    nodes: [
      { name: lt('设计稿拆解', 'Breaking down design comps'), state: 'PROFICIENT' },
      { name: lt('切图与补图', 'Slicing and repainting'), state: 'PROFICIENT' },
      { name: lt('图层整理', 'Layer organisation'), state: 'PROFICIENT' },
      { name: lt('透明通道处理', 'Alpha channel handling'), state: 'PRACTICE' },
      { name: lt('序列帧导出', 'Frame sequence export'), state: 'PROFICIENT' },
      { name: lt('前端资源适配', 'Front-end resource adaptation'), state: 'PRACTICE' },
      { name: lt('文件命名与交付检查', 'Naming conventions and delivery checks'), state: 'PROFICIENT' },
    ],
  },
  {
    id: 'engine-3d',
    index: '04',
    code: 'ENGINE & 3D',
    nameZh: lt('引擎与三维', 'Engine & 3D'),
    summary: lt(
      '正在扩展的方向：让动效不止停在合成软件里，而能在实时环境中成立。',
      'An area I am actively expanding: making motion hold up in a real-time environment, not just inside compositing software.'
    ),
    state: 'PRACTICE',
    linkedFilter: 'game-ui',
    accent: 'var(--accent-lime)',
    nodes: [
      { name: lt('UE5基础UI动效', 'UE5 basic UI motion'), state: 'PRACTICE' },
      { name: lt('Sequencer', 'Sequencer'), state: 'PRACTICE' },
      { name: lt('Niagara基础练习', 'Niagara fundamentals'), state: 'LEARNING' },
      { name: lt('Unity UGUI基础', 'Unity UGUI fundamentals'), state: 'PRACTICE' },
      { name: lt('Blender模型处理', 'Blender model work'), state: 'PRACTICE' },
      { name: lt('材质与灯光调整', 'Material and lighting'), state: 'PRACTICE' },
      { name: lt('实时展示效果验证', 'Real-time presentation validation'), state: 'LEARNING' },
      { name: lt('Unity Shader', 'Unity Shader'), state: 'LEARNING' },
      { name: lt('UE Blueprint', 'UE Blueprint'), state: 'LEARNING' },
    ],
  },
  {
    id: 'workflow',
    index: '05',
    code: 'WORKFLOW',
    nameZh: lt('工作流', 'Workflow'),
    summary: lt(
      '从需求到上线的完整链路，决定动效能不能被稳定还原。',
      'The full path from brief to launch — it decides whether motion actually survives implementation.'
    ),
    state: 'PROFICIENT',
    linkedFilter: 'ad',
    accent: 'var(--accent-purple)',
    nodes: [
      { name: lt('需求拆解', 'Requirement breakdown'), state: 'PROFICIENT' },
      { name: lt('动画方案撰写', 'Writing motion specs'), state: 'PROFICIENT' },
      { name: lt('动效预演', 'Motion previsualisation'), state: 'PROFICIENT' },
      { name: lt('AIGC辅助制作', 'AI-assisted production'), state: 'PRACTICE' },
      { name: lt('跨部门协作', 'Cross-team collaboration'), state: 'PROFICIENT' },
      { name: lt('设计、产品、技术对接', 'Design / product / engineering alignment'), state: 'PROFICIENT' },
      { name: lt('上线走查', 'Post-launch QA'), state: 'PROFICIENT' },
      { name: lt('动效还原检查', 'Motion fidelity review'), state: 'PROFICIENT' },
    ],
  },
  {
    id: 'aigc',
    index: '06',
    code: 'AIGC',
    nameZh: lt('AIGC', 'AIGC'),
    summary: lt(
      '把生成式AI接入动效生产链路：视频、图像、拆图、音效、素材调整与提示词优化，压缩创意探索与素材制作成本。',
      'Generative AI inside the motion pipeline: video, image, asset splitting, sound, asset retouching and prompt engineering — cutting exploration and production cost.'
    ),
    state: 'PRACTICE',
    linkedFilter: 'game-ui',
    accent: 'var(--accent-purple)',
    nodes: [
      { name: lt('AI视频生成', 'AI video generation'), state: 'PRACTICE' },
      { name: lt('AI生图', 'AI image generation'), state: 'PRACTICE' },
      { name: lt('AI拆图', 'AI asset splitting'), state: 'PRACTICE' },
      { name: lt('AI音效 / 音乐', 'AI sound / music'), state: 'LEARNING' },
      { name: lt('AI素材调整', 'AI asset retouching'), state: 'PRACTICE' },
      { name: lt('AI提示词优化', 'AI prompt optimisation'), state: 'PRACTICE' },
    ],
  },
]

/** 三种状态的显示定义（状态层级语义统一）：
    PROFICIENT 熟练应用 / PRACTICE 实践中 / LEARNING 学习中 */
export const skillStateMeta = {
  PROFICIENT: { label: 'PROFICIENT', labelZh: lt('熟练应用', 'Proficient'), color: 'var(--accent-purple)' },
  PRACTICE: { label: 'PRACTICE', labelZh: lt('实践中', 'In practice'), color: 'var(--accent-orange)' },
  LEARNING: { label: 'LEARNING', labelZh: lt('学习中', 'Learning'), color: 'var(--accent-lime)' },
} as const
