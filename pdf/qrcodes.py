# -*- coding: utf-8 -*-
"""Generate QR codes for the PDF pages.

QR encodes full URLs based on the HashRouter paths. ORIGIN is the production
domain; the #/ path stays identical to the site routes (HashRouter 保证手机/电脑
扫描跳转到同一页面，地址一致)。

切换站点来源（环境变量 QR_ORIGIN 覆盖默认值）：
  - 当前默认 = Vercel 镜像站（国内相对稳定、免备案、已部署验证）：
      https://jazim-portfolio-theta.vercel.app
  - 切回 GitHub Pages：
      PowerShell: $env:QR_ORIGIN="https://jazimlau.github.io/jazim-portfolio"; python pdf/qrcodes.py
      CMD:        set QR_ORIGIN=https://jazimlau.github.io/jazim-portfolio && python pdf/qrcodes.py
  注意：GitHub Pages 为仓库子路径部署，ORIGIN 必须带 /jazim-portfolio/ 前缀；
  Vercel 为根路径，不带前缀。
"""
import os
import qrcode
from qrcode.image.pil import PilImage

BASE = r"D:\Desktop\jazim-portfolio\jazim-portfolio"
OUT = os.path.join(BASE, "pdf", "assets", "qr")
os.makedirs(OUT, exist_ok=True)

ORIGIN = os.environ.get("QR_ORIGIN", "https://jazim-portfolio-theta.vercel.app")

QR_TARGETS = [
    ("qr-home",      f"{ORIGIN}/#/"),
    ("qr-wudao",     f"{ORIGIN}/#/projects/leihuo-external-motion-system/case/hearthstone"),
    ("qr-jiuzhou",   f"{ORIGIN}/#/projects/leihuo-external-motion-system/case/nsh"),
    ("qr-gameui",    f"{ORIGIN}/#/projects/game-ui-motion-studies"),
    ("qr-promo",     f"{ORIGIN}/#/projects/game-promotion-films"),
    ("qr-ad",        f"{ORIGIN}/#/projects/game-ad-films"),
    ("qr-social",    f"{ORIGIN}/#/projects/game-social-videos"),
    ("qr-ae-previs", f"{ORIGIN}/#/projects/game-ui-motion-studies/case/ae-previs"),
    ("qr-forgotten", f"{ORIGIN}/#/projects/game-promotion-films/case/forgotten-sea"),
    ("qr-peak",      f"{ORIGIN}/#/projects/game-promotion-films/case/peak-speed-map"),
    ("qr-mhxy",      f"{ORIGIN}/#/projects/game-ad-films/case/mhxy"),
    ("qr-yys",       f"{ORIGIN}/#/projects/game-ad-films/case/yys"),
    ("qr-poorest",   f"{ORIGIN}/#/projects/game-social-videos/case/poorest-official"),
    ("qr-wolf",      f"{ORIGIN}/#/projects/game-social-videos/case/wolf-barged-in"),
]

for name, url in QR_TARGETS:
    qr = qrcode.QRCode(
        version=None,
        error_correction=qrcode.constants.ERROR_CORRECT_M,
        box_size=6,
        border=2,
    )
    qr.add_data(url)
    qr.make(fit=True)
    img = qr.make_image(fill_color="black", back_color="white").convert("RGB")
    img.save(os.path.join(OUT, name + ".png"))
    print("QR", name, "->", url)
print("done ->", OUT)
