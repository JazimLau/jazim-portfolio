import { lt } from './i18n'
import type { IndexNode, IndexStat, NavItem } from './types'
import { timeline } from './timeline'
import { skillSystems } from './skills'
import { projects } from './projects'
import { profile, maskPhone, maskWechat } from './profile'

/* 各节点卡面的精简内容标签直接从对应模块的数据算出来，
   而不是写死数字 —— 履历 / 能力 / 项目库的条目数会变，这样永远对得上。 */
const missionCount = timeline.filter((e) => e.kind === 'MISSION').length
const trainingCount = timeline.filter((e) => e.kind === 'TRAINING').length
const skillNodeCount = skillSystems.reduce((sum, s) => sum + s.nodes.length, 0)
const featuredCount = projects.filter((p) => p.featured).length
const caseCount = projects.reduce((sum, p) => sum + (p.cases?.length ?? 0), 0)

/** 顶部导航：7 项。导航文字双语 —— CN 下显示中文（附英文小字副标），EN 下保持英文系统语言 */
export const navItems: NavItem[] = [
  { id: 'home', index: '01', label: lt('主页', 'HOME'), target: 'home' },
  { id: 'index', index: '02', label: lt('索引', 'INDEX'), target: 'index' },
  { id: 'profile', index: '03', label: lt('角色档案', 'PROFILE'), target: 'profile' },
  {
    id: 'timeline',
    index: '04',
    label: lt('角色经历', 'TIMELINE'),
    target: 'timeline',
  },
  { id: 'skills', index: '05', label: lt('技能', 'SKILLS'), target: 'skills' },
  { id: 'projects', index: '06', label: lt('项目', 'PROJECTS'), target: 'projects' },
  { id: 'contact', index: '07', label: lt('联系我', 'CONTACT'), target: 'contact' },
]

/**
 * Index 模块的 6 个系统节点。
 * 每个节点对应一个区块；PROJECTS 节点进入精选项目区，
 * 精选项目再通过 VIEW CASE 展开各产品 / 环境的子层级案例。
 */
export const indexNodes: IndexNode[] = [
  {
    id: 'node-home',
    index: '01',
    label: lt('主页', 'HOME'),
    target: 'home',
    iconKey: 'home',
    brief: lt(
      '站点入口。动效系统启动序列与作品监视器。',
      'Entry point. Motion system boot sequence and showreel monitor.'
    ),
    preview: [lt('作品 Showreel 监视器', 'Showreel monitor'), lt('3 个入口动作', '3 entry actions')],
  },
  {
    id: 'node-profile',
    index: '02',
    label: lt('角色档案', 'PROFILE'),
    target: 'profile',
    iconKey: 'profile',
    brief: lt(
      '角色档案。身份定位、能力描述与工具链。',
      'Character profile. Identity, ability description and toolset.'
    ),
    preview: [
      lt('具体软件 + 能力状态', 'Per-software proficiency'),
      lt('能力标签 + 工具链', 'Ability tags + toolchain'),
    ],
  },
  {
    id: 'node-timeline',
    index: '03',
    label: lt('角色经历', 'TIMELINE'),
    target: 'timeline',
    iconKey: 'timeline',
    brief: lt(
      '任务日志。2021 年至今的实习与项目培训记录。',
      'Mission log. Internships and project training from 2021 to now.'
    ),
    preview: [
      lt(`${timeline.length} 段履历记录`, `${timeline.length} timeline entries`),
      lt(`${missionCount} 段实习 + ${trainingCount} 段培训`, `${missionCount} internships + ${trainingCount} training`),
    ],
  },
  {
    id: 'node-skills',
    index: '04',
    label: lt('技能', 'SKILLS'),
    target: 'skills',
    iconKey: 'skills',
    brief: lt(
      '能力矩阵。六个系统，可反向筛选项目数据库。',
      'Ability matrix. Six systems, filterable against the project database.'
    ),
    preview: [
      lt(`${skillSystems.length} 大能力系统`, `${skillSystems.length} ability systems`),
      lt(`${skillNodeCount}+ 项能力节点`, `${skillNodeCount}+ skill nodes`),
    ],
  },
  {
    id: 'node-projects',
    index: '05',
    label: lt('项目', 'PROJECTS'),
    target: 'projects',
    iconKey: 'projects',
    brief: lt(
      '精选项目。雷火产品动效、游戏UI动效与视频设计三大方向;视频设计下设游戏广告视频、游戏宣发视频、游戏社媒视频三个模块,子层级案例按产品/环境展开。',
      'Selected missions. Leihuo off-client motion, game UI motion and video design — video design splits into game ad films, promotion films and social videos, with sub-level cases per product / environment.'
    ),
    preview: [
      lt(`${featuredCount} 个精选方向`, `${featuredCount} featured directions`),
      lt(`${caseCount} 个子层级案例`, `${caseCount} sub-level cases`),
    ],
  },
  {
    id: 'node-contact',
    index: '06',
    label: lt('联系我', 'CONTACT'),
    target: 'contact',
    iconKey: 'contact',
    brief: lt(
      '建立连接。邮箱、手机、简历与合作渠道。',
      'Establish connection. Email, phone, CV and collaboration channels.'
    ),
    preview: [
      lt(profile.email, profile.email),
      lt(`${maskPhone(profile.phone)}`, `${maskPhone(profile.phone)}`),
      lt(`微信 ${maskWechat(profile.wechat)}`, `WeChat ${maskWechat(profile.wechat)}`),
    ],
  },
]

/* ---------- Index 模块核心数据总览（6 项数字面板，最新版简历口径） ---------- */

export const indexStats: IndexStat[] = [
  {
    id: 'stat-internships',
    index: 'D-01',
    value: lt('03', '03'),
    label: lt('网易相关实习', 'NETEASE INTERNSHIPS'),
    note: lt(
      '市场营销 / 品牌公关 / 雷火媒体创意',
      'Marketing / Brand PR / Leihuo Media Creative'
    ),
    accent: 'lime',
  },
  {
    id: 'stat-projects',
    index: 'D-02',
    value: lt('14', '14'),
    label: lt('雷火项目', 'LEIHUO PROJECTS'),
    note: lt(
      '端内及端外游戏动效项目',
      'In-game and off-client game motion projects'
    ),
    accent: 'purple',
  },
  {
    id: 'stat-draft',
    index: 'D-03',
    value: lt('95%', '95%'),
    label: lt('一稿过率', 'FIRST-DRAFT PASS'),
    note: lt(
      '项目常规需求一稿通过率',
      'First-draft pass rate for routine project requests'
    ),
    accent: 'blue',
  },
  {
    id: 'stat-views',
    index: 'D-04',
    value: lt('2200W+', '22M+'),
    label: lt('累计播放量', 'TOTAL VIDEO VIEWS'),
    note: lt('官号相关历史内容累计播放', 'Cumulative views across official-account content'),
    accent: 'orange',
  },
  {
    id: 'stat-motion',
    index: 'D-05',
    value: lt('65+', '65+'),
    label: lt('动效资源', 'MOTION ASSETS'),
    note: lt(
      '雷火期间累计输出动效及动态视觉资源',
      'Motion & dynamic-visual assets delivered at Leihuo'
    ),
    accent: 'lime',
  },
  {
    id: 'stat-preview',
    index: 'D-06',
    value: lt('06', '06'),
    label: lt('UI 动效预演', 'UI MOTION PREVIEWS'),
    note: lt('游戏内 UI 动效预演', 'In-game UI motion previews'),
    accent: 'purple',
  },
]
