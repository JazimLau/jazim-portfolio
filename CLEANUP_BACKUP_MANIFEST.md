# CLEANUP BACKUP MANIFEST

> 生成时间：2026-08-09 13:41 (Asia/Shanghai)
> 阶段：FINAL CODEBASE CLEANUP（最终清理，网站与 PDF 功能已完成）
> Git 状态：**非 Git 仓库**（`.git` 不存在，`git` 命令不可用）→ 使用本 Manifest 作为恢复点记录

## 恢复点信息

- 当前 Commit Hash：N/A（无 Git）
- 当前 Branch：N/A
- 未提交文件：N/A
- 备份策略：删除前记录路径/大小/原因（见 FINAL_CODEBASE_CLEANUP_REPORT.md 与 MEDIA_ASSET_INVENTORY.csv）

## 清理前基线统计

| 指标 | 数值 |
| --- | --- |
| 项目文件总数 | 1,225 |
| 项目总大小 | 1,661.3 MB |
| src 文件数 / 大小 | 87 / 0.9 MB |
| public 文件数 / 大小 | 783 / 1,570.4 MB |
| pdf 目录文件数 / 大小 | 190 / 7.5 MB |
| scripts 文件数 / 大小 | 3 / 0.0 MB |
| 视频数量 / 大小 | 95 / 0.0 MB |
| 图片数量 / 大小 | 334 / 52.6 MB |
| PDF 文件数量 / 大小 | 3 / 42.5 MB |
| node_modules | 跳过（可 npm install 重建） |
| dist | 构建产物（可 npm run build 重建） |

> 完整文件清单见 `PROJECT_FILE_TREE_BEFORE_CLEANUP.txt`
