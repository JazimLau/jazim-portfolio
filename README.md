# 刘俊熙 JAZIM LAU — 游戏动效设计师作品集

暗色系游戏风格化个人作品集。单页滚动 + 项目详情独立路由，React + Vite + TypeScript + GSAP ScrollTrigger。

---

## 快速开始

### 最简单：双击 `启动开发服务器.bat`

双击后会显示一个菜单：

| 选项 | 作用 |
|---|---|
| `1` 启动开发服务器 | 推荐。热更新，改代码即时生效，浏览器自动打开 |
| `2` 构建生产版本 + 本地预览 | 先类型检查再打包，最后起服务器预览成品（`dist/`） |
| `3` 只做类型检查 | 快速检查代码有没有类型错误 |
| `4` 退出 | 关闭窗口 |

会自动检查 Node.js 环境、首次自动安装依赖（`node_modules` 缺失时）、检测端口占用并提示。关闭黑窗口即停止服务。

> 脚本由两部分组成：`启动开发服务器.bat`（纯启动器）+ `run-tool.ps1`（菜单逻辑）。
> 菜单「① 启动开发服务器」与快速入口共用同一套启动逻辑 `start-dev.bat`。
> 改菜单文案去 `run-tool.ps1`（注意用带 BOM 的 UTF-8 保存，否则中文会乱码）。

### 入口一览

| 入口 | 用途 |
|---|---|
| `启动开发服务器.bat` | **推荐入口**：打开 Portfolio 工具菜单，可执行开发服务器、构建预览和类型检查 |
| `start-dev.bat` | **快速入口**：跳过菜单，直接启动本项目 Vite 开发服务器（菜单「① 启动开发服务器」也调用它）；若 5173 已在运行则不会重复启动 |
| `check-dev.bat` | **状态检查**：检查 Portfolio 是否正在 5173 端口运行；未运行时可按键一键启动 |
| `stop-portfolio.bat` | **停止服务器**：安全停止监听 5173 的 Portfolio 开发服务器（只关 5173 端口，不误杀其它 Node 项目） |

> 旧版重复入口 `start-portfolio.bat` / `start-dev.ps1` 已合并进 `start-dev.bat`，不再使用。

### 或者用命令行

```bash
npm install
npm run dev
```

浏览器会自动打开 <http://localhost:5173>。

> ### 不要直接双击 `index.html`
>
> 这是 React + Vite 工程，源码里的 `index.html` 写的是 `<script src="/src/main.tsx">`，
> 必须经过 Vite 编译才能运行。用 `file://` 直接打开会得到**一片空白**。
> `dist/index.html` 同样不行，它引用的是绝对路径资源，必须通过 HTTP 访问。
>
> 真的打开了也不会一片黑 —— 页面 8 秒后会自己显示一段说明，告诉你正确的打开方式。
>
> 想看构建后的效果请用 `npm run preview`（会起一个本地静态服务器），不要双击。

| 命令 | 作用 |
|---|---|
| `npm run dev` | 开发服务器，热更新 |
| `npm run build` | 类型检查 + 生产构建到 `dist/` |
| `npm run preview` | 本地起服务器预览生产构建产物 |
| `npm run typecheck` | 只做 TypeScript 检查 |

> **首次 `npm run dev` 页面可能空白十几秒**：Vite 要按需转换 1600+ 模块，转换完成后自动出现。之后有缓存，一秒左右（实测 1.27s）。

---

## 技术栈

- **React 18** + **TypeScript**（严格模式，`noUnusedLocals` 全开）
- **Vite 5** — 构建，GSAP 与 router 拆成独立 chunk
- **GSAP 3 + ScrollTrigger** — 全部动效
- **Lenis** — 平滑滚动，与 ScrollTrigger 同源驱动
- **React Router 6** — 项目详情页路由
- **lucide-react** — 图标
- **CSS Modules + 原生 CSS 变量** — 无 UI 组件库、无 CSS 框架、无 SCSS 编译

自实现（不引入额外依赖）：文本逐字/逐行拆分（`src/lib/splitText.ts`）、磁吸按钮、自定义光标、项目卡轮播。

---

## 目录结构

```
src/
├─ components/
│  ├─ layout/     Navbar / SectionHeader / PageTransition
│  ├─ ui/         MagneticButton / CursorFollower / StatusBadge
│  │              VideoPreview / RevealText / ProjectCard
│  └─ sections/   Opening / Hero / IndexSection / Profile
│                 Timeline / Skills / Projects / Contact
├─ pages/         HomePage / ProjectDetailPage / NotFoundPage
├─ data/          ★ 所有文案都在这里，改内容只改这几个文件
│  ├─ types.ts        数据契约
│  ├─ profile.ts      个人信息 / 能力 / 工具 / 统计 / 档案卡
│  ├─ timeline.ts     履历
│  ├─ skills.ts       能力矩阵
│  ├─ projects.ts     项目库 + 筛选器
│  └─ navigation.ts   导航项 + Index 节点
├─ hooks/         useGsapContext / useReducedMotion / useActiveSection
├─ lib/           gsap 注册 / 平滑滚动 / 文本拆分 / 动效参数规范
├─ context/       UIContext（语言 / 声音 / 首屏就绪）
└─ styles/        reset / variables / typography / global

public/assets/
├─ videos/    视频（见该目录 README）
├─ images/    图片（见该目录 README）
├─ files/     简历 PDF
└─ icons/     自定义 SVG（可选）
```

---

## 内容维护

### 修改个人信息

`src/data/profile.ts` — 姓名、职位、定位文案、状态标签、邮箱、手机号、微信、简历路径全在 `profile` 对象里。

```ts
export const profile = {
  name: '刘俊熙',
  nameEn: 'JAZIM LAU',
  roleEn: 'GAME MOTION DESIGNER',                                    // 英文代号，两版一致
  roleZh: lt('游戏动效设计 / 视频设计', 'Game Motion Design / Video Design'),  // 双语
  email: 'jazimlau@yeah.net',
  phone: '+86 138 0000 0000',       // ⚠️ 占位号码，见下方提醒
  cvPath: '/assets/files/Jazim-Lau-CV.pdf',
  // ...
}
```

面向读者的文案都是 `lt('中文', 'English')` 双语对照；工具名、代号、纯英文标签保持普通字符串。详见下面的「中英双语文案」。

同文件里还有：`profileIntro`（简介两段）、`abilityTags`、`abilityBlocks`（五条能力描述）、`tools`、`profileStats`（统计面板）、`archiveCards`（右侧四个档案窗口）。

> ⚠️ **发布前必须替换**：`profile.phone` 目前是占位号码 `+86 138 0000 0000`。
> 页面上默认只显示掩码 `+86 138 **** ****`，DOM 里也不放 `tel:` 链接，
> 访客点击"显示完整手机号"才展开成可拨号链接 —— 但号码本身仍然要换成你的真实号码。
> `profile.wechat` 同理，默认是 `AVAILABLE ON REQUEST`，不直接公开微信 ID。

### 修改统计面板（5 格制）

`profileStats` 里每项用 `level`（0–5，可带小数）表示格数，**不是百分比进度条**：

```ts
{
  code: 'FIRST-DRAFT PASS',
  label: lt('常规交付率（一稿过）', 'First-draft approval rate'),
  value: '95%+',
  numeric: 95, suffix: '%+',
  level: 4.75,          // 4 格满 + 第 5 格 3/4，最后一格会部分填充
}
```

格子会渲染 `aria-label="评级 4 / 5 格"`，评级同时有文字读数，不只靠填充色表达。

### 中英双语文案

站点是**完整的中英两个版本**，不是只翻译了导航。所有面向用户的文案都写成双语对照：

```ts
import { lt } from './i18n'

roleZh: lt('游戏动效设计 / 视频设计', 'Game Motion Design / Video Design'),
role:   [lt('动效设计', 'Motion Design'), lt('分镜', 'Storyboard')],
tools:  ['After Effects', 'Figma'],   // 纯英文（工具名、代号）不用包装
```

- 数据层：`src/data/i18n.ts` 提供 `lt(cn, en)`、`LT`、`MaybeLT`、`resolveLT`、`resolveList`
- 组件层：`const { t, tx, txList } = useUI()`
  - `t('中文', 'English')` —— 写在 JSX 里的零散文案（aria-label、按钮字）
  - `tx(someLT)` —— 解析数据里的一条 `LT`
  - `txList(someLTArray)` —— 解析 `LT[]`
- **新增文案时不要在 JSX 里硬写中文**，走上面三个函数，否则英文版会漏字

加字段的顺序：先在 `src/data/types.ts` 把类型标成 `LT`，再到对应数据文件用 `lt()` 填两版，最后组件里用 `tx()` 取。`npx tsc --noEmit` 会替你把漏掉的一版报出来。

切换语言的行为：

- 选择记在 `localStorage` 的 `jazim-lang` 键，刷新后保持
- 同步写 `<html lang>`（`zh-CN` / `en`）和 `<html data-lang>`（`CN` / `EN`）
- `data-lang` 供 CSS 使用 —— 等宽字体 JetBrains Mono 没有汉字，英文版里那些仍显示中文的位置（比如姓名副行）用 `:global(html[data-lang='EN'])` 换回正文字体
- 点击不是硬切：`requestLang` 只登记意图，七条竖向面板自下而上盖满屏幕后才在 `commitLang` 里换文案，再反向抽走，最后 `ScrollTrigger.refresh()` 重算布局（中英文长度不同会改变高度）

姓名是专有名词，两版都保留：英文版主行是 `JAZIM LAU`、副行 `刘俊熙`，中文版主副行对调。

### 替换首页背景视频


放到 `public/assets/videos/hero-placeholder.mp4`，文件名不用改。

- 建议 1920×1080、8–15s 无缝循环、H.264、≤6MB、**必须静音**
- 同时放一张 `public/assets/images/hero-poster.jpg` 作为加载前的封面
- 页面上会再叠一层压暗 + 渐变 + 颗粒，所以视频本身不用压得太暗

想换路径就改 `src/components/sections/Hero.tsx` 里的 `src="/assets/videos/hero-placeholder.mp4"`。

### 替换项目视频 / 图片

按 `src/data/projects.ts` 里每个项目的字段放同名文件即可：

```ts
cover: '/assets/images/project-01-cover.jpg',   // 16:9
video: '/assets/videos/project-01.mp4',         // 静音循环，≤4MB
gallery: [                                       // 详情页动效拆解图集
  '/assets/images/project-01-01.jpg',
  '/assets/images/project-01-02.jpg',
],
```

**资源不存在也不会破图**：`VideoPreview` 组件是三级回落 —— 视频失败用封面，封面也失败就用设计化的 CSS 占位底板（带项目编号和 `MEDIA PENDING` 标记）。所以可以先上线再补素材，替换真实文件后不需要改任何组件。

### 增加新项目

在 `src/data/projects.ts` 的 `projects` 数组里加一个对象。复制一个现有的改就行：

```ts
{
  id: 'my-new-project',
  slug: 'my-new-project',        // 决定 URL：/projects/my-new-project
  index: '09',                   // 卡面显示的编号
  title: 'MY NEW PROJECT',
  titleZh: '我的新项目',
  category: 'UI Motion / Interaction',
  categories: ['game-ui'],       // 参与哪些筛选，见 projectFilters
  year: '2026',
  featured: false,
  priority: 2,                   // 1/2/3 → 决定卡片视觉权重，1 最大
  status: 'ONGOING',             // ONGOING | DELIVERED | STUDY | ARCHIVE
  accent: 'var(--accent-purple)',
  description: '…',
  role: ['…'],
  tools: ['After Effects'],
  services: ['UI MOTION'],       // 卡面标签
  cover: '/assets/images/project-09-cover.jpg',
  video: '/assets/videos/project-09.mp4',
  gallery: [],
  metrics: [{ label: 'STUDIES', value: '6' }],
  sections: [                    // 详情页章节
    { id: 'background', label: 'PROJECT BACKGROUND', labelZh: '项目背景',
      body: ['段落一', '段落二'] },
    { id: 'role', label: 'MY ROLE', labelZh: '我的职责',
      list: ['要点一', '要点二'] },
    { id: 'process', label: 'PROCESS', labelZh: '制作流程',
      flow: ['需求理解', '动画方案', '动效制作', '上线走查'] },
  ],
}
```

`sections` 里三种呈现方式可任意组合：`body` → 段落，`list` → 要点列表，`flow` → 横向流程条。

**关于优先级**：`priority: 1` 的卡片字号最大、信息最全（雷火端外、UI动效练习、引擎动效）；`priority: 3` 会自动收敛简介行数、隐藏职责块。默认视图按 priority 排序，所以第一优先级内容永远排在最前。

### 替换简历

把 PDF 放到 `public/assets/files/Jazim-Lau-CV.pdf`。要换文件名就改 `src/data/profile.ts` 的 `cvPath`。

Hero、Profile、Contact 三处的 DOWNLOAD CV 按钮都指向这个路径。

### 修改履历 / 能力矩阵

- `src/data/timeline.ts` — 往数组里加对象即可，`kind: 'MISSION'`（实习）或 `'TRAINING'`（训练营）
- `src/data/skills.ts` — 五个能力系统；`linkedFilter` 决定点击 FILTER PROJECTS 时作品库过滤到哪一类；节点状态用 `CORE / PRACTICE / LEARNING`，不用百分比进度条

---

## 设计系统

改 `src/styles/variables.css` 一个文件就能换肤。

```css
--background-main:  #07070A;   --text-primary:   #F3F0E9;
--background-panel: #101017;   --text-secondary: #9693A4;
--background-elevated: #171720; --border-color:  rgba(255,255,255,0.14);
--accent-purple: #7455FF;  /* 主交互强调色 */
--accent-pink:   #E04B9A;  /* 次强调 */
--accent-orange: #FF713D;  /* 状态提示 */
--accent-lime:   #B7FF47;  /* 在线 / 激活状态 */
```

版心：`--shell-max: 1700px`，实际宽度 `min(1700px, 100vw - 2×gutter)`，大屏左右留白 40px（≤1200px 收到 26px，≤768px 收到 18px）。

共享视觉原语在 `global.css` 里，组件模块只写自己独有的布局：`.shell` `.panel` `.cut` `.brackets` `.grid-bg` `.scanlines` `.noise` `.scan-sweep` `.media-fallback`。

### 关于英文标题字体（重要）

本机没有 Oswald / Archivo Narrow / Arial Narrow，所以当前用的是 Windows 自带的 **Bahnschrift SemiCondensed**（DIN 风格窄体，实测宽度是 Segoe UI 的 78%）。

想要更强的压缩感，装一个开源窄体即可自动生效（字体栈里已排在最前）：

1. 从 Google Fonts 下载 [Oswald](https://fonts.google.com/specimen/Oswald) 或 [Archivo Narrow](https://fonts.google.com/specimen/Archivo+Narrow)（都是 OFL 免费商用）
2. 双击安装到系统，或自托管：把 `.woff2` 放进 `public/assets/fonts/`，在 `src/styles/typography.css` 顶部加：

```css
@font-face {
  font-family: 'Oswald';
  src: url('/assets/fonts/Oswald-Bold.woff2') format('woff2');
  font-weight: 700;
  font-display: swap;
}
```

3. 装好之后可以把标题调大一档（当前字号是按"最宽的兜底字体也不折行"算的）：

```css
--fs-display-xl: clamp(3rem, 12.5vw, 13rem);   /* 原 10.4vw */
--fs-display-lg: clamp(2.8rem, 10vw, 10rem);   /* 原 9vw */
```

---

## 动效规范

参数集中在 `src/lib/motion.ts`，所有区块引用同一套，保证节奏统一。

- 章节大标题：从视口外 `-22vw` 进入 + `scaleX 0.68` 压缩归位 + `clip-path` 揭示，`power4.out`，**到位不弹跳**
- 卡片：先轮廓 → 再背景 → 最后内容，`stagger 0.08–0.16`
- 图片/视频：斜切遮罩 reveal + `scale 1.08 → 1` + 轻微 parallax，`expo.out`
- 缓动只用 `power3/power4/expo`，**不用 bounce / elastic / back**
- 全站没有一处是单纯的 `opacity: 0 → 1` 淡入

`prefers-reduced-motion: reduce` 下自动降级：跳过 Opening、关闭视差与自定义光标、大位移改为直接呈现最终状态，内容完整可读。

---

## 交互说明

| 模块 | 操作 |
|---|---|
| Opening | 首次访问播完整 2.4s；再次访问（sessionStorage）走 0.5s 快速转场；随时可点 SKIP INTRO |
| Index 索引 | 滚轮 / ← → / 左右按钮 / 点击节点切换；到序列端点时滚轮**放行**给页面滚动，不会困住 |
| Skills | 点击模块头展开；点 FILTER PROJECTS 联动过滤作品库并滚到 Projects |
| Projects | 滚轮 / 拖拽 / 左右箭头 / ← → / 点击相邻卡片切换；同样有端点放行 |
| 项目卡视频 | hover 播放短预览，移出恢复封面并归零，下方有播放进度 |
| Contact | BACK TO TOP 会显示 RETURNING TO HOME 遮罩，回顶后 Hero 重播简化版标题动画 |
| Contact 手机号 | 默认掩码且 DOM 里没有 `tel:` 链接，点击"显示完整手机号"才展开成可拨号链接 |
| CN / EN 切换 | 导航栏分段开关，点哪边切到哪边；竖向面板盖满后才换文案，不硬切；选择存 `localStorage` |

自定义光标在 hover 项目卡显示 `VIEW`、视频显示 `PLAY`、拖拽区显示 `DRAG`；触摸设备、≤768px、reduced-motion 下自动关闭，交还系统光标。

---

## 性能与可访问性

- 首屏之外的视频/图片走 IntersectionObserver 懒加载，`preload="metadata"`，图片 `loading="lazy"`
- 动画只用 `transform` / `opacity` / `clip-path`，不改 width/height/top/left
- ScrollTrigger 统一在 `gsap.context` 内创建，组件卸载 `ctx.revert()` 全部回收
- 页面不可见时暂停全局时间轴（`src/lib/gsap.ts`）
- 无 Canvas 粒子系统、无重型 WebGL 场景
- 构建产物：CSS 105KB（gzip 19.5KB）+ JS 446KB（gzip 157KB，含 GSAP 与 Router）；中英两套文案都在同一份包里，不额外请求语言文件
- 语义化 HTML、全键盘可操作、`aria-current` 标记当前章节、图片有 alt、视频有 aria-label、focus 环清晰、状态同时用文字与颜色表达（不只靠颜色）

---

## 部署

### Vercel

```bash
npm i -g vercel
vercel
```

或在 vercel.com 直接导入 Git 仓库。构建设置会被自动识别：

- Framework Preset: **Vite**
- Build Command: `npm run build`
- Output Directory: `dist`

仓库根目录的 `vercel.json` 已配置好 SPA 路由回退（保证 `/projects/xxx` 深链接直接访问不 404）和 `assets/` 的长期缓存头。

### Netlify

```bash
npm i -g netlify-cli
netlify deploy --prod
```

或在 netlify.com 导入仓库，设置：

- Build command: `npm run build`
- Publish directory: `dist`

`public/_redirects` 已配置 SPA 回退，会随构建复制到 `dist/`。

### 其他静态托管

把 `dist/` 整个上传即可。**必须配置**：所有未匹配到文件的路径都回退到 `index.html`，否则刷新项目详情页会 404。

---

## 已知限制

- `public/assets/` 下目前只有说明文档，没有真实视频和图片 —— 所有媒体位都显示设计化的 CSS 占位底板，替换真实文件后无需改代码
- 简历 PDF 尚未放入，按钮结构保留，点击会提示找不到文件
- `profile.phone` 是占位号码，`profile.wechat` 是 `AVAILABLE ON REQUEST` —— 对外发布前替换成真实信息
- CN / EN 已是完整两个版本；后续新增文案必须走 `lt()` / `t()` / `tx()`，直接在 JSX 里硬写中文会让英文版漏字
- SOUND OFF 是预留开关，站点不自动播放任何带声音的内容
- 雷火相关项目内容为脱敏描述，不含未公开的产品名称与内部资料

---

## 本地视觉自检截图

`shots/` 目录里有 13 张各区块的实测截图（1600×1000 / 900 / 420 三种视口），用无头 Chrome 通过 DevTools Protocol 真实驱动生成，可以直接打开看当前效果。该目录已加入 `.gitignore`。
---

## 线上部署（GitHub + Tencent 一体化）

### 架构总览

```
GitHub Repository（Source of Truth）
   React + Vite 源码 · 项目数据 · 站点图片 · PDF · 部署配置 · GitHub Actions
        │
        ├──────────────────────────┐
        ▼                          ▼
Tencent EdgeOne（正式主站）      GitHub Pages（备用 / Mirror）
jazimportfolio.com                https://USERNAME.github.io/jazim-portfolio/
        │
        └──────────────┬───────────┘
                       ▼
        Tencent COS：media.jazimportfolio.com（HLS / .m3u8 / .ts 大型媒体）
```

| 角色 | 地址 | 说明 |
|---|---|---|
| PRIMARY | https://jazimportfolio.com | Tencent EdgeOne 正式主站（canonical） |
| SECONDARY | https://www.jazimportfolio.com | www（可访问或 301 到裸域，按平台能力） |
| MEDIA | https://media.jazimportfolio.com | Tencent COS 大型 HLS 媒体 |
| MIRROR | https://USERNAME.github.io/jazim-portfolio/ | GitHub Pages 备用 / 源码验证站 |

### LOCAL DEVELOPMENT（本地开发）

- 推荐入口：双击 `启动开发服务器.bat`（工具菜单）
- 快速启动：`start-dev.bat`
- `check-dev.bat` 状态检查 / `stop-portfolio.bat` 停止服务器

> BAT / PowerShell 脚本**只属于本地开发**，不参与线上部署。
> 线上（GitHub Actions / EdgeOne）统一通过 `npm ci` + `npm run typecheck` + `npm run build:*` 构建，
> **绝不调用** `*.bat` / `*.ps1` / `npm run dev`。

### SOURCE CONTROL（源码管理）

- GitHub Repository = **源码仓库**（Source only）
- 大型 HLS（`public/assets/videos/`，约 1.5GB）已 `.gitignore` 排除，**不入 Git**
- 不使用 Git LFS（GitHub = Source，COS = Media，单一媒体系统）
- 本地 HLS 仅忽略**不删除**（Local Development / Source Media / Backup）
- 首次初始化见 `GIT_INIT_GUIDE.md`

### PRODUCTION（正式站）

- Primary：Tencent EdgeOne，域名 `jazimportfolio.com`
- Media：Tencent COS，媒体域名 `media.jazimportfolio.com`
- 媒体统一由 `src/lib/media.ts` 解析：生产构建（注入 `VITE_MEDIA_BASE_URL`）
  自动把 `/assets/videos/...` 改写为 `https://media.jazimportfolio.com/assets/videos/...`；
  本地开发保持相对路径，不依赖 COS
- 腾讯云人工步骤见 `TENCENT_CLOUD_MANUAL_STEPS.md`、`COS_CORS_GUIDE.md`、`COSCLI_SETUP_GUIDE.md`

### MIRROR（备用站）

- GitHub Pages：静态 mirror / backup 部署，自动构建（`.github/workflows/deploy-pages.yml`）
- 不把 github.io 写进 PDF QR / Canonical / 正式 Contact / 正式 SEO

### BUILD（构建命令）

```bash
npm ci                       # 干净安装（CI / 首次）
npm run typecheck            # 类型检查
npm run build                # 普通生产构建（base ./，产物可 file:// 双击，含本地视频）
npm run build:deploy         # Tencent EdgeOne 构建（base /，剥离 HLS）→ deploy-output/tencent-site
npm run build:github         # GitHub Pages 构建（base /jazim-portfolio/，剥离 HLS）→ deploy-output/github-site
npm run package:deploy       # 打 EdgeOne ZIP → deploy-output/Jazim-Portfolio-EdgeOne.zip
npm run manifest:media       # 生成 COS 上传 Manifest + HLS 完整性审计
npm run verify:media         # 生产媒体验证（COS 生效后运行）
npm run cos:media            # 用本机已配置的 COSCLI 上传媒体到 COS（无 --delete）
```

> 各 build 共享同一份源码，区别仅在 Build Target / Vite Base / Production 配置
> （`.env.tencent` / `.env.github` / `.env.production`，只含公开 URL，非 Secret）。

### 未来部署流程（修改网站后）

```
本地修改 → npm run typecheck → git commit → git push origin main
  → GitHub Pages 自动重新部署（备用站）
Tencent：npm run build:deploy → 上传 EdgeOne（第一阶段手动；未来可选 GitHub Integration 自动）
```

### 部署报告

本地可完成部分全部产出在根目录与 `deploy-output/reports/`：
`DEPLOYMENT_MASTER_AUDIT.md`、`GITHUB_LARGE_FILE_AUDIT.md`、`SECRET_SCAN_REPORT.md`、
`PUBLIC_REPOSITORY_REVIEW.md`、`GITHUB_INITIAL_COMMIT_AUDIT.md`、`COS_MEDIA_UPLOAD_MANIFEST.csv`、
`GITHUB_PAGES_ARTIFACT_REPORT.md`、`TENCENT_DEPLOY_ARTIFACT_REPORT.md`、
`PRODUCTION_NETWORK_QA.md`、`FINAL_MULTI_PLATFORM_DEPLOYMENT_REPORT.md`。