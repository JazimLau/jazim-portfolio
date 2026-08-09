# -*- coding: utf-8 -*-
"""
sync-cos-assets.py —— 将部署产物静态资源同步到腾讯 COS（供 GitHub Actions 与本地复用）。

背景：GitHub Pages 入口 + COS 资源 CDN 架构下，GitHub Actions 云端构建的产物
（assets/*.js / *.css / fonts / images 等，hash 文件名）必须与 COS 上的资源一致，
否则线上 index.html 引用的资源 404。本脚本遍历产物目录，逐文件 cp 到 COS
（保持相对路径、--acl public-read），并发 8 加速。

用法：
  python scripts/sync-cos-assets.py <dir> [--coscli <path>] [--target cos://bucket] [--endpoint <endpoint>]
  # 本地示例（复用 C:\\Users\\32741\\.cos.yaml 的 alias）：
  python scripts/sync-cos-assets.py deploy-output/github-site --coscli D:\\coscli-windows-386.exe --target cos://jazim-media
  # GitHub Actions 示例（显式 endpoint）：
  python scripts/sync-cos-assets.py deploy-output/github-site --coscli /tmp/coscli --target cos://jazim-media --endpoint cos.ap-guangzhou.myqcloud.com
"""
import argparse
import concurrent.futures
import os
import subprocess
import sys

EXCLUDE_DIRS = {"videos"}  # HLS 媒体不随站点产物上传（媒体由 COS 独立维护）


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("dir", help="部署产物目录（如 deploy-output/github-site）")
    ap.add_argument("--coscli", default="coscli", help="coscli 可执行文件路径")
    ap.add_argument("--target", default="cos://jazim-media", help="COS 目标前缀")
    ap.add_argument("--endpoint", default="", help="显式 endpoint（如 cos.ap-guangzhou.myqcloud.com），新 bucket 或云端需要")
    args = ap.parse_args()

    src_dir = os.path.abspath(args.dir)
    if not os.path.isdir(src_dir):
        print(f"[sync-cos-assets] 目录不存在: {src_dir}")
        sys.exit(1)

    files = []
    for dp, dns, fns in os.walk(src_dir):
        dns[:] = [d for d in dns if d not in EXCLUDE_DIRS]
        for f in fns:
            full = os.path.join(dp, f)
            rel = os.path.relpath(full, src_dir).replace("\\", "/")
            files.append((full, rel))

    print(f"[sync-cos-assets] {len(files)} files -> {args.target}")

    def up(job):
        local, key = job
        cmd = [args.coscli, "cp", local, f"{args.target}/{key}", "--acl", "public-read"]
        if args.endpoint:
            cmd += ["-e", args.endpoint]
        try:
            r = subprocess.run(cmd, capture_output=True, text=True, timeout=300)
            return key, r.returncode
        except Exception as e:
            return key, -1

    ok = fail = 0
    failed = []
    with concurrent.futures.ThreadPoolExecutor(max_workers=8) as ex:
        for key, rc in ex.map(up, files):
            if rc == 0:
                ok += 1
            else:
                fail += 1
                failed.append(key)
                print(f"  FAIL: {key} rc={rc}", flush=True)
    print(f"[sync-cos-assets] done ok={ok} fail={fail}")
    if fail:
        print("  failed:", failed[:20])
        sys.exit(1)


if __name__ == "__main__":
    main()
