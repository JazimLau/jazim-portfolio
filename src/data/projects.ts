import { lt } from './i18n'
import type { LT } from './i18n'
import type { Project, ProjectCase, ProjectFilterId, ProjectMetric } from './types'

/**
 * 筛选器 —— 一级分类，顺序固定：雷火端外 / 游戏UI动效 / 宣发 / 广告 / 社媒。
 * 'all' 为默认视图（全部项目）。
 */
export const projectFilters: {
  id: ProjectFilterId | 'all'
  label: string
  labelZh: LT
}[] = [
  { id: 'all', label: 'ALL MISSIONS', labelZh: lt('全部', 'All') },
  { id: 'leihuo', label: 'LEIHUO', labelZh: lt('雷火产品动效', 'Leihuo Motion') },
  { id: 'game-ui', label: 'GAME UI', labelZh: lt('游戏UI动效练习', 'Game UI Motion Practice') },
  { id: 'promo', label: 'PROMO', labelZh: lt('游戏宣发视频', 'Game Promo Films') },
  { id: 'ad', label: 'AD', labelZh: lt('游戏广告视频', 'Game Ad Films') },
  { id: 'social', label: 'SOCIAL', labelZh: lt('游戏社媒视频', 'Game Social Videos') },
]

/* =========================================================================
   三级信息架构元数据：TRACK（作品方向）→ PRODUCT/MODULE（游戏产品/实践模块）→ CASE（项目案例）
   组件只从这里读层级标签，不硬编码「二级项目 / 项目 / Campaign」等模糊叫法。
   ========================================================================= */

export interface TrackLevelMeta {
  /** 层级：1 = 作品方向，2 = 游戏产品 / 实践模块，3 = 项目案例 */
  level: 1 | 2 | 3
  /** 英文代号（如 TRACK / PRODUCT / MODULE / CASE） */
  code: LT
  /** 中文名（如 作品方向 / 游戏产品 / 实践模块 / 项目案例） */
  label: LT
  /** 一句话辅助提示（可选，用于筛选区） */
  hint?: LT
}

/** LEVEL 01 —— TRACK / 作品方向（所有一级分类通用） */
export const TRACK_META: TrackLevelMeta = {
  level: 1,
  code: lt('TRACK', 'TRACK'),
  label: lt('作品方向', 'PORTFOLIO TRACK'),
}

/**
 * LEVEL 02 —— 二级筛选中「下一层」的元数据：
 * 雷火 / 广告有真实产品层 → PRODUCT / 游戏产品；
 * 游戏UI动效练习按引擎展开 → MODULE / 实践模块；
 * 宣发 / 社媒没有产品层 → 直接进入 LEVEL 03 CASE。
 */
export function level2Meta(filter: ProjectFilterId | 'all'): TrackLevelMeta {
  switch (filter) {
    case 'leihuo':
    case 'ad':
      return {
        level: 2,
        code: lt('PRODUCT', 'PRODUCT'),
        label: lt('游戏产品', 'GAME PRODUCT'),
        hint: lt('点击产品查看对应项目', 'SELECT A PRODUCT TO VIEW CASES'),
      }
    case 'game-ui':
      return {
        level: 2,
        code: lt('MODULE', 'MODULE'),
        label: lt('实践模块', 'PRACTICE MODULE'),
        hint: lt('选择模块查看对应案例', 'SELECT A MODULE TO VIEW CASES'),
      }
    default:
      /* promo / social：无产品层，子筛选即案例 */
      return {
        level: 3,
        code: lt('CASE', 'CASE'),
        label: lt('项目案例', 'CASE'),
      }
  }
}

/** 某个项目所属的一级分类（去掉 featured / video 等聚合标签） */
export function trackFilterOf(p: Project | undefined): ProjectFilterId {
  const f = (p?.categories ?? []).find((c) => c !== 'featured' && c !== 'video')
  return (f ?? 'leihuo') as ProjectFilterId
}

/** 案例专属封面（约定路径）：由抽帧脚本从案例首条视频 25% 位置生成，
    存在时优先于 track 级 cover；未生成时组件 onError 会回落到占位底板。
    注意：实际文件位于 public/images/cases/...（对应线上 /images/cases/...），
    渲染时由 VideoPreview 内的 siteAsset() 按 Vite base 解析。 */
export function caseCoverPath(p: Project, c: ProjectCase): string {
  return `/images/cases/${p.slug}/${c.id}/cover.jpg`
}

/** 一个案例下的作品数：优先活动项目（works）数量，其次视频数，最少为 1 */
export function caseCount(c: ProjectCase): number {
  if (c.works && c.works.length > 0) return c.works.length
  const n = c.videos?.length ?? (c.video ? 1 : 0)
  return n > 0 ? n : 1
}

/** 从较长类型文案派生「主要类型」短值：取前两段（如「BGC / 原生化 / PUGC…」→「BGC / 原生化」） */
function shortType(cat: LT): LT {
  const take = (s: string) => s.split('/').slice(0, 2).join(' / ').trim()
  return lt(take(cat.cn), take(cat.en))
}

/** 各一级模块的「上线表现」默认值（无产品级真实统计时不虚构百分比） */
function defaultLaunch(projectId: string): LT {
  switch (projectId) {
    case 'leihuo-external-motion':
      return lt('高还原', 'HIGH FIDELITY')
    case 'game-ui-motion-studies':
      return lt('已完成', 'COMPLETED')
    case 'game-ad-films':
      return lt('多形式广告', 'MULTI-FORMAT')
    case 'game-promotion-films':
      return lt('多平台', 'MULTI-PLATFORM')
    case 'game-social-videos':
      return lt('平台内容', 'PLATFORM CONTENT')
    default:
      return lt('高还原', 'HIGH FIDELITY')
  }
}

/** 流程节点，雷火项目详情页的 PROCESS 模块使用（flowNum 自动加编号，文本不含编号前缀） */
const deliveryFlow: LT[] = [
  lt('需求理解：确认项目背景、页面功能、设计稿状态与上线节点', 'Understand brief — align on context, page function, design state and launch milestone'),
  lt('方案设计：拆解动态重点、节奏、层级关系与实现方式', 'Design spec — break down motion focus, pacing, hierarchy and implementation approach'),
  lt('素材确认：检查设计稿分层，并完成必要的拆分、补图与资源整理', 'Asset check — review design layers, split, retouch and organise assets as needed'),
  lt('动效制作：完成 KV、UI、角色、氛围及相关动态表现', 'Animation — produce KV, UI, character, atmosphere and related motion'),
  lt('评审修改：经历内部评审与业务侧确认，根据反馈迭代', 'Review — iterate through internal and business-side reviews'),
  lt('资源交付：按照实现方式输出动画参数、序列帧、视频等资源', 'Asset delivery — export parameters, frame sequences, video per implementation'),
  lt('技术联调：配合技术确认资源接入、层级关系及效果还原', 'Tech integration — confirm asset handoff, hierarchy and fidelity'),
  lt('上线走查：检查最终效果并修复还原、性能及显示异常', 'Post-launch QA — verify the final effect, fix fidelity, performance and display issues'),
]

/**
 * 项目库。
 * priority 决定卡片视觉权重（1 最大 / 3 最小），不是所有项目都平铺同样大小。
 * 新增项目：复制一个对象，改 id / slug / index，把资源放到 public/assets 下同名路径。
 * 雷火相关内容为脱敏描述，不含未公开的产品名称与内部资料。
 */
export const projects: Project[] = [
  /* ══════════════════ 第一优先级 ══════════════════ */
  {
    id: 'leihuo-external-motion',
    slug: 'leihuo-external-motion-system',
    index: '01',
    title: 'LEIHUO / GAME MOTION SYSTEM',
    titleZh: lt('网易雷火游戏动效', 'NetEase Leihuo Game Motion'),
    category: lt(
      '端内 UI / 官网 / H5 / 小程序 / KV 动效',
      'In-game UI / Official site / H5 / Mini-program / Key visual'
    ),
    categories: ['featured', 'leihuo'],
    year: '2026',
    featured: true,
    priority: 1,
    status: 'ONGOING',
    accent: 'var(--accent-purple)',
    description: lt(
      '参与雷火旗下游戏产品的端内 UI 动效及官网、H5 活动页、小程序等端外产品动态设计，围绕 KV 主视觉、Slogan、按钮、角色与场景氛围等内容完成动效方案、制作与资源交付，并参与三维展示资源适配、AIGC 辅助预演及上线还原走查，推动动效从设计到前端呈现的完整落地。',
      'Motion design for Leihuo game products — in-game UI motion plus official sites, H5 campaign pages and mini-programs — covering key visuals, slogans, buttons, characters and scene atmosphere through spec, production and asset delivery, with 3D showcase adaptation, AI-assisted previs and post-launch fidelity QA, pushing motion from design to full front-end delivery.'
    ),
    role: [
      lt('需求拆解', 'Requirement breakdown'),
      lt('动画方案', 'Motion spec'),
      lt('素材拆分', 'Asset splitting'),
      lt('动效设计', 'Motion design'),
      lt('AIGC辅助制作', 'AI-assisted production'),
      lt('前端资源输出', 'Front-end asset export'),
      lt('上线走查', 'Post-launch QA'),
    ],
    tools: ['After Effects', 'Photoshop', 'Figma', 'Blender', 'AIGC', 'AI Tools', 'Cocos', 'HTML', 'Spine'],
    toolGroups: [
      {
        label: 'MAIN',
        labelZh: lt('主要制作', 'Main production'),
        items: ['After Effects', 'Photoshop', 'Figma'],
      },
      {
        label: '3D',
        labelZh: lt('三维与资源处理', '3D & asset processing'),
        items: ['Blender'],
      },
      {
        label: 'AIGC',
        labelZh: lt('AIGC 辅助', 'AI-assisted'),
        items: ['AIGC', 'AI Tools'],
      },
      {
        label: 'WORKFLOW',
        labelZh: lt('项目验证 / 工作流接触', 'Validation / workflow exposure'),
        items: ['Cocos', 'HTML', 'Spine'],
      },
    ],
    services: ['KV MOTION', 'PAGE MOTION', 'UI MOTION PREVIS', '3D ADAPTATION', 'ASSET DELIVERY', 'QA'],
    cover: '/assets/images/project-01-cover.jpg',
    /* 一级项目视频 = 子模块全部作品视频；由文件底部 syncLeihuoVideos() 自动同步 */
    video: '/assets/videos/naraka/naraka-shangbo-demo.m3u8',
    videos: [],
    gallery: [],
    /* 任务数据（最新版简历口径）：主指标 14 / 83 / 65 / 10，辅助 06 / 07 / 95% / 100% */
    metrics: [
      { label: 'PROJECTS', value: lt('14', '14') },
      { label: 'MOTION MODULES', value: lt('83', '83') },
      { label: 'MOTION ASSETS', value: lt('65', '65') },
      { label: 'LAUNCHED', value: lt('10', '10') },
      { label: 'UI PREVIEWS', value: lt('06', '06') },
      { label: 'AIGC PROJECTS', value: lt('07', '07') },
      { label: 'FIRST-DRAFT PASS', value: lt('95%', '95%') },
      { label: 'ON-TIME', value: lt('100%', '100%') },
    ],
    sections: [
      {
        id: 'background',
        label: 'PROJECT BACKGROUND',
        labelZh: lt('项目背景', 'Project background'),
        body: [
          lt(
            '官网、活动 H5 与小程序等端外产品，是游戏在版本宣传、活动预约与内容曝光中的重要触点。视觉设计通常已确定整体版式与风格，动效则需要在不破坏既有视觉结构的基础上，通过节奏、层级、反馈与氛围强化页面表现，并兼顾不同终端的资源体积与实现方式。本项目集合本人实习期间参与的多项端外动态设计工作，具体产品名称、版本节点及内部资料均按项目要求进行脱敏展示。',
            'Off-client surfaces — official sites, campaign H5 pages and mini-programs — are key touchpoints for version promotion, activity pre-registration and content exposure. The visual design usually locks the overall layout and style, so motion has to strengthen pacing, hierarchy, feedback and atmosphere without breaking the existing visual structure, while balancing asset size and implementation approach across devices. This project compiles the off-client motion work I contributed to during my internship; specific product names, version milestones and internal materials are desensitised as required.'
          ),
        ],
      },
      {
        id: 'objective',
        label: 'MOTION OBJECTIVE',
        labelZh: lt('动效目标', 'Motion objective'),
        list: [
          lt(
            '强化 KV 首屏的氛围与视觉节奏，避免仅以基础淡入完成动态呈现',
            'Strengthen the atmosphere and visual rhythm of the KV above the fold, rather than settling for a plain fade-in'
          ),
          lt(
            '通过动效建立页面信息层级，引导用户关注核心视觉与关键操作区域',
            'Use motion to build page hierarchy and guide attention toward the core visual and key action areas'
          ),
          lt(
            '为按钮、标签、状态切换等界面元素补充清晰且可感知的动态反馈',
            'Give buttons, tags and state changes clear, perceptible motion feedback'
          ),
          lt(
            '根据 PC、移动端及不同页面载体控制帧率、尺寸、资源体积与运行成本',
            'Control frame rate, dimensions, asset size and runtime cost across PC, mobile and different page surfaces'
          ),
          lt(
            '在设计阶段同步考虑技术实现方式，降低后续资源接入与还原偏差',
            'Consider the technical implementation during design to reduce asset integration and fidelity drift later'
          ),
          lt(
            '在保证视觉表现的前提下平衡动画复杂度、性能与交付效率',
            'Balance animation complexity, performance and delivery efficiency without sacrificing visual quality'
          ),
        ],
      },
      {
        id: 'role',
        label: 'MY ROLE',
        labelZh: lt('我的职责', 'My role'),
        list: [
          lt(
            '与产品、视觉及技术协作确认需求背景、页面结构与动态表现重点',
            'Work with product, visual and technical teams to align on the brief, page structure and motion focus'
          ),
          lt(
            '制作前输出动画方案，明确节奏、表现方式、素材拆分与交付形式',
            'Produce motion specs up front — timing, visual approach, asset breakdown and delivery format'
          ),
          lt(
            '根据动效需求完成素材拆分、补图、透明通道及图层结构整理',
            'Split and complete assets, handling alpha channels and layer structure as the motion requires'
          ),
          lt(
            '完成 KV、Slogan、按钮、角色微动及场景氛围等端外动态设计',
            'Design off-client motion for key visuals, slogans, buttons, character micro-motion and scene atmosphere'
          ),
          lt(
            '参与三维展示资源的材质、贴图、灯光与展示效果适配，并结合项目环境进行验证',
            'Adapt materials, textures, lighting and showcase effect for 3D display assets, validating within the project environment'
          ),
          lt(
            '使用 AIGC 辅助前期动态验证及部分动效素材制作，提高方案探索效率',
            'Use AIGC to assist early motion validation and some asset production, improving exploration efficiency'
          ),
          lt(
            '根据技术实现方式分类输出动画参数、序列帧、视频等可接入资源',
            'Output animation parameters, frame sequences and video as deliverable assets matched to the technical approach'
          ),
          lt(
            '配合技术完成还原确认，并在上线前后进行动效走查与问题修正',
            'Confirm fidelity with the technical team, and run motion QA before and after launch to fix issues'
          ),
        ],
      },
      {
        id: 'process',
        label: 'PROCESS',
        labelZh: lt('制作流程', 'Process'),
        flow: deliveryFlow,
      },
      {
        id: 'delivery',
        label: 'DELIVERY',
        labelZh: lt('交付方式', 'Delivery'),
        list: [
          lt(
            '根据实际实现方式选择资源交付方案，简单位移、缩放、旋转与透明度动画优先提供数值及时序参数',
            'Choose the delivery approach per the actual implementation — simple position, scale, rotation and opacity animations ship as numbers with timing parameters first'
          ),
          lt(
            '对粒子、光效、角色动作及特殊质感等复杂表现，根据实际需求输出序列帧、视频或其他前端可接入资源',
            'For complex motion — particles, light effects, character actions and special finishes — export frame sequences, video or other front-end-ready assets as needed'
          ),
          lt(
            '统一资源命名、尺寸与目录结构，并同步动画时序、层级及循环方式',
            'Keep naming, dimensions and folder structure consistent, and document timing, hierarchy and looping'
          ),
          lt(
            '针对 PC 与移动端分别关注分辨率、帧率、资源体积及显示适配',
            'Address resolution, frame rate, asset size and display adaptation for PC and mobile separately'
          ),
          lt(
            '交付前完成尺寸、帧率、循环点、透明边缘、资源体积及版本信息等自检',
            'Run a pre-delivery checklist covering dimensions, frame rate, loop point, alpha edges, asset size and version info'
          ),
          lt(
            '配合技术侧完成接入后的效果核对，减少设计预演与最终上线效果之间的偏差',
            'Verify the integrated result with the technical team to close the gap between design preview and final live effect'
          ),
        ],
      },
      {
        id: 'result',
        label: 'FINAL RESULT',
        labelZh: lt('最终呈现', 'Final result'),
        body: [
          lt(
            '截至目前累计参与 14 个项目推进，拆解 83 个动态需求模块，输出 65 组动效及动态视觉资源，完成 6 组游戏内 UI 动效预演，其中 10 个项目正式上线，并完成 7 个 AIGC 相关正式项目；常规需求按期交付率保持 100%，一稿过率约 95%。在项目实践中逐步建立了从需求理解、方案设计、动效制作到资源交付与上线走查的完整工作闭环。',
            'So far: 14 projects supported, 83 motion requirement modules broken down, 65 sets of motion & dynamic-visual assets delivered, 6 in-game UI motion previs sets completed, 10 projects officially launched and 7 AIGC-related official projects delivered; 100% on-time delivery for routine requests with roughly 95% first-draft pass rate. Through these projects I built a complete working loop from brief understanding, design and production to asset delivery and post-launch QA.'
          ),
        ],
      },
    ],
    /* 雷火端外子层级：按产品展开的案例目录 */
    cases: [
      {
        id: 'naraka',
        name: lt('永劫无间', 'Naraka: Bladepoint'),
        meta: lt('官网 / H5活动页', 'Official site / H5 campaign'),
        description: lt(
          '《永劫无间》文化联动与周年节点的端外动态设计：三维展示资源处理、KV 氛围建立与多语言/多端适配。',
          'Off-client motion for Naraka: Bladepoint cultural collabs and anniversary milestones — 3D showcase asset work, key-visual atmosphere and multilingual/responsive adaptation.'
        ),
        tags: ['H5', 'KV MOTION', 'COLLABORATION'],
        date: lt('2026', '2026'),
        role: lt('KV 动效 / 3D 资源处理 / 多端适配', 'KV motion / 3D asset / Responsive'),
        projectType: lt('H5 / 周年 / 联动活动', 'H5 / Anniversary / Collab'),
        responsibility: [lt('KV 动效', 'KV motion'), lt('3D 资源', '3D assets'), lt('多语言适配', 'Localization')],
        mainType: lt('KV / 3D', 'KV / 3D'),
        works: [
          {
            id: 'naraka-shangbo',
            name: lt('上博联动第四期', 'Museum Collab · Phase 4'),
            description: lt(
              '参与《永劫无间》文化联动 H5 的迭代制作，围绕新增展示内容完成三维资源处理与页面适配，并配合既有动态体系完成资源交付与效果验证。',
              'Iterative motion work on the Naraka cultural-collab H5 — 3D asset processing and page adaptation for the new showcase content, delivered within the existing motion system and verified for effect.'
            ),
            meta: lt('PC / 移动端 H5', 'PC / Mobile H5'),
            date: lt('2026.06', '2026.06'),
            role: lt('3D 资源处理 / 页面适配 / 资源交付 / 效果验证', '3D asset / Page adaptation / Delivery / Effect verification'),
            tags: ['H5', '3D ASSET', 'COLLABORATION'],
            videos: ['/assets/videos/naraka/naraka-shangbo-demo.m3u8'],
            detail: {
              background: lt(
                '该项目为文化联动系列 H5 的阶段性迭代，在延续既有页面结构与视觉语言的基础上更新当期展示内容。相比重新设计整套页面，本期更强调新增资源与既有动态体系之间的适配和一致性。',
                'This is a phase iteration of the cultural-collab H5 series — refreshing the current showcase content while keeping the existing page structure and visual language. More than a full redesign, it emphasises fitting the new assets into the established motion system consistently.'
              ),
              objectives: [
                lt('保持新增内容与既有联动页面视觉风格统一', 'Keep the new content visually consistent with the existing collab page'),
                lt('处理三维展示资源，使其满足网页端呈现需求', 'Process 3D showcase assets to meet web presentation needs'),
                lt('保证不同展示形式之间的视觉一致性', 'Ensure visual consistency across different showcase formats'),
                lt('控制资源规格并减少技术接入偏差', 'Control asset specs and reduce integration drift'),
              ],
              role: lt(
                '参与新增展示内容的三维资源处理，根据页面需求调整模型、材质及展示效果，并整理为网页端可接入的资源；配合页面效果验证及交付检查。',
                'Handled the 3D assets for the new showcase content — adjusting models, materials and presentation to the page needs and packaging them for web — then supported effect verification and delivery checks.'
              ),
              process: [
                lt('需求理解', 'Understand brief'),
                lt('资源确认', 'Asset review'),
                lt('三维资源处理', '3D asset processing'),
                lt('展示效果调整', 'Presentation polish'),
                lt('页面适配', 'Page adaptation'),
                lt('效果验证', 'Effect verification'),
                lt('资源交付', 'Asset delivery'),
                lt('上线走查', 'Post-launch QA'),
              ],
              delivery: [
                lt('根据页面展示方式整理对应三维及展示资源', 'Prepare the 3D and showcase assets per the page display approach'),
                lt('与技术侧确认模型、材质、贴图和最终呈现效果', 'Confirm models, materials, textures and the final presentation with the technical team'),
                lt('保证资源能够在实际页面环境中正确还原', 'Ensure the assets restore correctly in the real page environment'),
              ],
              result: lt(
                '完成新增展示内容的资源处理与页面适配，使新增内容能够延续既有联动页面的视觉语言，并满足实际网页展示与技术接入需求。',
                'Delivered the asset processing and page adaptation for the new showcase content, extending the existing collab page\'s visual language while meeting real web display and integration needs.'
              ),
              tools: ['Blender', 'Cocos', 'Photoshop', 'After Effects'],
            },
          },
          {
            id: 'naraka-anniversary',
            name: lt('五周年年报', '5th Anniversary Report'),
            description: lt(
              '参与《永劫无间》五周年年报网页动态设计，负责首页 KV 与 Slogan 等核心视觉的循环表现及多语言适配，使不同语言和终端版本保持统一的氛围与动态节奏。',
              'Motion design for the Naraka 5th-anniversary report — home KV and Slogan loop motion plus multilingual adaptation, keeping the atmosphere and pacing unified across languages and devices.'
            ),
            meta: lt('PC / 移动端网页', 'PC / Mobile web'),
            date: lt('2026.06', '2026.06'),
            role: lt('KV 动效 / Slogan 动效 / 多语言适配 / 资源交付', 'KV motion / Slogan motion / Localization / Delivery'),
            tags: ['ANNIVERSARY', 'KV MOTION', 'LOCALIZATION'],
            videos: ['/assets/videos/naraka/naraka-anniversary-kv.m3u8'],
            detail: {
              background: lt(
                '五周年年报通过互动网页回顾阶段性内容与玩家经历，整体采用较强的主题化视觉表现。首页作为进入年报体验的第一层，需要通过持续但克制的动态建立氛围，同时适配不同语言版本。',
                'The 5th-anniversary report revisits milestone content and player journeys through an interactive page with a strongly themed visual. As the entry layer of that experience, the home needs sustained but restrained motion to set the mood, adapted across language versions.'
              ),
              objectives: [
                lt('强化周年主题首页的视觉氛围', 'Strengthen the atmosphere of the anniversary-themed home'),
                lt('通过场景微动与粒子循环保持画面活力', 'Keep the frame alive with subtle scene motion and particle loops'),
                lt('保证 KV 与 Slogan 在多语言版本中的表现一致', 'Keep KV and Slogan consistent across language versions'),
                lt('兼顾 PC、移动端及不同版本的资源适配', 'Handle asset adaptation for PC, mobile and different versions'),
              ],
              role: lt(
                '负责首页 KV、Slogan 等核心动态内容制作，并完成简中、繁中及英文版本的对应适配；根据不同终端整理循环视频及网页动效资源，保证多语言版本的动态效果一致。',
                'Produced the home KV and Slogan motion and adapted it for Simplified Chinese, Traditional Chinese and English; organised loop videos and web motion assets per device so the effect stays consistent across languages.'
              ),
              process: [
                lt('需求理解', 'Understand brief'),
                lt('动效方案', 'Motion spec'),
                lt('素材整理', 'Asset prep'),
                lt('KV 动效制作', 'KV animation'),
                lt('Slogan 制作', 'Slogan animation'),
                lt('多语言适配', 'Localization'),
                lt('评审调整', 'Review & iterate'),
                lt('资源交付', 'Asset delivery'),
              ],
              delivery: [
                lt('根据不同语言和终端分别整理 KV 视频及文字动效资源', 'Prepare KV video and type-motion assets separately per language and device'),
                lt('统一循环节奏与视觉表现，并检查尺寸、文字适配和资源完整性', 'Unify loop pacing and visuals, checking size, text adaptation and asset completeness'),
              ],
              result: lt(
                '完成周年年报首页核心视觉及多语言版本适配，使不同语言与终端版本保持统一的视觉氛围和动态体验。',
                'Delivered the report home\'s core visuals and multilingual adaptation, keeping the atmosphere and motion experience unified across languages and devices.'
              ),
              tools: ['After Effects', 'Photoshop', 'Figma'],
            },
          },
        ],
        gallery: [],
      },
      {
        id: 'nsh',
        name: lt('黄金服', 'Golden Server'),
        product: lt('逆水寒', 'Justice Online'),
        meta: lt('官网 / 预约页', 'Official site / Pre-registration'),
        description: lt(
          '国风题材下的端外动效处理：新服预约页的 KV 主视觉氛围建立与核心卖点的节奏引导。',
          'Motion for a traditional Chinese aesthetic — key-visual atmosphere for the new-server pre-registration page, pacing that lands the core selling point.'
        ),
        tags: ['H5', 'KV MOTION', 'INTERACTION'],
        date: lt('2026', '2026'),
        role: lt('KV 动效 / UI 动效 / 双端适配', 'KV motion / UI motion / Responsive'),
        projectType: lt('预约 H5 / 活动页', 'Pre-reg H5 / Campaign'),
        responsibility: [lt('KV 动效', 'KV motion'), lt('UI 反馈', 'UI feedback'), lt('双端适配', 'Responsive')],
        mainType: lt('KV / UI', 'KV / UI'),
        works: [
          {
            id: 'nsh-golden',
            name: lt('黄金畅玩服预约', 'Golden Server Pre-registration'),
            description: lt(
              '参与《逆水寒》黄金畅玩服预约活动动态设计，围绕首屏 KV、Slogan 与活动按钮完成 PC / 移动端动效制作及适配，在活动氛围、交互反馈与网页性能之间保持平衡。',
              'Motion design for the Justice Online Golden Server pre-registration — KV, Slogan and activity-button animation for PC and mobile, balancing campaign atmosphere, interaction feedback and web performance.'
            ),
            meta: lt('PC / 移动端 H5', 'PC / Mobile H5'),
            date: lt('2026.06', '2026.06'),
            role: lt('KV 动效 / UI 动效 / 双端适配 / 资源交付', 'KV motion / UI motion / Responsive / Delivery'),
            tags: ['H5', 'KV MOTION', 'INTERACTION'],
            videos: ['/assets/videos/nsh/nsh-golden-kv.m3u8'],
            detail: {
              background: lt(
                '该项目为新服预约活动页面，通过预约、内容展示及互动模块承接版本推广。页面包含较多活动信息，因此动效需要在强化首屏视觉的同时，为关键操作提供明确反馈，并兼顾双端展示效果。',
                'This is a new-server pre-registration page carrying version promotion through registration, content display and interactive modules. With a lot of activity info on page, the motion must strengthen the first-screen visual while giving clear feedback on key actions, across both platforms.'
              ),
              objectives: [
                lt('强化 KV 与 Slogan 的首屏氛围', 'Strengthen the first-screen atmosphere of the KV and Slogan'),
                lt('为活动按钮提供清晰的待机与操作反馈', 'Give the activity button clear idle and interaction feedback'),
                lt('保证 PC 与移动端的视觉和节奏一致', 'Keep visuals and pacing consistent on PC and mobile'),
                lt('控制资源体积与动画复杂度，保证 H5 展示流畅', 'Control asset size and animation complexity so the H5 stays smooth'),
              ],
              role: lt(
                '负责主页面 KV、Slogan 与活动按钮等核心动效制作，并根据 PC 页面完成移动端适配；结合页面实现方式调整素材结构、循环状态及资源输出。',
                'Produced the core motion for the page KV, Slogan and activity button, adapted it from the PC page to mobile, and adjusted asset structure, loop states and output to the page implementation.'
              ),
              process: [
                lt('需求理解', 'Understand brief'),
                lt('动效方案', 'Motion spec'),
                lt('素材确认', 'Asset check'),
                lt('KV 动效制作', 'KV animation'),
                lt('UI 动效制作', 'UI animation'),
                lt('双端适配', 'Responsive adaptation'),
                lt('评审调整', 'Review & iterate'),
                lt('资源交付与走查', 'Delivery & QA'),
              ],
              delivery: [
                lt('根据不同动态内容分别输出视频、CSS 等网页可接入资源', 'Output video, CSS and other web-ready assets per motion type'),
                lt('针对 PC 与移动端检查尺寸、帧率、循环、透明边缘及资源体积', 'Check size, frame rate, looping, alpha edges and asset weight for PC and mobile'),
                lt('配合开发完成最终还原', 'Support development in restoring the final effect'),
              ],
              result: lt(
                '完成活动首屏及核心操作区域的双端动态设计，使页面在保持活动氛围的同时具备清晰的操作反馈，并形成从设计到技术接入的完整交付链路。',
                'Delivered the dual-platform motion for the activity first screen and core actions, keeping the campaign atmosphere with clear interaction feedback and forming a complete pipeline from design to technical integration.'
              ),
              tools: ['After Effects', 'Photoshop', 'Figma'],
            },
          },
          {
            id: 'nsh-jiuzhou-mijing',
            name: lt('九州秘境', 'Mystic Realm'),
            date: lt('2026.06', '2026.06'),
            videos: ['/assets/videos/nsh/nsh-jiuzhou-mijing.m3u8'],
          },
        ],
        gallery: [],
      },
      {
        id: 'hearthstone',
        name: lt('武道大会', 'Martial Arts Tournament'),
        product: lt('炉石传说', 'Hearthstone'),
        meta: lt('端内活动', 'In-game'),
        description: lt(
          '炉石传说端内「武道大会」促活活动的动画：抽奖演出、稀有度发光反馈、任务刷新与升级效果的节奏设计。',
          'In-game motion for Hearthstone\'s "Martial Arts Tournament" event — gacha sequences, rarity glow feedback, task refresh and level-up beats.'
        ),
        tags: ['IN-GAME', 'GACHA', 'FEEDBACK'],
        date: lt('2025 — 2026', '2025 — 2026'),
        role: lt('端内动效 / 反馈动效', 'In-game motion / Feedback motion'),
        projectType: lt('端内活动 / UI 动效', 'In-game / UI motion'),
        responsibility: [lt('交互动效', 'Interaction motion'), lt('反馈演出', 'Feedback sequence')],
        mainType: lt('端内 / UI', 'IN-GAME / UI'),
        works: [
          {
            id: 'hs-tournament',
            name: lt('武道大会', 'Martial Arts Tournament'),
            date: lt('2026.06', '2026.06'),
            videos: [
              '/assets/videos/hearthstone/hs-five-draw.m3u8',
              '/assets/videos/hearthstone/hs-gold-glow.m3u8',
              '/assets/videos/hearthstone/hs-single-draw.m3u8',
              '/assets/videos/hearthstone/hs-purple-glow.m3u8',
              '/assets/videos/hearthstone/hs-blue-glow.m3u8',
              '/assets/videos/hearthstone/hs-task-refresh.m3u8',
              '/assets/videos/hearthstone/hs-upgrade.m3u8',
            ],
            detail: {
              background: lt(
                '「武道大会」是炉石传说端内的促活活动，通过抽奖、任务与升级等玩法激励玩家持续参与。动效需要承担奖励演出的情绪表达与操作反馈，让每一次抽卡和任务达成都有明确的视觉回报。',
                '"Martial Arts Tournament" is an engagement event inside Hearthstone, using gacha, tasks and level-ups to keep players participating. Motion carries the emotion of reward reveals and the feedback of every action, so each draw and task completion feels rewarding.'
              ),
              objectives: [
                lt('通过抽奖演出建立稀有度的层级感与获得情绪', 'Use gacha sequences to build rarity hierarchy and the sense of reward'),
                lt('用发光反馈强化卡片品质的识别', 'Use glow feedback to make card quality instantly readable'),
                lt('让任务刷新与升级等状态变化清晰可感知', 'Make state changes like task refresh and level-up clear and perceptible'),
                lt('统一多节点演出的节奏，避免重复操作疲劳', 'Keep the pacing consistent across nodes so repeated play stays comfortable'),
              ],
              role: lt(
                '参与抽奖演出、稀有度发光、任务刷新与升级效果的动效制作，围绕奖励反馈与节奏感完成动画设计，并跟进端内还原。',
                'Produced the gacha sequences, rarity glows, task refresh and level-up motion, focusing on reward feedback and pacing, then followed up on the in-game rebuild.'
              ),
              process: [
                lt('需求理解', 'Understand brief'),
                lt('演出拆解', 'Sequence breakdown'),
                lt('动效方案', 'Motion spec'),
                lt('动效制作', 'Animation'),
                lt('节奏调整', 'Pacing polish'),
                lt('评审修改', 'Review & iterate'),
                lt('资源交付', 'Asset delivery'),
                lt('端内还原', 'In-game handoff'),
              ],
              delivery: [
                lt('按演出节点拆分抽奖、发光、任务与升级动画资源', 'Split gacha, glow, task and level-up assets by sequence node'),
                lt('基础反馈优先提供可复现的参数说明，复杂演出输出序列帧或视频', 'Ship reusable parameters for basic feedback, frame sequences or video for complex reveals'),
                lt('交付前核对循环点、时长、层级与透明边缘', 'Check loop points, duration, hierarchy and alpha edges before delivery'),
              ],
              result: lt(
                '完成抽奖、发光、任务与升级等核心反馈的动效设计，使奖励获得与状态变化具备一致且清晰的视觉节奏。',
                'Delivered the motion for gacha, glows, task refresh and level-ups, giving reward moments and state changes a consistent, readable visual rhythm.'
              ),
              tools: ['After Effects', 'Photoshop', 'Figma'],
            },
          },
        ],
        gallery: [],
      },
      {
        id: 'wow',
        name: lt('魔兽世界', 'World of Warcraft'),
        meta: lt('官网 / 活动页', 'Official site / Campaign'),
        description: lt(
          '《魔兽世界》周年庆系列活动页面的动态设计：从活动 Landing 页、抽奖页面到多入口聚合页，围绕页面氛围、交互反馈与多端适配完成动效制作与资源交付。',
          'Motion design for World of Warcraft anniversary campaign pages — landing pages, lottery pages and multi-entry hubs, covering atmosphere, interaction feedback and responsive delivery.'
        ),
        tags: ['WEB MOTION', 'UI MOTION', 'RESPONSIVE'],
        date: lt('2026', '2026'),
        role: lt('页面动效 / UI 动效 / 多端适配', 'Page motion / UI motion / Responsive'),
        projectType: lt('官网 / H5 / 活动页', 'Official site / H5 / Campaign'),
        responsibility: [lt('KV 动效', 'KV motion'), lt('UI 动效', 'UI motion'), lt('多端适配', 'Responsive')],
        mainType: lt('KV / UI', 'KV / UI'),
        works: [
          {
            id: 'wow-midsummer',
            name: lt('仲夏祥瑞', 'Midsummer Auspice'),
            date: lt('2026.06', '2026.06'),
            videos: [
              '/assets/videos/wow/wow-midsummer-slogan.m3u8',
              '/assets/videos/wow/wow-midsummer-product.m3u8',
            ],
            detail: {
              background: lt(
                '该项目为《魔兽世界》阶段性活动 Landing 页，通过主视觉与页面内容承接活动宣传及内容展示。动效主要围绕首屏视觉展开，在保持原有视觉设计的基础上强化画面氛围与页面动态表现。',
                'This is a milestone campaign landing page for World of Warcraft, using the key visual and page content to carry promotion and showcase. Motion focuses on the above-the-fold visual, reinforcing atmosphere and page dynamics without disturbing the existing design.'
              ),
              objectives: [
                lt('强化主视觉的动态氛围与视觉层次', 'Strengthen the atmosphere and visual hierarchy of the key visual'),
                lt('通过 Slogan 循环表现保持首屏视觉活力', 'Keep the above-the-fold lively through looping Slogan motion'),
                lt('保证 PC 与移动端在不同构图下的动态一致性', 'Keep motion consistent across PC and mobile compositions'),
                lt('在视觉效果与网页资源体积之间取得平衡', 'Balance visual impact with web asset size'),
              ],
              role: lt(
                '参与主视觉 KV、Slogan 等核心区域的动效制作与调整，根据 PC 与移动端页面结构完成适配，并根据技术实现要求整理与输出对应动画资源。',
                'Produced and refined the motion for the key visual and Slogan, adapted it to the PC and mobile page structures, and prepared the corresponding animation assets for the technical implementation.'
              ),
              process: [
                lt('需求理解', 'Understand brief'),
                lt('动效方案', 'Motion spec'),
                lt('素材整理', 'Asset prep'),
                lt('动效制作', 'Animation'),
                lt('多端适配', 'Responsive adaptation'),
                lt('评审调整', 'Review & iterate'),
                lt('资源交付', 'Asset delivery'),
                lt('上线走查', 'Post-launch QA'),
              ],
              delivery: [
                lt('根据页面实现方式分别整理主视觉视频与界面动画资源', 'Prepare key-visual video and UI animation assets per the page implementation'),
                lt('针对 PC、移动端进行尺寸、构图、循环及资源体积检查', 'Check size, composition, looping and asset weight for PC and mobile'),
                lt('配合技术完成最终效果确认', 'Confirm the final effect with the technical team'),
              ],
              result: lt(
                '完成 Landing 页核心视觉区域的动态表现与多端适配，使静态主视觉形成更完整的氛围循环，同时保证网页端展示与资源加载需求。',
                'Delivered the motion and responsive adaptation for the landing page\'s core visual, turning the static key visual into a fuller ambient loop while meeting web display and loading requirements.'
              ),
              tools: ['After Effects', 'Photoshop', 'Figma'],
            },
          },
          {
            id: 'wow-walrus',
            name: lt('海象人抽奖', 'Walrus Lottery'),
            date: lt('2026.07', '2026.07'),
            videos: ['/assets/videos/wow/wow-walrus-lottery.m3u8'],
            detail: {
              background: lt(
                '周年庆海象人抽奖是《魔兽世界》周年活动中的抽奖类页面，需要同时承载抽奖操作、奖励展示及不同状态反馈。动效主要用于强化关键操作和奖励信息，使抽奖体验更加明确且具有持续的视觉吸引力。',
                'The anniversary Walrus lottery is a draw page within the World of Warcraft anniversary event, carrying the draw action, reward display and various state feedback at once. Motion reinforces the key actions and reward information, making the lottery experience clearer and visually engaging.'
              ),
              objectives: [
                lt('强化抽奖按钮及关键操作的反馈感', 'Strengthen feedback on the draw button and key actions'),
                lt('通过循环动画提升奖励区域的视觉识别', 'Use looping animation to make the reward area more recognisable'),
                lt('区分不同抽奖与奖励状态', 'Distinguish different draw and reward states'),
                lt('在多个页面版本中保持统一的动态语言', 'Keep a consistent motion language across page versions'),
              ],
              role: lt(
                '参与抽奖界面的 UI 动效制作，包括抽奖按钮、奖励切换、循环提示及部分活动元素的动态表现，并根据不同页面版本完成调整与资源输出。',
                'Produced UI motion for the lottery interface — the draw button, reward switching, looping hints and some event elements — then adapted and exported assets across page versions.'
              ),
              process: [
                lt('需求理解', 'Understand brief'),
                lt('状态梳理', 'State mapping'),
                lt('动效方案', 'Motion spec'),
                lt('动效制作', 'Animation'),
                lt('版本适配', 'Version adaptation'),
                lt('评审调整', 'Review & iterate'),
                lt('资源交付', 'Asset delivery'),
                lt('效果走查', 'Effect QA'),
              ],
              delivery: [
                lt('根据页面状态拆分循环、切换及交互反馈等动画资源', 'Split loop, transition and interaction assets by page state'),
                lt('基础界面动画优先以可复现的参数方式交付，复杂视觉表现根据实际实现方式输出对应资源', 'Deliver basic UI animation as reusable parameters, and complex visuals as assets per the implementation'),
                lt('配合开发完成效果确认', 'Confirm the effect with development'),
              ],
              result: lt(
                '完成抽奖页面多个核心交互与循环状态的动态设计，使抽奖操作、奖励信息及页面状态之间形成更加清晰的反馈关系，并保持整体视觉节奏的一致性。',
                'Delivered the motion for the lottery page\'s key interactions and looping states, forming a clearer feedback relationship between the draw action, reward info and page states with consistent visual pacing.'
              ),
              tools: ['After Effects', 'Photoshop', 'Figma'],
            },
          },
          {
            id: 'wow-21st-aggregation',
            name: lt('21周年庆聚合页', '21st Anniversary Hub'),
            date: lt('2026.07', '2026.07'),
            role: lt('KV 制作 / UI 动效 / 状态反馈 / 页面动效 / 资源交付', 'KV production / UI motion / State feedback / Page motion / Delivery'),
            videos: [
              '/assets/videos/wow/wow-21st-aggregation.m3u8',
              '/assets/videos/wow/wow-21st-popup.m3u8',
            ],
            detail: {
              background: lt(
                '周年庆聚合页作为多个周年活动的统一入口，需要在同一页面中承载不同活动内容、入口状态及奖励信息。相比单一活动页面，动效需要更关注信息层级与状态识别，使玩家能够快速理解不同模块的可操作状态。',
                'The anniversary hub is a unified entry to multiple anniversary activities, carrying different campaign content, entry states and reward info on one page. Unlike a single activity page, motion must focus on hierarchy and state recognition so players can quickly tell which modules are actionable.'
              ),
              objectives: [
                lt('建立不同活动入口之间清晰的视觉层级', 'Build clear visual hierarchy between different activity entries'),
                lt('通过常态与提醒态区分不同页面状态', 'Use normal and alert states to distinguish page states'),
                lt('为按钮、Banner 与奖励入口提供明确反馈', 'Give buttons, banners and reward entries clear feedback'),
                lt('保持大量模块同时存在时的动态节奏统一', 'Keep pacing unified while many modules coexist'),
                lt('避免过多动画相互抢夺视觉焦点', 'Avoid too many animations competing for visual focus'),
              ],
              role: lt(
                '参与聚合页核心 UI 动效制作，围绕按钮交互、活动入口常态与提醒态、Banner 及奖励相关组件完成动态表现，并根据页面状态和实际实现需求进行资源整理与交付。',
                'Produced core UI motion for the hub — button interactions, normal/alert states of entries, banners and reward components — then organised and delivered assets per page state and implementation needs.'
              ),
              process: [
                lt('信息梳理', 'Info mapping'),
                lt('状态拆解', 'State breakdown'),
                lt('动效方案', 'Motion spec'),
                lt('UI 动效制作', 'UI animation'),
                lt('状态适配', 'State adaptation'),
                lt('评审调整', 'Review & iterate'),
                lt('资源交付', 'Asset delivery'),
                lt('上线走查', 'Post-launch QA'),
              ],
              delivery: [
                lt('根据不同入口的常态、提醒态与交互状态整理动画资源及参数', 'Organise animation assets and parameters per entry\'s normal, alert and interaction states'),
                lt('优先考虑相同组件之间的效果复用', 'Prioritise reuse of effects across shared components'),
                lt('配合开发核对触发逻辑、页面状态及最终还原效果', 'Verify trigger logic, page states and final fidelity with development'),
              ],
              result: lt(
                '完成多个活动入口及状态组件的动态设计，使周年庆聚合页在承载较多内容的情况下仍保持清晰的层级关系，并通过统一的反馈语言增强页面整体一致性。',
                'Delivered the motion for multiple entries and state components, keeping the content-heavy anniversary hub clearly layered and consistent through a unified feedback language.'
              ),
              tools: ['After Effects', 'Photoshop', 'Figma'],
            },
          },
          {
            id: 'wow-redpacket',
            name: lt('周年庆红包活动', 'Anniversary Red Packet'),
            date: lt('2026.07', '2026.07'),
            videos: [
              '/assets/videos/wow/wow-redpacket-loop.m3u8',
              '/assets/videos/wow/wow-redpacket-draw.m3u8',
            ],
            detail: {
              background: lt(
                '该项目为《魔兽世界》周年庆期间的互动活动页面，通过抽奖及奖励反馈形成完整的参与流程。动效需要同时承担页面氛围、操作反馈和中奖结果表现，在保持活动节奏的同时避免复杂效果影响信息读取。',
                'This is an interactive activity page during the World of Warcraft anniversary, forming a full participation loop through the draw and reward feedback. Motion carries the page atmosphere, interaction feedback and winning-result reveal while keeping the rhythm lively without hindering readability.'
              ),
              objectives: [
                lt('强化页面主视觉与活动氛围', 'Strengthen the page key visual and event atmosphere'),
                lt('为按钮及可操作区域提供明确反馈', 'Provide clear feedback on buttons and actionable areas'),
                lt('建立抽奖前后清晰的演出节奏', 'Establish a clear reveal rhythm around the draw'),
                lt('区分不同奖励结果的视觉层级', 'Differentiate the visual hierarchy of reward results'),
                lt('保证 PC 与移动端的动态体验一致', 'Keep the motion experience consistent on PC and mobile'),
              ],
              role: lt(
                '参与活动页面整体动态表现，包括主页面循环、UI 交互、抽奖过程及奖励反馈等内容，并根据 PC 与移动端页面结构完成适配、资源整理及效果确认。',
                'Produced the overall motion for the activity page — the main loop, UI interaction, draw process and reward feedback — then adapted to PC and mobile structures, organised assets and confirmed the effect.'
              ),
              process: [
                lt('需求理解', 'Understand brief'),
                lt('流程梳理', 'Flow mapping'),
                lt('动效方案', 'Motion spec'),
                lt('动效制作', 'Animation'),
                lt('多端适配', 'Responsive adaptation'),
                lt('评审调整', 'Review & iterate'),
                lt('资源交付', 'Asset delivery'),
                lt('效果走查', 'Effect QA'),
              ],
              delivery: [
                lt('根据页面表现分别整理循环动画、交互参数及抽奖演出相关资源', 'Organise loop animation, interaction parameters and draw-reveal assets by page behaviour'),
                lt('针对 PC 与移动端完成尺寸、状态及播放逻辑适配', 'Adapt size, states and playback logic for PC and mobile'),
                lt('配合开发完成页面效果还原', 'Support development in restoring the final page effect'),
              ],
              result: lt(
                '完成活动从页面浏览、操作反馈到抽奖及结果展示的主要动态表现，使不同交互阶段形成较完整的视觉反馈链路，并兼顾多端展示与实际落地需求。',
                'Delivered the main motion across browsing, interaction feedback and the draw-and-result reveal, forming a complete visual feedback loop through the stages while covering multi-device display and practical delivery.'
              ),
              tools: ['After Effects', 'Photoshop', 'Figma'],
            },
          },
        ],
        gallery: [],
      },
      {
        id: 'tianyu',
        name: lt('天谕', 'Revelation'),
        meta: lt('官网 / 版本页', 'Official site / Version page'),
        description: lt(
          '国服版本官网的动态设计：主视觉 KV 循环、移动端延展与内页标题入场，并尝试以 AIGC 辅助复杂画面动态制作。',
          'Motion design for the national-server version site — key-visual loop, mobile extension and inner-page title entrances, with AIGC assisting complex frame animation.'
        ),
        tags: ['WEB', 'KV MOTION', 'AIGC'],
        date: lt('2026.07', '2026.07'),
        role: lt('KV 动效 / AIGC 辅助 / 双端适配 / UI 动效', 'KV motion / AIGC assist / Responsive / UI motion'),
        projectType: lt('官网 / H5 / 版本内容', 'Official site / H5 / Version'),
        responsibility: [lt('KV 动效', 'KV motion'), lt('页面动效', 'Page motion')],
        mainType: lt('KV / 页面', 'KV / PAGE'),
        works: [
          {
            id: 'tianyu-liujin-zhiyi',
            name: lt('流金之翼', 'Golden Wings'),
            description: lt(
              '参与国服版本 FAB 官网动态设计，围绕 PC / 移动端 KV 循环及内页标题入场完成动效制作，并尝试使用 AIGC 辅助主视觉动态生成，提高复杂画面前期制作效率。',
              'Motion design for the national-server version FAB site — PC/mobile KV loops and inner-page title entrances, using AIGC to assist key-visual animation generation and speed up the early production of complex frames.'
            ),
            meta: lt('PC / 移动端官网', 'PC / Mobile site'),
            date: lt('2026.07', '2026.07'),
            role: lt('KV 动效 / AIGC 辅助 / 双端适配 / UI 动效', 'KV motion / AIGC assist / Responsive / UI motion'),
            tags: ['WEB', 'KV MOTION', 'AIGC'],
            videos: ['/assets/videos/tianyu/tianyu-liujin-zhiyi.m3u8'],
            detail: {
              background: lt(
                '该项目为版本内容展示型官网，通过主视觉及多个内容模块承接版本信息。页面动效以首屏 KV 为主要视觉重点，同时需要兼顾移动端延展和内页信息进入时的节奏衔接。',
                'This is a version-content showcase site, carrying version info through the key visual and multiple content modules. Motion centres on the above-the-fold KV, while also covering the mobile extension and the rhythm of inner-page content entrances.'
              ),
              objectives: [
                lt('通过 KV 循环强化版本主视觉表现', 'Reinforce the version key visual with the KV loop'),
                lt('使用 AIGC 辅助复杂画面动态制作与前期探索', 'Use AIGC to assist complex-frame animation and early exploration'),
                lt('完成 PC 横版向移动端竖版的动态延展', 'Extend the motion from PC landscape to mobile portrait'),
                lt('为内页标题补充简洁明确的入场反馈', 'Give inner-page titles simple, clear entrance feedback'),
                lt('保证主视觉效果与网页实现方式兼容', 'Keep the key visual compatible with the web implementation'),
              ],
              role: lt(
                '负责 PC 端 KV 循环、Slogan 资源、移动端 KV 竖版延展及内页标题入场动效；在 KV 制作中使用 AIGC 辅助人物与场景动态生成，并结合后期处理完成最终循环效果与网页资源输出。',
                'Produced the PC KV loop, Slogan assets, mobile portrait KV extension and inner-page title entrances; used AIGC to assist character and scene animation in the KV, then finished the loop and web assets through post-processing.'
              ),
              process: [
                lt('需求理解', 'Understand brief'),
                lt('动效方案', 'Motion spec'),
                lt('AIGC 动态预演', 'AIGC motion previs'),
                lt('KV 制作', 'KV production'),
                lt('后期调整', 'Post-processing'),
                lt('移动端延展', 'Mobile extension'),
                lt('UI 动效制作', 'UI animation'),
                lt('资源交付', 'Asset delivery'),
              ],
              delivery: [
                lt('根据网页实现方式分别输出 KV 视频、Slogan 序列及内页 UI 动效资源', 'Output KV video, Slogan sequences and inner-page UI motion assets per the web implementation'),
                lt('针对 PC 与移动端完成构图、循环和资源规格适配', 'Adapt composition, looping and asset specs for PC and mobile'),
              ],
              result: lt(
                '完成版本官网 PC / 移动端主视觉及内页基础动态设计，并将 AIGC 应用于 KV 动态制作流程，在保持视觉效果的同时提高前期动态探索与制作效率。',
                'Delivered the PC/mobile key visual and inner-page motion for the version site, applying AIGC to the KV workflow to improve early exploration and production efficiency without sacrificing the visual result.'
              ),
              tools: ['After Effects', 'Photoshop', 'AIGC Tools'],
            },
          },
        ],
        gallery: [],
      },
      {
        id: 'qingnv',
        name: lt('倩女幽魂', 'Qingnv'),
        meta: lt('官网 / H5活动页', 'Official site / H5 campaign'),
        description: lt(
          '倩女端游赛事与活动专题的动态设计：围绕赛事主视觉、Slogan 与页面入口完成 KV、UI 动效及多端适配。',
          'Motion design for Qingnv esports and campaign pages — KV, UI motion and responsive adaptation around the event key visual, Slogan and page entries.'
        ),
        tags: ['ESPORTS', 'KV MOTION', 'WEB'],
        date: lt('2026', '2026'),
        role: lt('KV 动效 / UI 动效 / 多端适配', 'KV motion / UI motion / Responsive'),
        projectType: lt('赛事专题 / 官网', 'Esports campaign / Site'),
        responsibility: [lt('KV 动效', 'KV motion'), lt('Slogan', 'Slogan'), lt('UI 动效', 'UI motion')],
        mainType: lt('KV / UI', 'KV / UI'),
        works: [
          {
            id: 'qingnv-national-cup',
            name: lt('全民争霸赛', 'National Championship'),
            description: lt(
              '参与倩女端游年度赛事专题动态设计，围绕赛事主视觉 KV、Slogan 与核心入口完成入场及循环表现，并配合年度视觉更新完成页面动态适配与资源交付。',
              'Motion design for the annual esports campaign — KV, Slogan and core-entry entrance and loop animation, adapted with the yearly visual refresh and delivered as page-ready assets.'
            ),
            meta: lt('PC / 移动端网页', 'PC / Mobile web'),
            date: lt('2026.07', '2026.07'),
            role: lt('KV 动效 / Slogan 动效 / UI 动效 / 多端适配', 'KV motion / Slogan motion / UI motion / Responsive'),
            tags: ['ESPORTS', 'KV MOTION', 'WEB'],
            videos: ['/assets/videos/qingnv/qingnv-national-cup.m3u8'],
            detail: {
              background: lt(
                '全民争霸赛是倩女端游周期性赛事专题，本期在既有赛事页面框架基础上进行年度内容与视觉更新。动效需要配合新的赛事视觉建立首屏氛围，同时保证页面信息与赛事入口清晰易读。',
                'The National Championship is a recurring esports campaign for Qingnv. This run refreshes the yearly content and visuals on the existing campaign framework — motion builds the above-the-fold atmosphere around the new event key visual while keeping page info and entries clear.'
              ),
              objectives: [
                lt('强化赛事首屏的氛围与视觉冲击', 'Strengthen the atmosphere and visual impact of the event first screen'),
                lt('建立 KV 入场与循环之间自然的节奏衔接', 'Create a natural rhythmic bridge between the KV entrance and its loop'),
                lt('通过 Slogan 与按钮动效强化核心信息和入口', 'Use Slogan and button motion to emphasise the core message and entries'),
                lt('保证不同终端下的动态表现稳定统一', 'Keep the motion stable and consistent across devices'),
              ],
              role: lt(
                '参与赛事首页 KV、Slogan 与按钮等核心动态内容制作，完成入场、循环及移动端适配，并根据页面实现需求整理对应资源。',
                'Produced the KV, Slogan and button motion for the campaign home, handled entrance, loop and mobile adaptation, then prepared the corresponding assets for the page implementation.'
              ),
              process: [
                lt('需求理解', 'Understand brief'),
                lt('动效方案', 'Motion spec'),
                lt('素材整理', 'Asset prep'),
                lt('KV 动效制作', 'KV animation'),
                lt('UI 动效制作', 'UI animation'),
                lt('多端适配', 'Responsive adaptation'),
                lt('评审调整', 'Review & iterate'),
                lt('资源交付', 'Asset delivery'),
              ],
              delivery: [
                lt('根据网页实现方式分别整理 KV 视频、Slogan 及按钮等动态资源', 'Prepare KV video, Slogan and button assets per the web implementation'),
                lt('针对 PC 与移动端完成尺寸、循环和播放状态检查', 'Check size, looping and playback state for PC and mobile'),
                lt('配合开发进行效果确认', 'Confirm the effect with development'),
              ],
              result: lt(
                '完成赛事专题核心首屏的入场与循环动态表现，使年度赛事视觉在保持信息清晰的同时具有更完整的氛围与节奏。',
                'Delivered the entrance and loop motion for the campaign\'s core first screen, giving the yearly event visual a fuller atmosphere and rhythm while keeping information clear.'
              ),
              tools: ['After Effects', 'Photoshop', 'Figma'],
            },
          },
          {
            id: 'qingnv-guild-arena',
            name: lt('帮会竞擂', 'Guild Arena'),
            description: lt(
              '参与倩女端游帮会赛事专题动态设计，围绕赛事主视觉、Slogan 与页面按钮完成入场及循环效果，为新赛事建立统一的视觉节奏与页面反馈。',
              'Motion design for the guild esports campaign — entrance and loop animation around the event key visual, Slogan and page buttons, building a unified visual rhythm and page feedback for the new tournament.'
            ),
            meta: lt('PC / 移动端网页', 'PC / Mobile web'),
            date: lt('2026.07', '2026.07'),
            role: lt('KV 动效 / Slogan 动效 / UI 动效 / 资源交付', 'KV motion / Slogan motion / UI motion / Asset delivery'),
            tags: ['ESPORTS', 'UI MOTION', 'KV'],
            videos: ['/assets/videos/qingnv/qingnv-guild-arena.m3u8'],
            detail: {
              background: lt(
                '帮会竞擂是倩女端游赛事专题页面，通过独立页面承载赛事介绍、赛程及相关内容。动效主要集中于首屏和核心操作区域，需要在赛事氛围与信息可读性之间保持平衡。',
                'Guild Arena is a dedicated esports page for Qingnv, carrying the tournament intro, schedule and related content on its own page. Motion concentrates on the first screen and key action areas, balancing event atmosphere with readability.'
              ),
              objectives: [
                lt('通过 KV 入场建立赛事首屏氛围', 'Use the KV entrance to establish the event first-screen atmosphere'),
                lt('使用循环表现维持页面视觉活力', 'Keep the page visually alive with looping motion'),
                lt('强化 Slogan 与核心按钮的视觉层级', 'Strengthen the hierarchy of the Slogan and core buttons'),
                lt('保持页面动效风格与赛事整体视觉统一', 'Keep the page motion consistent with the event\'s overall visual'),
              ],
              role: lt(
                '参与赛事专题 KV、Slogan 与按钮动效制作，根据页面视觉完成入场和循环方案，并整理网页端可接入的动态资源。',
                'Produced the KV, Slogan and button motion for the campaign, designed entrance and loop approaches around the page visual, and organised web-ready animation assets.'
              ),
              process: [
                lt('需求理解', 'Understand brief'),
                lt('动效方案', 'Motion spec'),
                lt('素材整理', 'Asset prep'),
                lt('动效制作', 'Animation'),
                lt('页面适配', 'Page adaptation'),
                lt('评审调整', 'Review & iterate'),
                lt('资源交付', 'Asset delivery'),
                lt('效果确认', 'Effect confirmation'),
              ],
              delivery: [
                lt('根据页面实现方式输出主视觉视频及 UI 动效资源', 'Output key-visual video and UI motion assets per the page implementation'),
                lt('区分入场与循环状态，并配合开发确认页面最终呈现', 'Separate entrance and loop states, then confirm the final page look with development'),
              ],
              result: lt(
                '完成赛事专题首屏与核心 UI 的动态表现，通过主视觉、文字和按钮之间的节奏关系强化赛事感与页面完整度。',
                'Delivered the motion for the campaign first screen and core UI, reinforcing the esports feel and page completeness through the rhythm between key visual, text and buttons.'
              ),
              tools: ['After Effects', 'Photoshop', 'Figma'],
            },
          },
        ],
        gallery: [],
      },
      {
        id: 'rd',
        name: lt('在研项目', 'In-development title'),
        meta: lt('官网 / 保密项目', 'Official site / Confidential'),
        description: lt(
          '尚未公开的在研产品端外动效，涉及内容以脱敏形式呈现。',
          'Off-client motion for an unannounced in-development title, presented in desensitised form.'
        ),
        tags: ['KV MOTION', 'NDA', 'H5'],
        date: lt('2026.08', '2026.08'),
        role: lt('KV动效 / 动效方案', 'KV motion / Motion spec'),
        projectType: lt('在研 / 动效探索', 'In-dev / Motion exploration'),
        responsibility: [lt('方案预演', 'Previs'), lt('动效制作', 'Motion production')],
        mainType: lt('PREVIS', 'PREVIS'),
        deliveryStatus: lt('进行中', 'IN PROGRESS'),
        launchStatus: lt('—', '—'),
        works: [
          {
            id: 'rd-mini-program',
            name: lt('雾海之下预约小程序', 'Fogsea Pre-registration Mini-program'),
            videos: ['/assets/videos/rd/rd-mini-program.m3u8'],
          },
          {
            id: 'rd-official-demo',
            name: lt('雾海之下首测官网动效', 'Fogsea First-test Site Motion'),
            videos: ['/assets/videos/rd/rd-official-demo.m3u8'],
          },
        ],
        gallery: [],
      },
    ],
  },

  {
    id: 'game-ui-motion-studies',
    slug: 'game-ui-motion-studies',
    index: '02',
    title: 'GAME UI MOTION STUDIES',
    titleZh: lt('游戏UI动效练习', 'Game UI Motion Studies'),
    category: lt(
      'UI 动效 / 视觉预演 / 引擎实践',
      'UI Motion / Visual Previs / Engine Practice'
    ),
    categories: ['featured', 'game-ui'],
    year: '2025 — 2026',
    featured: true,
    priority: 1,
    status: 'LEARNING',
    accent: 'var(--accent-pink)',
    description: lt(
      '围绕游戏 UI 动效的设计与实时实现持续进行系统练习，以 AE 完成视觉预演，并通过 UE5 与 Unity 探索实时引擎中的界面动画、材质与特效表现，重点训练节奏设计、UI 层级、交互反馈及从预演到引擎实现的转换能力。',
      'A continuous, systematic practice of game UI motion from design to real-time implementation — visual previs in AE, then UE5 and Unity explorations of UI animation, materials and effects, building pacing, hierarchy, interaction feedback and the ability to translate a previs into engine.'
    ),
    role: [
      lt('动效预演', 'Motion previs'),
      lt('节奏设计', 'Pacing design'),
      lt('UI 层级组织', 'UI hierarchy'),
      lt('光效制作', 'Light effects'),
      lt('反馈逻辑设计', 'Feedback logic'),
      lt('实时引擎实践', 'Real-time engine practice'),
    ],
    tools: ['After Effects', 'Photoshop', 'Figma', 'Unreal Engine 5', 'Unity'],
    services: ['MOTION PREVIS', 'UI MOTION', 'REAL-TIME FX', 'ENGINE PRACTICE'],
    cover: '/assets/images/project-02-cover.jpg',
    /* 一级预览视频指向实际存在的案例视频（旧 mp4 文件不存在） */
    video: '/assets/videos/game-ui/lobby-main-menu.m3u8',
    gallery: [],
    metrics: [
      { label: 'STUDIES', value: '8' },
      { label: 'FOCUS', value: 'UI MOTION' },
      { label: 'ENGINE', value: 'UE5 / UNITY' },
    ],
    sections: [
      {
        id: 'background',
        label: 'PROJECT BACKGROUND',
        labelZh: lt('项目背景', 'Project background'),
        body: [
          lt(
            '游戏UI动效和普通网页动效最大的差别，是它必须同时服务于"信息传达"和"情绪反馈"。一个奖励弹窗如果只是淡入，玩家不会感到获得感；抽卡动画如果节奏不对，稀有度的层级就立不住。',
            'The big difference between game UI motion and ordinary web motion is that it has to serve both information and emotion at once. A reward popup that merely fades in gives no sense of gain; if a gacha sequence is mistimed, the rarity hierarchy collapses.'
          ),
          lt(
            '这组练习按界面类型逐个拆解，目标是建立一套可复用的节奏与层级判断。',
            'These studies work through interface types one by one, aiming to build reusable judgement about pacing and hierarchy.'
          ),
        ],
      },
      {
        id: 'scope',
        label: 'STUDY SCOPE',
        labelZh: lt('练习范围', 'Study scope'),
        list: [
          lt('主界面入场', 'Main screen entrance'),
          lt('奖励弹窗', 'Reward popup'),
          lt('抽卡动画', 'Gacha sequence'),
          lt('按钮Hover与点击反馈', 'Button hover and press feedback'),
          lt('卡片获得', 'Card acquisition'),
          lt('页面转场', 'Page transitions'),
          lt('战斗状态UI', 'Combat state UI'),
          lt('加载动画', 'Loading animation'),
        ],
      },
      {
        id: 'objective',
        label: 'MOTION OBJECTIVE',
        labelZh: lt('动效目标', 'Motion objective'),
        list: [
          lt(
            '用时序差建立UI层级，让玩家先看到该看的元素',
            'Use timing offsets to build hierarchy so players see the right element first'
          ),
          lt(
            '把"获得感"拆成可控参数：预备、爆发、余韵、收束',
            'Break the sense of reward into controllable beats: anticipation, burst, afterglow, settle'
          ),
          lt(
            '给每个交互态设计明确反馈，避免点击后无响应感',
            'Give every interaction state clear feedback so taps never feel dead'
          ),
          lt(
            '控制单次演出时长，保证重复操作时不产生疲劳',
            'Keep each sequence short enough to survive repeated use'
          ),
        ],
      },
      {
        id: 'role',
        label: 'MY ROLE',
        labelZh: lt('我的职责', 'My role'),
        list: [
          lt(
            '拆解界面结构，规划动效层级与出场顺序',
            'Break down interface structure, plan motion hierarchy and entrance order'
          ),
          lt(
            '设计节奏曲线与缓动，确定每段的时长配比',
            'Design pacing curves and easing, set the duration ratio of each beat'
          ),
          lt(
            '制作光效、粒子与遮罩等辅助元素',
            'Produce supporting light, particle and mask elements'
          ),
          lt(
            '定义交互反馈逻辑（Normal / Hover / Press / Disabled）',
            'Define interaction feedback logic (normal / hover / press / disabled)'
          ),
          lt(
            '在UE5与Unity中复现部分方案，验证可实现性',
            'Rebuild selected concepts in UE5 and Unity to validate feasibility'
          ),
        ],
      },
      {
        id: 'process',
        label: 'PROCESS',
        labelZh: lt('制作流程', 'Process'),
        flow: [
          lt('参考拆解', 'Reference analysis'),
          lt('结构分层', 'Layer structure'),
          lt('节奏草案', 'Pacing draft'),
          lt('动效制作', 'Animation'),
          lt('光效叠加', 'Light effects'),
          lt('引擎复现', 'Engine rebuild'),
          lt('对比复盘', 'Comparative review'),
        ],
      },
      {
        id: 'result',
        label: 'FINAL RESULT',
        labelZh: lt('最终呈现', 'Final result'),
        body: [
          lt(
            '形成一套按界面类型分类的动效参考库，包含节奏配比、层级顺序与缓动选择的判断依据，可直接用于实际项目的方案撰写。',
            'The result is a motion reference library organised by interface type, documenting pacing ratios, hierarchy order and easing rationale — directly reusable when writing specs for real projects.'
          ),
        ],
      },
    ],
    /* UI动效子层级：按实现环境展开的案例目录（AE 预演 → UE → Unity） */
    cases: [
      {
        id: 'ae-previs',
        name: lt('AE 预演', 'After Effects Previs'),
        meta: lt('动效预演', 'Motion previs'),
        description: lt(
          '主战场在AE：完成主界面入场、奖励弹窗、抽卡演出与按钮反馈的动效预演，输出节奏、缓动与层级参数供引擎复现。',
          'The main studio — main screen entrances, reward popups, gacha sequences and button feedback, delivering pacing / easing / hierarchy parameters for engine rebuild.'
        ),
        tags: ['AFTER EFFECTS', 'PACING', 'PREVIS'],
        date: lt('2026.05', '2026.05'),
        role: lt('动效预演 / 节奏设计', 'Motion previs / Pacing design'),
        projectType: lt('UI 动效 / 视觉预演', 'UI motion / Visual previs'),
        responsibility: [lt('节奏设计', 'Pacing design'), lt('动效预演', 'Motion previs')],
        mainType: lt('预演', 'PREVIS'),
        works: [
          {
            id: 'ae-sci-fi-win',
            name: lt('科技风胜利结算', 'Sci-fi Victory Settlement'),
            videos: ['/assets/videos/game-ui/ae-sci-fi-win.m3u8'],
            description: lt(
              '科技风胜利结算的动效预演：结算数据展示、等级跃升与胜利反馈的节奏与光效表现。',
              'A motion previs for a sci-fi victory settlement — result data, level-up and victory feedback with pacing and light effects.'
            ),
            meta: lt('动效预演', 'Motion previs'),
            date: lt('2026.05', '2026.05'),
            role: lt('动效预演 / 光效制作', 'Motion previs / Light effects'),
            tags: ['AE', 'VFX', 'VICTORY'],
            detail: {
              background: lt(
                '胜利结算作为局末的关键反馈界面，需要在短时间内完成数据展示与情绪收束。预演围绕科技风格，用光效与节奏强化结算时刻的完成感。',
                'A victory settlement closes a match and must deliver data and emotion quickly. The previs uses a sci-fi look — light effects and pacing — to strengthen the sense of completion.'
              ),
              objectives: [
                lt('强化结算数据的层级与阅读顺序', 'Layer the result data and its reading order'),
                lt('用光效与节奏营造胜利的完成感', 'Use light and pacing to build a sense of victory'),
                lt('控制结算总时长，避免拖沓', 'Keep the settlement short and snappy'),
              ],
              role: lt(
                '完成胜利结算的数据展示与光效动效预演，输出完整动画与参数说明。',
                'Produced the victory settlement motion previs — data reveal and light effects — with full animation and parameter notes.'
              ),
              process: [
                lt('节奏草案', 'Pacing draft'),
                lt('光效设计', 'Light design'),
                lt('动效制作', 'Animation'),
                lt('效果调整', 'Effect tuning'),
              ],
              result: lt(
                '完成科技风胜利结算的动效预演，让局末反馈在短时间内形成清晰的完成感。',
                'Completed the sci-fi victory settlement previs, delivering a clear sense of completion in a short window.'
              ),
              tools: ['After Effects', 'Photoshop'],
            },
          },

          {
            id: 'gongxi-gacha',
            name: lt('恭喜获得 抽卡动效', 'Congratulations Gacha Reward'),
            videos: ['/assets/videos/game-ui/gongxi-gacha.m3u8'],
            description: lt(
              '游戏抽卡「恭喜获得」反馈的动效预演：获得结果揭晓、卡面展示与庆祝反馈的节奏与光效表现，强化稀有度层级与获得感。',
              'A motion previs for the in-game gacha "Congratulations" reward feedback — result reveal, card display and celebration beats, paced and layered to strengthen rarity hierarchy and the sense of gain.'
            ),
            meta: lt('动效预演', 'Motion previs'),
            date: lt('2026.05', '2026.05'),
            role: lt('动效预演 / 光效制作', 'Motion previs / Light effects'),
            tags: ['AE', 'GACHA', 'REWARD'],
            detail: {
              background: lt(
                '「恭喜获得」是抽卡 / 开箱后的核心奖励反馈界面，需要在极短时间内完成结果揭晓与情绪收束。预演围绕获得反馈的预备、爆发与余韵节奏，用光效与粒子突出稀有度层级。',
                '"Congratulations" is the core reward feedback after a gacha draw — it must reveal the result and close the emotional beat in moments. The previs focuses on anticipation, burst and afterglow, using light and particles to highlight rarity hierarchy.'
              ),
              objectives: [
                lt('用预备—爆发—余韵的节奏强化获得反馈', 'Use anticipation-burst-afterglow pacing to strengthen the reward feedback'),
                lt('通过光效与粒子突出稀有度层级', 'Use light and particles to emphasise rarity hierarchy'),
                lt('控制演出时长，保证高频抽卡不疲劳', 'Keep the sequence short enough for repeated draws'),
              ],
              role: lt(
                '完成「恭喜获得」抽卡反馈的整体动效预演，从节奏编排到光效叠加输出完整动画与参数说明。',
                'Produced the full gacha "Congratulations" motion previs — from pacing to light effects, delivering complete animation with parameter notes.'
              ),
              process: [
                lt('参考拆解', 'Reference analysis'),
                lt('节奏草案', 'Pacing draft'),
                lt('动效制作', 'Animation'),
                lt('光效叠加', 'Light effects'),
                lt('反馈打磨', 'Feedback polish'),
              ],
              result: lt(
                '完成抽卡「恭喜获得」反馈的动效预演，让结果揭晓在短时间内形成清晰的获得情绪。',
                'Completed the gacha "Congratulations" reward previs, delivering a clear sense of gain the moment the result is revealed.'
              ),
              tools: ['After Effects', 'Photoshop'],
            },
          },

          {
            id: 'ae-7day-signin',
            name: lt('二次元-七日签到', 'Anime 7-day Sign-in'),
            videos: ['/assets/videos/game-ui/erciyuan-7day-signin.m3u8'],
            description: lt(
              '二次元题材七日签到的动效预演：奖励弹窗、进度反馈与领取状态的节奏与层级设计。',
              'A motion previs for an anime-style 7-day sign-in — reward popups, progress feedback and claim states, paced and layered.'
            ),
            meta: lt('动效预演', 'Motion previs'),
            date: lt('2026.05', '2026.05'),
            role: lt('动效预演 / 节奏设计', 'Motion previs / Pacing design'),
            tags: ['AE', 'REWARD', 'UI MOTION'],
            detail: {
              background: lt(
                '七日签到是常见的活动型界面，需要兼顾每日打卡的重复感与奖励获得的期待感。预演重点处理签到进度、奖励弹窗与领取反馈之间的节奏关系。',
                'A 7-day sign-in is a recurring event screen balancing repetition with the anticipation of rewards. The previs focuses on the rhythm between sign-in progress, reward popups and claim feedback.'
              ),
              objectives: [
                lt('让奖励弹窗与领取反馈有明确的获得情绪', 'Give reward popups and claim feedback a clear sense of gain'),
                lt('通过进度动效降低每日打卡的重复感', 'Use progress motion to reduce the repetitiveness of daily sign-in'),
                lt('区分未领取、已领取与可领取三种状态', 'Distinguish unclaimed, claimed and claimable states'),
              ],
              role: lt(
                '完成签到进度、奖励弹窗与领取状态的整体动效预演，输出节奏与层级参数。',
                'Produced the full sign-in motion previs — progress, reward popup and claim states — with pacing and hierarchy parameters.'
              ),
              process: [
                lt('状态梳理', 'State mapping'),
                lt('节奏草案', 'Pacing draft'),
                lt('动效制作', 'Animation'),
                lt('反馈打磨', 'Feedback polish'),
              ],
              result: lt(
                '完成七日签到的奖励与状态动效预演，让每日打卡在重复中保持一定的获得体验。',
                'Completed the reward and state motion previs for the 7-day sign-in, keeping the daily routine rewarding.'
              ),
              tools: ['After Effects', 'Photoshop'],
            },
          },

          {
            id: 'ae-lobby',
            name: lt('Lobby', 'Lobby'),
            videos: [
              '/assets/videos/game-ui/lobby-main-menu.m3u8',
              '/assets/videos/game-ui/lobby-game-start.m3u8',
              '/assets/videos/game-ui/lobby-card.m3u8',
              '/assets/videos/game-ui/lobby-signin.m3u8',
            ],
            description: lt(
              '围绕游戏主界面的完整动效预演练习：主界面入场、按钮反馈、卡片与签到等模块的动态节奏与层级设计。',
              'A motion-previs practice around the game lobby — entrance, button feedback, cards and sign-in modules, exploring pacing and hierarchy.'
            ),
            meta: lt('动效预演', 'Motion previs'),
            date: lt('2026.05', '2026.05'),
            role: lt('动效预演 / 节奏设计', 'Motion previs / Pacing design'),
            tags: ['AE', 'PACING', 'UI MOTION'],
            detail: {
              background: lt(
                'Lobby 预演以游戏主界面为对象，覆盖入场、按钮、卡片与签到等高频交互模块，用 AE 完成一套从信息层级到反馈节奏的完整动效方案。',
                'The Lobby previs targets a game main screen — entrance, buttons, cards and sign-in — building a complete AE motion concept from information hierarchy to feedback pacing.'
              ),
              objectives: [
                lt('用错峰时序建立主界面的信息层级', 'Build main-screen hierarchy through staggered timing'),
                lt('为高频按钮与卡片补齐明确反馈', 'Give frequent buttons and cards clear feedback'),
                lt('统一模块间节奏，避免重复操作疲劳', 'Keep pacing consistent across modules to avoid fatigue'),
              ],
              role: lt(
                '独立完成 Lobby 相关模块的动效预演，从层级拆解到节奏编排输出完整 AE 动画与参数说明。',
                'Independently produced the Lobby motion previs — from hierarchy breakdown to pacing, delivering full AE animation with parameter notes.'
              ),
              process: [
                lt('界面拆解', 'Interface breakdown'),
                lt('节奏草案', 'Pacing draft'),
                lt('动效制作', 'Animation'),
                lt('光效叠加', 'Light effects'),
                lt('对比复盘', 'Comparative review'),
              ],
              result: lt(
                '完成一套覆盖主界面入场、按钮、卡片与签到的动效预演，形成节奏、层级与缓动的参考依据。',
                'Completed a motion previs covering lobby entrance, buttons, cards and sign-in, forming a reference for pacing, hierarchy and easing.'
              ),
              tools: ['After Effects', 'Photoshop'],
            },
          },
        ],
        gallery: [],
      },
      {
        id: 'ue5',
        name: lt('UE5 UI 动效实践', 'UE5 UI Motion Practice'),
        meta: lt('Unreal Engine 5', 'Unreal Engine 5'),
        description: lt(
          '围绕 Unreal Engine 5 的游戏 UI 动效与实时特效进行持续学习，目前已完成图标动效类实践，并逐步扩展至界面动画、交互反馈、材质、粒子特效与页面转场等方向，重点建立从视觉设计到实时引擎实现的基础能力。',
          'A continuous self-directed study of game UI motion and real-time effects in Unreal Engine 5 — icon-motion practice completed so far, gradually extending into UI animation, interaction feedback, materials, particles and page transitions, building the fundamentals from visual design to real-time engine implementation.'
        ),
        tags: ['UE5', 'UI MOTION', 'REAL-TIME'],
        date: lt('2026.07', '2026.07'),
        role: lt('UI 动效 / 实时特效 / 引擎实践', 'UI motion / Real-time FX / Engine practice'),
        projectType: lt('实时引擎 / 自学实践', 'Real-time engine / Self-study'),
        responsibility: [lt('UI 动效', 'UI motion'), lt('材质特效', 'Material & FX')],
        mainType: lt('UI / 材质', 'UI / MATERIAL'),
        deliveryStatus: lt('持续学习', 'CONTINUING'),
        launchStatus: lt('进行中', 'IN PROGRESS'),
        statusLabel: lt('持续学习', 'CONTINUING LEARNING'),
        works: [
          {
            id: 'ue5-icon-motion',
            name: lt('图标动效实践', 'Icon Motion Practice'),
            description: lt(
              '围绕 Unreal Engine 5 的游戏 UI 动效与实时特效进行持续学习，目前已完成图标动效类实践，并逐步扩展至界面动画、交互反馈、材质、粒子特效与页面转场等方向。',
              'A continuous self-directed study of game UI motion and real-time effects in Unreal Engine 5 — icon-motion practice completed so far, extending into UI animation, feedback, materials, particles and page transitions.'
            ),
            meta: lt('Unreal Engine 5', 'Unreal Engine 5'),
            date: lt('2026.07', '2026.07'),
            role: lt('UI 动效 / 实时特效 / 引擎实践', 'UI motion / Real-time FX / Engine practice'),
            tags: ['UE5', 'UI MOTION', 'REAL-TIME'],
            videos: [
              '/assets/videos/game-ui/ue5-icon-motion-1.m3u8',
              '/assets/videos/game-ui/ue5-icon-motion-2.m3u8',
            ],
            detail: {
              background: lt(
                'UE5 实践主要用于补充实时引擎中的 UI 动效能力，将原本以 AE 为主的视觉预演进一步延伸到实际引擎环境。学习重点从单纯的时间轴动画逐步扩展到界面层级、实时材质、粒子特效、状态逻辑与资源组织。',
                'The UE5 practice supplements UI motion capability inside a real-time engine, extending the AE-based visual previs into an actual engine environment. The focus moves from simple timeline animation toward interface hierarchy, real-time materials, particles, state logic and asset organisation.'
              ),
              objectivesTitle: ['学习方向', 'STUDY FOCUS'],
              objectives: [
                lt('UI 图标与界面元素动效', 'UI icons and interface element motion'),
                lt('系统界面入场与模块衔接', 'System screen entrances and module transitions'),
                lt('弹窗与通用 UI 动效', 'Popups and general UI motion'),
                lt('任务提示与状态反馈', 'Task prompts and state feedback'),
                lt('Loading 与等待状态表现', 'Loading and waiting states'),
                lt('卡牌与页面转场', 'Card and page transitions'),
                lt('Banner 与活动界面表现', 'Banners and event screens'),
                lt('材质动画与实时视觉效果', 'Material animation and real-time visuals'),
                lt('粒子及 UI 特效', 'Particles and UI effects'),
                lt('蓝图与基础交互逻辑', 'Blueprint and basic interaction logic'),
                lt('UI 数据与组件组织', 'UI data and component organisation'),
              ],
              roleTitle: ['实践内容', 'PRACTICE'],
              role: lt(
                '目前以 UI 图标动效作为阶段性完成案例，从素材整理、层级搭建到实时动画与效果调整完成基础实践；后续结合不同类型的游戏 UI 场景，逐步学习界面动画、材质、粒子、转场及蓝图逻辑，并通过实际案例验证不同实现方式。',
                'So far, icon motion stands as the completed phase — from asset prep and layer setup to real-time animation and effect tuning. Moving forward, different game UI scenarios will guide the gradual study of interface animation, materials, particles, transitions and blueprint logic, validated through real cases.'
              ),
              process: [
                lt('视觉分析', 'Visual analysis'),
                lt('素材整理', 'Asset prep'),
                lt('UI 层级搭建', 'UI layer setup'),
                lt('动画制作', 'Animation'),
                lt('特效与材质', 'Effects & materials'),
                lt('实时预览', 'Real-time preview'),
                lt('效果调整', 'Effect tuning'),
                lt('学习复盘', 'Study review'),
              ],
              result: lt(
                '目前已完成 UI 图标动效类阶段性实践，并持续扩展不同游戏 UI 场景下的实时动效能力。通过练习逐步理解视觉预演与实时引擎之间在层级、资源、特效和触发逻辑上的实现差异。',
                'Icon-motion practice is complete as a first phase, with real-time UI motion capability expanding across scenarios. Through practice I\'m building an understanding of how visual previs differs from a real-time engine in hierarchy, assets, effects and trigger logic.'
              ),
              tools: ['Unreal Engine 5', 'After Effects', 'Photoshop'],
              studyTechTitle: ['学习技术', 'TECH STUDY'],
              studyTech: [
                lt('UMG', 'UMG'),
                lt('Sequencer', 'Sequencer'),
                lt('Material', 'Material'),
                lt('Niagara', 'Niagara'),
                lt('Blueprint', 'Blueprint'),
              ],
            },
          },
        ],
        gallery: [],
      },
      {
        id: 'unity',
        name: lt('Unity UI 动效实践', 'Unity UI Motion Practice'),
        meta: lt('Unity', 'Unity'),
        description: lt(
          '围绕游戏 UI 动效与实时特效完成 Unity 专项实践，将界面动画、Shader 与 Particle System 结合用于动态表现，重点训练视觉预演向实时引擎效果转换时的节奏、层级与特效组织能力。',
          'A dedicated UI motion practice in Unity combining interface animation, Shader and Particle System for dynamic presentation — training pacing, hierarchy and effect organisation when translating a visual previs into a real-time engine.'
        ),
        tags: ['UNITY', 'SHADER', 'PARTICLE SYSTEM'],
        date: lt('2026.04', '2026.04'),
        role: lt('UI 动效 / Shader / 实时特效', 'UI motion / Shader / Real-time FX'),
        projectType: lt('实时引擎 / 专项实践', 'Real-time engine / Practice'),
        responsibility: [lt('UI 动效', 'UI motion'), lt('Shader', 'Shader'), lt('粒子', 'Particles')],
        mainType: lt('UI / SHADER', 'UI / SHADER'),
        works: [
          {
            id: 'unity-chest-open',
            name: lt('UI 动效专项实践', 'UI Motion Practice'),
            description: lt(
              '围绕游戏 UI 动效与实时特效完成 Unity 专项实践，将界面动画、Shader 与 Particle System 结合用于动态表现，重点训练视觉预演向实时引擎效果转换时的节奏、层级与特效组织能力。',
              'A dedicated UI motion practice in Unity combining interface animation, Shader and Particle System for dynamic presentation — training pacing, hierarchy and effect organisation when translating a visual previs into a real-time engine.'
            ),
            meta: lt('Unity', 'Unity'),
            date: lt('2026.04', '2026.04'),
            role: lt('UI 动效 / Shader / 实时特效', 'UI motion / Shader / Real-time FX'),
            tags: ['UNITY', 'SHADER', 'PARTICLE SYSTEM'],
            videos: ['/assets/videos/game-ui/unity-chest-open.m3u8'],
            detail: {
              background: lt(
                '该练习围绕游戏 UI 的实时动态表现展开，需要将界面动画与引擎特效结合，在有限的界面结构中建立清晰的动态层级，并通过实时材质和粒子效果增强视觉反馈。',
                'This practice focuses on real-time UI dynamics — combining interface animation with engine effects, building clear dynamic hierarchy within a limited UI structure, and using real-time materials and particles to enrich visual feedback.'
              ),
              objectives: [
                lt('将 UI 动画与实时特效组合为完整视觉表现', 'Combine UI animation and real-time effects into a complete visual'),
                lt('通过节奏与层级控制界面信息阅读顺序', 'Control the reading order of interface info through pacing and hierarchy'),
                lt('使用 Shader 丰富界面材质和动态质感', 'Use Shader to enrich interface materials and dynamic texture'),
                lt('使用 Particle System 补充粒子与氛围反馈', 'Use Particle System for particles and atmosphere feedback'),
                lt('验证 AE 动效思路在 Unity 环境中的实现方式', 'Validate how AE motion ideas translate into the Unity environment'),
              ],
              roleTitle: ['实践内容', 'PRACTICE'],
              role: lt(
                '独立完成界面动态表现的整理与制作，在 Unity 中结合 Animation、Shader 与 Particle System 实现 UI 动画及实时特效，并根据最终画面效果调整动画节奏、层级与视觉反馈。',
                'Independently organised and produced the interface dynamics — using Animation, Shader and Particle System in Unity for UI animation and real-time effects, then tuning pacing, hierarchy and visual feedback against the final picture.'
              ),
              process: [
                lt('界面分析', 'Interface analysis'),
                lt('素材整理', 'Asset prep'),
                lt('UI 层级搭建', 'UI layer setup'),
                lt('Animation 制作', 'Animation'),
                lt('Shader 表现', 'Shader'),
                lt('Particle 特效', 'Particle effects'),
                lt('实时调整', 'Real-time tuning'),
                lt('最终整合', 'Final integration'),
              ],
              result: lt(
                '完成一套游戏 UI 实时动效专项实践，将基础界面动画与 Shader、粒子系统结合，进一步理解视觉动效进入实时引擎后的资源组织、效果组合与表现差异。',
                'Completed a dedicated real-time UI motion practice, combining basic interface animation with Shader and particle systems — deepening the understanding of asset organisation, effect combination and presentation differences once visual motion enters a real-time engine.'
              ),
              tools: ['Unity', 'After Effects', 'Photoshop'],
              studyTechTitle: ['技术应用', 'TECH APPLIED'],
              studyTech: [
                lt('Animation', 'Animation'),
                lt('Shader', 'Shader'),
                lt('Particle System', 'Particle System'),
              ],
            },
          },
        ],
        gallery: [],
      },
    ],
  },

  /* ══════════════════ 第二优先级 ══════════════════ */
  {
    id: 'game-ad-films',
    slug: 'game-ad-films',
    index: '03',
    title: 'GAME AD FILMS',
    titleZh: lt('游戏广告视频', 'Game Ad Films'),
    category: lt('BGC / 原生化 / PUGC / KOL / 混剪', 'BGC / Native / PUGC / KOL / Mixed cut'),
    categories: ['featured', 'video', 'ad'],
    year: '2025',
    featured: true,
    priority: 2,
    status: 'DELIVERED',
    accent: 'var(--accent-cyan)',
    description: lt(
      '围绕游戏营销与广告传播需求进行多类型视频制作，覆盖 BGC、原生化、PUGC、素材混剪及 KOL 内容等方向，根据不同广告形式完成脚本理解、素材组织、节奏剪辑与动态包装，并结合传播场景调整内容结构与视觉表达。',
      'Multi-type video production for game marketing and advertising — covering BGC, native, PUGC, mixed cuts and KOL content — from script understanding and asset organisation to rhythm editing and motion packaging, adapting structure and visuals to the distribution context.'
    ),
    role: [
      lt('广告剪辑', 'Ad editing'),
      lt('动态包装', 'Motion packaging'),
      lt('素材适配', 'Footage adaptation'),
    ],
    tools: ['After Effects', 'Premiere Pro', 'Photoshop'],
    services: ['BGC', 'NATIVE', 'PUGC', 'MIXED CUT', 'KOL'],
    cover: '/assets/images/project-04-cover.jpg',
    /* 一级预览视频指向实际存在的案例视频（旧 mp4 文件不存在） */
    video: '/assets/videos/ad/slzh-gaixielishi.m3u8',
    gallery: [],
    metrics: [
      { label: 'BGC / NATIVE', value: 'BGC' },
      { label: 'PUGC / MIXED CUT', value: 'PUGC' },
      { label: 'KOL CONTENT', value: 'KOL' },
    ],
    sections: [
      {
        id: 'background',
        label: 'PROJECT BACKGROUND',
        labelZh: lt('项目背景', 'Project background'),
        body: [
          lt(
            '游戏广告视频需要根据不同营销目标选择对应的内容形式。同一款游戏可能同时涉及品牌向内容、原生化短视频、玩家内容包装、素材混剪及 KOL 合作内容，因此制作重点不仅是剪辑，还包括对广告形式、素材来源、信息节奏和传播语境的理解。',
            'Game ad films are chosen by marketing goal — one title can span branded content, native short-form, player-content packaging, mixed cuts and KOL collaborations. So the craft is not only editing: it is understanding the ad format, where the footage comes from, how information is paced and the context it is distributed in.'
          ),
        ],
      },
      {
        id: 'role',
        label: 'MY ROLE',
        labelZh: lt('我的职责', 'My role'),
        list: [
          lt(
            '根据营销脚本与广告类型梳理内容结构',
            'Structure content from the marketing script and the ad type'
          ),
          lt(
            '整理游戏 PV、实机、平面、达人及其他可用素材并完成剪辑重组',
            'Organise PV, gameplay, stills, creator and other available footage, then cut and re-compose'
          ),
          lt(
            '根据 BGC、原生化、PUGC、混剪和 KOL 等不同内容形式调整节奏与包装方式',
            'Adapt pacing and packaging across BGC, native, PUGC, mixed-cut and KOL formats'
          ),
          lt(
            '制作字幕、UI、图形及辅助动态包装，并根据不同投放或传播场景完成成片适配',
            'Produce subtitles, UI, graphics and supporting motion packaging, then adapt the final cut to the ad placement or distribution context'
          ),
        ],
      },
      {
        id: 'process',
        label: 'PROCESS',
        labelZh: lt('制作流程', 'Process'),
        flow: [
          lt('需求理解', 'Understand brief'),
          lt('广告类型判断', 'Determine ad type'),
          lt('脚本与素材梳理', 'Script & footage review'),
          lt('节奏剪辑', 'Rhythm editing'),
          lt('动态包装', 'Motion packaging'),
          lt('成片调整', 'Final cut polish'),
          lt('输出适配', 'Output adaptation'),
        ],
      },
      {
        id: 'result',
        label: 'FINAL RESULT',
        labelZh: lt('最终呈现', 'Final result'),
        body: [
          lt(
            '完成多种游戏广告内容形式的制作实践，覆盖 BGC、原生化、PUGC、混剪及 KOL 等方向，在不同素材条件和传播目标下完成内容重组与视频包装，逐步形成针对不同广告类型调整节奏、信息密度与视觉表现的制作方法。',
            'Completed multi-format game ad production across BGC, native, PUGC, mixed cuts and KOL — re-composing content and packaging videos under varied footage conditions and distribution goals, building a working method for tuning pacing, information density and visuals per ad type.'
          ),
        ],
      },
    ],
    /* 广告视频子层级：按产品展开的案例目录 */
    cases: [
      {
        id: 'slzh',
        name: lt('率土之滨', 'Slash of the Three Kingdoms'),
        meta: lt('广告视频 / BGC', 'Ad film / BGC'),
        description: lt(
          '三国题材的策略感广告：PV素材重组、动态包装与视频内信息层设计，围绕赛季节点组织画面节奏。',
          'Strategy-toned ad film for a Three Kingdoms title — PV re-cuts, motion packaging and in-video info layers paced around season milestones.'
        ),
        tags: ['AD FILM', 'PV RECUT', 'BGC'],
        date: lt('2023', '2023'),
        role: lt('动态包装 / 视频内UI动效', 'Motion packaging / In-video UI motion'),
        works: [
          {
            id: 'slzh-gaixielishi',
            name: lt('改写历史', 'Rewriting History'),
            videos: ['/assets/videos/ad/slzh-gaixielishi.m3u8'],
          },
          {
            id: 'slzh-jiedifengdi',
            name: lt('竭地锋镝-百城之战', 'Battle of Hundred Cities'),
            videos: ['/assets/videos/ad/slzh-jiedifengdi.m3u8'],
          },
          {
            id: 'slzh-2022-year-review',
            name: lt('2022年度盘点', '2022 Year Review'),
            videos: ['/assets/videos/ad/slzh-2023-year-review.m3u8'],
          },
          {
            id: 'slzh-cengmoshou',
            name: lt('蹲魔兽', 'Crouching WoW'),
            videos: ['/assets/videos/ad/slzh-cengmoshou.m3u8'],
          },
          {
            id: 'slzh-yizidangtou',
            name: lt('地区服-义字当头', 'Regional - Yi Zi Dang Tou'),
            videos: ['/assets/videos/ad/slzh-yizidangtou.m3u8'],
          },
          {
            id: 'slzh-sanzhanchaoxi',
            name: lt('法务-三战抄袭', 'Legal - Copycat Ad'),
            videos: ['/assets/videos/ad/slzh-sanzhanchaoxi.m3u8'],
          },
          {
            id: 'slzh-airuhuo',
            name: lt('混剪卡点-爱如火', 'Mashup - Ai Ru Huo'),
            videos: ['/assets/videos/ad/slzh-airuhuo.m3u8'],
          },
          {
            id: 'slzh-meirenhuajuan',
            name: lt('卡点混剪-美人画卷', 'Mashup - Beauty Scroll'),
            videos: ['/assets/videos/ad/slzh-meirenhuajuan.m3u8'],
          },
          {
            id: 'slzh-jinsimazhao',
            name: lt('晋司马昭', 'Sima Zhao'),
            videos: ['/assets/videos/ad/slzh-jinsimazhao.m3u8'],
          },
          {
            id: 'slzh-pugc-zhurong',
            name: lt('PUGC祝融', 'PUGC Zhurong'),
            videos: ['/assets/videos/ad/slzh-pugc-zhurong.m3u8'],
          },
          {
            id: 'slzh-pugc-girls',
            name: lt('PUGC美少女战队', 'PUGC Girls Squad'),
            videos: ['/assets/videos/ad/slzh-pugc-girls.m3u8'],
          },
          {
            id: 'slzh-wuxingxunyu',
            name: lt('原生化-五星荀彧', 'Original - Five-star Xun Yu'),
            videos: ['/assets/videos/ad/slzh-wuxingxunyu.m3u8'],
          },
          {
            id: 'slzh-dianshangluoji',
            name: lt('原生化-电商逻辑', 'Original - E-commerce Logic'),
            videos: ['/assets/videos/ad/slzh-dianshangluoji.m3u8'],
          },
          {
            id: 'slzh-zhubochouka',
            name: lt('原生化-抽卡', 'Original - Gacha'),
            videos: ['/assets/videos/ad/slzh-zhubochouka.m3u8'],
          },
        ],
        detail: {
          background: lt(
            '率土之滨的广告内容以策略题材为核心，围绕赛季节点与玩法卖点组织多种广告形式，从 BGC 品牌素材、原生化短剧到 PUGC 与混剪卡点，覆盖不同传播目标下的内容表达。',
            'Slash of the Three Kingdoms ad content is strategy-led, organised around season milestones and gameplay selling points across BGC, native short-form, PUGC and beat-synced mashups — each serving a different distribution goal.'
          ),
          objectives: [
            lt('在不同广告形式下保持策略感的视觉调性', 'Keep a strategy-toned visual style across ad formats'),
            lt('围绕赛季卖点重组素材与信息节奏', 'Re-compose footage and information pacing around season selling points'),
            lt('让动态包装适配 BGC、原生化与混剪等不同形式', 'Fit motion packaging to BGC, native and mashup formats'),
            lt('在短时长内完成卖点传达与情绪引导', 'Land selling points and lead emotion within short durations'),
          ],
          role: lt(
            '参与率土之滨多类型广告视频的剪辑与动态包装，根据广告形式整理素材、重排节奏并完成字幕、信息层与 UI 动效。',
            'Produced editing and motion packaging for multiple Slash of the Three Kingdoms ad formats — organising footage, re-timing and adding subtitles, info layers and UI motion.'
          ),
          process: [
            lt('需求理解', 'Understand brief'),
            lt('广告类型判断', 'Determine ad type'),
            lt('脚本与素材梳理', 'Script & footage review'),
            lt('节奏剪辑', 'Rhythm editing'),
            lt('动态包装', 'Motion packaging'),
            lt('成片调整', 'Final cut polish'),
            lt('输出适配', 'Output adaptation'),
          ],
          delivery: [
            lt('根据广告投放规格输出横版、竖版及不同时长的成片', 'Export landscape, portrait and varying-duration cuts for ad placements'),
            lt('统一字幕、信息层与包装风格，减少多版本差异', 'Keep subtitles, info layers and packaging consistent across versions'),
          ],
          result: lt(
            '完成率土之滨多个赛季节点的广告视频制作，覆盖 BGC、原生化、PUGC 与混剪等形式，形成针对策略题材的内容重组与包装方法。',
            'Delivered ad films across multiple Slash of the Three Kingdoms season milestones — BGC, native, PUGC and mashups — building a content and packaging method for strategy titles.'
          ),
          tools: ['After Effects', 'Premiere Pro', 'Photoshop'],
        },
        gallery: [],
      },
      {
        id: 'mhxy',
        name: lt('梦幻西游', 'Fantasy Westward Journey'),
        meta: lt('广告视频 / 动态包装', 'Ad film / Motion package'),
        description: lt(
          '经典Q版题材的广告内容：活泼节奏的动态包装与活动视觉的动态化呈现。',
          'Ad content for a classic Q-style title — lively motion packaging and animated campaign visuals.'
        ),
        tags: ['MOTION GRAPHICS', 'AD FILM', 'UI MOTION'],
        date: lt('2023', '2023'),
        role: lt('动态包装 / 剪辑', 'Motion packaging / Editing'),
        works: [
          {
            id: 'mhxy-tiandiqiju-xuanchuan',
            name: lt('天地棋局版本宣传片', 'World Chess Promo'),
            videos: ['/assets/videos/ad/mhxy-tiandiqiju-xuanchuan.m3u8'],
          },
          {
            id: 'mhxy-shikong-chengbaquanfu',
            name: lt('时空服-称霸全服', 'Space-Time Server - Dominate All'),
            videos: ['/assets/videos/ad/mhxy-shikong-chengbaquanfu.m3u8'],
          },
          {
            id: 'mhxy-xumihai-kongbunanhu',
            name: lt('须弥海恐怖男主', 'Xumi Sea Horror Lead'),
            videos: ['/assets/videos/ad/mhxy-xumihai-kongbunanhu.m3u8'],
          },
          {
            id: 'mhxy-fuchoudaxi',
            name: lt('复仇大戏', 'Revenge Drama'),
            videos: ['/assets/videos/ad/mhxy-fuchoudaxi.m3u8'],
          },
          {
            id: 'mhxy-gaoebaoji',
            name: lt('高额暴击', 'High Damage Crit'),
            videos: ['/assets/videos/ad/mhxy-gaoebaoji.m3u8'],
          },
          {
            id: 'mhxy-datangtezhongbing',
            name: lt('大唐特种兵', 'Tang Special Forces'),
            videos: ['/assets/videos/ad/mhxy-datangtezhongbing.m3u8'],
          },
          {
            id: 'mhxy-linli-haidaohunfang',
            name: lt('邻里系统-海岛婚房', 'Neighbor System - Island Wedding'),
            videos: ['/assets/videos/ad/mhxy-linli-haidaohunfang.m3u8'],
          },
          {
            id: 'mhxy-linli-haoxiaoxi',
            name: lt('邻里系统-好消息', 'Neighbor System - Good News'),
            videos: ['/assets/videos/ad/mhxy-linli-haoxiaoxi.m3u8'],
          },
          {
            id: 'mhxy-tiandiqiju-wubufa',
            name: lt('天地棋局-五步法', 'World Chess - Five-step'),
            videos: ['/assets/videos/ad/mhxy-tiandiqiju-wubufa.m3u8'],
          },
          {
            id: 'mhxy-tianpengyinyuan',
            name: lt('天蓬因缘', 'Tianpeng Fate'),
            videos: ['/assets/videos/ad/mhxy-tianpengyinyuan.m3u8'],
          },
          {
            id: 'mhxy-xianzugongzhu',
            name: lt('仙族公主', 'Fairy Princess'),
            videos: ['/assets/videos/ad/mhxy-xianzugongzhu.m3u8'],
          },
          {
            id: 'mhxy-kol-lishenmechuang',
            name: lt('KOL-李什么闯', 'KOL Li Shenme Chuang'),
            videos: ['/assets/videos/ad/mhxy-kol-lishenmechuang.m3u8'],
          },
          {
            id: 'mhxy-kol-menghuanjinian',
            name: lt('KOL-梦幻纪念', 'KOL Dream Anniversary'),
            videos: ['/assets/videos/ad/mhxy-kol-menghuanjinian.m3u8'],
          },
          {
            id: 'mhxy-815-maintenance',
            name: lt('815期维护解读', 'Maintenance Review #815'),
            videos: ['/assets/videos/ad/mhxy-815-maintenance.m3u8'],
          },
          {
            id: 'mhxy-814-maintenance',
            name: lt('814期维护解读', 'Maintenance Review #814'),
            videos: ['/assets/videos/ad/mhxy-814-maintenance.m3u8'],
          },
        ],
        detail: {
          background: lt(
            '梦幻西游的广告内容以经典 Q 版题材为主，覆盖版本宣传、活动包装、KOL 合作与维护解读等方向，用活泼的节奏和动态包装承载不同传播目标下的卖点表达。',
            'Fantasy Westward Journey ad content is built around its classic Q-style look — version promos, campaign packaging, KOL collaborations and maintenance reviews — using lively pacing and motion packaging to carry selling points across distribution goals.'
          ),
          objectives: [
            lt('保持活泼 Q 版视觉调性下的信息清晰', 'Keep lively Q-style visuals while keeping info clear'),
            lt('围绕版本与活动卖点组织画面节奏', 'Organise pacing around version and campaign selling points'),
            lt('适配版本宣传、维护解读等不同内容形式', 'Fit version promos, maintenance reviews and other formats'),
            lt('通过动态包装提升单条内容的传播表现', 'Use motion packaging to strengthen each piece in distribution'),
          ],
          role: lt(
            '参与梦幻西游多种广告内容的剪辑与动态包装，根据内容形式整理素材、重排节奏并完成字幕、信息层与动态表现。',
            'Produced editing and motion packaging across Fantasy Westward Journey ad formats — organising footage, re-timing and adding subtitles, info layers and motion.'
          ),
          process: [
            lt('需求理解', 'Understand brief'),
            lt('广告类型判断', 'Determine ad type'),
            lt('脚本与素材梳理', 'Script & footage review'),
            lt('节奏剪辑', 'Rhythm editing'),
            lt('动态包装', 'Motion packaging'),
            lt('成片调整', 'Final cut polish'),
            lt('输出适配', 'Output adaptation'),
          ],
          delivery: [
            lt('按投放规格输出多版本成片与包装资源', 'Export multi-version cuts and packaging assets per placement'),
            lt('统一字幕与信息层风格，减少版本差异', 'Keep subtitles and info layers consistent across versions'),
          ],
          result: lt(
            '完成梦幻西游多类广告内容的制作，覆盖版本宣传、活动包装、KOL 与维护解读等形式，形成针对 Q 版题材的节奏与包装方法。',
            'Delivered multiple Fantasy Westward Journey ad formats — promos, campaign packaging, KOL and maintenance reviews — building a pacing and packaging method for Q-style titles.'
          ),
          tools: ['After Effects', 'Premiere Pro', 'Photoshop'],
        },
        gallery: [],
      },
      {
        id: 'yys',
        name: lt('阴阳师手游', 'Onmyoji Mobile'),
        meta: lt('广告视频 / 动态包装', 'Ad film / Motion package'),
        description: lt(
          '日式和风题材的视频动效：氛围感包装、字幕与信息层的动态设计。',
          'Motion for a Japanese-style title — atmospheric packaging plus dynamic subtitle and info-layer design.'
        ),
        tags: ['AMBIENT', 'SUBTITLE', 'AD FILM'],
        date: lt('2023', '2023'),
        role: lt('动态包装 / 字幕信息层', 'Motion packaging / Subtitle & info layer'),
        works: [
          {
            id: 'yys-yinhun-liandong',
            name: lt('银魂联动', 'Gintama Collaboration'),
            videos: ['/assets/videos/ad/yys-yinhun-liandong.m3u8'],
          },
          {
            id: 'yys-xinshishen',
            name: lt('新式神', 'New Shikigami'),
            videos: ['/assets/videos/ad/yys-xinshishen.m3u8'],
          },
          {
            id: 'yys-xinqu-mianfeipifu',
            name: lt('新区特定版本免费皮肤', 'New Server Free Skin'),
            videos: ['/assets/videos/ad/yys-xinqu-mianfeipifu.m3u8'],
          },
        ],
        detail: {
          background: lt(
            '阴阳师手游的广告内容以日式和风题材为主，覆盖联动、新式神与新区版本等方向，通过氛围感包装、字幕与信息层设计，在保留调性的同时传达版本卖点。',
            'Onmyoji Mobile ad content is built around its Japanese aesthetic — collaborations, new shikigami and new-server versions — using atmospheric packaging, subtitles and info layers to carry version selling points while keeping the tone.'
          ),
          objectives: [
            lt('保持日式和风调性下的氛围表达', 'Keep the Japanese aesthetic and its atmosphere'),
            lt('围绕联动、新式神与新区内容组织节奏', 'Organise pacing around collabs, new shikigami and new-server content'),
            lt('用字幕与信息层强化卖点传达', 'Use subtitles and info layers to reinforce selling points'),
            lt('适配不同版本与投放规格的成片', 'Adapt cuts to different versions and placement specs'),
          ],
          role: lt(
            '参与阴阳师手游广告内容的动态包装与信息层设计，根据内容形式整理素材、完成字幕、氛围与节奏表现。',
            'Produced motion packaging and info-layer design for Onmyoji Mobile ad content — organising footage, and handling subtitles, atmosphere and pacing.'
          ),
          process: [
            lt('需求理解', 'Understand brief'),
            lt('广告类型判断', 'Determine ad type'),
            lt('脚本与素材梳理', 'Script & footage review'),
            lt('节奏剪辑', 'Rhythm editing'),
            lt('动态包装', 'Motion packaging'),
            lt('成片调整', 'Final cut polish'),
            lt('输出适配', 'Output adaptation'),
          ],
          delivery: [
            lt('按投放规格输出成片与字幕信息层资源', 'Export cuts and subtitle/info-layer assets per placement'),
            lt('统一风格与字幕规范，减少版本差异', 'Keep style and subtitle rules consistent across versions'),
          ],
          result: lt(
            '完成阴阳师手游多类广告内容制作，覆盖联动、新式神与新区版本等形式，形成针对日式和风题材的包装与信息层方法。',
            'Delivered multiple Onmyoji Mobile ad formats — collabs, new shikigami and new-server versions — building a packaging and info-layer method for the Japanese aesthetic.'
          ),
          tools: ['After Effects', 'Premiere Pro', 'Photoshop'],
        },
        gallery: [],
      },
      {
        id: 'xxyx',
        name: lt('小小英雄 (4399)', 'Little Heroes (4399)'),
        meta: lt('广告视频 / 短视频', 'Ad film / Short-form'),
        description: lt(
          '休闲题材的短周期广告内容：从创意到成片的快速动态制作。',
          'Short-cycle ad content for a casual title — concept to finished cut on a fast turnaround.'
        ),
        tags: ['SHORT-FORM', 'QUICK TURN', 'MOTION'],
        date: lt('2025', '2025'),
        role: lt('创意 / 快速动态制作', 'Concept / Fast-turn motion'),
        works: [
          {
            id: 'xxyx-character-showcase',
            name: lt('游戏角色展示', 'Character Showcase'),
            videos: ['/assets/videos/ad/xxyx-character-showcase.m3u8'],
          },
        ],
        detail: {
          background: lt(
            '小小英雄的广告内容以休闲题材为主，围绕短周期、快速响应的投放需求完成内容制作，从创意判断到成片输出保持较高效率，适配短视频与广告素材的传播节奏。',
            'Little Heroes ad content is casual-focused, built for short-cycle, fast-turnaround placements — from concept judgement to a finished cut, tuned to short-video and ad-asset distribution pacing.'
          ),
          objectives: [
            lt('在短周期内完成创意到成片', 'Take a concept to a finished cut within a short cycle'),
            lt('用清晰的节奏快速传达卖点', 'Land selling points quickly with clear pacing'),
            lt('适配短视频与广告素材的播放场景', 'Fit short-video and ad-asset playback contexts'),
            lt('控制制作效率与成片质量平衡', 'Balance production efficiency and output quality'),
          ],
          role: lt(
            '参与小小英雄广告内容的创意与快速制作，完成素材组织、剪辑与动态包装，在短周期内输出适配投放的成片。',
            'Produced concept and fast-turn production for Little Heroes ads — organising footage, editing and motion packaging to ship placement-ready cuts quickly.'
          ),
          process: [
            lt('需求理解', 'Understand brief'),
            lt('广告类型判断', 'Determine ad type'),
            lt('脚本与素材梳理', 'Script & footage review'),
            lt('节奏剪辑', 'Rhythm editing'),
            lt('动态包装', 'Motion packaging'),
            lt('成片调整', 'Final cut polish'),
            lt('输出适配', 'Output adaptation'),
          ],
          delivery: [
            lt('按投放规格快速输出适配的成片', 'Ship placement-adapted cuts quickly'),
            lt('统一包装与字幕，保证多版本一致', 'Keep packaging and subtitles consistent across versions'),
          ],
          result: lt(
            '完成小小英雄短周期广告内容的快速制作，在控制效率的同时保持成片质量，形成面向休闲题材的快速响应方法。',
            'Delivered short-cycle Little Heroes ad production with controlled efficiency and steady quality, building a fast-response method for casual titles.'
          ),
          tools: ['After Effects', 'Premiere Pro', 'Photoshop'],
        },
        gallery: [],
      },
      {
        id: 'sanqi',
        name: lt('三七互娱（项目）', 'Sanqi Interactive (Project)'),
        meta: lt('广告视频 / 角色混剪', 'Ad film / Character mix'),
        description: lt(
          '三七互娱项目的角色混剪广告：角色素材的节奏重组与动态包装。',
          'Character-mix ad for the Sanqi Interactive project — re-cut character footage with motion packaging.'
        ),
        tags: ['AD FILM', 'CHARACTER MIX', 'MOTION'],
        date: lt('2024', '2024'),
        role: lt('剪辑 / 动态包装', 'Editing / Motion packaging'),
        works: [
          {
            id: 'sanqi-character-mix',
            name: lt('游戏角色混剪', 'Game Character Mix'),
            videos: ['/assets/videos/ad/sanqi-character-mix.m3u8'],
          },
        ],
        detail: {
          background: lt(
            '该项目的角色混剪广告以角色展示为核心，通过素材的节奏重组与动态包装，在较短时长内集中呈现角色表现并适配移动端投放场景。',
            'This character-mix ad centres on character showcase — re-cutting footage with motion packaging to present characters densely in a short runtime, adapted for mobile placements.'
          ),
          objectives: [
            lt('用节奏卡点强化角色素材的表现力', 'Use beat-synced pacing to strengthen character footage'),
            lt('在短时长内集中展示角色亮点', 'Present character highlights densely within a short runtime'),
            lt('适配移动端广告的构图与播放', 'Fit mobile-ad composition and playback'),
            lt('通过动态包装提升整体观感', 'Use motion packaging to lift the overall look'),
          ],
          role: lt(
            '参与该角色混剪广告的剪辑与动态包装，整理角色素材、重排节奏并完成移动端适配。',
            'Produced the editing and motion packaging for this character mix — organising footage, re-timing and adapting for mobile.'
          ),
          process: [
            lt('需求理解', 'Understand brief'),
            lt('广告类型判断', 'Determine ad type'),
            lt('脚本与素材梳理', 'Script & footage review'),
            lt('节奏剪辑', 'Rhythm editing'),
            lt('动态包装', 'Motion packaging'),
            lt('成片调整', 'Final cut polish'),
            lt('输出适配', 'Output adaptation'),
          ],
          delivery: [
            lt('按移动端投放规格输出成片', 'Export the cut for mobile placement specs'),
            lt('统一包装与转场，保证成片完整', 'Keep packaging and transitions consistent for a complete cut'),
          ],
          result: lt(
            '完成该角色混剪广告的节奏重组与动态包装，使角色素材在短时长内形成连贯、有节奏的展示。',
            'Delivered the character-mix ad — re-timed and packaged so the footage reads as a coherent, rhythmic showcase in a short runtime.'
          ),
          tools: ['After Effects', 'Premiere Pro', 'Photoshop'],
        },
      },
      {
        id: 'sjqy',
        name: lt('世界启元 (腾讯)', 'World Awakening (Tencent)'),
        meta: lt('广告视频 / BGC', 'Ad film / BGC'),
        description: lt(
          '跨厂合作的广告内容：品牌视觉调性下的动态包装与版本节点传播。',
          'Cross-studio ad content — motion packaging within the brand’s visual tone, built around version communication goals.'
        ),
        tags: ['BGC', 'AD FILM', 'MOTION PACKAGE'],
        date: lt('2024', '2024'),
        role: lt('动态包装 / 品牌调性适配', 'Motion packaging / Brand tone'),
        works: [
          {
            id: 'sjqy-hardcore-vehicle',
            name: lt('硬核载具', 'Hardcore Vehicles'),
            videos: ['/assets/videos/ad/sjqy-hardcore-vehicle.m3u8'],
          },
          {
            id: 'sjqy-fire-gun-battle',
            name: lt('火枪大战', 'Gunpowder Battle'),
            videos: ['/assets/videos/ad/sjqy-fire-gun-battle.m3u8'],
          },
        ],
        detail: {
          background: lt(
            '世界启元的广告内容以跨厂合作的品牌调性为基础，围绕硬核载具、兵种战斗等主题完成素材二创与动态包装，在保持品牌视觉的前提下适配不同广告形式。',
            'World Awakening ad content builds on the cross-studio brand tone — around hardcore vehicles and unit battles — re-cutting footage with motion packaging while keeping the brand look across ad formats.'
          ),
          objectives: [
            lt('保持品牌视觉调性下的卖点表达', 'Keep selling points within the brand visual tone'),
            lt('围绕载具与战斗主题组织素材节奏', 'Organise pacing around vehicle and battle themes'),
            lt('适配品牌广告与二创内容的投放场景', 'Fit branded ads and re-cut content placements'),
            lt('通过动态包装强化主题表现力', 'Use motion packaging to strengthen the theme'),
          ],
          role: lt(
            '参与世界启元广告素材的二创与动态包装，整理主题素材、重排节奏并完成信息层与包装设计。',
            'Produced re-cuts and motion packaging for World Awakening ads — organising theme footage, re-timing and adding info layers and packaging.'
          ),
          process: [
            lt('需求理解', 'Understand brief'),
            lt('广告类型判断', 'Determine ad type'),
            lt('脚本与素材梳理', 'Script & footage review'),
            lt('节奏剪辑', 'Rhythm editing'),
            lt('动态包装', 'Motion packaging'),
            lt('成片调整', 'Final cut polish'),
            lt('输出适配', 'Output adaptation'),
          ],
          delivery: [
            lt('按投放规格输出多版本成片与包装资源', 'Export multi-version cuts and packaging assets per placement'),
            lt('统一品牌信息层与字幕风格', 'Keep brand info layers and subtitle style consistent'),
          ],
          result: lt(
            '完成世界启元硬核载具、兵种战斗等主题广告的二创与包装，在品牌调性下形成清晰的主题化表达。',
            'Delivered World Awakening re-cut ads around vehicles and unit battles, keeping the brand tone while making each theme read clearly.'
          ),
          tools: ['After Effects', 'Premiere Pro', 'Photoshop'],
        },
        gallery: [],
      },
      {
        id: 'peak-speed',
        name: lt('巅峰极速', 'Peak Speed'),
        meta: lt('广告视频 / BGC', 'Ad film / BGC'),
        description: lt(
          '巅峰极速的广告视频：围绕公测节点与段位玩法组织画面节奏，PV素材重组与动态包装。',
          'Ad films for Peak Speed — pacing around the open-beta milestone and ranked modes, PV re-cuts and motion packaging.'
        ),
        tags: ['AD FILM', 'PV RECUT', 'BGC'],
        date: lt('2023', '2023'),
        role: lt('动态包装 / 视频内UI动效', 'Motion packaging / In-video UI motion'),
        works: [
          {
            id: 'peak-speed-gongce-fuli',
            name: lt('巅峰极速公测福利', 'Peak Speed Open Beta Welfare'),
            videos: ['/assets/videos/ad/peak-speed-gongce-fuli.m3u8'],
          },
          {
            id: 'peak-speed-duanwei',
            name: lt('巅峰极速段位', 'Peak Speed Ranked'),
            videos: ['/assets/videos/ad/peak-speed-duanwei.m3u8'],
          },
        ],
        detail: {
          background: lt(
            '巅峰极速的广告视频围绕公测节点与段位玩法组织内容，通过 PV 素材重组、游戏内录与动态包装，在短时长内传达福利与玩法卖点。',
            'Peak Speed ad films are organised around the open-beta milestone and ranked modes — re-cutting PV and in-game footage with motion packaging to land welfare and gameplay selling points quickly.'
          ),
          objectives: [
            lt('围绕公测与段位卖点重排画面节奏', 'Re-time around open-beta and ranked selling points'),
            lt('用游戏内录与 PV 重组强化真实玩法表现', 'Use in-game footage and PV re-cuts to show real gameplay'),
            lt('通过动态包装与信息层强化福利传达', 'Reinforce welfare messaging with packaging and info layers'),
            lt('适配横竖版等不同投放规格', 'Fit landscape and portrait placement specs'),
          ],
          role: lt(
            '参与巅峰极速广告的剪辑与动态包装，整理游戏素材、重排节奏并完成信息层与 UI 动效。',
            'Produced editing and motion packaging for Peak Speed ads — organising footage, re-timing and adding info layers and UI motion.'
          ),
          process: [
            lt('需求理解', 'Understand brief'),
            lt('广告类型判断', 'Determine ad type'),
            lt('脚本与素材梳理', 'Script & footage review'),
            lt('节奏剪辑', 'Rhythm editing'),
            lt('动态包装', 'Motion packaging'),
            lt('成片调整', 'Final cut polish'),
            lt('输出适配', 'Output adaptation'),
          ],
          delivery: [
            lt('按投放规格输出横竖版多版本成片', 'Export landscape and portrait cuts per placement'),
            lt('统一包装与信息层，保证多版本一致', 'Keep packaging and info layers consistent across versions'),
          ],
          result: lt(
            '完成巅峰极速公测与段位玩法的广告制作，通过素材重组与动态包装清晰传达版本卖点。',
            'Delivered Peak Speed ads around the open-beta and ranked modes, using re-cuts and packaging to convey version selling points clearly.'
          ),
          tools: ['After Effects', 'Premiere Pro', 'Photoshop'],
        },
      },
      {
        id: 'nsh-ad',
        name: lt('逆水寒手游', 'Justice Online Mobile'),
        meta: lt('广告视频 / BGC', 'Ad film / BGC'),
        description: lt(
          '逆水寒手游的广告视频：脚本迭代素材重组，围绕卖点与福利节奏组织画面。',
          'Ad film for Justice Online Mobile — script-iteration footage re-composition, paced around selling points and welfare beats.'
        ),
        tags: ['AD FILM', 'PV RECUT', 'BGC'],
        date: lt('2023', '2023'),
        role: lt('动态包装 / 视频内UI动效', 'Motion packaging / In-video UI motion'),
        works: [
          {
            id: 'nsh-ad-zhenbuxianghua',
            name: lt('真不像话', 'Zhen Bu Xiang Hua'),
            videos: ['/assets/videos/ad/nsh-zhenbuxianghua.m3u8'],
          },
        ],
        detail: {
          background: lt(
            '逆水寒手游的广告视频以脚本迭代素材重组为主，围绕卖点与福利节奏组织画面，在真人实拍与游戏内录的混合素材中完成节奏与包装。',
            'Justice Online Mobile ad films centre on script-iteration re-composition — organising pacing around selling points and welfare beats across live-action and in-game footage.'
          ),
          objectives: [
            lt('围绕卖点与福利节奏组织画面', 'Organise pacing around selling points and welfare beats'),
            lt('在混合素材中保持节奏与信息清晰', 'Keep pacing and information clear across mixed footage'),
            lt('通过动态包装强化版本福利传达', 'Use packaging to reinforce version welfare messaging'),
            lt('适配不同投放规格与时长', 'Fit different placement specs and durations'),
          ],
          role: lt(
            '参与逆水寒手游广告的脚本素材重组与动态包装，整理真人实拍与游戏内录素材、重排节奏并完成信息层与 UI 动效。',
            'Produced re-composition and motion packaging for Justice Online Mobile ads — organising live-action and in-game footage, re-timing and adding info layers and UI motion.'
          ),
          process: [
            lt('需求理解', 'Understand brief'),
            lt('广告类型判断', 'Determine ad type'),
            lt('脚本与素材梳理', 'Script & footage review'),
            lt('节奏剪辑', 'Rhythm editing'),
            lt('动态包装', 'Motion packaging'),
            lt('成片调整', 'Final cut polish'),
            lt('输出适配', 'Output adaptation'),
          ],
          delivery: [
            lt('按投放规格输出多版本成片与包装资源', 'Export multi-version cuts and packaging assets per placement'),
            lt('统一字幕与信息层，保证多版本一致', 'Keep subtitles and info layers consistent across versions'),
          ],
          result: lt(
            '完成逆水寒手游广告的素材重组与包装，围绕卖点与福利形成清晰、有节奏的传达。',
            'Delivered Justice Online Mobile ad re-composition and packaging, conveying selling points and welfare with clear pacing.'
          ),
          tools: ['After Effects', 'Premiere Pro', 'Photoshop'],
        },
      },
      {
        id: 'uu',
        name: lt('UU加速器', 'UU Booster'),
        meta: lt('广告视频 / 动态包装', 'Ad film / Motion package'),
        description: lt(
          '网易UU加速器的广告内容：黑科技卖点的动态包装与信息层设计。',
          'Ad content for NetEase UU Booster — motion packaging and info-layer design around its tech selling points.'
        ),
        tags: ['MOTION GRAPHICS', 'AD FILM', 'INFO LAYER'],
        date: lt('2023', '2023'),
        role: lt('动态包装 / 字幕信息层', 'Motion packaging / Subtitle & info layer'),
        works: [
          {
            id: 'uu-heikeji',
            name: lt('加速器黑科技', 'Booster Tech'),
            videos: ['/assets/videos/ad/uu-heikeji.m3u8'],
          },
        ],
        detail: {
          background: lt(
            '网易 UU 加速器的广告内容围绕「黑科技」卖点展开，通过动态包装与信息层设计，把技术功能转译为直观、易懂的传播表达。',
            'NetEase UU Booster ads are built around its "tech" selling points — using motion packaging and info-layer design to translate technical functions into clear, approachable messaging.'
          ),
          objectives: [
            lt('把技术卖点转译为直观的表达', 'Turn technical selling points into intuitive messaging'),
            lt('通过信息层强化功能认知', 'Use info layers to reinforce how the features work'),
            lt('保持动态包装与品牌调性统一', 'Keep motion packaging aligned with the brand tone'),
            lt('适配不同投放规格与时长', 'Fit different placement specs and durations'),
          ],
          role: lt(
            '参与 UU 加速器广告的动态包装与信息层设计，围绕技术卖点完成节奏、字幕与图形表现。',
            'Produced motion packaging and info-layer design for UU Booster ads — pacing, subtitles and graphics around the tech selling points.'
          ),
          process: [
            lt('需求理解', 'Understand brief'),
            lt('广告类型判断', 'Determine ad type'),
            lt('脚本与素材梳理', 'Script & footage review'),
            lt('节奏剪辑', 'Rhythm editing'),
            lt('动态包装', 'Motion packaging'),
            lt('成片调整', 'Final cut polish'),
            lt('输出适配', 'Output adaptation'),
          ],
          delivery: [
            lt('按投放规格输出多版本成片与包装资源', 'Export multi-version cuts and packaging assets per placement'),
            lt('统一字幕与信息层风格', 'Keep subtitle and info-layer style consistent'),
          ],
          result: lt(
            '完成 UU 加速器广告的动态包装与信息层设计，使技术卖点形成清晰、可感知的传播表达。',
            'Delivered UU Booster ad packaging and info layers, making the tech selling points clear and perceptible.'
          ),
          tools: ['After Effects', 'Premiere Pro', 'Photoshop'],
        },
      },
    ],
  },

  {
    id: 'game-promotion-films',
    slug: 'game-promotion-films',
    index: '04',
    title: 'GAME PROMOTION FILMS',
    titleZh: lt('游戏宣发视频', 'Game Promotion Films'),
    category: lt('宣发 / 混剪 / 动态包装', 'Promo / Mixed cut / Motion package'),
    categories: ['featured', 'video', 'promo'],
    year: '2025',
    featured: true,
    priority: 2,
    status: 'DELIVERED',
    accent: 'var(--accent-pink)',
    description: lt(
      '游戏节点宣传、BGC营销、PV素材重组、动态包装及视频内UI动效，围绕版本节点的传播目标组织画面节奏。',
      'Milestone promotion, BGC marketing, PV re-cuts, motion-graphic packaging and in-video UI motion — pacing built around each version’s communication goal.'
    ),
    role: [
      lt('剪辑', 'Editing'),
      lt('素材重组', 'Re-composition'),
      lt('UI 包装', 'UI packaging'),
    ],
    tools: ['After Effects', 'Premiere Pro', 'Photoshop'],
    services: ['PROMOTION', 'MOTION GRAPHICS', 'EDITING', 'UI MOTION'],
    cover: '/assets/images/project-05-cover.jpg',
    /* 一级预览视频指向实际存在的案例视频（旧 mp4 文件不存在） */
    video: '/assets/videos/promo/peak-speed-map-reveal.m3u8',
    gallery: [],
    /* 口径与品牌公关经历一致（最新版简历）：30+ 内容 / 累计 2200W+ 播放 / 210W+ 点赞 */
    metrics: [
      { label: 'CONTENTS', value: lt('30+', '30+') },
      { label: 'VIEWS', value: lt('2200W+', '22M+') },
      { label: 'LIKES', value: lt('210W+', '2.1M') },
    ],
    sections: [
      {
        id: 'background',
        label: 'PROJECT BACKGROUND',
        labelZh: lt('项目背景', 'Project background'),
        body: [
          lt(
            '宣发视频的目标很明确：在极短的时间里把版本卖点讲清楚，同时保住产品的视觉调性。素材往往来自既有PV和美术资源，重组能力比原创画面更关键。',
            'The goal of a promotion film is blunt: land the version’s selling points in very little time while protecting the product’s visual tone. Footage usually comes from existing PVs and art assets, so re-composition matters more than original shots.'
          ),
        ],
      },
      {
        id: 'role',
        label: 'MY ROLE',
        labelZh: lt('我的职责', 'My role'),
        list: [
          lt(
            '结合脚本与产品视觉风格完成内容设计',
            'Content design driven by the script and the product’s visual style'
          ),
          lt('PV素材重组与节奏重排', 'Re-composing PV footage and re-timing'),
          lt('动态包装与字幕/信息层设计', 'Motion packaging plus subtitle and info-layer design'),
          lt('视频内UI动效制作', 'In-video UI motion'),
        ],
      },
      {
        id: 'process',
        label: 'PROCESS',
        labelZh: lt('制作流程', 'Process'),
        flow: [
          lt('脚本理解', 'Read the script'),
          lt('素材梳理', 'Footage review'),
          lt('节奏排布', 'Pacing layout'),
          lt('动态包装', 'Motion packaging'),
          lt('合成输出', 'Composite and export'),
          lt('平台适配', 'Platform adaptation'),
        ],
      },
      {
        id: 'result',
        label: 'FINAL RESULT',
        labelZh: lt('最终呈现', 'Final result'),
        body: [
          lt(
            '累计创作25条内容，累计播放量2200万，累计点赞量212万，协助账号粉丝增长32万。',
            '25 pieces produced, 22M total views, 2.12M total likes, and 320K follower growth across the accounts.'
          ),
        ],
      },
    ],
    /* 宣发视频子层级：每个宣发项目各为一个二级项目（case），二级项目条/筛选显示 5 个项目 */
    cases: [
      {
        id: 'peak-speed-map',
        product: lt('巅峰极速', 'Peak Speed'),
        name: lt('巅峰极速-地图爆料', 'Peak Speed - Map Reveal'),
        meta: lt('游戏宣发视频', 'Promo film'),
        description: lt(
          '面向版本节点的宣发视频，围绕传播目标在极短时间内把卖点讲清楚。',
          'Promo film around version milestones — landing the selling points fast.'
        ),
        tags: ['PROMOTION', 'EDITING', 'MOTION'],
        date: lt('2023.06', '2023.06'),
        role: lt('宣发视频 / 动态包装', 'Promo / Motion packaging'),
        works: [
          {
            id: 'peak-speed-map-main',
            name: lt('巅峰极速-地图爆料', 'Peak Speed - Map Reveal'),
            videos: ['/assets/videos/promo/peak-speed-map-reveal.m3u8'],
          },
        ],
      },
      {
        id: 'forgotten-sea',
        product: lt('遗忘之海', 'Forgotten Sea'),
        name: lt('遗忘之海宣发', 'Forgotten Sea Promo'),
        meta: lt('游戏宣发视频', 'Promo film'),
        description: lt(
          '面向版本节点的宣发视频，围绕传播目标在极短时间内把卖点讲清楚。',
          'Promo film around version milestones — landing the selling points fast.'
        ),
        tags: ['PROMOTION', 'EDITING', 'MOTION'],
        date: lt('2025.05', '2025.05'),
        role: lt('宣发视频 / 动态包装', 'Promo / Motion packaging'),
        works: [
          {
            id: 'forgotten-sea-main',
            name: lt('遗忘之海宣发', 'Forgotten Sea Promo'),
            videos: ['/assets/videos/promo/forgotten-sea-promo.m3u8'],
          },
        ],
      },
      {
        id: 'diablo3',
        product: lt('暗黑破坏神3', 'Diablo 3'),
        name: lt('暗黑破坏神3宣发', 'Diablo 3 Promo'),
        meta: lt('游戏宣发视频', 'Promo film'),
        description: lt(
          '面向版本节点的宣发视频，围绕传播目标在极短时间内把卖点讲清楚。',
          'Promo film around version milestones — landing the selling points fast.'
        ),
        tags: ['PROMOTION', 'EDITING', 'MOTION'],
        date: lt('2025.04', '2025.04'),
        role: lt('宣发视频 / 动态包装', 'Promo / Motion packaging'),
        works: [
          {
            id: 'diablo3-main',
            name: lt('暗黑破坏神3宣发', 'Diablo 3 Promo'),
            videos: ['/assets/videos/promo/diablo3-promo.m3u8'],
          },
        ],
      },
      {
        id: 'headshot-xmt',
        product: lt('头号追击', 'Headshot'),
        name: lt('头号追击XMT宣发', 'Headshot XMT Promo'),
        meta: lt('游戏宣发视频', 'Promo film'),
        description: lt(
          '面向版本节点的宣发视频，围绕传播目标在极短时间内把卖点讲清楚。',
          'Promo film around version milestones — landing the selling points fast.'
        ),
        tags: ['PROMOTION', 'EDITING', 'MOTION'],
        date: lt('2025.05', '2025.05'),
        role: lt('宣发视频 / 动态包装', 'Promo / Motion packaging'),
        works: [
          {
            id: 'headshot-xmt-main',
            name: lt('头号追击XMT宣发', 'Headshot XMT Promo'),
            videos: ['/assets/videos/promo/headshot-xmt-promo.m3u8'],
          },
        ],
      },
      {
        id: 'seven-days-xmt',
        product: lt('七日世界', '7 Days World'),
        name: lt('七日世界XMT宣发', '7 Days World XMT Promo'),
        meta: lt('游戏宣发视频', 'Promo film'),
        description: lt(
          '面向版本节点的宣发视频，围绕传播目标在极短时间内把卖点讲清楚。',
          'Promo film around version milestones — landing the selling points fast.'
        ),
        tags: ['PROMOTION', 'EDITING', 'MOTION'],
        date: lt('2025.04', '2025.04'),
        role: lt('宣发视频 / 动态包装', 'Promo / Motion packaging'),
        works: [
          {
            id: 'seven-days-xmt-main',
            name: lt('七日世界XMT宣发', '7 Days World XMT Promo'),
            videos: ['/assets/videos/promo/7days-world-xmt-promo.m3u8'],
          },
        ],
      },
    ],
  },

  {
    id: 'game-social-videos',
    slug: 'game-social-videos',
    index: '05',
    title: 'GAME SOCIAL VIDEOS',
    titleZh: lt('游戏社媒视频', 'Game Social Videos'),
    category: lt('社媒 / 短视频 / 官号内容', 'Social / Short-form / Official accounts'),
    categories: ['featured', 'video', 'social'],
    year: '2025',
    featured: true,
    priority: 2,
    status: 'DELIVERED',
    accent: 'var(--accent-orange)',
    description: lt(
      '面向官方账号矩阵的社媒视频制作：创意策划、快速剪辑、动态包装与视频内UI动效，适配短视频平台的传播节奏。',
      'Social video production for official account matrices — concept, fast editing, motion packaging and in-video UI motion, tuned to short-video platform pacing.'
    ),
    role: [
      lt('创意脚本', 'Creative script'),
      lt('快速剪辑', 'Fast editing'),
      lt('动态包装', 'Motion packaging'),
    ],
    tools: ['After Effects', 'Premiere Pro', 'Photoshop'],
    services: ['SOCIAL VIDEO', 'SHORT-FORM', 'EDITING', 'UI MOTION'],
    cover: '/assets/images/project-06-cover.jpg',
    video: '/assets/videos/social/social-yanyi-star.m3u8',
    gallery: [],
    /* 口径：17 精选案例与 30+ 参与内容分开展示，避免「网站只有 17 条」与简历 30+ 的误解 */
    metrics: [
      { label: 'SELECTED CASES', value: lt('17', '17') },
      { label: 'CONTENT PRODUCED', value: lt('30+', '30+') },
      { label: 'TOTAL VIEWS', value: lt('2200W+', '22M+') },
      { label: 'TOTAL LIKES', value: lt('210W+', '2.1M') },
    ],
    sections: [
      {
        id: 'background',
        label: 'PROJECT BACKGROUND',
        labelZh: lt('项目背景', 'Project background'),
        body: [
          lt(
            '社媒视频更依赖账号人设与平台节奏：前3秒抓注意力、信息密度高、结尾留钩子。素材来源杂，需要快速判断什么能剪、怎么剪得好看。',
            'Social video leans on the account persona and platform rhythm: hook in the first three seconds, high info density, a cliffhanger at the end. Source material is messy — the job is deciding fast what to cut and how to cut it well.'
          ),
        ],
      },
      {
        id: 'role',
        label: 'MY ROLE',
        labelZh: lt('我的职责', 'My role'),
        list: [
          lt(
            '结合版本热点与账号调性产出创意脚本',
            'Creative scripts driven by version buzz and the account tone'
          ),
          lt('直播 / 活动素材的快速剪辑与节奏重组', 'Fast cuts and re-timing of live-stream and event footage'),
          lt('动态包装、字幕与信息层的统一视觉', 'Unified motion packaging, subtitles and info layers'),
          lt('视频内UI动效与界面演示制作', 'In-video UI motion and interface demos'),
        ],
      },
      {
        id: 'process',
        label: 'PROCESS',
        labelZh: lt('制作流程', 'Process'),
        flow: [
          lt('热点判断', 'Spot the hook'),
          lt('创意脚本', 'Creative script'),
          lt('素材梳理', 'Footage review'),
          lt('快速剪辑', 'Fast edit'),
          lt('动态包装', 'Motion packaging'),
          lt('平台适配', 'Platform adaptation'),
        ],
      },
      {
        id: 'result',
        label: 'FINAL RESULT',
        labelZh: lt('最终呈现', 'Final result'),
        body: [
          lt(
            '累计参与制作 30+ 条社媒内容，累计播放量 2200W+，累计点赞量 210W+，其中 13+ 条高传播内容；单条最高播放 467W、单条最高点赞 43W。',
            '30+ social videos produced, 22M+ total views and 2.1M+ total likes, including 13+ high-reach pieces; 4.67M max views and 430K max likes on a single piece.'
          ),
        ],
      },
    ],
    /* 社媒视频子层级：每个社媒项目为一个案例，按官号发布内容展开 */
    cases: [
      {
        id: 'yanyi-star',
        name: lt('演绎之星', 'Deduction Star'),
        meta: lt('游戏社媒视频', 'Social video'),
        description: lt(
          '演绎之星揭晓的社媒视频：悬念铺垫、揭晓节点与信息层级的节奏设计。',
          'Deduction Star reveal social film — suspense build-up, reveal beat and info-layer pacing.'
        ),
        tags: ['SOCIAL VIDEO', 'EDITING', 'REVEAL'],
        date: lt('2025', '2025'),
        role: lt('创意策划 / 快速剪辑 / 动态包装', 'Creative concept / Fast editing / Motion packaging'),
        works: [
          {
            id: 'yanyi-star-main',
            name: lt('演绎之星', 'Deduction Star'),
            videos: ['/assets/videos/social/social-yanyi-star.m3u8'],
          },
        ],
      },
      {
        id: 'poorest-official',
        name: lt('最惨官方', 'Poorest Official'),
        meta: lt('游戏社媒视频', 'Social video'),
        description: lt(
          '以官号人设自嘲为核心的社媒内容：梗的快速建立与节奏编排。',
          'Social content built on the account persona — quick gag setup and pacing.'
        ),
        tags: ['SOCIAL VIDEO', 'EDITING', 'PERSONA'],
        date: lt('2025', '2025'),
        role: lt('创意策划 / 快速剪辑 / 动态包装', 'Creative concept / Fast editing / Motion packaging'),
        works: [
          {
            id: 'poorest-official-main',
            name: lt('最惨官方', 'Poorest Official'),
            videos: ['/assets/videos/social/social-zuican-guanfang.m3u8'],
          },
        ],
      },
      {
        id: 'wolf-barged-in',
        name: lt('公司里突然闯进一只狼', 'A Wolf Barged In'),
        meta: lt('游戏社媒视频', 'Social video'),
        description: lt(
          '公司场景的反差剧情短剧：以 MMD 形式制作，将 3D 模型合成到实景画面中，配合闯入感的镜头节奏与音效呈现。',
          'A contrast skit set in the office — an MMD piece compositing a 3D model into live-action footage, with barge-in camera pacing and sound beats.'
        ),
        tags: ['SOCIAL VIDEO', 'SKIT', 'EDITING'],
        date: lt('2025', '2025'),
        role: lt('创意策划 / 快速剪辑 / 动态包装', 'Creative concept / Fast editing / Motion packaging'),
        works: [
          {
            id: 'wolf-barged-in-main',
            name: lt('公司里突然闯进一只狼', 'A Wolf Barged In'),
            videos: ['/assets/videos/social/social-wolf-in-office.m3u8'],
          },
        ],
      },
      {
        id: 'my-meme-pack',
        name: lt('我的表情包', 'My Meme Pack'),
        meta: lt('游戏社媒视频', 'Social video'),
        description: lt(
          '以表情包为素材的轻量内容：表情素材的快速重组与节奏卡点。',
          'Lightweight meme-pack content — meme footage re-cut and beat-synced pacing.'
        ),
        tags: ['SOCIAL VIDEO', 'MEME', 'FAST EDIT'],
        date: lt('2025', '2025'),
        role: lt('创意策划 / 快速剪辑 / 动态包装', 'Creative concept / Fast editing / Motion packaging'),
        works: [
          {
            id: 'my-meme-pack-main',
            name: lt('我的表情包', 'My Meme Pack'),
            videos: ['/assets/videos/social/social-meme-pack.m3u8'],
          },
        ],
      },
      {
        id: 'english-corner',
        name: lt('英语角', 'English Corner'),
        meta: lt('游戏社媒视频', 'Social video'),
        description: lt(
          '英语角话题向内容：字幕信息层与双语文案的动态设计。',
          'English-corner themed content — subtitle info layer and bilingual copy motion.'
        ),
        tags: ['SOCIAL VIDEO', 'SUBTITLE', 'INFO LAYER'],
        date: lt('2025', '2025'),
        role: lt('创意策划 / 动态包装 / 字幕信息层', 'Creative concept / Motion packaging / Subtitle info layer'),
        works: [
          {
            id: 'english-corner-main',
            name: lt('英语角', 'English Corner'),
            videos: ['/assets/videos/social/social-english-corner.m3u8'],
          },
        ],
      },
      {
        id: 'blue-v',
        name: lt('蓝V', 'Blue V'),
        meta: lt('游戏社媒视频', 'Social video'),
        description: lt(
          '蓝V身份梗的社媒内容：官号认证梗的幽默化表达。',
          'Blue-V persona gag content — turning the verified-account identity into humor.'
        ),
        tags: ['SOCIAL VIDEO', 'PERSONA', 'EDITING'],
        date: lt('2025', '2025'),
        role: lt('创意策划 / 快速剪辑 / 动态包装', 'Creative concept / Fast editing / Motion packaging'),
        works: [
          {
            id: 'blue-v-main',
            name: lt('蓝V', 'Blue V'),
            videos: ['/assets/videos/social/social-lanv.m3u8'],
          },
        ],
      },
      {
        id: 'poorest-official-2',
        name: lt('最惨官方2.0', 'Poorest Official 2.0'),
        meta: lt('游戏社媒视频', 'Social video'),
        description: lt(
          '最惨官方人设的续集内容：延续梗的再升级与节奏重排。',
          'Poorest Official 2.0 — a sequel riff that re-ups the persona gag.'
        ),
        tags: ['SOCIAL VIDEO', 'EDITING', 'SEQUEL'],
        date: lt('2025', '2025'),
        role: lt('创意策划 / 快速剪辑 / 动态包装', 'Creative concept / Fast editing / Motion packaging'),
        works: [
          {
            id: 'poorest-official-2-main',
            name: lt('最惨官方2.0', 'Poorest Official 2.0'),
            videos: ['/assets/videos/social/social-zuican-guanfang-2.m3u8'],
          },
        ],
      },
      {
        id: 'being-framed',
        name: lt('被做局', 'Being Framed'),
        meta: lt('游戏社媒视频', 'Social video'),
        description: lt(
          '被做局的剧情向内容：反转结构与节奏卡点。',
          'A "set-up" skit — twist structure and beat pacing.'
        ),
        tags: ['SOCIAL VIDEO', 'SKIT', 'EDITING'],
        date: lt('2025', '2025'),
        role: lt('创意策划 / 快速剪辑 / 动态包装', 'Creative concept / Fast editing / Motion packaging'),
        works: [
          {
            id: 'being-framed-main',
            name: lt('被做局', 'Being Framed'),
            videos: ['/assets/videos/social/social-framed.m3u8'],
          },
        ],
      },
      {
        id: 'easiest-edit',
        name: lt('最好剪的视频', 'Easiest Edit'),
        meta: lt('游戏社媒视频', 'Social video'),
        description: lt(
          '以"最好剪"为卖点的幕后向内容：剪辑过程的快节奏呈现。',
          'A behind-the-scenes riff on "the easiest edit" — fast-cut process beats.'
        ),
        tags: ['SOCIAL VIDEO', 'EDITING', 'BEHIND THE SCENES'],
        date: lt('2025', '2025'),
        role: lt('创意策划 / 快速剪辑 / 动态包装', 'Creative concept / Fast editing / Motion packaging'),
        works: [
          {
            id: 'easiest-edit-main',
            name: lt('最好剪的视频', 'Easiest Edit'),
            videos: ['/assets/videos/social/social-easy-cut.m3u8'],
          },
        ],
      },
      {
        id: 'props-attitude',
        name: lt('对不同道具的态度', 'Attitudes to Props'),
        meta: lt('游戏社媒视频', 'Social video'),
        description: lt(
          '对道具的态度对比内容：分组对比的节奏设计与信息层。',
          'Attitudes toward different props — side-by-side contrast pacing and info layers.'
        ),
        tags: ['SOCIAL VIDEO', 'CONTRAST', 'INFO LAYER'],
        date: lt('2025', '2025'),
        role: lt('创意策划 / 快速剪辑 / 动态包装', 'Creative concept / Fast editing / Motion packaging'),
        works: [
          {
            id: 'props-attitude-main',
            name: lt('对不同道具的态度', 'Attitudes to Props'),
            videos: ['/assets/videos/social/social-props-attitude.m3u8'],
          },
        ],
      },
      {
        id: 'idv-marketing',
        name: lt('第五营销', 'Identity V Marketing'),
        meta: lt('游戏社媒视频', 'Social video'),
        description: lt(
          '第五人格营销梗内容：玩法卖点的幽默化表达与节奏编排。',
          'Identity V marketing gag — game selling points turned into humor.'
        ),
        tags: ['SOCIAL VIDEO', 'PERSONA', 'EDITING'],
        date: lt('2025', '2025'),
        role: lt('创意策划 / 快速剪辑 / 动态包装', 'Creative concept / Fast editing / Motion packaging'),
        works: [
          {
            id: 'idv-marketing-main',
            name: lt('第五营销', 'Identity V Marketing'),
            videos: ['/assets/videos/social/social-idv-marketing.m3u8'],
          },
        ],
      },
      {
        id: 'idv-math',
        name: lt('第五数学', 'Identity V Math'),
        meta: lt('游戏社媒视频', 'Social video'),
        description: lt(
          '第五人格数学梗内容：数值梗的创意呈现与信息层设计。',
          'Identity V math gag — number jokes with creative info-layer design.'
        ),
        tags: ['SOCIAL VIDEO', 'MEME', 'INFO LAYER'],
        date: lt('2025', '2025'),
        role: lt('创意策划 / 快速剪辑 / 动态包装', 'Creative concept / Fast editing / Motion packaging'),
        works: [
          {
            id: 'idv-math-main',
            name: lt('第五数学', 'Identity V Math'),
            videos: ['/assets/videos/social/social-idv-math.m3u8'],
          },
        ],
      },
      {
        id: 'ai-fatcat',
        name: lt('AI胖猫', 'AI Fat Cat'),
        meta: lt('游戏社媒视频', 'Social video'),
        description: lt(
          'AI生成素材的社媒内容：AI胖猫形象的动态包装。',
          'AI-generated fat-cat content — motion packaging for the AI cat.'
        ),
        tags: ['SOCIAL VIDEO', 'AI', 'MOTION PACKAGE'],
        date: lt('2025', '2025'),
        role: lt('创意策划 / 动态包装', 'Creative concept / Motion packaging'),
        works: [
          {
            id: 'ai-fatcat-main',
            name: lt('AI胖猫', 'AI Fat Cat'),
            videos: ['/assets/videos/social/social-ai-fatcat.m3u8'],
          },
        ],
      },
      {
        id: 'ai-ambitions',
        name: lt('AI大展宏图', 'AI Ambitions'),
        meta: lt('游戏社媒视频', 'Social video'),
        description: lt(
          'AI大展宏图的社媒内容：AI视觉奇观的动态包装与节奏。',
          'AI ambition-themed content — AI visual spectacle with motion packaging.'
        ),
        tags: ['SOCIAL VIDEO', 'AI', 'MOTION PACKAGE'],
        date: lt('2025', '2025'),
        role: lt('创意策划 / 动态包装', 'Creative concept / Motion packaging'),
        works: [
          {
            id: 'ai-ambitions-main',
            name: lt('AI大展宏图', 'AI Ambitions'),
            videos: ['/assets/videos/social/social-ai-ambition.m3u8'],
          },
        ],
      },
      {
        id: 'downed-rescue',
        name: lt('倒地时最希望出现的人', 'Who You Want When Downed'),
        meta: lt('游戏社媒视频', 'Social video'),
        description: lt(
          '对战向内容：倒地救援场景的节奏设计与情绪渲染。',
          'In-match content — downed-rescue scenario pacing and emotional beats.'
        ),
        tags: ['SOCIAL VIDEO', 'GAMEPLAY', 'EMOTION'],
        date: lt('2025', '2025'),
        role: lt('创意策划 / 快速剪辑 / 动态包装', 'Creative concept / Fast editing / Motion packaging'),
        works: [
          {
            id: 'downed-rescue-main',
            name: lt('倒地时最希望出现的人', 'Who You Want When Downed'),
            videos: ['/assets/videos/social/social-downed-rescue.m3u8'],
          },
        ],
      },
      {
        id: 'into-the-essay',
        name: lt('写进作文', 'Into the Essay'),
        meta: lt('游戏社媒视频', 'Social video'),
        description: lt(
          '以"写进作文"为梗的内容：素材反差与文案信息层设计。',
          'A "written into the essay" gag — footage contrast and copy info layer.'
        ),
        tags: ['SOCIAL VIDEO', 'MEME', 'INFO LAYER'],
        date: lt('2025', '2025'),
        role: lt('创意策划 / 快速剪辑 / 动态包装', 'Creative concept / Fast editing / Motion packaging'),
        works: [
          {
            id: 'into-the-essay-main',
            name: lt('写进作文', 'Into the Essay'),
            videos: ['/assets/videos/social/social-essay.m3u8'],
          },
        ],
      },
      {
        id: 'netease-24h-live',
        name: lt('网易24小时直播间', 'NetEase 24H Livestream'),
        meta: lt('游戏社媒视频', 'Social video'),
        description: lt(
          '24小时直播间的切片内容：视频中的角色动作与声音均由 AI 制作生成，结合直播素材完成快速剪辑与节奏编排。',
          'NetEase 24H livestream content — the character\'s motion and voice are fully AI-generated, fast-cut with livestream footage and tight pacing.'
        ),
        tags: ['SOCIAL VIDEO', 'LIVESTREAM', 'FAST EDIT'],
        date: lt('2025', '2025'),
        role: lt('创意策划 / 快速剪辑 / 动态包装', 'Creative concept / Fast editing / Motion packaging'),
        works: [
          {
            id: 'netease-24h-live-main',
            name: lt('网易24小时直播间', 'NetEase 24H Livestream'),
            videos: ['/assets/videos/social/social-24h-livestream.m3u8'],
          },
        ],
      },
    ],
  },
]

/** 一级项目视频总数：优先 videos（已由底部 sync 同步为全部作品视频），否则单条 video */
export function projectVideoCount(p: Project): number {
  return p.videos?.length ?? (p.video ? 1 : 0)
}

/** 按 slug 取项目，详情页路由使用 */
export function getProjectBySlug(slug: string | undefined): Project | undefined {
  if (!slug) return undefined
  return projects.find((p) => p.slug === slug)
}

/** 取下一个项目，详情页 NEXT PROJECT 使用（末尾回到第一个） */
export function getNextProject(slug: string): Project {
  const i = projects.findIndex((p) => p.slug === slug)
  return projects[(i + 1 + projects.length) % projects.length]
}

/** 取上一个项目，详情页 PREVIOUS PROJECT 使用（开头回到最后一个） */
export function getPrevProject(slug: string): Project {
  const i = projects.findIndex((p) => p.slug === slug)
  return projects[(i - 1 + projects.length) % projects.length]
}

/** 按筛选条件取项目，并按优先级排序（雷火与UI动效自然靠前） */
export function filterProjects(filter: ProjectFilterId | 'all'): Project[] {
  const list =
    filter === 'all' ? [...projects] : projects.filter((p) => p.categories.includes(filter))
  return list.sort((a, b) => a.priority - b.priority || a.index.localeCompare(b.index))
}

/* ---------- 二级筛选：基于子层级案例（cases）的分组 ---------- */

/** 一级分类的二级筛选项（'all' 为全部；宣发/社媒无二级筛选） */
export interface ProjectSubFilter {
  id: string
  label: LT
}

export const projectSubFilters: Partial<Record<ProjectFilterId, ProjectSubFilter[]>> = {
  leihuo: [
    { id: 'all', label: lt('全部', 'All') },
    { id: 'wow', label: lt('魔兽世界', 'World of Warcraft') },
    { id: 'naraka', label: lt('永劫无间', 'Naraka: Bladepoint') },
    { id: 'nsh', label: lt('逆水寒', 'Justice Online') },
    { id: 'qingnv', label: lt('倩女幽魂', 'Qingnv') },
    { id: 'hearthstone', label: lt('炉石传说', 'Hearthstone') },
    { id: 'rd', label: lt('在研项目', 'In-development') },
    { id: 'tianyu', label: lt('天谕', 'Revelation') },
  ],
  'game-ui': [
    { id: 'all', label: lt('全部', 'All') },
    { id: 'ae-previs', label: lt('AE 预演', 'AE Previs') },
    { id: 'ue5', label: lt('UE', 'Unreal Engine') },
    { id: 'unity', label: lt('Unity', 'Unity') },
  ],
  ad: [
    { id: 'all', label: lt('全部', 'All') },
    { id: 'mhxy', label: lt('梦幻西游手游', 'Fantasy Westward Journey Mobile') },
    { id: 'yys', label: lt('阴阳师手游', 'Onmyoji Mobile') },
    { id: 'slzh', label: lt('率土之滨', 'Slash of the Three Kingdoms') },
    { id: 'nsh-ad', label: lt('逆水寒手游', 'Justice Online Mobile') },
    { id: 'peak-speed', label: lt('巅峰极速', 'Peak Speed') },
    { id: 'uu', label: lt('UU加速器', 'UU Booster') },
    { id: 'xxyx', label: lt('小小英雄（4399 项目）', 'Little Heroes (4399)') },
    { id: 'sanqi', label: lt('三七互娱（项目）', 'Sanqi Interactive (Project)') },
    { id: 'sjqy', label: lt('世界启元（腾讯项目）', 'World Awakening (Tencent)') },
  ],
  promo: [
    { id: 'all', label: lt('全部', 'All') },
    { id: 'peak-speed-map', label: lt('巅峰极速', 'Peak Speed') },
    { id: 'forgotten-sea', label: lt('遗忘之海', 'Forgotten Sea') },
    { id: 'diablo3', label: lt('暗黑破坏神3', 'Diablo 3') },
    { id: 'headshot-xmt', label: lt('头号追击', 'Headshot') },
    { id: 'seven-days-xmt', label: lt('七日世界', '7 Days World') },
  ],
  social: [
    { id: 'all', label: lt('全部', 'All') },
    { id: 'idv-math', label: lt('第五数学', 'Identity V Math') },
    { id: 'yanyi-star', label: lt('演绎之星', 'Deduction Star') },
    { id: 'poorest-official', label: lt('最惨官方', 'Poorest Official') },
    { id: 'poorest-official-2', label: lt('最惨官方2.0', 'Poorest Official 2.0') },
    { id: 'ai-fatcat', label: lt('AI胖猫', 'AI Fat Cat') },
    { id: 'ai-ambitions', label: lt('AI大展宏图', 'AI Ambitions') },
    { id: 'netease-24h-live', label: lt('网易24小时直播间', 'NetEase 24H Livestream') },
    { id: 'wolf-barged-in', label: lt('公司里突然闯进一只狼', 'A Wolf Barged In') },
    { id: 'my-meme-pack', label: lt('我的表情包', 'My Meme Pack') },
    { id: 'english-corner', label: lt('英语角', 'English Corner') },
    { id: 'blue-v', label: lt('蓝V', 'Blue V') },
    { id: 'being-framed', label: lt('被做局', 'Being Framed') },
    { id: 'easiest-edit', label: lt('最好剪的视频', 'Easiest Edit') },
    { id: 'props-attitude', label: lt('对不同道具的态度', 'Attitudes to Props') },
    { id: 'idv-marketing', label: lt('第五营销', 'Identity V Marketing') },
    { id: 'downed-rescue', label: lt('倒地时最希望出现的人', 'Who You Want When Downed') },
    { id: 'into-the-essay', label: lt('写进作文', 'Into the Essay') },
  ],
}

/** 取案例的全部作品视频：优先按 works 活动展开，其次多视频 / 单视频 */
function caseVideos(c: ProjectCase): string[] {
  if (c.works && c.works.length > 0) return c.works.flatMap((w) => w.videos)
  if (c.videos && c.videos.length > 0) return c.videos
  return c.video ? [c.video] : []
}

/** 按二级筛选按钮的顺序排列案例（与筛选页顺序一致），用于雷火 videos 同步、
    二级项目条与视频切换/案例导航顺序。未列入子筛选的案例（如 AD 分组）保持在原顺序后段。
    projectSubFilters 的键是一级筛选 id（如 'leihuo'），从项目 categories 里反查。 */
export function orderCasesBySubFilter(p: Project | undefined): ProjectCase[] {
  if (!p?.cases?.length) return []
  const filterId = (p.categories ?? []).find((c) => c in projectSubFilters) as
    | ProjectFilterId
    | undefined
  const subs = filterId ? projectSubFilters[filterId] : undefined
  if (!subs?.length) return p.cases
  const ids = subs.map((s) => s.id).filter((id) => id !== 'all')
  if (!ids.length) return p.cases
  const map = new Map(p.cases.map((c) => [c.id, c]))
  const ordered = ids.map((id) => map.get(id)).filter((c): c is ProjectCase => !!c)
  const rest = p.cases.filter((c) => !ids.includes(c.id))
  return [...ordered, ...rest]
}

/** 案例展示名：有 product 字段（如 炉石传说 / 逆水寒）时显示产品名，否则显示案例名 */
export function caseDisplayName(c: ProjectCase): LT {
  return c.product ?? c.name
}

/** 子筛选按钮的数字：该子模块（案例）的视频总数（'all' 为全部案例视频之和）。
    新增 / 上传视频后自动同步。 */
export function subFilterVideoCount(filter: ProjectFilterId, sub: string): number {
  const p = filterProjects(filter)[0]
  if (!p?.cases?.length) return 0
  const cases = sub === 'all' ? p.cases : p.cases.filter((c) => c.id === sub)
  return cases.reduce((s, c) => s + caseVideos(c).length, 0)
}

/** 把项目全部作品视频映射到所属案例 id，用于二级项目条（子模块）高亮跟随当前视频。 */
export function videoOwnerMap(p: Project | undefined): Record<string, string> {
  const owner: Record<string, string> = {}
  if (!p) return owner
  ;(p.cases ?? []).forEach((c) => {
    caseVideos(c).forEach((v) => {
      owner[v] = c.id
    })
  })
  return owner
}

/* 一级项目 videos 与子模块自动同步：
   子模块新增 / 上传视频后，一级项目卡片与详情页预览自动包含新视频，无需手动维护列表。
   雷火顺序跟随二级筛选（sub-filter）顺序，保证视频切换与二级项目条顺序一致。 */
const leihuoExternal = projects.find((p) => p.id === 'leihuo-external-motion')
if (leihuoExternal) {
  leihuoExternal.videos = orderCasesBySubFilter(leihuoExternal).flatMap((c) => caseVideos(c))
}

/* 游戏UI动效练习 / 游戏宣发视频 / 游戏广告视频：同样从子模块作品同步 videos（卡片与详情页预览）。 */
const gameUi = projects.find((p) => p.id === 'game-ui-motion-studies')
if (gameUi) {
  gameUi.videos = (gameUi.cases ?? []).flatMap((c) => caseVideos(c))
}
const promoFilms = projects.find((p) => p.id === 'game-promotion-films')
if (promoFilms) {
  promoFilms.videos = (promoFilms.cases ?? []).flatMap((c) => caseVideos(c))
  promoFilms.metrics = moduleMetrics(promoFilms, lt('剪辑 / 包装', 'EDIT / PACK'), lt('多平台', 'MULTI-PLATFORM'))
}
const adFilms = projects.find((p) => p.id === 'game-ad-films')
if (adFilms) {
  adFilms.videos = orderCasesBySubFilter(adFilms).flatMap((c) => caseVideos(c))
  adFilms.metrics = moduleMetrics(adFilms, lt('BGC / PUGC / KOL', 'BGC / PUGC / KOL'), lt('多形式广告', 'MULTI-FORMAT'))
}
const socialVideos = projects.find((p) => p.id === 'game-social-videos')
if (socialVideos) {
  socialVideos.videos = orderCasesBySubFilter(socialVideos).flatMap((c) => caseVideos(c))
  /* 社媒一级指标使用数据源中配置的 4 项（17 精选案例 / 30+ 参与内容 / 2200W+ 播放 / 210W+ 点赞），
     不再覆盖为模块级 CASE COUNT */
}

/** 一级模块级任务数据（宣发 / 广告 / 社媒顶部卡片）：数量动态计算，其余状态型信息 */
function moduleMetrics(p: Project, main: LT, launch: LT): ProjectMetric[] {
  const n = `${p.cases?.length ?? 0}`
  return [
    { label: 'CASE COUNT', value: lt(n, n) },
    { label: 'MAIN TYPE', value: main },
    { label: 'DELIVERY', value: lt('已交付', 'DELIVERED') },
    { label: 'LAUNCH', value: launch },
  ]
}

/** 把子层级案例包装成展示用 Project（复用项目卡 / 详情入口） */
function caseToProject(p: Project, c: ProjectCase, seq: number): Project {
  const name = typeof c.name === 'string' ? c.name : c.name.en
  const count = `${caseCount(c)}`
  return {
    ...p,
    /* 唯一 id：同一父项目下的多个案例必须有不同 React key */
    id: `${p.id}-${c.id}`,
    /* 标记该展示项为子层级案例，VIEW CASE 跳转案例查看器 */
    caseId: c.id,
    title: name,
    titleZh: c.name,
    index: String(seq + 1).padStart(2, '0'),
    /* 卡面类型 / 职责：优先案例级配置，缺失时回落父级（宣发/广告/社媒保持模块级） */
    category: c.projectType ?? p.category,
    role: c.responsibility ?? p.role,
    description: c.description,
    /* 案例专属封面（约定路径，从首条视频抽帧）优先，其次 track cover */
    cover: caseCoverPath(p, c),
    video: c.video ?? caseVideos(c)[0] ?? '',
    videos: caseVideos(c),
    gallery: c.gallery ?? [],
    /* 独立任务数据：数量动态计算；主要类型/交付/上线按案例配置，缺失回落模块默认 */
    metrics: [
      { label: 'CASE COUNT', value: lt(count, count) },
      { label: 'MAIN TYPE', value: c.mainType ?? shortType(c.projectType ?? p.category) },
      { label: 'DELIVERY', value: c.deliveryStatus ?? lt('已交付', 'DELIVERED') },
      { label: 'LAUNCH', value: c.launchStatus ?? defaultLaunch(p.id) },
    ],
    ...(c.statusLabel ? { statusLabel: c.statusLabel } : {}),
  }
}

/**
 * Projects 一级页面的"展示项"：
 * - 雷火 / 游戏UI / 广告 三个方向：展示该方向的子层级案例（cases），并支持二级筛选。
 * - 宣发 / 社媒 / 全部：展示顶级项目。
 */
export function getDisplayItems(
  filter: ProjectFilterId | 'all',
  sub: string = 'all'
): Project[] {
  if (filter === 'all') return filterProjects('all')

  const primary = filterProjects(filter)
  const p = primary[0]
  if (p?.cases?.length) {
    if (sub === 'all') {
      /* 全部：顶级项目卡（含二级项目条 + 全部视频）置于首位，其后为各子模块案例卡。
         案例卡顺序跟随二级筛选顺序，保证「全部」与筛选按钮顺序一致。 */
      return [p, ...orderCasesBySubFilter(p).map((c, i) => caseToProject(p, c, i))]
    }
    /* 子筛选匹配支持前缀：例如 'wow' 同时命中 wow 与 wow-v2（如需多版本节点），计数显示该子模块的作品总数 */
    const cases = p.cases.filter((c) => c.id === sub || c.id.startsWith(`${sub}-`))
    return cases.map((c, i) => caseToProject(p, c, i))
  }
  return primary
}
