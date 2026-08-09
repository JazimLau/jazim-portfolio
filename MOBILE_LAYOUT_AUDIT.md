# MOBILE LAYOUT AUDIT — 手机端专项审计

> PHASE 01 · 生成时间：2026-08-09
> 目标 Viewport：320～767px；重点 375×812 / 390×844 / 393×873 / 414×896 / 430×932（CSS px）
> 750×1624 为 DPR=2 物理像素，CSS 布局对应 375×812，**不**用 750 作为设计宽度。
> 测试环境：Vite dev server (127.0.0.1:5173) + CDP DeviceMetricsOverride 375×812 dpr2。

---

## 1. 现有响应式断点分布

| 文件 | 断点 | 作用 |
|---|---|---|
| variables.css | ≤1200 / ≤768 | shell-gutter 40→26→18px；section-gap 收缩 |
| Projects.module.css | ≤1100 / ≤768 / ≤380 | subGrid 4→3→2 列；380px 改 auto-fit |
| ProjectCard.module.css | ≤1100 / ≤768 | card grid 1 列；media order:-1；padding 18px |
| VideoPreview.module.css | （无移动断点） | HUD 全程绝对定位覆盖在视频内 |
| IndexSection.module.css | ≤1200 / ≤1024 / ≤768 | stats 3→2 列；menu 1 列；contactList 1 列 |
| Skills.module.css | ≤1100 / ≤768 | modHead 换行；nodes 1 列 |

**缺口**：`.moduleExtra`（IndexSection）没有任何移动端规则；VideoPreview 无移动端规则；
Projects 的 `.subGrid` 在 768 下仍是 2 列竖排（不是横向 Rail）。

---

## 2. 问题 01 · Projects PRODUCT 筛选竖向堆积过长

- **selector**：`.subGrid` / `.subChip`（`Projects.module.css`）
- **现状**：`@media (max-width:768px)` 下 `grid-template-columns: repeat(2, minmax(0, max-content))`
- **实测（375×812，LEIHUO 筛选）**：
  - `.subGrid`：302×200px（2 列 × 4 行，8 个 chip）
  - 每个 `.subChip`：132×44px
  - `.filterPanel` 总高 **632px**（含 LEVEL 标签 + 提示 + Rail + 轨道 chips + 计数）
- **判定**：与用户要求「横向 Scrollable Product Rail」不符 → FAIL

## 3. 问题 02 · Video Preview 被挤到首屏之外 + 控件遮挡

- **selector**：`.slot`（`Projects.tsx` 内联 `flex: 0 0 78%`）、`.subModuleList` / `.subModuleChip`（`ProjectCard.module.css`）、`.videoNav`、VideoPreview `.hud` 各层
- **现状**：
  - `.slot` 固定 78% 卡片宽 → 375 下卡片内容区仅 ~184px（媒体列更窄），正文只占页面约 55%
  - 卡片内 `.subModuleList`：`repeat(auto-fill, minmax(126px, max-content))` → 375 下塌成 1 列 × 7 行 = **344px**
  - `.videoBox`：184×111px，位于 subModuleList 之后（被推下 ~500px）
  - `.selectPanel` 总高 **1532px**
- **实测数据（375×812，LEIHUO）**：videoBox top=1741（首屏外）；subModuleChip 7 个纵向堆叠
- **判定**：视频被大量推下、卡片过窄 → FAIL

## 4. 问题 03 · Home MODULES / FOCUS / GUIDE 三栏过窄

- **selector**：`.moduleExtra` / `.extraCard`（`IndexSection.module.css`）
- **现状**：`grid-template-columns: repeat(3, 1fr)` 全宽度生效，无移动端覆盖
- **375×812**：`.extraCard` 每栏约 (343-36)/3 ≈ **102px** →「身份定位 / 动效监视器 / 作品入口」被压成逐字竖排
- **判定**：三栏过窄、中文碎裂 → FAIL

## 5. 问题 04 · Index Contact 下方 LEVELING / STATUS / TOPICS 三栏

- **selector**：同 `.moduleExtra` / `.extraCard`
- **现状**：同上 3 列；「游戏UI / 动效」「持续更 / 新作品集」「项目协 / 作」逐字碎裂
- **判定**：FAIL

## 6. 问题 05 · Skills 巨大空白（核心 Bug）

- **selector**：`.module`（`Skills.tsx` 的 `useGsapContext` 内 `gsap.from(mod, { scaleY:0, opacity:0 })`）
- **实测（375×812）**：
  - 首模块滚入视口后 1.8s，`getComputedStyle`：**`transform: matrix(1,0,0,0,0,0)`（scaleY=0）+ `opacity: 0`**
  - `clearProps: 'transform,opacity'` 未生效 → 模块永久卡在 from 态
  - 布局高度仍在（区块 1907px），但内容不可见 → 用户看到「标题/状态条之后巨大空白」
  - 首模块位于节点头部（SectionHeader + 图例）下方约 **1000px** 处
- **根因**：ScrollTrigger `from` 动画触发不及时/未触发（移动端滚动节奏与 768 以下触发点不匹配），`once:true` 未完成
- **判定**：FAIL（这是"进入 Skills 看不到内容"的直接原因）

## 7. 问题 06 · Skills / Projects 可视化右对齐

- **selector**：`.modStateWrap`（Skills，align-items:stretch/末端）、`.metrics`/`.sidePanel`、`.pickerExtra`（margin-left:auto）
- **现状**：多处使用 `align-items:flex-end` / `margin-left:auto` / 右对齐计数
- **判定**：移动端需统一左上对齐（仅影响移动端覆盖）

## 8. 其它隐患（审计发现）

- **视频 HUD 全层叠**：`.hud` 绝对定位 inset:0；`.hudBottomArea` 内 Playback 控制行 + `.pickerRow`（VIDEO 01..23 永远可见）都在视频画面内 → 移动端互相挤压（问题 02 控制遮挡来源）
- **左右切换箭头** `.videoNav` 绝对定位 `inset:0` 覆盖视频（desktop 正常；mobile 需移出画面）
- **音量条** `.volumeTrack` 54px 桌面宽度，移动端会挤压 Progress
- **`.progressTrack`** 已用 `minmax(0,1fr)`，本身不重叠，但被音量/VIDEO 层挤压
- **页面横向溢出**：375 下 `documentElement.scrollWidth === innerWidth`（body overflow-x hidden 掩盖）；320 需专项复查
- **320px 断点**：现有 `@media (max-width:380px)` 改 subGrid 为 auto-fit 132px → 需改为 Rail 并复查

---

## 9. 结论与修复方向

| # | 修复目标 | 方式 |
|---|---|---|
| 01 | Product Selector → 横向 Rail | Projects.module.css `@media(max-width:767px)` 覆盖 `.subGrid`/`.subChip` |
| 02 | 卡片全宽 + 视频快速可见 | ProjectCard `.slot` 100%、`.subModuleList` 横向 Rail、紧凑 padding |
| 02 | 播放/导航分离、移出画面 | VideoPreview 移动端覆盖 + ProjectCard 移动端导航行（prev/counter/next + Rail） |
| 03/04 | moduleExtra → 单列 | IndexSection.module.css 移动端覆盖 |
| 05 | Skills 去空白 | Skills.tsx `isCompact` 跳过模块 scaleY/opacity 入场（内容直接可见） |
| 06 | 左上对齐 | 各模块移动端覆盖统一 flex-start / text-align:left |
| 全局 | 安全区 16px（320 用 12px） | global.css `@media(max-width:767px)` 覆盖 shell-gutter |

> 全部修改限定在 `@media (max-width: 767px)` 或移动端组件逻辑内；≥768px 视觉零改动。
