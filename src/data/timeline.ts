import { lt } from './i18n'
import type { TimelineEntry } from './types'

/**
 * 履历 / 任务日志。
 * kind: MISSION = 实习经历，TRAINING = 项目培训经历（显示标签见 types.ts 的 TIMELINE_KIND_LABEL）。
 * 新增经历直接往数组里加对象即可，Timeline 组件按顺序渲染并驱动路径点亮。
 */
export const timeline: TimelineEntry[] = [
  {
    id: 'leihuo',
    index: '01',
    period: '2026.06 — PRESENT',
    org: lt('杭州网易雷火科技有限公司', 'Hangzhou NetEase Leihuo Technology Co., Ltd.'),
    role: lt('动效实习生（精英实习）', 'Motion Design Intern (Elite Internship)'),
    dept: lt('平台创新中心 - 媒体创意部', 'Platform Innovation Center · Media Creative Dept.'),
    kind: 'MISSION',
    status: 'ACTIVE',
    duties: [
      lt('端内及端外游戏动效制作', 'In-game and off-client game motion'),
      lt('KV / Slogan / UI / 页面动态表现', 'KV / Slogan / UI / page dynamics'),
      lt('游戏内 UI 动效预演', 'In-game UI motion previsualisation'),
      lt('动画方案与需求拆解', 'Motion spec and requirement breakdown'),
      lt('三维模型资源处理与展示适配', '3D model asset processing and showcase adaptation'),
      lt('动效资源交付与上线走查', 'Asset delivery and post-launch QA'),
      lt('AIGC 动效素材应用', 'AI-assisted motion asset application'),
    ],
    keywords: [
      lt('UI 动态设计', 'UI MOTION'),
      lt('KV 视觉动效', 'KV MOTION'),
      lt('端内交互', 'IN-GAME UI'),
      lt('H5 动态表现', 'H5 MOTION'),
      lt('3D 资源处理', '3D ASSET'),
      lt('AIGC 工作流', 'AIGC'),
      lt('技术交付', 'DELIVERY'),
      lt('上线走查', 'QA'),
    ],
    /* 职责按两类划分：动效制作（核心产出） / 流程与交付（落地闭环） */
    dutyGroups: [
      {
        code: 'MP',
        label: lt('动效制作', 'MOTION PRODUCTION'),
        items: [
          lt('端内及端外游戏动效制作', 'In-game and off-client game motion'),
          lt('KV / Slogan / UI / 页面动态表现', 'KV / Slogan / UI / page dynamics'),
          lt('游戏内 UI 动效预演', 'In-game UI motion previsualisation'),
          lt('三维模型资源处理与展示适配', '3D model asset processing and showcase adaptation'),
          lt('AIGC 动效素材应用', 'AI-assisted motion asset application'),
        ],
      },
      {
        code: 'WD',
        label: lt('流程与交付', 'WORKFLOW & DELIVERY'),
        items: [
          lt('动画方案与需求拆解', 'Motion spec and requirement breakdown'),
          lt('动效资源交付与上线走查', 'Asset delivery and post-launch QA'),
        ],
      },
    ],
    /* 数据结果卡：主指标（最新版简历口径，数字在上方、远大于职责文字） */
    resultStats: [
      { value: '14', label: lt('项目', 'PROJECTS'), numeric: 14 },
      { value: '83', label: lt('动态模块', 'MOTION MODULES'), numeric: 83 },
      { value: '65', label: lt('动效资源', 'MOTION ASSETS'), numeric: 65 },
      { value: '10', label: lt('上线项目', 'LAUNCHED'), numeric: 10 },
      { value: '06', label: lt('UI 预演', 'UI PREVIEWS'), numeric: 6 },
    ],
    results: [
      lt('支持 14 个项目推进', 'Supported 14 projects'),
      lt('拆解 83 个动态需求模块', 'Broke down 83 motion requirement modules'),
      lt('输出 65 组动效及动态视觉资源', 'Delivered 65 sets of motion & dynamic-visual assets'),
      lt('完成 6 组游戏内 UI 动效预演', 'Completed 6 in-game UI motion previs sets'),
      lt('10 个项目正式上线', '10 projects went live'),
      lt('完成 7 个 AIGC 相关正式项目', 'Delivered 7 AIGC-related official projects'),
      lt('常规需求按期交付率 100%，一稿过率约 95%', '100% on-time delivery, roughly 95% first-draft pass'),
    ],
    /* 项目数量与 AIGC 落地最能体现这段经历的分量 */
    highlight: [lt('项目', 'projects'), lt('交付率', 'delivery')],
  },
  {
    id: 'brand-pr',
    index: '02',
    period: '2025.04 — 2025.07',
    org: lt('网易（杭州）网络有限公司', 'NetEase (Hangzhou) Network Co., Ltd.'),
    role: lt('游戏视频制作实习生', 'Game Video Production Intern'),
    dept: lt('品牌公关部-宣发中心', 'Brand & PR Dept. · Promotion Center'),
    kind: 'MISSION',
    status: 'COMPLETE',
    duties: [
      lt('官号矩阵社媒内容制作', 'Official account matrix social content'),
      lt('创意执行与素材重组', 'Creative execution and footage re-composition'),
      lt('动态包装与视频内 UI 动效', 'Motion packaging and in-video UI motion'),
      lt('游戏节点宣发视频制作', 'Promotion films for game milestones'),
    ],
    keywords: [
      lt('官号内容', 'OFFICIAL SOCIAL'),
      lt('社媒创意', 'SOCIAL CREATIVE'),
      lt('节点宣发', 'GAME PROMO'),
      lt('素材重组', 'FOOTAGE RE-CUT'),
      lt('动态包装', 'MOTION PACKAGE'),
      lt('信息层设计', 'INFO LAYER'),
      lt('热点响应', 'TREND RESPONSE'),
    ],
    /* 职责按两类划分：内容制作（核心产出） / 包装与设计（落地闭环） */
    dutyGroups: [
      {
        code: 'MC',
        label: lt('内容制作', 'CONTENT PRODUCTION'),
        items: [
          lt('官号矩阵社媒内容制作', 'Official account matrix social content'),
          lt('创意执行与素材重组', 'Creative execution and footage re-composition'),
        ],
      },
      {
        code: 'PD',
        label: lt('包装与设计', 'PACKAGING & DESIGN'),
        items: [
          lt('动态包装与视频内 UI 动效', 'Motion packaging and in-video UI motion'),
          lt('游戏节点宣发视频制作', 'Promotion films for game milestones'),
        ],
      },
    ],
    /* 数据结果卡：数字在上方、远大于职责文字，核心数据统一 lime（最新版简历口径） */
    resultStats: [
      { value: '30', label: lt('内容制作', 'CONTENT PIECES'), numeric: 30, suffix: '+' },
      { value: '2200', label: lt('累计播放', 'TOTAL VIEWS'), numeric: 2200, suffix: 'W+' },
      { value: '210', label: lt('累计点赞', 'TOTAL LIKES'), numeric: 210, suffix: 'W+' },
      { value: '13', label: lt('高传播内容', 'HIGH-REACH CONTENT'), numeric: 13, suffix: '+' },
    ],
    results: [
      lt('累计创作 30+ 条内容', '30+ pieces produced'),
      lt('累计播放量 2200W+', '22M+ total views'),
      lt('累计点赞量 210W+', '2.1M+ total likes'),
      lt('13+ 条高传播内容', '13+ high-reach pieces'),
      lt('单条最高播放 467W（4.67M）', '4.67M max views on a single piece'),
      lt('单条最高点赞 43W（430K）', '430K max likes on a single piece'),
    ],
    /* 播放量与高传播内容最能说明这段经历的产出规模 */
    highlight: [lt('播放', 'views'), lt('高传播', 'reach')],
  },
  {
    id: 'marketing',
    index: '03',
    period: '2023.01 — 2023.07',
    org: lt('网易游戏（广州博冠信息科技有限公司）', 'NetEase Games (Guangzhou Boguan Information Technology Co., Ltd.)'),
    role: lt('视频设计实习生', 'Video Design Intern'),
    dept: lt('市场与渠道营销中心-新媒体及渠道营销部-视频设计组', 'Market & Channel Marketing Center · New Media & Channel Marketing Dept. · Video Design Group'),
    kind: 'MISSION',
    status: 'COMPLETE',
    duties: [
      lt('承接 PM / 产品需求及策划脚本', 'Handle PM / product briefs and creative scripts'),
      lt('根据投放目标拆解视频节奏与卖点', 'Break down pacing and selling points per campaign goal'),
      lt('协同平面设计准备视觉素材', 'Prepare visual assets with graphic design'),
      lt('完成剪辑、动态合成和视觉包装', 'Editing, motion compositing and visual packaging'),
      lt('制作广告中的 UI / ICON / 信息层 / 光效 / 转场', 'UI / ICON / info layers / light effects / transitions'),
      lt('根据素材投放反馈优化前 3 秒与核心卖点节奏', 'Optimise the first 3 seconds and key-message pacing from delivery feedback'),
    ],
    keywords: [
      lt('游戏广告', 'GAME ADS'),
      lt('BGC / PUGC', 'BGC / PUGC'),
      lt('KOL 内容', 'KOL CONTENT'),
      lt('素材混剪', 'MIXED EDIT'),
      lt('卖点节奏', 'AD PACING'),
      lt('投放适配', 'AD ADAPTATION'),
      lt('数据反馈', 'DATA FEEDBACK'),
    ],
    /* 职责按两类划分：视频制作（核心产出） / 动效与交付（落地闭环） */
    dutyGroups: [
      {
        code: 'VP',
        label: lt('视频制作', 'VIDEO PRODUCTION'),
        items: [
          lt('承接 PM / 产品需求及策划脚本', 'Handle PM / product briefs and creative scripts'),
          lt('根据投放目标拆解视频节奏与卖点', 'Break down pacing and selling points per campaign goal'),
          lt('协同平面设计准备视觉素材', 'Prepare visual assets with graphic design'),
        ],
      },
      {
        code: 'MD',
        label: lt('动效与交付', 'MOTION & DELIVERY'),
        items: [
          lt('制作广告中的 UI / ICON / 信息层 / 光效 / 转场', 'UI / ICON / info layers / light effects / transitions'),
          lt('完成剪辑、动态合成和视觉包装', 'Editing, motion compositing and visual packaging'),
          lt('根据素材投放反馈优化前 3 秒与核心卖点节奏', 'Optimise the first 3 seconds and key-message pacing from delivery feedback'),
        ],
      },
    ],
    /* 数据结果卡：数字在上方、远大于职责文字，核心数据统一 lime */
    resultStats: [
      { value: '41', label: lt('内容数', 'CONTENT PIECES'), numeric: 41 },
      { value: '54', label: lt('完播率', 'COMPLETION RATE'), numeric: 54, suffix: '%' },
    ],
    results: [
      lt('累计制作41条内容', '41 pieces produced'),
      lt('内容完播率54%', '54% completion rate'),
    ],
    /* 完播率是广告视频最直接的效果指标 */
    highlight: [lt('完播率', 'completion')],
  },
  {
    id: 'mengying',
    index: '04',
    period: '2021.03 — 2021.09',
    org: lt('广州梦映动漫网络科技有限公司', 'Guangzhou Mengying Animation Network Technology Co., Ltd.'),
    role: lt('动画实习生', 'Animation Intern'),
    dept: lt('美术部-黄金组', 'Art Dept. · Gold Group'),
    kind: 'MISSION',
    status: 'COMPLETE',
    duties: [
      lt('2D角色待机动效', '2D character idle animation'),
      lt('画面特效制作', 'Screen effects production'),
      lt('动态漫画内容制作', 'Motion comic production'),
      lt('新媒体动画内容生产', 'Animation content for new media'),
    ],
    keywords: [
      lt('角色微动效', 'CHARACTER MOTION'),
      lt('2D 动画', '2D ANIMATION'),
      lt('画面特效', 'SCREEN VFX'),
      lt('动态漫画', 'MOTION COMIC'),
      lt('新媒体动画', 'SOCIAL ANIMATION'),
    ],
    /* 职责按两类划分：角色动效（核心产出） / 特效与内容（扩展产出） */
    dutyGroups: [
      {
        code: 'CA',
        label: lt('角色动效', 'CHARACTER ANIMATION'),
        items: [
          lt('2D角色待机动效', '2D character idle animation'),
          lt('动态漫画内容制作', 'Motion comic production'),
        ],
      },
      {
        code: 'FX',
        label: lt('特效与内容', 'VFX & CONTENT'),
        items: [
          lt('画面特效制作', 'Screen effects production'),
          lt('新媒体动画内容生产', 'Animation content for new media'),
        ],
      },
    ],
    /* 数据结果卡：数字在上方、远大于职责文字，核心数据统一 lime（补充最新版简历播放/点赞口径） */
    resultStats: [
      { value: '99', label: lt('2D 动效', '2D MOTION'), numeric: 99 },
      { value: '25', label: lt('画面特效', 'VFX ASSETS'), numeric: 25 },
      { value: '71', label: lt('使用率', 'ADOPTION'), numeric: 71, suffix: '%' },
      { value: '200', label: lt('相关播放', 'VIEWS'), numeric: 200, suffix: 'W+' },
    ],
    results: [
      lt('制作99个角色微动效', '99 character idle animations'),
      lt('制作25个画面特效', '25 screen effects'),
      lt('玩家使用率71%', '71% player adoption'),
      lt('相关内容累计播放 200W+', '2M+ total views on related content'),
      lt('相关内容累计点赞 20W+', '200K+ total likes on related content'),
    ],
    /* 待机动效贯穿这段经历的职责和成果，是最核心的产出类型 */
    highlight: [lt('待机动效', 'idle animation')],
  },
  {
    /* 腾讯光子是项目培训经历，不是实习 —— kind: 'TRAINING' */
    id: 'openlight',
    index: '05',
    period: '2025.09 — 2025.11',
    org: lt('腾讯科技（深圳）有限公司', 'Tencent Technology (Shenzhen) Co., Ltd.'),
    role: lt('游戏动效设计（UI向）· OpenLight 创造营', 'Game UI Motion Design (UI Track) · OpenLight Camp'),
    dept: lt('腾讯互动娱乐事业群（IEG）-光子工作室群-光子艺术部 · 线上游戏 UI 动效培训', 'Tencent IEG · LightSpeed Studios Art Dept. · Online Game UI Motion Training'),
    kind: 'TRAINING',
    status: 'COMPLETE',
    /* 能力型展示（不人为量化）：UI 动效 / 引擎界面动画 / 蓝图基础 / AIGC 辅助 */
    duties: [
      lt('游戏 UI 动效（UI MOTION）', 'Game UI motion (UI MOTION)'),
      lt('UE UI 引擎界面动画（UE UI）', 'UE UI engine interface animation'),
      lt('蓝图结构基础（BLUEPRINT）', 'Blueprint fundamentals (BLUEPRINT)'),
      lt('AIGC 辅助动效（AIGC）', 'AI-assisted motion (AIGC)'),
    ],
    keywords: [
      lt('UE UI', 'UE UI'),
      lt('实时界面动效', 'REAL-TIME UI'),
      lt('蓝图逻辑', 'BLUEPRINT LOGIC'),
      lt('动效规范', 'MOTION SPEC'),
      lt('AIGC 辅助', 'AIGC'),
    ],
    /* 职责按两类划分：动效训练（核心训练） / 逻辑与工具（体系化沉淀） */
    dutyGroups: [
      {
        code: 'MT',
        label: lt('动效训练', 'MOTION TRAINING'),
        items: [
          lt('游戏 UI 动效（UI MOTION）', 'Game UI motion (UI MOTION)'),
          lt('UE UI 引擎界面动画（UE UI）', 'UE UI engine interface animation'),
        ],
      },
      {
        code: 'LS',
        label: lt('逻辑与工具', 'LOGIC & TOOLS'),
        items: [
          lt('蓝图结构基础（BLUEPRINT）', 'Blueprint fundamentals (BLUEPRINT)'),
          lt('AIGC 辅助动效（AIGC）', 'AI-assisted motion (AIGC)'),
        ],
      },
    ],
    results: [
      lt('完成腾讯 IEG 光子线上游戏 UI 动效培训', 'Completed Tencent IEG LightSpeed’s online game UI motion training'),
    ],
    /* 培训定位：能力沉淀，不虚构量化指标 */
    highlight: [lt('训练', 'training'), lt('UI动效', 'UI motion')],
  },
]
