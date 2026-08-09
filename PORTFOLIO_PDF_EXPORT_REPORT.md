# PORTFOLIO PDF EXPORT REPORT

生成时间：2026-08-08（重做版）
PDF 文件：`Jazim-Lau-Portfolio-PDF.pdf`（**15 页横版 1920×1080**，约 27 MB）
PDF 方案源：`pdf/portfolio-pdf.html`（**1920×1080 横版 · Neo-Pixel / Game-HUD 游戏化视觉系统**，完全继承主站设计语言）
精选配置：`src/data/pdfFeaturedCases.ts`（人工指定固定案例，**仅影响 PDF Featured Selection**）

---

## 2026-08-08 彻底重做说明（v2 · 1920×1080 横版作品集）

### 页面规格
- **不再采用 A4 文档逻辑**。每页按桌面 16:9 横版设计：`@page { size: 1920px 1080px; margin: 0 }`，`.page { width:1920px; height:1080px; overflow:hidden }`，导出 PDF 每页 1440×810 pt（= 20×11.25 in = 1920×1080 CSS px）。
- 安全边距 64px，内容完全落在 1080px 内，15 页均无溢出（浏览器逐页 `scrollHeight ≤ clientHeight` 验证）。

### 视觉设计语言（继承主站）
- 深色绿黑底 `#070b09` + 抬升面板 `#0b100d/#101612`；米白 `#f2f3eb` 文字。
- 强调色：lime `#b8ff3d`、purple `#7557ff`、orange `#ff6b3d`、blue `#5bc8ff`、pink `#e04b9a`（取自 `src/styles/variables.css`）。
- 像素硬阴影、`clip-path` 切角面板、44px 网格线、SVG 噪点、幽灵大编号、断续轨道 + 光脉冲、mono 系统标签（`[ SYS ]` / 大写 / 字距），与 `PixelSceneBackground` / `Projects` 组件同源。
- 字体：Barlow Condensed（display）、Inter + 雅黑（body）、IBM Plex Mono / Consolas（mono）。

### 页面模板（15 页）
| 页 | 模板 | 内容 |
|----|------|------|
| 01 | COVER 封面英雄 | 超大 GAME/MOTION/DESIGNER 标题、名字、定位 tagline、ROLE/STATUS/EMAIL/BASE、disciplines chips、首页 QR |
| 02 | PROFILE | 左：ABOUT + POSITIONING；右：COORDINATES + CONTACT + 状态 chips |
| 03 | EXPERIENCE | 4 个 MISSION 卡片（period/org/role/dept/duties/keywords） |
| 04 | PROJECT INDEX / MISSION SELECT | 5 个任务模块卡（编号、描述、services chips、cases/tools 统计） |
| 05 | LEIHUO OVERVIEW | 4 指标 + 能力维度 flow + 精选预告（武道大会/九州秘境） |
| 06 | 武道大会 | 单案例：大 hero 帧 + **3 帧关键帧** + 目标/流程 + 视频源 |
| 07 | 九州秘境 | 单案例：同上 + 职责/作品 |
| 08 | GAME UI OVERVIEW | 指标 + 能力框架（AE/UE5/Unity）+ 练习范围 |
| 09 | GAME UI 双案例 | 科技风结算 + 恭喜获得（各 **3 帧** + QR） |
| 10 | PROMOTION 双案例 | 遗忘之海 + 巅峰极速（各 **3 帧** + QR） |
| 11 | AD 双案例 | 梦幻西游·天地棋局 + 阴阳师·银魂联动（各 **3 帧** + QR） |
| 12 | SOCIAL 双案例 | 最惨官方 + 公司里闯进一只狼（**竖版特处理** + 4 指标） |
| 13 | MORE SELECTED WORKS | 5 组缩略矩阵（LEIHUO/UI/PROMO/AD/SOCIAL） |
| 14 | SKILLS / TOOLSET | 6 技能系统 + 工具链 |
| 15 | CONTACT | READY FOR THE NEXT MISSION + 联系 + 大首页 QR |

### 视频 3 帧展示（START / MID / END）
- 10 个精选视频案例全部提取 3 张关键帧：`pdf/frames3/{name}_{s|m|e}.jpg`，分别位于 16% / 50% / 84% 时长（带防黑帧探测）。
- 生成脚本：`pdf/frames3.py`（ffmpeg，`-ss` 放在 `-i` 之后精确 seek HLS）。
- 单案例页：大 hero 帧 + 下方 3 帧横排；双案例视频页：每案例 3 帧横排（共 6 图）。
- 帧标签：`START / MID / END` + `FRAME 01/02/03 · S/M/E`。

### 竖版视频特处理（最惨官方 zuican、狼 wolf）
- 这两个视频为 **9:16 竖版**（1080×1920 / 2160×3840）。
- 页面使用「模糊延伸舞台」：背景用同帧放大 + `blur(32px) brightness(.4)` 铺满，两侧暗角渐变，**前景竖版帧 `object-fit: contain` 完整居中显示，绝不裁切**，标注 `FULL FRAME · NOT CROPPED` + `PORTRAIT 9:16`。
- 下方三帧缩略图同样按竖版比例展示。

### QR 放置
- 二维码统一放在**每页右下角**（`qrbox` 绝对定位 right/bottom）。
- 封面 & Contact：首页 QR（`qr-home.png` → `http://127.0.0.1:5173/`）。
- 单案例页：对应案例 QR（qr-wudao / qr-jiuzhou 等）；双案例页：案例 QR；Overview：一级 Track QR。
- 新增 `qr-home.png`、`qr-leihuo.png`（→ `#/projects/leihuo-external-motion-system`）。

### 数据来源
- 全部文案仍从 `pdf/data/pdf-data.json` 拉取（profile / timeline / skills / 5 个 project + cases + works），未编造；`profileIntro` / `classInfo` 从 `src/data/profile.ts` 解析。
- 10 个精选案例来自 `src/data/pdfFeaturedCases.ts`，用真实 Case/Work ID 精确读取。

### 验证结果
- 浏览器 1920×1080 逐页验证：15 页全部无横向/纵向溢出，无断图（73 张图片全部加载）。
- Chrome headless 导出：`Jazim-Lau-Portfolio-PDF.pdf` = **15 页，每页 1440×810 pt（1920×1080 CSS px）**。
- PyMuPDF 渲染逐页检查：全部页面有内容，竖版页中央竖条亮度高（视频帧完整显示）、两侧模糊暗化（延伸背景正常）。

### 网站主站不受影响
- 本次仅重做 `pdf/build_html.py` + 生成 HTML/PDF + 新增 `pdf/frames3.py` 与资源，**未修改任何网站源码、项目排序或主站交互**。

---

## 精选机制说明

- **不使用** `cases.slice(0, 2)` 之类的自动抽取逻辑。
- **不依赖** 网站当前 Projects / PRODUCT / CASE 排序决定 PDF 代表案例。
- **保存的是真实 Case ID（+ Work ID）**，不从中文标题做运行时模糊匹配；展示名 / 描述 / 标签全部从 `src/data/projects.ts` 按 id 精确读取。
- 网站 Projects 排序、Prev / Next 逻辑、Case URL **完全不受影响**。

---

## FEATURED CASES（10 个指定代表案例）

### LEIHUO / 雷火产品动效
| # | 名称 | Case ID | Work ID | Route | QR / Hyperlink URL |
|---|------|---------|---------|-------|--------------------|
| 01 | 武道大会（炉石传说 · 端内活动） | `hearthstone` | `hs-tournament` | `#/projects/leihuo-external-motion-system/case/hearthstone` | `http://127.0.0.1:5173/#/projects/leihuo-external-motion-system/case/hearthstone` |
| 02 | 九州秘境（逆水寒 · 官网/预约页） | `nsh` | `nsh-jiuzhou-mijing` | `#/projects/leihuo-external-motion-system/case/nsh` | `http://127.0.0.1:5173/#/projects/leihuo-external-motion-system/case/nsh` |

### GAME UI / 游戏 UI 动效练习
| # | 名称 | Case ID | Work ID | Route | QR / Hyperlink URL |
|---|------|---------|---------|-------|--------------------|
| 01 | 科技风结算（科技风胜利结算） | `ae-previs` | `ae-sci-fi-win` | `#/projects/game-ui-motion-studies/case/ae-previs` | 主二维码 → 一级 Track `http://127.0.0.1:5173/#/projects/game-ui-motion-studies` |
| 02 | 恭喜获得（恭喜获得 抽卡动效） | `ae-previs` | `gongxi-gacha` | `#/projects/game-ui-motion-studies/case/ae-previs` | VIEW CASE → 同一查看器 URL |

### PROMOTION / 游戏宣发视频
| # | 名称 | Case ID | Work ID | Route | QR / Hyperlink URL |
|---|------|---------|---------|-------|--------------------|
| 01 | 遗忘之海 | `forgotten-sea` | `forgotten-sea-main` | `#/projects/game-promotion-films/case/forgotten-sea` | 主二维码 → 一级 Track `http://127.0.0.1:5173/#/projects/game-promotion-films` |
| 02 | 巅峰极速（巅峰极速-地图爆料） | `peak-speed-map` | `peak-speed-map-main` | `#/projects/game-promotion-films/case/peak-speed-map` | VIEW CASE → 对应 Case URL |

### AD / 游戏广告视频
| # | 名称 | Case ID | Work ID | Route | QR / Hyperlink URL |
|---|------|---------|---------|-------|--------------------|
| 01 | 梦幻西游 · 天地棋局宣传片 | `mhxy` | `mhxy-tiandiqiju-xuanchuan` | `#/projects/game-ad-films/case/mhxy` | 主二维码 → 一级 Track `http://127.0.0.1:5173/#/projects/game-ad-films` |
| 02 | 阴阳师手游 · 银魂联动 | `yys` | `yys-yinhun-liandong` | `#/projects/game-ad-films/case/yys` | VIEW CASE → 对应 Case URL |

### SOCIAL / 游戏社媒视频
| # | 名称 | Case ID | Work ID | Route | QR / Hyperlink URL |
|---|------|---------|---------|-------|--------------------|
| 01 | 最惨官方 | `poorest-official` | `poorest-official-main` | `#/projects/game-social-videos/case/poorest-official` | 主二维码 → 一级 Track `http://127.0.0.1:5173/#/projects/game-social-videos` |
| 02 | 公司里突然闯进一只狼（网站正式标题） | `wolf-barged-in` | `wolf-barged-in-main` | `#/projects/game-social-videos/case/wolf-barged-in` | VIEW CASE → 对应 Case URL |

---

## QR / Hyperlink URL 说明

- 网站为 **HashRouter**，所有二维码编码完整 URL = `origin + #/路由`。
- 当前仓库未配置线上域名，二维码使用本地开发 origin `http://127.0.0.1:5173`（当前可扫码 / 打开验证路由正确性）。
- **部署后只需替换 origin**（例如 `https://<deployed-domain>`），`#/...` 部分与网站完全一致，二维码无需重新设计。
- 二维码 PNG 已生成于 `pdf/assets/qr/`。

---

## FEATURED CASE NOT FOUND 检查

| 需核对案例 | 期望 ID | 检查结果 |
|-----------|---------|---------|
| 武道大会 | `hearthstone`（work `hs-tournament`） | ✅ FOUND |
| 九州秘境 | `nsh`（work `nsh-jiuzhou-mijing`） | ✅ FOUND |
| 科技风结算 | `ae-previs`（work `ae-sci-fi-win`） | ✅ FOUND |
| 恭喜获得 | `ae-previs`（work `gongxi-gacha`） | ✅ FOUND |
| 遗忘之海 | `forgotten-sea`（work `forgotten-sea-main`） | ✅ FOUND |
| 巅峰极速 | `peak-speed-map`（work `peak-speed-map-main`） | ✅ FOUND |
| 梦幻西游 · 天地棋局宣传片 | `mhxy`（work `mhxy-tiandiqiju-xuanchuan`） | ✅ FOUND |
| 阴阳师手游 · 银魂联动 | `yys`（work `yys-yinhun-liandong`） | ✅ FOUND |
| 最惨官方 | `poorest-official`（work `poorest-official-main`） | ✅ FOUND |
| 公司里突然闯进一只狼 | `wolf-barged-in`（work `wolf-barged-in-main`） | ✅ FOUND |

**结论：10 个精选案例全部在真实数据中找到，无 FEATURED CASE NOT FOUND，无需人工确认 ID。**

> 说明：九州秘境在网站中为 `nsh` 案例下的作品（work `nsh-jiuzhou-mijing`，无独立 Case URL），二维码指向其所在 Case 页面 `#/projects/leihuo-external-motion-system/case/nsh`（查看器内即九州秘境视频）；职责/背景文案直接采用 `nsh` case 的真实数据，未自行重写。

---

## 最终检查（导出前确认）

- [x] 雷火精选：01 武道大会 / 02 九州秘境
- [x] 游戏 UI 精选：01 科技风结算 / 02 恭喜获得
- [x] 宣发精选：01 遗忘之海 / 02 巅峰极速
- [x] 广告精选：01 梦幻西游·天地棋局宣传片 / 02 阴阳师手游·银魂联动
- [x] 社媒精选：01 最惨官方 / 02 公司里突然闯进一只狼（网站正式标题）
- [x] 共 10 个指定代表案例，不允许被其他 Case 自动替换
- [x] 网站 Projects 排序：不受影响
- [x] Prev / Next：不受影响
- [x] Case URL：不受影响
- [x] 仅影响 PDF Featured Selection

## 产物

| 文件 | 说明 |
|------|------|
| `Jazim-Lau-Portfolio-PDF.pdf` | 正式 PDF（15 页 A4） |
| `pdf/portfolio-pdf.html` | PDF 方案源（可重新打印） |
| `pdf/data/pdf-data.json` | 从真实 TS 数据解析的 PDF 数据 |
| `pdf/assets/frames/*.jpg` | 代表画面（ffmpeg 从 HLS 抽帧） |
| `pdf/assets/qr/*.png` | 二维码 |
| `pdf/parse_data.py` / `pdf/build_html.py` / `pdf/assets.py` | 生成脚本 |
| `src/data/pdfFeaturedCases.ts` | 精选配置（保存真实 Case ID） |
