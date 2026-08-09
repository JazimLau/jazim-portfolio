# -*- coding: utf-8 -*-
"""
hls-audio-safe-transcode.py —— 修复后的 HLS 转码 Pipeline（音频安全版）

背景（2026-08 根因）：
  旧转码流程对"有音轨的源"也生成了无音轨 HLS（音频被丢弃），导致网站全部无声。
  本脚本修复该问题：
    - 源有 Audio Stream  -> 输出 HLS/TS 保留音频（AAC 128k 立体声），并用 volumedetect 校验非静音
    - 源无 Audio Stream  -> 输出无声 HLS（-an），不强制加空音轨

用法：
  python scripts/hls-audio-safe-transcode.py "<源视频.mp4>" --out optimized-test/audio-fix/<name> --base <m3u8名>
  可选：
    --crf 22                视频质量（默认 22）
    --height 1080           限制高度（默认保持源分辨率，只等比缩放不放大）
    --seg-sec 2             分片时长秒（默认 2，配 -force_key_frames 关键帧对齐）
    --bitrate-a 128k        音频码率（默认 128k，范围 128k~160k）
    --no-verify             跳过转码后校验
  示例（三个有声源）：
    python scripts/hls-audio-safe-transcode.py "src.mp4" --out optimized-test/audio-fix/x --base x
"""
import argparse
import io
import json
import os
import subprocess
import sys
import time

try:
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
except Exception:
    pass

FFMPEG = os.environ.get('FFMPEG_PATH', 'ffmpeg')
FFPROBE = os.environ.get('FFPROBE_PATH', 'ffprobe')


def probe_streams(path):
    """返回 {'video':[...], 'audio':[...]} 流信息。"""
    r = subprocess.run([FFPROBE, '-v', 'error', '-show_streams', '-of', 'json', path],
                       capture_output=True, text=True, encoding='utf-8', errors='replace', timeout=120)
    try:
        data = json.loads(r.stdout or '{}')
    except Exception:
        return {'video': [], 'audio': []}
    out = {'video': [], 'audio': []}
    for s in data.get('streams', []):
        ct = s.get('codec_type')
        if ct in out:
            out[ct].append({
                'codec': s.get('codec_name'),
                'width': s.get('width'),
                'height': s.get('height'),
                'channels': s.get('channels'),
                'sample_rate': s.get('sample_rate'),
            })
    return out


def probe_video_size(path):
    streams = probe_streams(path)
    for v in streams.get('video', []):
        if v.get('width') and v.get('height'):
            return v['width'], v['height']
    return None, None


def volumedetect(path):
    """返回 (mean_db, max_db)；无音频返回 (None, None)。"""
    r = subprocess.run([FFMPEG, '-hide_banner', '-i', path, '-map', '0:a:0',
                        '-af', 'volumedetect', '-f', 'null', '-'],
                       capture_output=True, text=True, encoding='utf-8', errors='replace', timeout=300)
    mean = max_ = None
    for l in (r.stderr or '').splitlines():
        if 'mean_volume' in l:
            try:
                mean = float(l.split('mean_volume:')[1].strip().split()[0])
            except Exception:
                pass
        if 'max_volume' in l:
            try:
                max_ = float(l.split('max_volume:')[1].strip().split()[0])
            except Exception:
                pass
    return mean, max_


def scale_filter(src, target_height):
    w, h = probe_video_size(src)
    if not w or not h or not target_height or h <= target_height:
        return None  # 不缩放（保持原分辨率，避免放大）
    return f'scale=-2:{target_height}'


def transcode(src, out_dir, base, crf, height, seg_sec, bitrate_a, verify=True):
    os.makedirs(out_dir, exist_ok=True)
    m3u8 = os.path.join(out_dir, base + '.m3u8')
    seg = os.path.join(out_dir, base + '_%03d.ts')

    info = probe_streams(src)
    has_audio = len(info.get('audio', [])) > 0
    print(f'[source] {src}')
    print(f'  video streams: {info["video"]}')
    print(f'  audio streams: {info["audio"] if info["audio"] else "NONE"}')

    cmd = [FFMPEG, '-y', '-hide_banner', '-loglevel', 'error',
           '-i', src, '-map', '0:v:0']
    if has_audio:
        cmd += ['-map', '0:a:0?', '-c:a', 'aac', '-b:a', bitrate_a, '-ac', '2']
    else:
        cmd += ['-an']
    vf = scale_filter(src, height)
    cmd += ['-c:v', 'libx264', '-preset', 'medium', '-crf', str(crf), '-pix_fmt', 'yuv420p']
    if vf:
        cmd += ['-vf', vf]
    cmd += ['-force_key_frames', f'expr:gte(t,n_forced*{seg_sec})',
            '-hls_time', str(seg_sec), '-hls_playlist_type', 'vod',
            '-hls_segment_filename', seg, m3u8]

    t0 = time.time()
    r = subprocess.run(cmd, capture_output=True, text=True, encoding='utf-8', errors='replace', timeout=1800)
    print(f'[transcode] RC={r.returncode} elapsed={round(time.time()-t0,1)}s')
    if r.returncode != 0:
        print('  stderr tail:', (r.stderr or '')[-800:])
        return False

    segs = [f for f in sorted(os.listdir(out_dir)) if f.endswith('.ts')]
    print(f'[output] {len(segs)} segments, m3u8={m3u8}')

    if not verify:
        return True

    # ---- 校验 ----
    ok = True
    # 1) m3u8
    with open(m3u8, encoding='utf-8', errors='ignore') as f:
        m3content = f.read()
    print(f'[verify] m3u8 segments listed={m3content.count(".ts")}')
    # 2) 首/中/尾 TS 音轨
    picks = {'first': segs[0]}
    if len(segs) > 2:
        picks['middle'] = segs[len(segs) // 2]
    picks['last'] = segs[-1]
    for label, s in picks.items():
        p = os.path.join(out_dir, s)
        si = probe_streams(p)
        a_ok = (len(si['audio']) > 0) if has_audio else (len(si['audio']) == 0)
        mean, mx = volumedetect(p)
        if has_audio:
            audible = (mean is not None and mx is not None and mx > -50.0)
            print(f'  [{label}] {s}: audio_streams={len(si["audio"])} vol=mean:{mean} max:{mx} audible={audible}')
            if not a_ok or not audible:
                ok = False
        else:
            print(f'  [{label}] {s}: audio_streams={len(si["audio"])} (expect 0, source silent)')
            if not a_ok:
                ok = False
    print(f'[verify] RESULT: {"PASS" if ok else "FAIL"}')
    return ok


def main():
    ap = argparse.ArgumentParser(description='Audio-safe HLS transcode pipeline')
    ap.add_argument('src', help='source video path')
    ap.add_argument('--out', required=True, help='output directory')
    ap.add_argument('--base', required=True, help='output base name (m3u8/ts prefix)')
    ap.add_argument('--crf', type=int, default=22)
    ap.add_argument('--height', type=int, default=0, help='max height (0=keep source)')
    ap.add_argument('--seg-sec', type=int, default=2)
    ap.add_argument('--bitrate-a', default='128k')
    ap.add_argument('--no-verify', action='store_true')
    args = ap.parse_args()

    ok = transcode(args.src, args.out, args.base, args.crf,
                   args.height or None, args.seg_sec, args.bitrate_a,
                   verify=not args.no_verify)
    sys.exit(0 if ok else 1)


if __name__ == '__main__':
    main()
