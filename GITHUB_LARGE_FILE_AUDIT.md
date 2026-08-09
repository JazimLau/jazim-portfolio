# GITHUB LARGE FILE AUDIT — Jazim Lau Portfolio

> PHASE 10 · 生成时间：2026-08-09
> 按最终 `.gitignore` 模拟待提交文件集，扫描 >10MB / >25MB / >50MB / >100MB 文件。

## 结论

| 阈值 | 命中数 |
|---|---|
| > 10 MB | **0** |
| > 25 MB | **0** |
| > 50 MB | **0** |
| > 100 MB | **0** |

**GITHUB LARGE FILE VIOLATIONS = 0** ✅

## 待提交文件集（模拟 git add .）

- 文件总数：363
- 总大小：20.53 MB
- 最大文件：`portfolio-output/Jazim-Lau-Game-Motion-Portfolio-2026.pdf`（5.23 MB）— 可正常提交

## 最大 10 个文件

| 大小 | 文件 |
|---|---|
| 5.23 MB | portfolio-output/Jazim-Lau-Game-Motion-Portfolio-2026.pdf |
| 0.63 MB | public/images/cases/leihuo-external-motion-system/nsh/cover.jpg |
| 0.38 MB | public/images/cases/leihuo-external-motion-system/qingnv/cover.jpg |
| 0.35 MB | public/images/cases/leihuo-external-motion-system/tianyu/cover.jpg |
| 0.35 MB | public/images/cases/leihuo-external-motion-system/rd/cover.jpg |
| 0.30 MB | public/assets/files/Jazim-Lau-CV.pdf |
| 0.29 MB | pdf/assets-optimized/hero/gongxi.jpg |
| 0.29 MB | public/images/cases/game-ui-motion-studies/unity/cover.jpg |
| 0.26 MB | public/images/cases/leihuo-external-motion-system/wow/cover.jpg |
| 0.23 MB | public/images/cases/game-social-videos/into-the-essay/cover.jpg |

## 已排除（.gitignore）

| 项 | 规模 | 说明 |
|---|---|---|
| public/assets/videos/ | ~1.56 GB（731 文件） | 大型 HLS，走 Tencent COS |
| node_modules/ | — | 依赖 |
| dist/ / deploy-output/ | — | 构建产物 |
| portfolio-review-export/ | — | 临时 Review 导出 |
| shots/ | — | 本地截图 |

## 说明

- **不使用 Git LFS** 管理 HLS。架构：GitHub = 源码，COS = 媒体，单一媒体系统。
- 本地 HLS 文件保留（Local Development / Source Media / Backup），仅 Git Ignore，不删除。
