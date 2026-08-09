# 图片资源目录

文件名保持不变直接替换即可，缺失时组件回落到 CSS 占位底板。

| 文件名 | 用途 | 建议规格 |
|---|---|---|
| `hero-poster.jpg` | 首页背景视频的封面（视频加载前显示） | 1920×1080 |
| `showreel-cover.jpg` | 首页监视器封面 | 1600×1000 |
| `profile-portrait.jpg` | Profile 档案卡：本人形象 | 800×1000（4:5） |
| `profile-ui-motion.jpg` | Profile 档案卡：UI动效截图 | 800×1000 |
| `profile-ue-practice.jpg` | Profile 档案卡：UE5 练习截图 | 800×1000 |
| `profile-workstation.jpg` | Profile 档案卡：工作状态 | 800×1000 |
| `project-01-cover.jpg` … `project-08-cover.jpg` | 项目卡封面 | 1600×900（16:9） |
| `project-01-01.jpg` … | 详情页动效拆解图集 | 1600×1000（16:10） |

要点：

- 档案卡是 4:5 竖图，项目封面是 16:9 横图，比例不对会被 `object-fit: cover` 裁切。
- 建议压到 200KB 以内（WebP 更好，把 `src/data` 里的扩展名一起改成 `.webp` 即可）。
- 图集数量由 `src/data/projects.ts` 的 `gallery` 数组决定，可增可减。
