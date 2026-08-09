# -*- coding: utf-8 -*-
"""v9：用用户提供的成品截图替换 PDF 精选案例 / 更多项目的作品图。
映射规则（用户原话）：
  - 「首图/首页」 -> 一级项目精选案例（feat/）缩略图
  - 「项目介绍四张图」 -> Case Detail 页 4 个图片槽：[Hero 大图, START, MID, END]
  - 「更多项目」缩略图 -> thumbs/
输出为 96 DPI 优化 JPEG（沿用 v8 尺寸策略），写入 pdf/assets-optimized/，覆盖对应文件。
"""
import os
from PIL import Image

BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = r"C:\Users\32741\Documents\我的POPO\【04】成品"
OPT = os.path.join(BASE, "pdf", "assets-optimized")
DPI = (96, 96)

# 案例映射: case_key -> (featured, hero, frame_s, frame_m, frame_e)
CASES = {
    "wudao":     ( "【0】武道大会首页.png", "【0】武道大会图1.png", "【0】武道大会图2.png", "【0】武道大会图3.png", "【0】武道大会图4.png"),
    "jiuzhou":   ( "【1】九州秘境首页.png", "【1】九州图3.png",     "【1】九州图1.png",     "【1】九州图2.png",     "【1】九州秘境首页.png"),
    "kejifeng":  ( "【2】科技结算首页.png", "【2】科技结算首页.png", "【2】科技结算图1.png",  "【2】科技结算图2.png",  "【2】科技结算图3.png"),
    "gongxi":    ( "【3】恭喜获得首页.png", "【3】恭喜获得首页.png", "【3】恭喜获得图1.png",  "【3】恭喜获得图2.png",  "【3】恭喜获得图3.png"),
    "yiwang":    ( "【4】遗忘之海首页.png", "【4】遗忘之海图1.png",  "【4】遗忘之海图2.png",  "【4】遗忘之海首页.png", "【4】遗忘之海图3.png"),
    "dianfeng":  ( "【5】巅峰极速首图.png", "【5】巅峰极速首图.png", "【5】巅峰极速图1.png",  "【5】巅峰极速图2.png",  "【5】巅峰极速图3.png"),
    "tianqi":    ( "【6】天地棋局首图.png", "【6】天地棋局图1.png",  "【6】天地棋局图2.png",  "【6】天地棋局首图.png", "【6】天地棋局图3.png"),
    "yinhun":    ( "【7】阴阳师首图.png",   "【7】阴阳师首图.png",   "【7】阴阳师图1.png",    "【7】阴阳师图2.png",    "【7】阴阳师图3.png"),
}

# 更多项目缩略图: thumb_key -> source
THUMBS = {
    "more-wow":     "【8】魔兽首图.png",
    "more-naraka":  "【9】永劫首图.png",
    "more-qingnv":  "【9】倩女首图.png",
    "more-ae-7day": "【9】七日签到首图.png",
    "more-unity":   "【9】宝箱首图.png",
    "more-diablo3": "【9】暗黑3首图.png",
    "more-7days":   "【9】七日首图.png",
    "more-slzh":    "【9】率土首图.png",
    "more-xxyx":    "【9】4399首图.png",
}


def save_jpeg(img, path, q, ss):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    img.save(path, "JPEG", quality=q, optimize=True, dpi=DPI, subsampling=ss)


def load_resize(src_name, target_max):
    im = Image.open(os.path.join(SRC, src_name))
    if im.mode != "RGB":
        im = im.convert("RGB")
    w, h = im.size
    if max(w, h) > target_max:
        if w >= h:
            nw = target_max
            nh = round(h * target_max / w)
        else:
            nh = target_max
            nw = round(w * target_max / h)
        im = im.resize((nw, nh), Image.LANCZOS)
    return im


def main():
    report = []
    # cases: feat(640,q85) hero(1500,q88,ss0) frames(640,q84)
    for key, (f_feat, f_hero, f_s, f_m, f_e) in CASES.items():
        save_jpeg(load_resize(f_feat, 640),  os.path.join(OPT, "feat", f"{key}.jpg"), 85, 1)
        save_jpeg(load_resize(f_hero, 1500), os.path.join(OPT, "hero", f"{key}.jpg"), 88, 0)
        save_jpeg(load_resize(f_s, 640),     os.path.join(OPT, "frames", f"{key}_s.jpg"), 84, 1)
        save_jpeg(load_resize(f_m, 640),     os.path.join(OPT, "frames", f"{key}_m.jpg"), 84, 1)
        save_jpeg(load_resize(f_e, 640),     os.path.join(OPT, "frames", f"{key}_e.jpg"), 84, 1)
        report.append((key, f_feat, f_hero, f_s, f_m, f_e))
    for tk, src in THUMBS.items():
        save_jpeg(load_resize(src, 560), os.path.join(OPT, "thumbs", f"{tk}.jpg"), 82, 1)
    print("cases updated:", len(CASES), "thumbs updated:", len(THUMBS))
    # sizes
    total = 0
    for sub in ["hero", "feat", "frames", "thumbs"]:
        d = os.path.join(OPT, sub)
        s = sum(os.path.getsize(os.path.join(d, f)) for f in os.listdir(d))
        total += s
        print(f"  {sub}/: {round(s/1024)} KB")
    print("assets-optimized total:", round(total/1024), "KB")


if __name__ == "__main__":
    main()
