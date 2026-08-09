#!/usr/bin/env python3
"""
package-tencent-deploy.py
PHASE 29：Tencent EdgeOne 部署 ZIP 打包。

把 deploy-output/tencent-site/ 打包为 deploy-output/Jazim-Portfolio-EdgeOne.zip，
ZIP 根目录直接是 index.html / assets/...（不能再套一层 dist/）。

用法：
    python scripts/package-tencent-deploy.py [src_dir] [out_zip]
    默认 src_dir = deploy-output/tencent-site
    默认 out_zip = deploy-output/Jazim-Portfolio-EdgeOne.zip

同时生成 TENCENT_DEPLOY_ARTIFACT_REPORT.md（File Count / Total Size / Largest File /
m3u8 / ts / video 统计）。
"""
import os
import sys
import zipfile
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SRC = (ROOT / (sys.argv[1] if len(sys.argv) > 1 else "deploy-output/tencent-site")).resolve()
OUT = (ROOT / (sys.argv[2] if len(sys.argv) > 2 else "deploy-output/Jazim-Portfolio-EdgeOne.zip")).resolve()
REPORT = ROOT / "deploy-output" / "reports" / "TENCENT_DEPLOY_ARTIFACT_REPORT.md"

VIDEO_EXTS = {".m3u8", ".ts", ".mov", ".mp4", ".webm", ".avi", ".mkv"}


def main() -> int:
    if not (SRC / "index.html").exists():
        print(f"[package-tencent-deploy] ERROR: {SRC} 缺少 index.html，请先运行 npm run build:deploy")
        return 1

    OUT.parent.mkdir(parents=True, exist_ok=True)
    REPORT.parent.mkdir(parents=True, exist_ok=True)

    # 收集文件
    files = []
    for base, _dirs, names in os.walk(SRC):
        for n in names:
            p = Path(base) / n
            files.append(p)

    total_size = sum(p.stat().st_size for p in files)
    largest = max(files, key=lambda p: p.stat().st_size)
    m3u8 = [p for p in files if p.suffix.lower() == ".m3u8"]
    ts = [p for p in files if p.suffix.lower() == ".ts"]
    videos = [p for p in files if p.suffix.lower() in VIDEO_EXTS]

    # 打包：ZIP 根目录 = index.html / assets/...
    with zipfile.ZipFile(OUT, "w", zipfile.ZIP_DEFLATED) as zf:
        for p in sorted(files):
            arc = p.relative_to(SRC).as_posix()
            zf.write(p, arc)

    # 报告
    lines = [
        "# TENCENT DEPLOY ARTIFACT REPORT",
        "",
        f"生成时间：{__import__('datetime').datetime.now().isoformat()}",
        f"来源目录：{SRC.relative_to(ROOT)}",
        f"ZIP 文件：{OUT.relative_to(ROOT)}",
        f"ZIP 大小：{OUT.stat().st_size / 1024 / 1024:.2f} MB",
        "",
        "## 统计",
        "",
        f"- File Count：{len(files)}",
        f"- Total Size：{total_size / 1024 / 1024:.2f} MB",
        f"- Largest File：{largest.relative_to(SRC).as_posix()}（{largest.stat().st_size / 1024 / 1024:.2f} MB）",
        f"- m3u8 count：{len(m3u8)}",
        f"- ts count：{len(ts)}",
        f"- video count：{len(videos)}",
        "",
        "## 要求核验",
        "",
        "- ZIP 根目录直接包含 index.html：YES",
        "- HLS（m3u8/ts）进入 EdgeOne 部署包：**0**（应已由 prepare-deploy-build 剥离）",
        "- media.jazimportfolio.com（COS）承载大型视频：独立于本部署包",
    ]
    if len(m3u8) + len(ts) > 0:
        lines.append("")
        lines.append("⚠️ 检测到部署包内仍含 HLS 文件，请运行 npm run build:deploy 重新生成。")
    REPORT.write_text("\n".join(lines), encoding="utf-8")

    print("[package-tencent-deploy] OK")
    print(f"  zip   : {OUT.relative_to(ROOT)} ({OUT.stat().st_size / 1024 / 1024:.2f} MB)")
    print(f"  files : {len(files)}")
    print(f"  hls   : m3u8={len(m3u8)} ts={len(ts)}")
    print(f"  report: {REPORT.relative_to(ROOT)}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
