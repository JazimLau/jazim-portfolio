import { lt } from './i18n'
import type { LT } from './i18n'
import type { AbilityBlock } from './types'

/**
 * 私密联系方式（邮箱 / 手机 / 微信）通过构建环境变量注入，源码只保留占位符：
 *   VITE_CONTACT_EMAIL / VITE_CONTACT_PHONE / VITE_CONTACT_WECHAT
 * - 本地真实值放 .env.local 与 .env.github.local（均被 .gitignore 忽略，不入库）；
 * - GitHub Actions 从仓库 Secrets（CONTACT_EMAIL / CONTACT_PHONE / CONTACT_WECHAT）注入；
 * - 未注入时回落为占位，保证页面结构正常且不泄露真实信息。
 */
const CONTACT = {
  email: import.meta.env.VITE_CONTACT_EMAIL || 'your-email@example.com',
  phone: import.meta.env.VITE_CONTACT_PHONE || '+86 138 **** ****',
  wechat: import.meta.env.VITE_CONTACT_WECHAT || 'AVAILABLE ON REQUEST',
}

/** 个人基础信息。修改姓名、职位、文案、联系方式都在这里。 */
export const profile = {
  name: '刘俊熙',
  nameEn: 'Liu Junxi',
  build: 'V.2027',
  initials: 'JL',

  /** 首页核心职位（英文代号，两种语言下都保持一致） */
  roleEn: 'GAME MOTION · VIDEO DESIGN',
  roleZh: lt('游戏动效 · 视频设计作品集', 'Game Motion & Video Design Portfolio'),

  /** Hero 顶部小标题 */
  kicker: 'PLAYER PROFILE / 2027',

  /** 个人定位 */
  positioning: lt(
    '专注游戏UI动效、端外产品动态设计与视频视觉表达，尝试将视觉风格、交互反馈和技术落地整合为完整的动态体验。',
    'Focused on game UI motion, off-client product motion design and video visual storytelling — bringing visual style, interaction feedback and technical delivery together into one coherent motion experience.'
  ),
  positioningShort: lt(
    '专注游戏UI动效、端外产品动态设计与视频视觉表达。',
    'Game UI motion, off-client product motion design and video visual storytelling.'
  ),

  /** 游戏感英文辅助文案 */
  taglineEn: 'DESIGNING MOTION FOR PLAYABLE EXPERIENCES',
  taglineEnAlt: 'TURNING STATIC INTERFACES INTO RESPONSIVE GAME EXPERIENCES',

  disciplines: ['GAME MOTION', 'UI MOTION', 'VIDEO DESIGN', 'REAL-TIME PRACTICE'],

  /** 当前身份 */
  identities: [
    lt('游戏动效设计师 / 视频设计师', 'Game Motion Designer / Video Designer'),
    lt('网易雷火动效实习生', 'Motion Design Intern at NetEase Leihuo'),
    lt('澳门城市大学设计学硕士在读', 'MA Design candidate, City University of Macau'),
    lt('2027届学生', 'Class of 2027'),
  ],

  /** Hero 状态标签（英文系统语言，不翻译） */
  statuses: [
    { label: 'MOTION SYSTEM ONLINE', tone: 'lime' as const },
    { label: 'STUDENT / INTERN', tone: 'neutral' as const },
    { label: 'BASED IN GBA', tone: 'neutral' as const },
    { label: 'GRADUATING 2027', tone: 'neutral' as const },
    { label: 'AVAILABLE FOR OPPORTUNITIES', tone: 'purple' as const },
  ],

  /** Hero 底部状态栏 */
  heroStatusBar: [
    'SYSTEM ONLINE',
    'MOTION DESIGN',
    'UI / VIDEO / VFX',
    'UPDATED 2026',
    'SCROLL TO EXPLORE',
  ],

  email: CONTACT.email,

  /**
   * 手机号。默认在页面上以掩码显示，点击才展开完整号码。
   */
  phone: CONTACT.phone,

  /** 微信 ID。默认隐藏，点击后才显露完整 ID。 */
  wechat: CONTACT.wechat,
  location: lt('大湾区 / 澳门', 'Greater Bay Area / Macau'),
  school: lt('澳门城市大学 · 设计学硕士在读', 'City University of Macau · MA Design'),

  /** 简历文件路径。相对路径：构建产物支持 file:// 直接双击打开。文件暂缺时按钮结构保留，点击给出提示。 */
  cvPath: './assets/files/Jazim-Lau-CV.pdf',
} as const

/** Profile 区块简介（两段） */
export const profileIntro = [
  lt(
    '我是刘俊熙，一名专注游戏UI动效、端外页面动态设计与视频视觉表达的学生设计师。目前在网易雷火参与官网、H5、小程序及游戏UI动效相关项目。',
    'I am Jazim Lau, a student designer focused on game UI motion, off-client page motion design and video visual storytelling. I currently work at NetEase Leihuo on official sites, H5 campaigns, mini-programs and in-game UI motion.'
  ),
  lt(
    '我擅长从需求和静态设计稿出发，拆解动态表现、梳理动画节奏、补充及拆分视觉素材，并将最终动效整理为可供前端或引擎接入的资源。',
    'I work from requirements and static comps: breaking down how motion should behave, shaping timing and hierarchy, extending and splitting the visual assets, then packaging the result into resources that front-end or engine teams can implement directly.'
  ),
]

/** 档案页左上角：系统档案式信息区（业务坐标 / 工作维度 / 当前阶段 / 交付特征 / 技术延展 / 协作方式） */
export const classInfo: { key: LT; value: LT }[] = [
  {
    key: lt('业务坐标', 'Coordinates'),
    value: lt('游戏UI动效 · KV动效 · 页面交互动效 · 视频动态包装', 'Game UI motion · KV · Interaction · Video packaging'),
  },
  {
    key: lt('工作维度', 'Scope'),
    value: lt('官网 / H5 / 小程序 / 游戏UI / 视频设计 / 素材处理 / 动效交付', 'Site / H5 / Mini-program / Game UI / Video / Asset / Delivery'),
  },
  {
    key: lt('当前阶段', 'Stage'),
    value: lt('网易雷火动效实习 · 设计学硕士在读', 'Leihuo motion intern · MA Design'),
  },
  {
    key: lt('技术延展', 'Extending'),
    value: lt('UE5 / Unity / 实时特效 / AIGC 工作流', 'UE5 / Unity / Real-time VFX / AIGC workflow'),
  },
  {
    key: lt('协作方式', 'Collaboration'),
    value: lt(
      '跨团队协作 · 需求对齐与项目推进',
      'Cross-team collaboration · Alignment and delivery'
    ),
  },
]

/** 具体能力描述 */
export const abilityBlocks: AbilityBlock[] = [
  {
    index: '01',
    title: lt('动效设计', 'Motion Design'),
    titleEn: 'MOTION DESIGN',
    body: lt(
      '围绕界面功能、视觉风格和场景氛围设计动态表现，完成界面入场、状态切换、按钮反馈、KV主视觉、Slogan及局部特效。',
      'Designing motion around interface function, visual style and scene atmosphere — screen entrances, state changes, button feedback, key-visual animation, slogan reveals and localised effects.'
    ),
  },
  {
    index: '02',
    title: lt('素材处理', 'Asset Production'),
    titleEn: 'ASSET PRODUCTION',
    body: lt(
      '完成切图、补图、素材拆分、图层整理、透明通道处理、序列帧输出及前端资源适配。',
      'Slicing, repainting missing areas, splitting assets, organising layers, handling alpha channels, exporting frame sequences and adapting resources for front-end use.'
    ),
  },
  {
    index: '03',
    title: lt('视频设计', 'Video Design'),
    titleEn: 'VIDEO DESIGN',
    body: lt(
      '参与游戏宣发视频、广告视频、新媒体社媒视频的动态设计、剪辑、合成及包装。',
      'Motion design, editing, compositing and graphic packaging for game promotion films, advertising spots and social-media content.'
    ),
  },
  {
    index: '04',
    title: lt('引擎与三维', 'Engine & 3D'),
    titleEn: 'ENGINE & 3D',
    body: lt(
      '使用Blender、UE5及Unity完成基础模型处理、材质表现验证、界面动效和实时特效练习。',
      'Using Blender, UE5 and Unity for basic model work, material validation, interface motion and real-time VFX studies.'
    ),
  },
  {
    index: '05',
    title: lt('AIGC辅助制作', 'AIGC Workflow'),
    titleEn: 'AIGC WORKFLOW',
    body: lt(
      '将AI工具用于素材生成、方案验证、动态参考和前期预演，提高创意探索和制作效率。',
      'Using AI tools for asset generation, concept validation, motion reference and previsualisation to speed up exploration and production.'
    ),
  },
]

/** 工具链：文字 + 图标展示。state 为熟练状态（PROFICIENT/WORKING/PRACTICE/LEARNING），不使用百分比。
    命名统一：Unreal Engine 5（标签可用 UE5）；引擎能力不标 PROFICIENT。 */
export const tools: { name: string; role: string; state: string }[] = [
  { name: 'After Effects', role: 'MOTION', state: 'PROFICIENT' },
  { name: 'Photoshop', role: 'ASSET', state: 'PROFICIENT' },
  { name: 'Premiere Pro', role: 'VIDEO', state: 'PROFICIENT' },
  { name: 'Figma', role: 'UI', state: 'LEARNING' },
  { name: 'Blender', role: '3D', state: 'PRACTICE' },
  { name: 'Unreal Engine 5', role: 'ENGINE', state: 'PRACTICE' },
  { name: 'Unity', role: 'ENGINE', state: 'PRACTICE' },
  { name: 'Seedance', role: 'AIGC', state: 'PRACTICE' },
  { name: 'Viggle', role: 'AIGC', state: 'PRACTICE' },
  { name: 'NanoBanana', role: 'AIGC', state: 'PRACTICE' },
  { name: 'ComfyUI', role: 'AIGC', state: 'LEARNING' },
  { name: 'Midjourney', role: 'AIGC', state: 'LEARNING' },
]

/** PLAYER DATA 档案面板：字段标签与值均双语 → 显示值（中文模式全中文，英文模式全英文） */
export const playerData: { code: string; label: LT; value: LT }[] = [
  {
    code: 'PLAYER ID',
    label: lt('档案编号', 'Player ID'),
    value: lt('JL-2027', 'JL-2027'),
  },
  {
    code: 'NAME',
    label: lt('姓名', 'Name'),
    value: lt(profile.name, profile.nameEn),
  },
  {
    code: 'PRIMARY CLASS',
    label: lt('角色定位', 'Primary class'),
    value: lt('游戏动效设计师', 'Game Motion Designer'),
  },
  {
    code: 'SECONDARY CLASS',
    label: lt('次要方向', 'Secondary class'),
    value: lt('视频设计师', 'Video Designer'),
  },
  {
    code: 'POSITION',
    label: lt('当前身份', 'Current position'),
    value: lt('雷火动效实习生', 'Motion Intern @ Leihuo'),
  },
  {
    code: 'EDUCATION',
    label: lt('教育背景', 'Education'),
    value: lt('澳门城市大学 · 设计学硕士', 'City University of Macau · MA Design'),
  },
  {
    code: 'SPECIALIZATION',
    label: lt('专长方向', 'Specialization'),
    value: lt('游戏UI动效 / KV / 特效', 'Game UI Motion / KV / VFX'),
  },
  {
    code: 'STATUS',
    label: lt('当前状态', 'Status'),
    value: lt('活跃', 'Active'),
  },
  {
    code: 'AVAILABILITY',
    label: lt('可联系状态', 'Availability'),
    value: lt('可联系', 'Available'),
  },
  {
    code: 'BUILD',
    label: lt('版本编号', 'Build'),
    value: lt(profile.build, profile.build),
  },
]

/** 把手机号做成掩码：+86 138 0000 0000 → +86 138 **** **** */
export function maskPhone(phone: string): string {
  const parts = phone.trim().split(/\s+/)
  if (parts.length < 3) return phone.replace(/\d(?=\d{4})/g, '*')
  return parts.map((p, i) => (i < 2 ? p : p.replace(/\d/g, '*'))).join(' ')
}

/** 把微信 ID 做成掩码：wxid_abc… → wxid_************ */
export function maskWechat(id: string): string {
  const i = id.indexOf('_')
  if (i < 0) return id.replace(/[\w\d]/g, '*')
  return id.slice(0, i + 1) + '*'.repeat(id.length - i - 1)
}
