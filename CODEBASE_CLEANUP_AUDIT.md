# CODEBASE CLEANUP AUDIT

> 生成时间：2026-08-09 13:47 · 只读审计阶段（无删除）
> 原则：无法 100% 确认无使用的文件一律 REVIEW，不删除。
> 分类：`SAFE_DELETE`（确定可删）/ `REVIEW`（人工确认）/ `KEEP`（使用中）

## 一、SAFE_DELETE（确定可删）

## A. 日志 / 临时 / OS 垃圾（§05A / §26）

- `build.log` — 1,620 B — 日志/临时截图，0 引用
- `dev-server.log` — 1,469 B — 日志/临时截图，0 引用
- `.tmp-workflow-desktop.png` — 229,880 B — 日志/临时截图，0 引用
- `.impeccable/` — 空目录残留（0 字节 critique）
- `shots/` — 7,543 KB — 临时 QA 截图（§26，当前功能已确认，可再生）
- `repro-shots/` — 20,849 KB — 临时 QA 截图（§26，当前功能已确认，可再生）
- `verify-shots/` — 11,709 KB — 临时 QA 截图（§26，当前功能已确认，可再生）
## B. 调试脚本（§32，0 引用，package.json 无引用）

- `cdp-hero.mjs` — 7,887 B — 一次性调试脚本，无任何引用
- `cdp-index-reveal.mjs` — 3,008 B — 一次性调试脚本，无任何引用
- `cdp-index.mjs` — 5,285 B — 一次性调试脚本，无任何引用
- `cdp-section.mjs` — 9,832 B — 一次性调试脚本，无任何引用
- `cdp-timeline-bug.mjs` — 4,149 B — 一次性调试脚本，无任何引用
- `cdp-timeline-final.mjs` — 5,131 B — 一次性调试脚本，无任何引用
- `cdp-timeline-mobile.mjs` — 3,373 B — 一次性调试脚本，无任何引用
- `cdp-timeline-reveal.mjs` — 3,178 B — 一次性调试脚本，无任何引用
- `shot7.mjs` — 3,015 B — 一次性调试脚本，无任何引用
- `shot8.mjs` — 3,013 B — 一次性调试脚本，无任何引用
- `diag-pf.mjs` — 3,544 B — 一次性调试脚本，无任何引用
## C. 旧版本 Backup（§05B，当前版本存在）

- `pdf/build_html_v2_final.py.bak` — 56,024 B — 旧版 build_html 备份，当前 build_html.py 存在
- `pdf/build_html_v2_prefine.py.bak` — 59,116 B — 旧版 build_html 备份，当前 build_html.py 存在
## D. 旧 PDF 输出（§23/25，被新 PDF 取代）

- `Jazim-Lau-Portfolio-PDF.pdf` — 37 MB — v7 旧版基线 PDF，正式输出已迁至 `portfolio-output/Jazim-Lau-Game-Motion-Portfolio-2026.pdf`，0 脚本引用
## 二、REVIEW（人工确认，不自动删除）

## A. dist/（§27，GENERATED BUILD OUTPUT）

- `dist/` — 1,571 MB — Vite 构建产物（可 npm run build 重建）；`run-tool.ps1`/README 引用 dist/preview → 保守保留
## B. 一次性中间报告（§36/37，建议归档/删除，待确认）

- `PDF_CASE_FOCUS_MERGE_REPORT.md` — 6,513 B — 一次性中间报告（建议删除/归档）
- `PDF_CASE_IMAGE_UPDATE_REPORT.md` — 3,004 B — 一次性中间报告（建议删除/归档）
- `PDF_FINAL_LAYOUT_SCALE_REPORT.md` — 10,580 B — 一次性中间报告（建议删除/归档）
- `PDF_FINAL_TYPOGRAPHY_ALIGNMENT_REPORT.md` — 9,597 B — 一次性中间报告（建议删除/归档）
- `PDF_IMAGE_OPTIMIZATION_REPORT.md` — 11,835 B — 一次性中间报告（建议删除/归档）
- `PDF_LAYOUT_REFINEMENT_REPORT.md` — 6,960 B — 一次性中间报告（建议删除/归档）
- `PDF_LAYOUT_V3_REPORT.md` — 9,005 B — 一次性中间报告（建议删除/归档）
- `PDF_VISUAL_TYPOGRAPHY_FINAL_REPORT.md` — 6,415 B — 一次性中间报告（建议删除/归档）
- `PERFORMANCE_AUDIT.md` — 9,410 B — 一次性中间报告（建议删除/归档）
- `PERFORMANCE_FIX_REPORT.md` — 10,301 B — 一次性中间报告（建议删除/归档）
- `VIDEO_NAVIGATION_FIX_REPORT.md` — 13,640 B — 一次性中间报告（建议删除/归档）
## C. 一次性 Review 导出

- `portfolio-review-export/` — 592 KB — 历史 review 导出（含 zip/json），无引用，待确认
## D. 旧 PDF 辅助脚本（§32/§33 保守）

- `pdf/assets.py` — 旧 PDF 辅助脚本，0 代码引用（仅旧报告提及），但可能为手动工具 → 保留待确认
- `pdf/frames.py` — 旧 PDF 辅助脚本，0 代码引用（仅旧报告提及），但可能为手动工具 → 保留待确认
- `pdf/frames3.py` — 旧 PDF 辅助脚本，0 代码引用（仅旧报告提及），但可能为手动工具 → 保留待确认
- `pdf/qrcodes.py` — 旧 PDF 辅助脚本，0 代码引用（仅旧报告提及），但可能为手动工具 → 保留待确认
## 三、KEEP（确认使用中）

- `src/` 全部 — 网站源码
- `public/` 全部 — 网站资源（含 HLS 视频 .ts/.m3u8、图片、CV）
- `pdf/assets/`（frames/frames3/qr/noise）— optimize-pdf-images.py 的源（§56 原始资源）
- `pdf/assets-optimized/` — PDF 优化资源（build_html.py 引用）
- `pdf/build_html.py` / `pdf/parse_data.py` / `pdf/portfolio-pdf.html` — 正式 PDF 生成流程
- `scripts/` 全部（optimize-pdf-images / build-pdf / apply-new-case-images）— 正式 Workflow（§33）
- `portfolio-output/Jazim-Lau-Game-Motion-Portfolio-2026.pdf` — 当前最终 PDF
- 开发辅助脚本：`start-dev.bat/ps1` `start-portfolio.bat` `stop-dev.ps1` `stop-portfolio.bat` `check-dev.bat` `run-tool.ps1` `启动开发服务器.bat` — README/AGENTS 引用
- `README.md` `AGENTS.md` `package.json` `package-lock.json` `tsconfig.json` `vite.config.ts` `vercel.json` `index.html` `.gitignore`
- 最终维护报告：`PORTFOLIO_PDF_EXPORT_REPORT.md` `PDF_PERFORMANCE_IMAGE_OPTIMIZATION_REPORT.md`
- 本清理文档：`CLEANUP_BACKUP_MANIFEST.md` `PROJECT_FILE_TREE_BEFORE_CLEANUP.txt` `MEDIA_ASSET_INVENTORY.csv` `REPORT_CLEANUP_LIST.md` `FINAL_CODEBASE_CLEANUP_REPORT.md`

## 四、Exact Duplicate Groups（SHA256 完全一致）
| 组 | 文件 | 引用 | 建议 |
| --- | --- | --- | --- |
| G01 | shots/chk-file-dist.png = shots/chk-file-src.png | 0 | 随 shots/ 删除 |
| G02 | verify-shots/section-CN-1920x1080-profile.png = verify-shots/section-EN-1920x1080-profile.png | 0 | 随 verify-shots/ 删除 |

> 视频 .ts 段（656 个）为网站 HLS 播放器真实数据 → 全部 KEEP；不同分辨率/优化版本图片（网站 vs PDF optimized）属于不同用途 → KEEP（§16/17）。