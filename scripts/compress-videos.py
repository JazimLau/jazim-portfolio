# -*- coding: utf-8 -*-
"""
compress-videos.py —— 批量压缩 HLS 视频（降低码率/分辨率），缓解 COS 默认域名限速导致的加载慢。

背景：COS 默认域名（免备案）对下行有限速（实测 ~400-540KB/s），首画面等待较久。
把视频压到更低码率（默认 720p / 1200kbps）后体积约减半，首画面时间也随之减半。

用法：
  python scripts/compress-videos.py                # 压缩全部视频（覆盖原 m3u8 + ts）
  python scripts/compress-videos.py --dir wow      # 只压缩 assets/videos/wow 目录
  python scripts/compress-videos.py --dry-run      # 只列出将被处理的 m3u8，不实际转码
  python scripts/compress-videos.py --height 1080 --bitrate 2500k   # 自定义分辨率/码率

说明：
  - 转码到临时目录，成功后原子替换原 m3u8 + 分片（删除旧分片），失败则保留原文件。
  - 压缩后需重新上传 COS：npm run cos:media
  - 用 ffmpeg（需已安装并在 PATH 或配置 FFMPEG_PATH）。
"""
import argparse
import io
import os
import re
import shutil
import subprocess
import sys
import tempfile
import time

try:
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
except Exception:
    pass

BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
VIDEOS = os.path.join(BASE, 'public', 'assets', 'videos')

FFMPEG = os.environ.get('FFMPEG_PATH', 'ffmpeg')


def find_m3u8(dir_path):
    """返回目录下所有 .m3u8（含子目录，排除输出临时文件）。"""
    out = []
    for dp, _, fs in os.walk(dir_path):
        for f in fs:
            if f.endswith('.m3u8'):
                out.append(os.path.join(dp, f))
    return sorted(out)


def ffmpeg_available():
    try:
        r = subprocess.run([FFMPEG, '-version'], capture_output=True, timeout=20)
        return r.returncode == 0
    except Exception:
        return False


def compress_one(m3u8, height, bitrate, maxrate, bufsize):
    """转码单个 m3u8，成功替换原文件，返回 (ok, old_bytes, new_bytes, secs)。"""
    d = os.path.dirname(m3u8)
    base = os.path.splitext(os.path.basename(m3u8))[0]
    # 计算原体积
    old_bytes = 0
    with open(m3u8, encoding='utf-8', errors='ignore') as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith('#'):
                p = os.path.join(d, line)
                if os.path.exists(p):
                    old_bytes += os.path.getsize(p)

    tmp = tempfile.mkdtemp(prefix='hz_compress_')
    out_m3u8 = os.path.join(tmp, base + '.m3u8')
    # 保持原分片命名 <base>_%03d.ts（与 m3u8 相对路径一致）
    seg_pat = os.path.join(tmp, base + '_%03d.ts')
    # 读 m3u8 推断分片位数（_000 或 _00）
    seg_digits = 3
    with open(m3u8, encoding='utf-8', errors='ignore') as f:
        for line in f:
            m = re.search(r'_(\d+)\.ts', line)
            if m:
                seg_digits = len(m.group(1))
                break
    seg_pat = os.path.join(tmp, base + '_%0*d.ts' % (seg_digits, 0)).replace('%0*d' % (seg_digits, 0), f'%0{seg_digits}d')

    vf = f"scale='min({height},iw)':-2"
    cmd = [
        FFMPEG, '-y', '-i', m3u8,
        '-vf', vf,
        # 强制每 4s 一个关键帧，保证分片 ~4s（否则按原关键帧切可能 10s 一段，首画面等待不减反增）
        '-force_key_frames', 'expr:gte(t,n_forced*4)',
        '-c:v', 'libx264', '-b:v', bitrate, '-maxrate', maxrate, '-bufsize', bufsize,
        '-preset', 'veryfast', '-profile:v', 'main', '-level', '4.0',
        '-c:a', 'aac', '-b:a', '128k',
        '-hls_time', '4', '-hls_playlist_type', 'vod',
        '-hls_segment_filename', seg_pat,
        out_m3u8,
    ]
    t0 = time.time()
    try:
        r = subprocess.run(cmd, capture_output=True, text=True, timeout=1800, encoding='utf-8', errors='replace')
    except Exception as e:
        shutil.rmtree(tmp, ignore_errors=True)
        return (False, old_bytes, 0, time.time() - t0, str(e))
    dt = time.time() - t0
    if r.returncode != 0:
        shutil.rmtree(tmp, ignore_errors=True)
        return (False, old_bytes, 0, dt, (r.stderr or r.stdout)[-300:])
    # 新体积
    new_bytes = 0
    with open(out_m3u8, encoding='utf-8', errors='ignore') as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith('#'):
                p = os.path.join(tmp, line)
                if os.path.exists(p):
                    new_bytes += os.path.getsize(p)
    # 原子替换：备份旧分片，写入新文件
    try:
        # 删除旧分片
        for fn in os.listdir(d):
            if re.match(re.escape(base) + r'_\d+\.ts$', fn):
                os.remove(os.path.join(d, fn))
        # 复制新分片 + m3u8
        for fn in os.listdir(tmp):
            shutil.copy2(os.path.join(tmp, fn), os.path.join(d, fn))
        shutil.rmtree(tmp, ignore_errors=True)
        return (True, old_bytes, new_bytes, dt, '')
    except Exception as e:
        shutil.rmtree(tmp, ignore_errors=True)
        return (False, old_bytes, new_bytes, dt, 'replace failed: ' + str(e))


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--dir', default='', help='只处理 assets/videos/<dir> 子目录')
    ap.add_argument('--height', type=int, default=720, help='目标高度（默认 720）')
    ap.add_argument('--bitrate', default='1200k', help='目标视频码率（默认 1200k）')
    ap.add_argument('--dry-run', action='store_true', help='只列出将处理的 m3u8')
    args = ap.parse_args()

    if not ffmpeg_available():
        print('ffmpeg not found. Install ffmpeg or set FFMPEG_PATH.')
        sys.exit(1)

    base_dir = os.path.join(VIDEOS, args.dir) if args.dir else VIDEOS
    files = find_m3u8(base_dir)
    if not files:
        print('no m3u8 found under', base_dir)
        sys.exit(1)

    maxrate = args.bitrate if args.bitrate.endswith('k') else args.bitrate
    bufsize = ('%d' % (int(re.sub(r'[kK]', '', args.bitrate)) * 2)) + 'k'

    print(f'ffmpeg: {FFMPEG} | target {args.height}p @ {args.bitrate}')
    print(f'files: {len(files)}')
    if args.dry_run:
        for f in files:
            print(' ', os.path.relpath(f, BASE))
        return

    total_old = total_new = 0
    t_all = time.time()
    ok = 0
    for i, f in enumerate(files, 1):
        ok_, ob, nb, dt, err = compress_one(f, args.height, args.bitrate, maxrate, bufsize)
        rel = os.path.relpath(f, BASE)
        if ok_:
            ok += 1
            total_old += ob
            total_new += nb
            print(f'[{i}/{len(files)}] OK   {rel}  {ob/1048576:.1f}MB -> {nb/1048576:.1f}MB  ({dt:.0f}s)')
        else:
            print(f'[{i}/{len(files)}] FAIL {rel}  {err}')
    print(f'\ndone: {ok}/{len(files)} OK, total {total_old/1048576:.0f}MB -> {total_new/1048576:.0f}MB, '
          f'elapsed {time.time()-t_all:.0f}s')
    if ok:
        print('\nNext: npm run cos:media   (重新上传 COS 后线上生效)')


if __name__ == '__main__':
    main()
