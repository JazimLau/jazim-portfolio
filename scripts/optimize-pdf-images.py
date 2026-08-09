# -*- coding: utf-8 -*-
"""PDF 专用图片优化管线（v8）
只处理 pdf/assets 源图 -> 输出 pdf/assets-optimized/，绝不动网站原图。
按实际显示尺寸 resize + 96 DPI + JPEG/PNG 优化 + 预烘焙竖屏模糊背景 + 轻量 Noise 贴图。
"""
import os, json, random
from PIL import Image, ImageFilter, ImageEnhance

BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(BASE, "pdf", "assets")
OUT = os.path.join(BASE, "pdf", "assets-optimized")
DPI = (96, 96)

REPORT = []


def ensure(d):
    os.makedirs(d, exist_ok=True)


def save_jpeg(img, path, q, ss=1):
    img.save(path, "JPEG", quality=q, optimize=True, dpi=DPI, subsampling=ss)


def proc(name, src_path, out_dir, out_name, target_max, q, ss=1, note=""):
    """resize(不放大) + JPEG q + 96DPI，记录前后对比。"""
    im = Image.open(src_path)
    w, h = im.size
    ori = os.path.getsize(src_path)
    if im.mode != "RGB":
        im = im.convert("RGB")
    nw, nh = w, h
    if max(w, h) > target_max:
        if w >= h:
            nw = target_max
            nh = round(h * target_max / w)
        else:
            nh = target_max
            nw = round(w * target_max / h)
        im = im.resize((nw, nh), Image.LANCZOS)
    ensure(out_dir)
    out_path = os.path.join(out_dir, out_name)
    save_jpeg(im, out_path, q, ss)
    opt = os.path.getsize(out_path)
    REPORT.append(dict(kind=note or name, source=os.path.relpath(src_path, BASE),
                       orig_px=f"{w}x{h}", orig_kb=round(ori / 1024, 1),
                       opt_px=f"{nw}x{nh}", opt_kb=round(opt / 1024, 1),
                       reduction=round((1 - opt / ori) * 100, 1)))
    return out_path


def copy_png(name, src_path, out_dir, out_name):
    ensure(out_dir)
    out_path = os.path.join(out_dir, out_name)
    im = Image.open(src_path)
    w, h = im.size
    ori = os.path.getsize(src_path)
    im.save(out_path, "PNG", optimize=True, dpi=DPI)
    opt = os.path.getsize(out_path)
    REPORT.append(dict(kind=name, source=os.path.relpath(src_path, BASE),
                       orig_px=f"{w}x{h}", orig_kb=round(ori / 1024, 1),
                       opt_px=f"{w}x{h}", opt_kb=round(opt / 1024, 1),
                       reduction=round((1 - opt / ori) * 100, 1)))
    return out_path


def preblur_bg(name, src_path, out_dir, disp_w=1109, disp_h=580):
    """竖屏 Hero 背景：预烘焙 cover-crop + blur(32) + brightness .4 + saturate .9。"""
    im = Image.open(src_path).convert("RGB")
    w, h = im.size
    aspect = disp_w / disp_h
    if w / h > aspect:
        nw = round(h * aspect)
        x0 = (w - nw) // 2
        im = im.crop((x0, 0, x0 + nw, h))
    else:
        nh = round(w / aspect)
        y0 = (h - nh) // 2
        im = im.crop((0, y0, w, y0 + nh))
    final_w = 1200
    final_h = round(final_w / aspect)
    im = im.resize((final_w, final_h), Image.LANCZOS)
    im = im.filter(ImageFilter.GaussianBlur(32))
    im = ImageEnhance.Brightness(im).enhance(0.4)
    im = ImageEnhance.Color(im).enhance(0.9)
    ensure(out_dir)
    out_path = os.path.join(out_dir, f"{name}_bg.jpg")
    save_jpeg(im, out_path, 75, 1)
    ori = os.path.getsize(src_path)
    opt = os.path.getsize(out_path)
    REPORT.append(dict(kind=f"{name}_bg(preblur)", source=os.path.relpath(src_path, BASE),
                       orig_px=f"{w}x{h}", orig_kb=round(ori / 1024, 1),
                       opt_px=f"{final_w}x{final_h}", opt_kb=round(opt / 1024, 1),
                       reduction=round((1 - opt / ori) * 100, 1)))
    return out_path


def make_noise(out_path, size=128):
    rnd = random.Random(7)
    vals = [rnd.randrange(0, 256) for _ in range(size * size)]
    q = [int(v / 256 * 12) * 21 for v in vals]
    im = Image.new("L", (size, size))
    im.putdata(q)
    ensure(os.path.dirname(out_path))
    im.save(out_path, "PNG", optimize=True, dpi=DPI)
    return os.path.getsize(out_path)


# ---------------- categories ----------------
LANDSCAPE_HEROES = ["wudao", "jiuzhou", "kejifeng", "gongxi", "yiwang", "dianfeng", "tianqi", "yinhun"]
PORTRAIT = ["zuican", "wolf"]
FRAME_NAMES = ["wudao", "jiuzhou", "kejifeng", "gongxi", "yiwang", "dianfeng", "tianqi", "yinhun", "zuican", "wolf"]
THUMBS = ["more-wow", "more-naraka", "more-qingnv", "more-tianyu", "more-ae-7day", "more-ae-lobby",
          "more-ue5", "more-unity", "more-diablo3", "more-7days", "more-slzh", "more-xxyx"]
QRS = ["qr-home", "qr-wudao", "qr-jiuzhou", "qr-ae-previs", "qr-forgotten", "qr-peak",
       "qr-mhxy", "qr-yys", "qr-poorest", "qr-wolf"]

# heroes (case 大图，显示约1029px，源1200px 不放大 -> q90 4:4:4)
for n in LANDSCAPE_HEROES:
    proc(f"hero-{n}", os.path.join(SRC, "frames", f"{n}.jpg"), os.path.join(OUT, "hero"),
         f"{n}.jpg", 1200, 90, 0)

# portrait: fg + preblurred bg（fg 显示约 281x500，输出 480x854 ≈ 1.7x）
for n in PORTRAIT:
    src = os.path.join(SRC, "frames", f"{n}.jpg")
    proc(f"portrait-fg-{n}", src, os.path.join(OUT, "portrait"), f"{n}_fg.jpg", 854, 88, 0)
    preblur_bg(n, src, os.path.join(OUT, "portrait"))

# level-01 featured (显示约300px -> 560 宽)
for n in FRAME_NAMES:
    proc(f"feat-{n}", os.path.join(SRC, "frames", f"{n}.jpg"), os.path.join(OUT, "feat"),
         f"{n}.jpg", 560, 85, 1)

# three frames (显示约267x150 / 84x150 -> 横版560宽 / 竖版360宽)
for n in FRAME_NAMES:
    for s in "sme":
        src = os.path.join(SRC, "frames3", f"{n}_{s}.jpg")
        im = Image.open(src)
        tgt = 360 if im.size[1] > im.size[0] else 560
        im.close()
        proc(f"frame-{n}_{s}", src, os.path.join(OUT, "frames"), f"{n}_{s}.jpg", tgt, 84, 1)

# more thumbs (显示约425宽 -> 520 宽)
for n in THUMBS:
    proc(f"thumb-{n}", os.path.join(SRC, "frames", f"{n}.jpg"), os.path.join(OUT, "thumbs"),
         f"{n}.jpg", 520, 82, 1)

# qr: 保持 PNG 高对比
for n in QRS:
    copy_png(n, os.path.join(SRC, "qr", f"{n}.png"), os.path.join(OUT, "qr"), f"{n}.png")

# noise tile
noise_path = os.path.join(OUT, "noise.png")
noise_kb = round(make_noise(noise_path) / 1024, 1)
print("noise.png KB:", noise_kb)

# summary
tot_ori = sum(r["orig_kb"] for r in REPORT)
tot_opt = sum(r["opt_kb"] for r in REPORT)
print(f"images processed: {len(REPORT)}   orig total: {round(tot_ori,1)} KB   opt total: {round(tot_opt,1)} KB   reduction: {round((1-tot_opt/tot_ori)*100,1)}%")

with open(os.path.join(BASE, "pdf", "_optim_report.json"), "w", encoding="utf-8") as f:
    json.dump({"noise_kb": noise_kb, "rows": REPORT, "orig_total_kb": round(tot_ori, 1),
               "opt_total_kb": round(tot_opt, 1)}, f, ensure_ascii=False, indent=1)
print("report written")
