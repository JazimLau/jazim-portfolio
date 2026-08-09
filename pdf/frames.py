# -*- coding: utf-8 -*-
"""Extract representative frames from HLS videos for the PDF."""
import os, subprocess, json

BASE = r"D:\Desktop\jazim-portfolio\jazim-portfolio"
VID = os.path.join(BASE, "public", "assets", "videos")
OUT = os.path.join(BASE, "pdf", "assets", "frames")
os.makedirs(OUT, exist_ok=True)

# (output name, relative m3u8 path, seek seconds, scale)
TARGETS = [
    # 10 featured cases
    ("hearthstone-wudao",   "hearthstone/hs-five-draw.m3u8", 1.2, 1280),
    ("nsh-jiuzhou-mijing",  "nsh/nsh-jiuzhou-mijing.m3u8", 0.8, 1280),
    ("ae-sci-fi-win",       "game-ui/ae-sci-fi-win.m3u8", 1.0, 1280),
    ("gongxi-gacha",        "game-ui/gongxi-gacha.m3u8", 1.0, 1280),
    ("forgotten-sea",       "promo/forgotten-sea-promo.m3u8", 1.0, 1280),
    ("peak-speed-map",      "promo/peak-speed-map-reveal.m3u8", 1.0, 1280),
    ("mhxy-tiandiqiju",     "ad/mhxy-tiandiqiju-xuanchuan.m3u8", 1.0, 1280),
    ("yys-yinhun-liandong", "ad/yys-yinhun-liandong.m3u8", 1.0, 1280),
    ("social-zuican",       "social/social-zuican-guanfang.m3u8", 1.0, 1280),
    ("social-wolf",         "social/social-wolf-in-office.m3u8", 1.0, 1280),
    # more selected works (thumbnails)
    ("more-wow-midsummer",  "wow/wow-midsummer-product.m3u8", 1.0, 640),
    ("more-naraka-shangbo", "naraka/naraka-shangbo-demo.m3u8", 1.0, 640),
    ("more-qingnv-guild",   "qingnv/qingnv-guild-arena.m3u8", 1.0, 640),
    ("more-tianyu-liujin",  "tianyu/tianyu-liujin-zhiyi.m3u8", 1.0, 640),
    ("more-rd-mini",        "rd/rd-mini-program.m3u8", 1.0, 640),
    ("more-nsh-golden",     "nsh/nsh-golden-kv.m3u8", 1.0, 640),
    ("more-slzh",           "ad/slzh-gaixielishi.m3u8", 1.0, 640),
    ("more-mhxy-shikong",   "ad/mhxy-shikong-chengbaquanfu.m3u8", 1.0, 640),
    ("more-yys-xinshishen", "ad/yys-xinshishen.m3u8", 1.0, 640),
    ("more-xxyx",           "ad/xxyx-character-showcase.m3u8", 1.0, 640),
    ("more-sjqy",           "ad/sjqy-hardcore-vehicle.m3u8", 1.0, 640),
    ("more-nsh-ad",         "ad/nsh-zhenbuxianghua.m3u8", 1.0, 640),
    ("more-yanyi-star",     "social/social-yanyi-star.m3u8", 1.0, 640),
    ("more-meme-pack",      "social/social-meme-pack.m3u8", 1.0, 640),
    ("more-english-corner", "social/social-english-corner.m3u8", 1.0, 640),
    ("more-idv-math",       "social/social-idv-math.m3u8", 1.0, 640),
    ("more-24h-live",       "social/social-24h-livestream.m3u8", 1.0, 640),
    ("more-ae-7day",        "game-ui/erciyuan-7day-signin.m3u8", 1.0, 640),
    ("more-ae-lobby",       "game-ui/lobby-main-menu.m3u8", 1.0, 640),
    ("more-ue5-icon",       "game-ui/ue5-icon-motion-1.m3u8", 1.0, 640),
    ("more-unity-chest",    "game-ui/unity-chest-open.m3u8", 1.0, 640),
]

ok, fail = 0, []
for name, rel, t, w in TARGETS:
    src = os.path.join(VID, rel)
    dst = os.path.join(OUT, name + ".jpg")
    if not os.path.exists(src):
        fail.append((name, "no source"))
        continue
    cmd = [
        "ffmpeg", "-y", "-ss", str(t), "-i", src,
        "-frames:v", "1", "-vf", f"scale={w}:-2", "-q:v", "4",
        dst,
    ]
    r = subprocess.run(cmd, capture_output=True, text=True, encoding="utf-8", errors="replace")
    if r.returncode == 0 and os.path.exists(dst):
        ok += 1
    else:
        fail.append((name, r.stderr[-200:]))
print("ok frames:", ok, "fail:", len(fail))
for n, e in fail:
    print("  FAIL", n, "->", e)
