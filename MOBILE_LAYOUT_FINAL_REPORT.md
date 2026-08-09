# MOBILE LAYOUT FINAL REPORT — 手机端专项重构完成报告

> PHASE 75 · 生成时间：2026-08-09
> 目标：**Mobile Phone Only（320～767px）** 专项重构，绝对禁止影响 ≥768px 的 Tablet / Desktop。
> 对照审计文件：`MOBILE_LAYOUT_AUDIT.md`（PHASE 01）

---

## 0. 执行范围与约束

- 所有样式修改均限定在 `@media (max-width: 767px)` 内（或组件内 `useIsCompact()` 移动端逻辑分支）。
- ≥768px 的 Tablet / Desktop 视觉与交互**零改动**（已做回归验证，见 §13/§14）。
- 测试环境：Vite dev server (127.0.0.1:5173) + CDP `Emulation.setDeviceMetricsOverride`。
- 程序化 QA 基于真实 DOM `getBoundingClientRect()` / `getComputedStyle()` 测量，非目测。

---

## 1. 移动端断点定义

| 项 | 值 |
|---|---|
| 目标断点 | **`max-width: 767px`**（手机专享） |
| 主测视口 | 375×812（CSS px） |
| 全量程序化 QA 宽度 | 320 / 360 / 375 / 390 / 393 / 414 / 430 |
| 抽查视口 | 375×812、390×844、393×873、414×896、430×932 |
| 安全区变量 | `--mobile-safe-x: 16px`（≤767px）；`--shell-gutter: 16px`；`--section-gap: clamp(40px,8vh,56px)` |
| 超窄屏 | ≤359px 时 `--mobile-safe-x: 12px`、`--shell-gutter: 12px` |

## 2. 750×1624 与 375×812 的关系（重要澄清）

- **750×1624 是 DPR=2 的物理像素**，对应的 **CSS 布局宽度为 375px**（812 物理高 ÷ 2 = 406 CSS 高，实际以 812 计）。
- 本项目所有 CSS 均以 **CSS px** 编写与测量，**不使用 750 作为设计宽度**。
- 程序化 QA 均以 CSS 宽度 320/360/375/390/393/414/430 执行，符合用户要求。

---

## 3. 问题 01 · Product Selector 布局（旧 vs 新）

| 维度 | 旧（≤768 网格竖排） | 新（≤767 横向 Rail） |
|---|---|---|
| `.subGrid` 布局 | `grid` 2 列 × 4 行 | `flex` 横向（`flex-wrap: nowrap; overflow-x:auto`） |
| `.subGrid` 尺寸（375） | 302×**200px** | **56px** 高（单行） |
| `.subChip` | 132×44px，自动换行 | `flex: 0 0 auto`，`min-height:48px`，`white-space:nowrap` |
| 选中态 | 仅边框 | 紫边框 + `.subChipOn::after` 底部 2px 紫线 |
| `.filterPanel` 高度 | **632px** | **457px** |
| `.selectPanel` 高度 | **1532px** | **1220px** |

滚动条：Rail `scrollbar-width:none` + `::-webkit-scrollbar { display:none }`（隐藏，靠手势滑动）。

**自动滚动居中**：`Projects.tsx` 新增 `subGridRef`，在 `[activeSub, reduced]` 变化时用 `getBoundingClientRect()`（非 `offsetLeft`，避免 offsetParent 错位）计算 `relLeft` 并 `scrollTo({ left: max(0, relLeft-(clientWidth-chipW)/2) })`。验证：571px 下切换到 LEIHUO 时 `scrollLeft=474` 生效。

## 4. Product Rail 高度变化

| 指标 | 旧 | 新 |
|---|---|---|
| Rail 区域高度（375，含 8 chip） | 200px（4 行） | **56px**（1 行） |
| 对页面总高的影响 | 首屏被筛选器占满 | 节省约 **144px** 纵向空间 |

## 5. Video Player 移动端结构（重构后）

```
┌─ .videoBox（全宽 289×162@375，原 184×111）────────┐
│  HUD：播放/进度/音量/全屏（44×44 触控目标）        │
│  pickerRow（VIDEO 01..23）—— 移动端隐藏            │
└──────────────────────────────────────────────────┘
┌─ .mobileVideoNav（仅移动端渲染）──────────────────┐
│  ┌─ .mobileNavRow：◀ [视频 01 / 23] ▶           │
│  └─ .mobilePickerRail：01 02 03 … 23（横向滚动）  │
└──────────────────────────────────────────────────┘
```

- `.videoBox`：`width:100%`；移动端 `:global(.hidePickerOnMobile) .pickerRow { display:none }`（仅 ProjectCard 生效，Case/Detail 不受影响）。
- `.videoNav`（画面内左右箭头）移动端 `display:none`，由下方导航行替代。
- `.mobileNavBtn` / `.mobilePickBtn`：44×44px 触控目标。
- HUD 控件紧凑化：tag/status 10px、进度条 `min-width:0`、音量条 `.volumeTrack` 移动端隐藏。

## 6. 播放控制 / 视频导航分离

| 层 | 职责 | 位置 |
|---|---|---|
| HUD（播放/进度/音量/全屏） | 画面内播放控制 | 视频画面内（紧凑） |
| `.mobileVideoNav`（prev/counter/next + Rail） | 视频切换导航 | **视频画面外**、卡片媒体下方 |
| `.pickerRow` | 视频列表（桌面） | 移动端隐藏 |

- 原先 HUD 的 Playback 行 + pickerRow + 箭头全部挤在画面内 → 已彻底分离。
- **控件重叠实测（375，LEIHUO 视频）**：progress(202–269px) / play(54–98px) / volume(277–321px) 无重叠；`mobileNavRow` y=1407–1451 独立区域，与视频框无交集。

## 7. Video Selector 最终形态

- **桌面（≥768）**：画面内 `.pickerRow`（flex 行）+ `.videoNav` 左右箭头 —— 保持原样。
- **移动端（≤767）**：画面内 pickerRow 隐藏 → 视频下方 `.mobileVideoNav`：
  - 上一视频 / 视频 01/23 计数 / 下一视频（44×44 按钮）
  - 横向滚动视频 Chip Rail（`aria-current` 标记当前视频）
- 仅当 `videos.length > 1 && onPrevVideo && onNextVideo` 时渲染。

## 8. Home 三卡片（MODULES / FOCUS / GUIDE）移动端布局

- `.moduleExtra`：`repeat(3,1fr)` → 移动端 `grid-template-columns:1fr`（**单列**）。
- `.extraCard`：padding 14×16px、`text-align:left`；`.extraList li` 行高还原。
- 实测（375）：卡片宽 **310px**（原 3 栏时每栏仅 ~102px，中文逐字碎裂）。
- `detailInner`：`justify-content:flex-start; align-items:stretch; min-height:0`；标题 `clamp` 两行截断。

## 9. Index Contact 下方 LEVELING / STATUS / TOPICS 布局

- 同 `.moduleExtra` 单列规则（`IndexSection.module.css` 移动端覆盖）。
- 原「游戏UI / 动效」「持续更 / 新作品集」「项目协 / 作」逐字碎裂 → 单列后整词不换行。
- `contactValue` 16px + `overflow-wrap:anywhere`（邮箱/链接长文本不撑破）。
- `eyeBtn` 44×44 触控目标；`menuCol`/`menuItem`/`stats`/`statCard` 紧凑化。

## 10. Skills 巨大空白 —— 根因与修复

- **根因**：`Skills.tsx` 的 `useGsapContext` 中 `gsap.from(mod, { scaleY:0, opacity:0, ..., clearProps:'transform,opacity' })` + ScrollTrigger 在移动端**未触发/未完成** → 模块永久卡在 `opacity:0; transform:matrix(1,0,0,0,0,0)`（scaleY=0）。布局高度保留（区块 1907px）但内容不可见 → 首屏后大片空白。
- **修复**：`useGsapContext` 内新增 `if (isCompact)` 分支 —— **跳过模块 scaleY/opacity 入场动画**（内容直接可见），仅运行轻量图例动画。依赖 `[reduced] → [reduced, isCompact]`。
- **验证**：320–430 全宽度 `getComputedStyle`：`opacity:1`、`transform:none`，无卡死态。

## 11. Skills 头部 → 内容距离

| 指标 | 旧 | 新 |
|---|---|---|
| 模块入场 | scaleY/opacity from（卡死风险） | 直接可见（无动画） |
| 头部到内容间隙 | 首模块不可见 → 视口内大量空白 | **0**（模块标题后立即渲染节点） |
| 首屏可见节点数 | 0（全部隐藏） | **30–33 个节点**可见 |
| `.nodes` | `repeat(auto-fit,minmax(200px,1fr))` | 移动端 `1fr` 单列，`.node min-height:44px` |

## 12. 左对齐（可视化右对齐 → 左上）

移动端统一改为左上对齐（仅 ≤767px 覆盖）：

| 组件 | 原 | 移动端 |
|---|---|---|
| Skills `.modStateWrap` / `.modCount` | 右/末端对齐 | `align-items:flex-start` |
| Index `.detailCentered` | 居中/右 | `align-items:flex-start; text-align:left`；`.detailTop/.detailFoot` `justify-content:space-between` |
| Index `.extraCard` | — | `text-align:left` |
| 触控目标 | — | 全部按钮 ≥44×44（modToggle/eyeBtn/mobileNavBtn/mobilePickBtn） |

---

## 13. 横向溢出 QA（PHASE 68）—— 全通过

`documentElement.scrollWidth <= innerWidth + 1`，溢出元素数为 0：

| 宽度 | scrollWidth − innerWidth | 溢出元素数 | 结果 |
|---|---|---|---|
| 320 | 0 | 0 | PASS |
| 360 | 0 | 0 | PASS |
| 375 | 0 | 0 | PASS |
| 390 | 0 | 0 | PASS |
| 393 | 0 | 0 | PASS |
| 414 | 0 | 0 | PASS |
| 430 | 0 | 0 | PASS |

文本换行 QA、视频 bounding-rect QA、Skills bounding QA（PHASE 69–71）均通过。

## 14. Desktop 回归（PHASE 62）—— 无泄漏

干净加载 1920×1080（CDP `mobile:false`，非仿真切换残留状态）：

| 指标 | 实测 | 期望 |
|---|---|---|
| `@media(max-width:767px)` | false | — |
| `.slot` flex | `0 0 78%`（inline + computed） | 78% ✓ |
| `.slot`/卡片宽 | 1206px / stage 1663px（78%） | ✓ |
| `.subGrid` | `grid`，5 列（124.1/124.1/124.1/111.6/124.1px） | ✓ |
| `.subChip` 高 | 40px | ✓ |
| `.pickerRow` | `flex`（画面内 VIDEO 01..23） | ✓ |
| `.videoNav` | `block`（画面内左右箭头） | ✓ |
| `.mobileVideoNav` | `none` | ✓ |
| `.moduleExtra`（Home/Index） | 3 列 | ✓ |

> 结论：Desktop 完整保持重构前形态，无任何泄漏。

## 15. Tablet 回归（834px）—— 无泄漏

- `.subGrid`：`grid` **3 列**（≤1100 规则，未触发 ≤767 横向 Rail）✓
- 未命中任何 `max-width:767px` 规则 ✓

## 16–19. 构建验证（PHASE 74）

| 命令 | 内容 | 结果 |
|---|---|---|
| `npm run typecheck` | `tsc --noEmit` | **PASS（exit 0）** |
| `npm run build` | `tsc --noEmit && vite build`（1660 modules，6.10s） | **PASS（exit 0）** |
| `npm run build:github` | GitHub Pages（`VITE_BASE=./`） | **PASS（exit 0）** |
| `npm run build:deploy` | Tencent（生产 base） | **PASS（exit 0）** |

> 注：hls chunk 523KB 为既有体积警告（非新增、非错误）。

## 20. 结论

- **6 项问题全部修复**：① Product Rail 横向化；② 视频全宽 + 播放/导航分离；③④ Home/Index 三栏单列化；⑤ Skills 空白根因修复；⑥ 可视化左上对齐。
- **全部修改仅作用于 ≤767px**；Desktop / Tablet 回归验证无泄漏。
- **构建链路全绿**（typecheck / build / build:github / build:deploy）。
- 屏幕快照存档：`C:\Temp\mobile-qa\`（375×812 / 390×844 / 430×932 等 + 1920 桌面回归）。

> 部署（GitHub + Tencent）按用户指示暂缓；等待用户后续指令。
