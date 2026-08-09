# -*- coding: utf-8 -*-
"""PDF 导出流程（v8）：校验 optimized 资源 -> 生成 HTML -> Chrome headless 导出 PDF -> 校验。
用法：python scripts/build-pdf.py
"""
import os, sys, subprocess, shutil, tempfile

BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PDF_DIR = os.path.join(BASE, "pdf")
OPT = os.path.join(PDF_DIR, "assets-optimized")
OUT_DIR = os.path.join(BASE, "portfolio-output")
PDF_OUT = os.path.join(OUT_DIR, "Jazim-Lau-Game-Motion-Portfolio-2026.pdf")
URL = "http://127.0.0.1:8899/portfolio-pdf.html?r=v9-final"

CHROME_CANDIDATES = [
    r"C:\Program Files\Google\Chrome\Application\chrome.exe",
    r"C:\Program Files (x86)\Google\Chrome\Application\chrome.exe",
    os.path.expandvars(r"%LOCALAPPDATA%\Google\Chrome\Application\chrome.exe"),
]


def main():
    # 1. optimized assets 必须存在（不存在则先跑图片管线）
    if not os.path.isdir(OPT):
        print("[build-pdf] optimized assets missing -> run optimize-pdf-images.py")
        r = subprocess.run([sys.executable, os.path.join(BASE, "scripts", "optimize-pdf-images.py")])
        if r.returncode != 0:
            sys.exit("optimize failed")
    else:
        print("[build-pdf] optimized assets OK:", OPT)

    # 2. build HTML
    r = subprocess.run([sys.executable, os.path.join(PDF_DIR, "build_html.py")],
                       capture_output=True, text=True, encoding="utf-8")
    print(r.stdout[-200:] or r.stderr[-200:])
    if r.returncode != 0:
        sys.exit("build_html failed")

    # 3. export PDF (fresh user-data-dir, avoid stale cache)
    chrome = next((c for c in CHROME_CANDIDATES if os.path.exists(c)), None)
    if not chrome:
        sys.exit("chrome not found")
    os.makedirs(OUT_DIR, exist_ok=True)
    if os.path.exists(PDF_OUT):
        os.remove(PDF_OUT)
    ud = os.path.join(tempfile.gettempdir(), "chrm_pp_v8")
    if os.path.exists(ud):
        shutil.rmtree(ud, ignore_errors=True)
    cmd = [chrome, "--headless=new", "--disable-gpu", "--no-pdf-header-footer",
           "--user-data-dir=" + ud, "--print-to-pdf=" + PDF_OUT, URL]
    r = subprocess.run(cmd, capture_output=True, text=True, encoding="utf-8", timeout=240)
    print("chrome RC:", r.returncode)
    if not os.path.exists(PDF_OUT):
        sys.exit("pdf not produced: " + (r.stderr[-500:] or ""))
    print("PDF:", PDF_OUT, round(os.path.getsize(PDF_OUT) / 1024 / 1024, 1), "MB")

    # 4. verify
    try:
        import pymupdf
    except ImportError:
        print("pymupdf not installed, skip verify")
        return
    doc = pymupdf.open(PDF_OUT)
    sizes = set((round(p.rect.width), round(p.rect.height)) for p in doc)
    print("pages:", len(doc), "sizes:", sizes)


if __name__ == "__main__":
    main()
