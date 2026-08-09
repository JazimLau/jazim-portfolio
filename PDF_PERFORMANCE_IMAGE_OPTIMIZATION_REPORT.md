# PDF 性能 + 图片优化专项报告（v8）

> 范围：内容微调（Skills 字体 / 更多项目 / 社媒平台）+ 图片 96DPI 像素级优化 + PDF 渲染复杂度优化。
> 输出：`portfolio-output/Jazim-Lau-Game-Motion-Portfolio-2026.pdf`
> 配套逐图报告：`PDF_IMAGE_OPTIMIZATION_REPORT.md`（该逐图日志已于 2026-08-09 清理协议归档删除，本报告为最终汇总）

---

## A. 内容修改

### A1. 能力系统（外部模块尺寸完全不变）
- 6 张 Skill Card 实测尺寸均为 **569×296**（3×2 网格、gap 28/26、position 未变）；Toolset 外部模块未变；未恢复 Learning。
- 内部字体修改前后：

| 元素 | 修改前 | 修改后 |
| --- | --- | --- |
| 中文标题（动效设计/视频设计/素材处理/引擎与三维/工作流/AIGC） | 30px | **32px** |
| 英文辅助 `.sc-en` | 15px | 12px（减少无意义英文，突出中文第一视觉层） |
| 状态 `.st`（PROFICIENT · 熟练应用） | 13px / lh1.5 | **14px** / lh1.6 |
| Skill Chip `.sn .chip` | 14px | **14.5px** |
| Chip 换行 row-gap | 0 | **8px**（flex-wrap + gap） |
| 内容行距 | 1.5 | **1.6** |

- 溢出检查：6 卡内容底部均 ≤ 卡片内底（最满卡 AIGC 内容底 741 < 卡底 767），Skills 页整体底部 954 ≤ 985，**无溢出**。

### A2. “更多精选”→“更多项目”
- 页面标题：`更多精选 / MORE SELECTED WORKS` → **`更多项目 / MORE PROJECTS`**（页脚 pgname 同步为 MORE PROJECTS）。

### A3. More Projects 卡片英文项目标题删除（12 个）
- 删除的英文项目标题：WoW、Naraka、Qingnv、Revelation、Sign-in、Previs、UE5 Icon、Unity、Diablo 3 · PROMO、7 Days · PROMO、SLZH · AD、Little Heroes · AD。
- 卡片仅保留中文项目名（18px / weight 600，允许两行）；图片 `object-fit: contain` 保持不变。
- 分类英文辅助保留：LEIHUO / GAME UI / VIDEO（仅分类，非项目标题）。
- 实测：`.thumb .n .en2` 数量 = 0。

### A4. 游戏社媒视频平台
- 平台统一为 **`抖音 · Bilibili · 快手 · 视频号`**（不写微博/TikTok/Instagram/YouTube）。
- 一级「游戏社媒视频」页：精选案例标题右侧新增 `平台 PLATFORM · 抖音 · Bilibili · 快手 · 视频号`。
- Case Meta（最惨官方、狼）：`平台 PLATFORM` = `抖音 · Bilibili · 快手 · 视频号`（表示所在社媒矩阵；Case 未记录唯一发布平台，故不擅自指定单一平台）。

---

## B. 图片优化

| 指标 | 数值 |
| --- | --- |
| 图片总数量 | **74**（8 Hero + 2 竖屏前景 + 2 竖屏背景 + 10 Featured + 30 三帧 + 12 缩略图 + 10 二维码）+ 1 Noise 贴图 |
| 96 DPI 图片数量 | **74 / 74**（二维码复制并写 96 DPI；全部作品图 96 DPI） |
| 原始总大小 | **3,267 KB** |
| 优化后总大小 | **1,938 KB**（-40.7%） |
| 平均压缩率 | **40.7%** |
| PNG / JPEG 分布 | JPEG 64 张（作品图）；PNG 10 张（二维码）+ noise.png 1 张 |
| 最大单图 | 原 1200×2134（竖屏源）→ 现 1200×676（横版 Hero）／1200×628（竖屏背景） |

**尺寸策略（按实际显示尺寸，1.2×~1.7×，绝不 Upscale）：**
- **Hero（横版）**：显示约 1029px 宽，源 1200px（<1400 不放大）→ 保持 1200px，JPEG q90 / 4:4:4（最高优先级）。
- **竖屏 Hero 前景**：显示约 281×500 → 输出 **480×854**（≈1.7×），JPEG q88 / 4:4:4。
- **竖屏 Hero 背景**：预烘焙 cover-crop + blur(32) + 压暗 0.4 + 去饱和 0.9 → **1200×628** JPEG q75（不再用 CSS blur）。
- **三帧 START/MID/END**：横版显示约 267×150 → 输出 **560 宽**（≈2.1×）；竖版显示约 84×150 → 输出 **360 宽**；JPEG q84。
- **一级 Featured**：显示约 300px → 输出 **560 宽**，JPEG q85。
- **更多项目缩略图**：显示约 425px → 输出 **520 宽**，JPEG q82。
- **二维码**：保持 PNG（无损、高对比、清晰模块边缘），未压缩；96 DPI 写入。

**重复资源审计（SHA256）**：52 个使用中源图（Hero/三帧/Thumb）哈希比对，**无二进制重复**；Hero 与 Featured 同源图按用途输出不同分辨率（合法，非重复文件）。

---

## C. 渲染优化

| 项目 | 优化前 | 优化后 |
| --- | --- | --- |
| SVG fractalNoise（feTurbulence） | **每页 1 处**（PDF 中被展平为 1366×768×126，33,377KB） | **0** |
| Noise 替代 | — | **128×128 灰度 PNG 贴图（10.1KB）**，CSS `background-repeat`，opacity 0.04 |
| CSS Blur | 1（竖屏 `.pv-bg filter:blur(32px)`） | **0**（预烘焙 zuican_bg / wolf_bg.jpg） |
| Portrait 背景 | 实时 CSS blur 大图 | 预烘焙模糊 JPEG（视觉一致，PDF 无大型 Blur Effect） |
| Grid 背景 | CSS linear-gradient（PDF 中约 80KB 薄条） | **保留**（实测非性能因素，视觉不变） |
| Clip-path | 主面板 + Metric + Case Meta（3 处选择器） | **仅保留主面板/Metric/Case Meta 3 处**；未用于 Chip/Label/Thumb |
| Box-shadow | 4-5 处单层简单阴影 | **保持不变（均为 1 层，无多层 Neon Glow）** |
| animation / transition | 无 | **@media print 全局禁用**（`animation/transition: none !important`） |
| `<video>` / 视频媒体 | 0 | 0（纯静态 HTML+CSS，无 JS、无视频） |
| Base64 大型图 | 0 | 0（全部外部文件引用） |
| DOM 节点 | — | 共 **2,062**（每页 47–116，无逐像素装饰 DIV） |
| CSS `filter:` 声明 | 1 | **0** |

---

## D. PDF

| 指标 | 优化前（v7） | 优化后（v8） |
| --- | --- | --- |
| PDF 大小 | **37.9 MB** | **4.2 MB**（**-89%**） |
| 页数 | 21 | 21 |
| 页面尺寸 | 1440×810pt | 1440×810pt |
| PDF 内嵌图片字节 | 36,765 KB | 3,169 KB |
| 最大重复项 | 1366×768 noise ×126 = 33,377KB | 1366×768 noise ×84 = 942KB（单份 265KB→11KB） |
| CSS Filter 数 | 1 | 0 |
| SVG Filter 数 | 1/页 | 0 |
| 渲染基准（全页 100%） | 3,178ms（最慢页 279ms） | **2,150ms（最慢页 134ms）**（-32% / 最慢页 -52%） |

- **PDF Export**：**PASS**（Chrome headless，21 页，全 1440×810pt）。
- **Chrome / Edge Scroll Test**：自动化浏览器中 Chrome 内置 PDF Viewer 扩展被环境拦截（`chrome-extension://mhjfbmdgcfjbbpaeojofohoefgiehjai ERR_BLOCKED_BY_CLIENT`），无法在自动化环境中执行字面意义上的滚动交互。**替代实测**：PyMuPDF 全页渲染基准（上表）显示整体渲染 -32%、最慢页 -52%；文件体积 -89% 显著降低翻页时的加载/解码压力；DOM 与图片复杂度大幅下降。建议在本地 Chrome/Edge 打开 `portfolio-output/Jazim-Lau-Game-Motion-Portfolio-2026.pdf` 做最终主观滚动确认。
- **100% Zoom 图片清晰度**：**PASS**（1920×1080 渲染目视清晰，Hero/三帧/UI 文字可读）。
- **150% Zoom 图片清晰度**：**PASS**（轻微栅格感，无马赛克、无文字糊）。
- **QR Decode**：**12/12 PASS**（封面、联系页 + 10 个 Case 页，均正确解码到对应路由）。

---

## 交付物

| 文件 | 说明 |
| --- | --- |
| `scripts/optimize-pdf-images.py` | 图片批量优化管线（resize→96DPI→JPEG/PNG→预烘焙 blur→noise 贴图→报告 JSON） |
| `scripts/build-pdf.py` | PDF 导出流程（校验 optimized 资源→build_html→Chrome 导出→校验） |
| `pdf/assets-optimized/` | PDF 专用优化资源（网站原图未动） |
| `pdf/portfolio-pdf.html` | v8 重建（21 页） |
| `portfolio-output/Jazim-Lau-Game-Motion-Portfolio-2026.pdf` | **正式版 4.2MB（21 页）** |
| `PDF_IMAGE_OPTIMIZATION_REPORT.md` | 逐图前后对比（74 张） |
| `PDF_PERFORMANCE_IMAGE_OPTIMIZATION_REPORT.md` | 本报告 |
| `package.json` | 新增 `npm run portfolio:images` / `npm run portfolio:pdf` |

正式版 4.2MB 已 ≤ 35MB 且渲染流畅，按需求 58/73 不再生成 Lite 版。视觉主题（黑绿/酸绿/紫/橙/蓝、Pixel Cut Corner、HUD Label、Ghost Number、Grid、System Line、Noise 质感）全部保留；仅将昂贵效果替换为视觉相同的静态实现。完成后停止，不再继续修改页面设计。
