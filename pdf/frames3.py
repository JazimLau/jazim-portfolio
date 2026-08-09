# -*- coding: utf-8 -*-
"""Extract 3 keyframes (START / MID / END) for each featured video case.
- Landscape: frame at 1280 width.
- Portrait: keep full portrait (height ~1280), never crop subject.
- Anti-black: if a sampled frame is too dark, probe alternates.
"""
import os, subprocess, json

BASE = r"D:\Desktop\jazim-portfolio\jazim-portfolio"
VID = os.path.join(BASE, "public", "assets", "videos")
OUT = os.path.join(BASE, "pdf", "assets", "frames3")
os.makedirs(OUT, exist_ok=True)

VIDEOS = [
    ("wudao",   "hearthstone/hs-five-draw.m3u8"),
    ("jiuzhou", "nsh/nsh-jiuzhou-mijing.m3u8"),
    ("kejifeng","game-ui/ae-sci-fi-win.m3u8"),
    ("gongxi",  "game-ui/gongxi-gacha.m3u8"),
    ("yiwang",  "promo/forgotten-sea-promo.m3u8"),
    ("dianfeng","promo/peak-speed-map-reveal.m3u8"),
    ("tianqi",  "ad/mhxy-tiandiqiju-xuanchuan.m3u8"),
    ("yinhun",  "ad/yys-yinhun-liandong.m3u8"),
    ("zuican",  "social/social-zuican-guanfang.m3u8"),
    ("wolf",    "social/social-wolf-in-office.m3u8"),
]

def duration(src):
    r = subprocess.run(["ffprobe","-v","error","-show_entries","format=duration","-of","json", src],
                       capture_output=True, text=True, encoding="utf-8", errors="replace")
    try:
        return float(json.loads(r.stdout)["format"]["duration"])
    except Exception:
        return None

def dims(src):
    r = subprocess.run(["ffprobe","-v","error","-select_streams","v:0",
                        "-show_entries","stream=width,height","-of","json", src],
                       capture_output=True, text=True, encoding="utf-8", errors="replace")
    try:
        s = json.loads(r.stdout)["streams"][0]
        return int(s["width"]), int(s["height"])
    except Exception:
        return 1280, 720

def brightness(path):
    try:
        from PIL import Image
        im = Image.open(path).convert("L")
        px = list(im.resize((64, 36)).getdata())
        return sum(px) / len(px)
    except Exception:
        return 255.0

def extract(src, t, w, dst):
    # precise seek: -ss AFTER -i (HLS segments seek reliably this way)
    cmd = ["ffmpeg","-y","-i",src,"-ss",str(t),"-frames:v","1",
           "-vf",f"scale={w}:-2","-q:v","4","-loglevel","error",dst]
    r = subprocess.run(cmd, capture_output=True, text=True, encoding="utf-8", errors="replace")
    return r.returncode == 0 and os.path.exists(dst) and os.path.getsize(dst) > 0

ok, fail = 0, []
for name, rel in VIDEOS:
    src = os.path.join(VID, rel)
    dur = duration(src) or 30.0
    w0, h0 = dims(src)
    landscape = h0 <= w0
    # target width for landscape; for portrait keep height ~1280 (=> width ~720)
    w = 1280 if landscape else int(round(1280 * (w0 / h0)))
    for idx, frac in (("s", 0.16), ("m", 0.5), ("e", 0.84)):
        t = dur * frac
        t = max(0.4, min(t, dur - 0.4))
        dst = os.path.join(OUT, f"{name}_{idx}.jpg")
        # candidate offsets to avoid pure black / transition frames
        candidates = [t, t + dur*0.08, t - dur*0.08, t + dur*0.15, t - dur*0.15]
        chosen = None
        for ct in candidates:
            ct = max(0.4, min(ct, dur - 0.4))
            if extract(src, ct, w, dst):
                br = brightness(dst)
                if br >= 22:
                    chosen = ct
                    break
                chosen = chosen or ct  # keep last if all dark
        if chosen is not None:
            ok += 1
            print(f"{name}_{idx}: t={chosen:.2f}s")
        else:
            fail.append((name, idx))
print("frames ok:", ok, "fail:", fail)
