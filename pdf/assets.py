# -*- coding: utf-8 -*-
"""Extract representative frames from HLS videos for the PDF."""
import os, subprocess, json

BASE = r"D:\Desktop\jazim-portfolio\jazim-portfolio"
PUB = os.path.join(BASE, "public", "assets")
VID = os.path.join(PUB, "videos")
OUT = os.path.join(BASE, "pdf", "assets", "frames")
os.makedirs(OUT, exist_ok=True)

# name -> (video path under public/assets/videos, seek seconds, width)
FRAMES = {
    # featured 10
    "wudao":     ("hearthstone/hs-five-draw.m3u8", 1.0, 1200),
    "jiuzhou":   ("nsh/nsh-jiuzhou-mijing.m3u8", 1.0, 1200),
    "kejifeng":  ("game-ui/ae-sci-fi-win.m3u8", 1.0, 1200),
    "gongxi":    ("game-ui/gongxi-gacha.m3u8", 1.0, 1200),
    "yiwang":    ("promo/forgotten-sea-promo.m3u8", 1.0, 1200),
    "dianfeng":  ("promo/peak-speed-map-reveal.m3u8", 1.0, 1200),
    "tianqi":    ("ad/mhxy-tiandiqiju-xuanchuan.m3u8", 1.0, 1200),
    "yinhun":    ("ad/yys-yinhun-liandong.m3u8", 1.0, 1200),
    "zuican":    ("social/social-zuican-guanfang.m3u8", 1.0, 1200),
    "wolf":      ("social/social-wolf-in-office.m3u8", 1.0, 1200),
    # more selected works thumbnails
    "more-wow":      ("wow/wow-midsummer-product.m3u8", 1.0, 600),
    "more-naraka":   ("naraka/naraka-anniversary-kv.m3u8", 1.0, 600),
    "more-qingnv":   ("qingnv/qingnv-guild-arena.m3u8", 1.0, 600),
    "more-tianyu":   ("tianyu/tianyu-liujin-zhiyi.m3u8", 1.0, 600),
    "more-rd":       ("rd/rd-mini-program.m3u8", 1.0, 600),
    "more-7day":     ("game-ui/erciyuan-7day-signin.m3u8", 1.0, 600),
    "more-lobby":    ("game-ui/lobby-main-menu.m3u8", 1.0, 600),
    "more-ue5":      ("game-ui/ue5-icon-motion-1.m3u8", 1.0, 600),
    "more-unity":    ("game-ui/unity-chest-open.m3u8", 1.0, 600),
    "more-diablo3":  ("promo/diablo3-promo.m3u8", 1.0, 600),
    "more-headshot": ("promo/headshot-xmt-promo.m3u8", 1.0, 600),
    "more-7days":    ("promo/7days-world-xmt-promo.m3u8", 1.0, 600),
    "more-slzh":     ("ad/slzh-gaixielishi.m3u8", 1.0, 600),
    "more-mhxy-shikong": ("ad/mhxy-shikong-chengbaquanfu.m3u8", 1.0, 600),
    "more-yys-xinshi":   ("ad/yys-xinshishen.m3u8", 1.0, 600),
    "more-xxyx":     ("ad/xxyx-character-showcase.m3u8", 1.0, 600),
    "more-sanqi":    ("ad/sanqi-character-mix.m3u8", 1.0, 600),
    "more-sjqy":     ("ad/sjqy-hardcore-vehicle.m3u8", 1.0, 600),
    "more-nsh-ad":   ("ad/nsh-zhenbuxianghua.m3u8", 1.0, 600),
    "more-uu":       ("ad/uu-heikeji.m3u8", 1.0, 600),
    "more-yanyi":    ("social/social-yanyi-star.m3u8", 1.0, 600),
    "more-idv-math": ("social/social-idv-math.m3u8", 1.0, 600),
    "more-meme":     ("social/social-meme-pack.m3u8", 1.0, 600),
    "more-english":  ("social/social-english-corner.m3u8", 1.0, 600),
    "more-24h":      ("social/social-24h-livestream.m3u8", 1.0, 600),
}

def extract(name, rel, t, w):
    src = os.path.join(VID, rel)
    dst = os.path.join(OUT, name + ".jpg")
    if not os.path.exists(src):
        return False, "missing source"
    cmd = ["ffmpeg", "-y", "-ss", str(t), "-i", src, "-frames:v", "1",
           "-vf", f"scale={w}:-2", "-q:v", "5", "-loglevel", "error", dst]
    r = subprocess.run(cmd, capture_output=True, text=True, encoding="utf-8", errors="replace")
    if r.returncode == 0 and os.path.exists(dst) and os.path.getsize(dst) > 0:
        return True, ""
    return False, (r.stderr or "")[-300:]

ok, fail = 0, []
for name, (rel, t, w) in FRAMES.items():
    s, e = extract(name, rel, t, w)
    if s:
        ok += 1
    else:
        fail.append((name, e))
print("frames ok:", ok, "fail:", len(fail))
for n, e in fail:
    print("  FAIL", n, "->", e)

# ---- QR codes ----
try:
    import qrcode
except ImportError:
    print("qrcode missing")
    qrcode = None

if qrcode:
    qrdir = os.path.join(BASE, "pdf", "assets", "qr")
    os.makedirs(qrdir, exist_ok=True)
    ORIGIN = "https://jazimportfolio.com"
    QRS = {
        "qr-wudao":    f"{ORIGIN}/#/projects/leihuo-external-motion-system/case/hearthstone",
        "qr-jiuzhou":  f"{ORIGIN}/#/projects/leihuo-external-motion-system/case/nsh",
        "qr-gameui":   f"{ORIGIN}/#/projects/game-ui-motion-studies",
        "qr-promo":    f"{ORIGIN}/#/projects/game-promotion-films",
        "qr-ad":       f"{ORIGIN}/#/projects/game-ad-films",
        "qr-social":   f"{ORIGIN}/#/projects/game-social-videos",
    }
    for name, url in QRS.items():
        qr = qrcode.QRCode(version=None, error_correction=qrcode.constants.ERROR_CORRECT_M, box_size=8, border=2)
        qr.add_data(url)
        qr.make(fit=True)
        img = qr.make_image(fill_color="black", back_color="white")
        img.save(os.path.join(qrdir, name + ".png"))
    print("QR codes done")
