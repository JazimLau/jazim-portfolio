# -*- coding: utf-8 -*-
"""Build portfolio-pdf.html — 1920x1080 landscape portfolio-deck, FINAL TYPOGRAPHY & ALIGNMENT (v5).

Final round: typography / module scale / alignment unification (no redesign).
  - Locked safe area (left>=80, right<=1840, content bottom<=985).
  - Typography tokens (--fs-*) + image tokens centralized in :root; no inline font patches.
  - Workflow on ALL five LEVEL-01 pages is a strictly VERTICAL stepper (01-06, pixel rail + dots).
  - Featured area enlarged: columns 32fr / 68fr; images 320x180; all featured fonts >= 13px.
  - Experience: inner fonts scaled up (company 32 / role 20 / duties 17 / kw 13 / time 15).
  - Project Index: 5-card grid fixed; Stats Footer region fixed (same divider Y across cards).
  - Case Detail: page H1 = product/track name, right column = case name; right fonts scaled up;
    section titles CN-first (20-21px); still NO delivery block.
  - Skills: LEARNING module removed; Toolset becomes a full-width bottom panel; card fonts up.
  - Contact: STATUS panel removed; BASE removed; rows redistributed (bigger fonts / spacing).
  - More Works: card grid unchanged, name 17px.
  - Page count auto-computed. Chinese-first. 1920x1080 safe space enforced.
"""
import json, os, html

BASE = r"D:\Desktop\jazim-portfolio\jazim-portfolio"
DATA = json.load(open(os.path.join(BASE, "pdf", "data", "pdf-data.json"), encoding="utf-8"))
OUT = os.path.join(BASE, "pdf", "portfolio-pdf.html")

profile = DATA["profile"]
timeline = DATA["timeline"]
skills = DATA["skills"]
projects = DATA["projects"]
AD_PRODUCT_ORDER = [x for x in DATA.get("adProductOrder", []) if x]

def zh(v):
    if isinstance(v, list):
        return str(v[0] or "")
    return str(v or "")

def en(v):
    if isinstance(v, list):
        return str(v[1] or "")
    return str(v or "")

def esc(s):
    return html.escape(str(s), quote=False)

def cn(v):
    return esc(zh(v)) if isinstance(v, list) else esc(str(v or ""))

def plain(v):
    return zh(v) if isinstance(v, list) else str(v or "")

def project_by_id(pid):
    return next((p for p in projects if p["id"] == pid), None)

def case_by_id(p, cid):
    return next((c for c in (p or {}).get("cases", []) if c["id"] == cid), None)

def work_by_id(c, wid):
    return next((w for w in (c or {}).get("works", []) if w["id"] == wid), None)

LEIHUO = project_by_id("leihuo-external-motion")
GAMEUI = project_by_id("game-ui-motion-studies")
AD = project_by_id("game-ad-films")
PROMO = project_by_id("game-promotion-films")
SOCIAL = project_by_id("game-social-videos")

# ---------- dynamic product / module extraction (real data) ----------
def track_products(p, limit=4):
    seen = []
    cases = (p or {}).get("cases", [])
    pid = (p or {}).get("id", "")
    # 广告视频：按网页展示顺序（projectSubFilters.ad）排列
    if pid == "game-ad-films" and AD_PRODUCT_ORDER:
        by_id = {c.get("id"): c for c in cases}
        ordered = [by_id[i] for i in AD_PRODUCT_ORDER if i in by_id]
        ordered += [c for c in cases if c.get("id") not in AD_PRODUCT_ORDER]
        cases = ordered
    for c in cases:
        nm = None
        if c.get("product"):
            nm = plain(c["product"])
        elif c.get("name"):
            nm = plain(c["name"])
        if nm and nm not in seen:
            seen.append(nm)
    shown = seen[:limit]
    more = len(seen) - len(shown)
    return shown, more

GAMEUI_MODULE_MAP = {"ae-previs": "AE", "ue5": "UE5", "unity": "UNITY"}

def track_modules(p, limit=4):
    seen = []
    for c in (p or {}).get("cases", []):
        m = GAMEUI_MODULE_MAP.get(c.get("id", ""), plain(c.get("name")))
        if m and m not in seen:
            seen.append(m)
    return seen[:limit]

# ---------- real workflow per track ----------
def track_workflow(p):
    secs = (p or {}).get("sections") or []
    flow = []
    for s in secs:
        if s.get("id") == "process" and s.get("flow"):
            flow = [plain(x) for x in s["flow"]]
            break
    if len(flow) >= 6:
        return flow[:6]
    role = [plain(x) for x in (p or {}).get("role", [])]
    if len(role) >= 6:
        return role[:6]
    return (role + flow)[:6]

# ---------- display names (site / user-confirmed titles) ----------
DISPLAY = {
    "hs-tournament":              ("武道大会", "Martial Arts Tournament"),
    "nsh-jiuzhou-mijing":         ("九州秘境", "Mystic Realm"),
    "ae-sci-fi-win":              ("科技风结算", "Sci-fi Victory Settlement"),
    "gongxi-gacha":               ("恭喜获得", "Gacha Reward"),
    "forgotten-sea-main":         ("遗忘之海", "Forgotten Sea"),
    "peak-speed-map-main":        ("巅峰极速", "Peak Speed"),
    "mhxy-tiandiqiju-xuanchuan":  ("梦幻西游 · 天地棋局宣传片", "World Chess Promo"),
    "yys-yinhun-liandong":        ("阴阳师手游 · 银魂联动", "Gintama Collaboration"),
    "poorest-official-main":      ("最惨官方", "Poorest Official"),
    "wolf-barged-in-main":        ("公司里突然闯进一只狼", "A Wolf Barged In"),
}

def disp(work_id):
    return DISPLAY.get(work_id, ("", ""))

# 游戏社媒视频发布平台矩阵（真实业务平台）
SOCIAL_PLATFORM = "抖音 · Bilibili · 快手 · 视频号"

# ============================================================ CSS ============
CSS = r"""
@page { size: 1920px 1080px; margin: 0; }
:root {
  --bg:#070b09; --panel:#0b100d; --elev:#101612; --panel-active:#151d18;
  --tx:#f2f3eb; --tx2:#b1b8b1; --tx3:#8f9891; --txdim:#6f7972;
  --lime:#b8ff3d; --purple:#7557ff; --orange:#ff6b3d; --blue:#5bc8ff; --pink:#e04b9a;
  --line:#2c352f; --line-soft:rgba(255,255,255,.07);
  --safe-x:80px; --safe-top:72px; --safe-bottom:80px;
  /* ---- typography tokens (single source of truth) ---- */
  --fs-page-title:68px; --fs-case-title:50px; --fs-card-title:30px; --fs-section-title:27px;
  --fs-body-lg:18px; --fs-body:17px; --fs-meta:14px; --fs-chip:13px; --fs-label:12px;
  /* ---- image tokens ---- */
  --overview-featured-img-w:320px; --overview-featured-img-h:180px;
  --case-hero-h:500px; --case-frame-h:150px; --more-thumb-h:182px;
  --font-title-cn:"Microsoft YaHei UI","Microsoft YaHei","PingFang SC","Noto Sans SC","Segoe UI",sans-serif;
  --font-display-en:"Barlow Condensed","Bahnschrift","Roboto Condensed","Arial Narrow","Impact","Segoe UI",sans-serif;
  --font-body:"Inter","Segoe UI","PingFang SC","Microsoft YaHei UI","Microsoft YaHei","Noto Sans SC",sans-serif;
  --font-mono:"IBM Plex Mono","JetBrains Mono","Cascadia Mono","Consolas","Courier New",monospace;
}
* { box-sizing:border-box; margin:0; padding:0; }
html,body { background:#04060a; }
.page {
  width:1920px; height:1080px; position:relative; overflow:hidden;
  background:var(--bg); color:var(--tx);
  font-family:var(--font-body);
  page-break-after:always; break-after:page;
}
.page:last-child { page-break-after:auto; break-after:auto; }

/* ---------- page chrome ---------- */
.bg-grid { position:absolute; inset:0; z-index:0; pointer-events:none;
  background-image:linear-gradient(rgba(255,255,255,.035) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255,255,255,.035) 1px, transparent 1px);
  background-size:44px 44px; }
.bg-noise { position:absolute; inset:0; z-index:0; pointer-events:none; opacity:.04;
  background-image:url("assets-optimized/noise.png");
  background-repeat:repeat; background-size:128px 128px; }
/* ---------- per page-type background motif (website Neo-Pixel system sync, very weak) ---------- */
.ptype { position:absolute; z-index:0; pointer-events:none; }
.ptype.lv1 { left:88px; bottom:64px; width:200px; height:104px; opacity:.05;
  background-image:linear-gradient(var(--lime),var(--lime)),linear-gradient(var(--lime),var(--lime)),linear-gradient(var(--lime),var(--lime)),linear-gradient(var(--lime),var(--lime)),linear-gradient(var(--lime),var(--lime));
  background-repeat:no-repeat;
  background-size:28px 8px,56px 8px,84px 8px,112px 8px,140px 8px;
  background-position:0 0,0 24px,0 48px,0 72px,0 96px; }
.ptype.case { left:96px; bottom:60px; width:360px; height:52px; opacity:.03;
  background-image:linear-gradient(90deg, var(--blue) 0 5px, transparent 5px 22px),linear-gradient(90deg, var(--blue) 0 4px, transparent 4px 18px),linear-gradient(90deg, var(--blue) 0 5px, transparent 5px 26px);
  background-size:22px 1px,18px 1px,26px 1px; background-repeat:repeat-x;
  background-position:0 0,4px 20px,2px 40px; }
.ptype.idx { left:88px; top:250px; right:88px; height:36px; opacity:.04;
  background-image:linear-gradient(90deg, var(--purple) 0 4px, transparent 4px 20px),linear-gradient(90deg, var(--orange) 0 3px, transparent 3px 16px),linear-gradient(90deg, var(--blue) 0 4px, transparent 4px 22px);
  background-size:20px 1px,16px 1px,22px 1px; background-repeat:repeat-x;
  background-position:0 0,5px 16px,2px 32px; }
.ptype.skills { left:88px; bottom:56px; width:190px; height:92px; opacity:.05;
  background-image:linear-gradient(var(--purple),var(--purple)),linear-gradient(var(--purple),var(--purple)),linear-gradient(var(--purple),var(--purple)),linear-gradient(90deg,var(--purple) 0 34px,transparent 34px 90px),linear-gradient(90deg,var(--purple) 0 30px,transparent 30px 90px);
  background-repeat:no-repeat; background-size:6px 6px,6px 6px,6px 6px,90px 1px,90px 1px;
  background-position:0 0,62px 44px,126px 82px,8px 22px,66px 64px; }
.ptype.contact { right:96px; top:170px; width:240px; height:150px; opacity:.05;
  border:1px solid rgba(184,255,61,.07); }
.ptype.contact::before { content:''; position:absolute; inset:12px; border:1px solid rgba(255,255,255,.05); }
.ptype.contact::after { content:'CONTACT CHANNEL / SYSTEM READY'; position:absolute; left:0; top:-15px;
  font-family:var(--font-mono); font-size:9px; letter-spacing:.22em; color:rgba(255,255,255,.28); }
.ghost { position:absolute; z-index:0; right:40px; bottom:-60px; pointer-events:none;
  font-family:var(--font-display-en); font-weight:800; font-size:620px; line-height:1;
  letter-spacing:-.04em; color:rgba(255,255,255,.026); user-select:none;
  -webkit-text-stroke:1px rgba(255,255,255,.05); }
.ghost.tiny { font-size:280px; right:70px; bottom:-20px; color:rgba(255,255,255,.035); }
.track-line { position:absolute; z-index:0; height:2px; left:80px; right:80px;
  background-image:linear-gradient(to right, rgba(255,255,255,.14) 0 8px, transparent 8px 18px);
  background-size:18px 100%; background-repeat:repeat-x; opacity:.45; pointer-events:none; }
.track-line.t1 { top:150px; }
.track-pulse { position:absolute; top:-1px; width:8px; height:4px; background:var(--lime); opacity:.7; }

/* ---------- top-right brand (single HUD line; left [ TAG ] removed) ---------- */
.sysbar { position:absolute; top:36px; left:var(--safe-x); right:var(--safe-x); z-index:5;
  display:flex; justify-content:flex-end; align-items:center; }
.sysbar .r { font-family:var(--font-mono); font-size:var(--fs-label); letter-spacing:.28em; color:var(--txdim); text-transform:uppercase; }
.sysbar .r .dot { display:inline-block; width:7px; height:7px; background:var(--lime); margin-right:10px; }

/* ---------- page head: blue EN auxiliary + CN main (single set, unified Y) ---------- */
.phead { position:relative; z-index:3; padding:44px var(--safe-x) 0 var(--safe-x); }
.phead .en-sub { font-family:var(--font-display-en); font-weight:600; font-size:17px; letter-spacing:.34em;
  color:var(--blue); text-transform:uppercase; }
.phead .en-sub .sq { color:var(--lime); margin-right:12px; }
.phead h1 { font-family:var(--font-title-cn); font-weight:800; font-size:var(--fs-page-title); line-height:1.08;
  letter-spacing:.02em; margin-top:6px; color:var(--tx); }
.phead h1 .hl { color:var(--lime); }
.phead h1 .hl.p { color:var(--purple); }
.phead h1 .hl.o { color:var(--orange); }
.phead .rule { height:1px; background:linear-gradient(90deg, var(--lime) 0 110px, var(--line) 110px 100%); margin-top:10px; }
.phead .rule.p { background:linear-gradient(90deg, var(--purple) 0 110px, var(--line) 110px 100%); }
.phead .rule.o { background:linear-gradient(90deg, var(--orange) 0 110px, var(--line) 110px 100%); }
.phead .rule.b { background:linear-gradient(90deg, var(--blue) 0 110px, var(--line) 110px 100%); }

/* ---------- footer ---------- */
.pfoot { position:absolute; left:var(--safe-x); right:var(--safe-x); bottom:24px; z-index:5;
  display:flex; justify-content:space-between; align-items:flex-end; }
.pfoot .pgidx { font-family:var(--font-mono); font-size:var(--fs-label); letter-spacing:.3em; color:var(--txdim); }
.pfoot .pgidx b { color:var(--lime); font-weight:600; }
.pfoot .pgname { font-family:var(--font-mono); font-size:11px; letter-spacing:.26em; color:var(--tx3); text-transform:uppercase; }

/* ---------- chips ---------- */
.chip { display:inline-block; font-family:var(--font-mono); font-size:var(--fs-chip); letter-spacing:.1em;
  color:var(--tx2); border:1px solid var(--line); padding:5px 11px; margin:2px 6px 2px 0; }
.chip.on { color:#06100a; background:var(--lime); border-color:var(--lime); font-weight:700; }
.chip.p { color:var(--purple); border-color:rgba(117,87,255,.55); }
.chip.o { color:var(--orange); border-color:rgba(255,107,61,.55); }
.chip.b { color:var(--blue); border-color:rgba(91,200,255,.55); }

/* ---------- corner marks ---------- */
.corner { position:absolute; width:30px; height:30px; z-index:6; pointer-events:none; }
.corner.c-tl { top:18px; left:18px; border-top:2px solid var(--line); border-left:2px solid var(--line); }
.corner.c-tr { top:18px; right:18px; border-top:2px solid var(--line); border-right:2px solid var(--line); }
.corner.c-bl { bottom:18px; left:18px; border-bottom:2px solid var(--line); border-left:2px solid var(--line); }
.corner.c-br { bottom:18px; right:18px; border-bottom:2px solid var(--line); border-right:2px solid var(--line); }

/* ---------- panels ---------- */
.panel { position:relative; background:var(--panel); border:1px solid var(--line-soft);
  clip-path:polygon(0 0, calc(100% - 12px) 0, 100% 12px, 100% calc(100% - 12px), calc(100% - 12px) 100%, 12px 100%, 0 calc(100% - 12px), 0 0); }
.panel .panel-tag { position:absolute; top:12px; left:18px; z-index:2;
  font-family:var(--font-mono); font-size:var(--fs-label); letter-spacing:.24em; color:var(--lime); text-transform:uppercase; }
.panel .panel-tag.p { color:var(--purple); }
.panel .panel-tag.o { color:var(--orange); }
.panel .panel-tag.b { color:var(--blue); }
.en { color:var(--tx2); font-size:.82em; letter-spacing:.02em; font-family:var(--font-body); }
.mono { font-family:var(--font-mono); }
ul.list { list-style:none; }
ul.list li { position:relative; padding-left:18px; margin:7px 0; font-size:var(--fs-body); line-height:1.5; color:var(--tx); }
ul.list li::before { content:'\25B8'; position:absolute; left:0; color:var(--lime); }

/* ================= COVER (unchanged system, single HUD) ================= */
.cover-hud { position:absolute; left:var(--safe-x); right:var(--safe-x); top:40px; z-index:5; display:flex; justify-content:space-between; align-items:center; }
.cover-hud .l { font-family:var(--font-mono); font-size:13px; letter-spacing:.3em; color:var(--tx3); }
.cover-hud .l b { color:var(--lime); }
.cover-hud .r { font-family:var(--font-mono); font-size:var(--fs-label); letter-spacing:.3em; color:var(--txdim); }
.cover-title { position:relative; z-index:3; padding:150px var(--safe-x) 0 var(--safe-x); }
.cover-kicker { font-family:var(--font-display-en); font-size:22px; letter-spacing:.42em; color:var(--lime); text-transform:uppercase; }
.cover-h1-cn { font-family:var(--font-title-cn); font-weight:800; font-size:148px; line-height:1.04;
  letter-spacing:.04em; color:var(--tx); margin-top:14px; }
.cover-h1-cn .c2 { color:var(--lime); }
.cover-h1-en { font-family:var(--font-display-en); font-weight:600; font-size:30px; letter-spacing:.4em;
  color:var(--blue); text-transform:uppercase; margin-top:20px; }
.cover-name { margin-top:28px; font-size:26px; letter-spacing:.3em; color:var(--tx2); }
.cover-name b { color:var(--tx); font-weight:700; }
.cover-meta { position:relative; z-index:3; margin:44px var(--safe-x) 0 var(--safe-x); display:flex; gap:60px; }
.cover-meta .m { border-left:2px solid var(--line); padding-left:16px; }
.cover-meta .m .k { font-family:var(--font-mono); font-size:10px; letter-spacing:.3em; color:var(--txdim); text-transform:uppercase; }
.cover-meta .m .v { font-size:19px; color:var(--tx); margin-top:6px; letter-spacing:.04em; }
.cover-meta .m .v b { color:var(--lime); }
.cover-disciplines { position:relative; z-index:3; margin:26px var(--safe-x) 0 var(--safe-x); display:flex; gap:12px; }
.cover-disciplines span { font-family:var(--font-mono); font-size:var(--fs-label); letter-spacing:.26em; color:var(--tx2);
  border:1px solid var(--line); padding:8px 16px; }
.cover-right { position:absolute; right:120px; top:120px; bottom:120px; width:300px; z-index:1;
  display:flex; flex-direction:column; justify-content:space-between; align-items:center;
  border-left:1px solid rgba(255,255,255,.05); pointer-events:none; }
.cover-right .cr-word { font-family:var(--font-display-en); font-weight:800; font-size:88px; line-height:.9;
  color:rgba(255,255,255,.035); text-align:center; letter-spacing:-.02em; text-transform:uppercase;
  -webkit-text-stroke:1px rgba(255,255,255,.04); }
.cover-right .cr-ticks { display:flex; flex-direction:column; gap:12px; }
.cover-right .cr-ticks i { display:block; width:46px; height:1px; background:rgba(255,255,255,.07); }
.cover-right .cr-data { font-family:var(--font-mono); font-size:10px; letter-spacing:.34em;
  color:rgba(255,255,255,.05); text-transform:uppercase; writing-mode:vertical-rl; }
.cover-qr { position:absolute; right:var(--safe-x); bottom:40px; z-index:6; text-align:center; }
.cover-qr img { width:96px; height:96px; image-rendering:pixelated; background:#fff; padding:6px;
  box-shadow:4px 4px 0 rgba(0,0,0,.6); }
.cover-qr .cap { font-family:var(--font-mono); font-size:9px; letter-spacing:.12em; color:var(--tx3); margin-top:8px; }

/* ================= EXPERIENCE (2x2, enlarged inner typography) ================= */
.exp-grid { position:relative; z-index:3; display:grid; grid-template-columns:1fr 1fr;
  gap:30px 32px; padding:0 var(--safe-x); margin-top:30px; height:760px; align-content:start; }
.exp-card { padding:44px 32px 26px; display:flex; flex-direction:column; }
.exp-card .top { display:flex; justify-content:space-between; align-items:center; }
.exp-card .period { font-family:var(--font-mono); font-size:15px; letter-spacing:.16em; color:var(--blue); }
.exp-card .org { font-family:var(--font-title-cn); font-weight:700; font-size:32px; margin-top:14px;
  letter-spacing:.02em; min-height:66px; line-height:1.25; }
.exp-card .org .en2 { display:block; font-size:12px; color:var(--tx3); letter-spacing:.16em;
  font-family:var(--font-mono); margin-top:6px; font-weight:400; }
.exp-card .role { font-size:20px; color:var(--lime); margin-top:8px; letter-spacing:.02em; }
.exp-card .duties { margin-top:14px; }
.exp-card .duties li { font-size:17px; line-height:1.55; margin:5px 0; }
.exp-card .kw { margin-top:12px; }
.exp-card .kw .chip { font-size:13px; padding:5px 11px; }

/* ================= PROJECT INDEX (grid locked; Stats Footer fixed) ================= */
.idx-grid { position:relative; z-index:3; display:grid; grid-template-columns:repeat(5,1fr);
  gap:20px; padding:0 var(--safe-x); margin-top:30px; height:770px; }
.idx-card { padding:44px 22px 22px; display:grid;
  grid-template-rows:auto auto auto auto 62px 1fr 160px; }
.idx-card::before { content:''; position:absolute; top:0; left:16px; right:16px; height:2px; background:var(--lime); }
.idx-card:nth-child(2)::before { background:var(--purple); }
.idx-card:nth-child(3)::before { background:var(--orange); }
.idx-card:nth-child(4)::before { background:var(--blue); }
.idx-card:nth-child(5)::before { background:var(--pink); }
.idx-card .no { font-family:var(--font-display-en); font-weight:700; font-size:64px; line-height:1; color:var(--lime); }
.idx-card:nth-child(2) .no { color:var(--purple); }
.idx-card:nth-child(3) .no { color:var(--orange); }
.idx-card:nth-child(4) .no { color:var(--blue); }
.idx-card:nth-child(5) .no { color:var(--pink); }
.idx-card .t { font-family:var(--font-title-cn); font-weight:700; font-size:29px; margin-top:14px; line-height:1.15; }
.idx-card .t2 { font-family:var(--font-mono); font-size:12px; letter-spacing:.16em; color:var(--tx3); margin-top:6px; text-transform:uppercase; }
.idx-card .d { font-size:var(--fs-body); color:var(--tx2); line-height:1.7; margin-top:14px; }
.idx-card .cats { margin-top:14px; }
.idx-card .cats .chip { font-size:var(--fs-chip); padding:5px 11px; }
/* fixed stats footer region — same divider Y on all five cards */
.idx-card .foot { grid-row:7; padding-top:14px; border-top:1px solid var(--line); }
.idx-card .foot .fr { display:flex; gap:10px; margin:6px 0; align-items:baseline; }
.idx-card .foot .fr .k { font-family:var(--font-mono); font-size:var(--fs-meta); letter-spacing:.14em; color:var(--tx3); width:92px; flex:none; }
.idx-card .foot .fr .v { font-size:15px; color:var(--tx2); line-height:1.5; }
.idx-card .foot .fr .v b { color:var(--lime); font-weight:700; font-size:16px; }
.idx-card .foot .fr .v .more { color:var(--tx3); }

/* ================= LEVEL-01 / TRACK OVERVIEW (ONE template) ================= */
.ov-grid { position:relative; z-index:3; padding:0 var(--safe-x); margin-top:26px; }
.ov-metrics { display:grid; grid-template-columns:repeat(4,1fr); gap:16px; height:118px; }
.ov-metric { position:relative; padding:16px 12px; text-align:center; background:var(--panel); border:1px solid var(--line-soft);
  display:flex; flex-direction:column; justify-content:center;
  clip-path:polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 0 100%, 0 0); }
.ov-metric .stat { position:absolute; top:7px; left:10px; font-family:var(--font-mono); font-size:9px;
  letter-spacing:.18em; color:rgba(255,255,255,.3); }
.ov-metric .v { font-family:var(--font-display-en); font-weight:700; font-size:46px; color:var(--lime);
  line-height:1; font-variant-numeric:tabular-nums; }
.ov-metric .zc { font-size:17px; color:var(--tx); margin-top:5px; letter-spacing:.02em; }
.ov-metric .l { font-family:var(--font-mono); font-size:9.5px; letter-spacing:.2em; color:var(--tx3); margin-top:2px; text-transform:uppercase; }
.ov-main { display:grid; grid-template-columns:32fr 68fr; gap:32px; margin-top:30px; height:620px; }
/* workflow — STRICT VERTICAL STEPPER */
.ov-workflow { padding:44px 26px 22px; display:flex; flex-direction:column; }
.ov-workflow .wf-title { font-family:var(--font-title-cn); font-weight:700; font-size:var(--fs-section-title); margin-bottom:22px; }
.ov-workflow .wf-title .en { font-size:12px; letter-spacing:.22em; margin-left:8px; color:var(--blue); }
.ov-wf-grid { display:flex; flex-direction:column; flex:1; }
.wf-step { flex:1; display:flex; gap:16px; align-items:stretch; min-height:0; }
.wf-rail { display:flex; flex-direction:column; align-items:center; width:58px; flex:none; }
.wf-no { font-family:var(--font-display-en); font-weight:700; font-size:15px; color:var(--lime); line-height:1; }
.wf-dot { width:8px; height:8px; background:var(--lime); margin-top:7px; flex:none;
  box-shadow:0 0 0 3px rgba(184,255,61,.14); }
.wf-line { flex:1; width:2px; min-height:12px; margin-top:3px;
  background:linear-gradient(rgba(184,255,61,.4), rgba(255,255,255,.07)); }
.wf-step:last-child .wf-line { display:none; }
.wf-txt { font-size:20px; font-weight:600; color:var(--tx); align-self:flex-start; letter-spacing:.02em; }
/* featured 68% */
.ov-featured { display:flex; flex-direction:column; gap:22px; }
.ov-featured .ft-title { font-family:var(--font-title-cn); font-weight:700; font-size:var(--fs-section-title);
  display:flex; align-items:baseline; }
.ov-featured .ft-title .en { font-size:12px; letter-spacing:.22em; margin-left:8px; color:var(--blue); }
.ov-featured .ft-title .plat { margin-left:auto; font-family:var(--font-mono); font-size:12px; letter-spacing:.12em; color:var(--tx2); }
.ov-featured .ft-title .plat em { font-style:normal; color:var(--lime); }
.ov-feat { padding:20px 24px; display:flex; gap:26px; align-items:center; flex:1; }
.ov-feat .panel-tag { font-size:13px; }
.ov-feat .fc { flex:none; }
.ov-feat .fc .fno { font-family:var(--font-display-en); font-weight:700; font-size:44px; color:var(--lime); line-height:1; }
.ov-feat:nth-child(2) .fc .fno { color:var(--purple); }
.ov-feat img { width:var(--overview-featured-img-w); height:var(--overview-featured-img-h);
  object-fit:contain; flex:none; border:1px solid var(--line); background:#050806; }
.ov-feat .fi { flex:1; min-width:0; }
.ov-feat .fn { font-size:28px; font-weight:700; letter-spacing:.03em; }
.ov-feat .fn .en { display:block; font-size:13px; letter-spacing:.16em; margin-left:0; margin-top:4px;
  font-weight:400; color:var(--tx3); text-transform:uppercase; }
.ov-feat .fm { font-family:var(--font-mono); font-size:15px; letter-spacing:.1em; color:var(--tx3); margin-top:6px; }
.ov-feat .fd { font-size:16px; color:var(--tx2); margin-top:8px; line-height:1.7; }
.ov-feat .fk { margin-top:10px; }
.ov-feat .fk .chip { font-size:var(--fs-chip); padding:4px 10px; }

/* ================= CASE DETAIL (ONE template, no delivery) ================= */
.case-grid { position:relative; z-index:3; display:grid; grid-template-columns:60fr 40fr;
  gap:44px; padding:0 var(--safe-x); margin-top:20px; height:806px; }
/* hero frame: corner brackets + frame code overlay */
.case-media .bigwrap { position:relative; }
.case-media .bigwrap .big { width:100%; display:block; border:1px solid var(--line);
  box-shadow:4px 4px 0 rgba(0,0,0,.45); height:var(--case-hero-h); object-fit:contain; background:#050806; }
.case-media .bigwrap .cb { position:absolute; width:14px; height:14px; border:1.5px solid rgba(184,255,61,.55); }
.case-media .bigwrap .cb.tl { top:6px; left:6px; border-right:none; border-bottom:none; }
.case-media .bigwrap .cb.br { bottom:6px; right:6px; border-left:none; border-top:none; }
.case-media .bigwrap .fcode { position:absolute; right:10px; bottom:8px; font-family:var(--font-mono); font-size:9px;
  letter-spacing:.22em; color:rgba(255,255,255,.4); background:rgba(7,11,9,.55); padding:3px 8px; }
.case-media .big.portrait { position:relative; overflow:hidden; }
.case-media .big.portrait .pv-bg { position:absolute; inset:-40px; width:calc(100% + 80px); height:calc(100% + 80px);
  object-fit:cover; }  /* blur 已预烘焙到 assets-optimized/portrait/*_bg.jpg（v8 性能优化） */
.case-media .big.portrait .pv-dim { position:absolute; inset:0;
  background:linear-gradient(90deg, rgba(7,11,9,.72), transparent 26%, transparent 74%, rgba(7,11,9,.72)); }
.case-media .big.portrait .pv-fg { position:relative; display:block; margin:0 auto; height:100%; width:auto;
  max-width:100%; object-fit:contain; }
.frame3 { display:grid; grid-template-columns:repeat(3,1fr); gap:12px; margin-top:14px; position:relative; }
.frame3::before { content:''; position:absolute; left:8px; right:8px; top:-9px; height:1px;
  background:linear-gradient(90deg, rgba(184,255,61,.28), rgba(184,255,61,.06) 45%, rgba(255,255,255,.05)); }
.frame3 .f { position:relative; }
.frame3 .f img { width:100%; display:block; border:1px solid var(--line); height:var(--case-frame-h);
  object-fit:contain; background:#050806; }
.frame3 .f .ftag { position:absolute; top:6px; left:6px; font-family:var(--font-mono); font-size:9px;
  letter-spacing:.12em; color:#06100a; background:var(--lime); padding:2px 6px; font-weight:700; }
.frame3 .f:nth-child(2) .ftag { background:var(--purple); color:#fff; }
.frame3 .f:nth-child(3) .ftag { background:var(--orange); color:#fff; }
.frame3 .f .fcap { font-family:var(--font-mono); font-size:9px; letter-spacing:.16em; color:var(--txdim); margin-top:4px; text-transform:uppercase; }
/* right info column */
.case-info { display:flex; flex-direction:column; }
.case-info .case-prod { font-family:var(--font-mono); font-size:14px; letter-spacing:.18em; color:var(--purple); text-transform:uppercase; }
.case-info .case-prod.b { color:var(--blue); }
.case-info .case-prod.o { color:var(--orange); }
.case-info .case-name { font-family:var(--font-title-cn); font-weight:800; font-size:var(--fs-case-title); margin-top:8px; line-height:1.05; }
.case-info .case-name .en2 { display:block; font-family:var(--font-display-en); font-size:17px; font-weight:400;
  letter-spacing:.16em; color:var(--tx3); margin-top:5px; text-transform:uppercase; }
.case-info .meta-row { margin-top:8px; }
.case-info .meta-row .chip { font-size:var(--fs-chip); padding:5px 11px; }
/* section labels — CN first, 21px, with small system number */
.case-sec { margin-top:30px; }
.case-sec.first { margin-top:12px; }
.case-sec.mywork { margin-top:36px; flex:1; display:flex; flex-direction:column; min-height:0; }
.case-sec .bt { font-family:var(--font-title-cn); font-weight:700; font-size:21px; letter-spacing:.03em;
  color:var(--lime); margin-bottom:8px; }
.case-sec .bt .sno { font-family:var(--font-mono); font-size:11px; color:var(--txdim); margin-right:9px; letter-spacing:.1em; }
.case-sec .bt .en { font-family:var(--font-mono); color:var(--tx3); margin-left:10px; font-size:10px; letter-spacing:.2em; text-transform:uppercase; }
.case-sec .bt.p { color:var(--purple); }
.case-sec .bt.o { color:var(--orange); }
.case-sec .bt.b { color:var(--blue); }
/* 2x2 meta (cut corner, roomier) */
.case-meta { display:grid; grid-template-columns:1fr 1fr; gap:12px; }
.case-meta .cm { border:1px solid var(--line); padding:8px 14px; background:var(--bg);
  clip-path:polygon(0 0, calc(100% - 6px) 0, 100% 6px, 100% 100%, 0 100%, 0 0); }
.case-meta .cm .k { font-size:13px; color:var(--tx); letter-spacing:.02em; }
.case-meta .cm .k span { font-family:var(--font-mono); font-size:10px; letter-spacing:.16em; color:var(--tx3); margin-left:6px; text-transform:uppercase; }
.case-meta .cm .v { font-size:17px; color:var(--tx); margin-top:4px; line-height:1.4; }
/* desc */
.case-desc { font-size:var(--fs-body-lg); color:var(--tx2); line-height:1.7; }
/* mywork — Focus 并入后的编号条目（03），纵向填充分配右侧空间 */
.mywork-list { flex:1; display:flex; flex-direction:column; justify-content:space-evenly; min-height:0; }
.mywork-list .mw { display:flex; gap:12px; align-items:baseline; }
.mywork-list .mw .no { font-family:var(--font-mono); color:var(--lime); font-size:14px; flex:none; width:26px; }
.mywork-list .mw .txt { font-size:17px; line-height:1.7; color:var(--tx); }
/* QR view online */
.case-view { display:flex; align-items:center; gap:18px; margin-top:32px; }
.case-view img { width:76px; height:76px; image-rendering:pixelated; background:#fff; padding:4px;
  box-shadow:2px 2px 0 rgba(0,0,0,.5); }
.case-view .vv { font-size:15px; color:var(--tx2); line-height:1.5; }
.case-view .vv b { color:var(--lime); font-weight:600; }

/* ================= MORE WORKS (card grid unchanged, media/text enlarged) ================= */
.more-grid { position:relative; z-index:3; padding:0 var(--safe-x); margin-top:18px; }
.thumb-group-title { font-family:var(--font-title-cn); font-weight:700; font-size:21px; color:var(--lime); margin:4px 0 8px; }
.thumb-group-title .en { font-family:var(--font-mono); font-size:11px; letter-spacing:.22em; color:var(--tx3); margin-left:10px; text-transform:uppercase; }
.thumb-grid { display:grid; grid-template-columns:repeat(4,1fr); gap:14px; }
.thumb { border:1px solid var(--line-soft); background:var(--panel); overflow:hidden; }
.thumb-media { width:100%; height:var(--more-thumb-h); display:flex; align-items:center; justify-content:center;
  background:#050806; overflow:hidden; border-bottom:1px solid var(--line); }
.thumb-media img { display:block; width:100%; height:100%; object-fit:contain; }
.thumb .n { font-size:18px; font-weight:600; padding:8px 12px; color:var(--tx); line-height:1.3; }

/* ================= SKILLS (3x2 enlarged; Toolset full-width; Learning removed) ================= */
.skill-grid { position:relative; z-index:3; display:grid; grid-template-columns:repeat(3,1fr);
  gap:28px 26px; padding:0 var(--safe-x); margin-top:26px; height:620px; }
.skill-card { padding:44px 28px 26px; }
.skill-card .sc-cn { font-family:var(--font-title-cn); font-weight:700; font-size:32px; }
.skill-card .sc-en { font-family:var(--font-display-en); font-size:12px; letter-spacing:.24em; color:var(--blue); text-transform:uppercase; margin-top:6px; }
.skill-card .st { font-family:var(--font-mono); font-size:14px; letter-spacing:.1em; color:var(--tx3); margin-top:12px; line-height:1.6; }
.skill-card .st b { color:var(--lime); font-weight:600; }
.skill-card .st .sdot { display:inline-block; width:8px; height:8px; background:var(--lime); margin-right:7px; }
.skill-card .st.PRACTICE b { color:var(--orange); }
.skill-card .st.PRACTICE .sdot { background:var(--orange); }
.skill-card .sn { margin-top:14px; display:flex; flex-wrap:wrap; gap:8px 8px; line-height:1.6; }
.skill-card .sn .chip { font-size:14.5px; padding:6px 11px; margin:0; }
.skills-bottom { position:relative; z-index:3; padding:0 var(--safe-x); margin-top:16px; }
.sb-mod { padding:34px 24px 18px; }
.sb-mod .sb-title { font-family:var(--font-title-cn); font-weight:700; font-size:29px; margin-bottom:12px; }
.sb-mod .sb-title .en { font-size:12px; letter-spacing:.22em; margin-left:8px; color:var(--blue); }
.tool-row { display:flex; gap:12px; flex-wrap:wrap; }
.tool { font-family:var(--font-mono); font-size:14px; letter-spacing:.06em; color:var(--tx);
  border:1px solid var(--line); padding:9px 16px; background:var(--bg); }
.tool .tname { margin-right:8px; }
.tool .tst { font-style:normal; font-size:12px; letter-spacing:.1em; padding:2px 7px; border:1px solid currentColor; }
.tool .tst.PROFICIENT { color:var(--purple); }
.tool .tst.WORKING { color:var(--blue); }
.tool .tst.PRACTICE { color:var(--orange); }
.tool .tst.LEARNING { color:var(--lime); }

/* ================= CONTACT (STATUS & BASE removed; redistributed) ================= */
.contact-wrap { position:relative; z-index:3; display:grid; grid-template-columns:1.45fr 1fr;
  gap:60px; padding:40px var(--safe-x) 0 var(--safe-x); height:780px; }
.contact-wrap > div:first-child { display:flex; flex-direction:column; justify-content:center; }
.contact-big { font-family:var(--font-title-cn); font-weight:800; font-size:80px; line-height:1.08; letter-spacing:.02em; }
.contact-big .acc { color:var(--lime); }
.contact-sub { font-size:19px; color:var(--tx2); margin-top:30px; }
.contact-list { margin-top:44px; }
.contact-item { display:flex; gap:18px; border-bottom:1px solid var(--line); padding:24px 0; align-items:center; }
.contact-item .k { font-family:var(--font-mono); font-size:13px; letter-spacing:.18em; color:var(--tx3); width:180px; flex:none; }
.contact-item .v { font-size:20px; letter-spacing:.04em; }
.contact-qr { text-align:center; padding:40px 24px 24px; display:flex; flex-direction:column; justify-content:center; align-items:center; }
.contact-qr img { width:210px; height:210px; image-rendering:pixelated; background:#fff; padding:10px;
  box-shadow:6px 6px 0 rgba(0,0,0,.6); }
.contact-qr .cap { font-family:var(--font-mono); font-size:11px; letter-spacing:.18em; color:var(--tx3); margin-top:16px; }
.contact-qr .cap b { color:var(--lime); font-weight:600; }
.contact-qr .site { font-family:var(--font-mono); font-size:11px; letter-spacing:.12em; color:var(--tx3); margin-top:12px; }

/* ================= PRINT / PDF 渲染优化（v8） ================= */
@media print {
  *, *::before, *::after { animation:none !important; transition:none !important; }
}
"""

# ============================================================ helpers =======
TOTAL_PAGES = 21

def page(inner, pgname, idx, ghost_class="tiny", no_sysbar=False, ptype=""):
    brand = "" if no_sysbar else """
    <div class="sysbar"><div class="r"><span class="dot"></span>JAZIM&middot;LAU &nbsp;/&nbsp; 2027</div></div>"""
    ptype_html = f'<i class="ptype {ptype}"></i>' if ptype else ""
    return f"""
  <section class="page">
    <div class="bg-grid"></div><div class="bg-noise"></div>
    <div class="ghost {ghost_class}">{idx:02d}</div>
    <div class="track-line t1"><i class="track-pulse"></i></div>
    {ptype_html}
    <i class="corner c-tl"></i><i class="corner c-tr"></i><i class="corner c-bl"></i><i class="corner c-br"></i>
    {brand}
    {inner}
    <div class="pfoot">
      <div class="pgidx"><b>{idx:02d}</b> / {TOTAL_PAGES:02d}</div>
      <div class="pgname">{esc(pgname)}</div>
    </div>
  </section>
"""

def page_head(en_label, zh_title, rule=""):
    r = f'<div class="phead"><div class="en-sub"><span class="sq">&#9632;</span>{esc(en_label)}</div>'
    r += f'<h1>{zh_title}</h1>'
    r += f'<div class="rule {rule}"></div></div>'
    return r

def chips(tags, cls="chip", limit=6):
    return "".join(f'<span class="chip {cls}">{esc(plain(t))}</span>' for t in (tags or [])[:limit])

def frame3(name):
    out = '<div class="frame3">'
    for i, (suf, lab) in enumerate(zip(("s", "m", "e"), ("START", "MID", "END"))):
        out += f"""
      <div class="f"><img src="assets-optimized/frames/{name}_{suf}.jpg" alt="{lab}">
        <span class="ftag">{lab}</span><div class="fcap">FRAME {i+1:02d} / {suf.upper()}</div></div>"""
    out += '</div>'
    return out

def metric_cells(metrics):
    out = ""
    for i, (v, zc, ec) in enumerate((metrics or [])[:4], 1):
        out += (f'<div class="ov-metric"><span class="stat">STAT {i:02d}</span>'
                f'<div class="v">{esc(v)}</div>'
                f'<div class="zc">{esc(zc)}</div><div class="l">{esc(ec)}</div></div>')
    return out

def workflow_nodes(p):
    """Strict vertical stepper 01-06."""
    steps = track_workflow(p)
    out = ""
    for i, t in enumerate(steps[:6], 1):
        out += f"""
  <div class="wf-step">
    <div class="wf-rail"><span class="wf-no">{i:02d}</span><i class="wf-dot"></i><i class="wf-line"></i></div>
    <div class="wf-txt">{esc(t)}</div>
  </div>"""
    return out

def meta_line(case):
    prod = plain(case.get("product"))
    name = plain(case.get("name"))
    meta = plain(case.get("meta"))
    left = prod or name
    parts = [x for x in (left, meta) if x]
    return " · ".join(parts)

def case_desc(case, work):
    if (work or {}).get("description"):
        return cn((work or {}).get("description"))
    return cn(case.get("description"))

# ---------- Focus 已并入 My Work：基于真实 Case Data 提炼的具体职责条目 ----------
MY_WORK = {
    "hs-tournament": ["任务刷新与升级状态反馈动效", "抽奖演出与稀有度发光反馈设计",
                      "奖励演出的节奏与获得情绪设计", "动效方案、制作与端内还原跟进"],
    "nsh-jiuzhou-mijing": ["KV 主视觉氛围动态建立", "核心卖点的节奏引导",
                           "UI 交互反馈动效", "PC / 移动端双端适配"],
    "ae-sci-fi-win": ["结算数据层级与阅读顺序编排", "光效与节奏营造胜利完成感",
                      "结算时长控制与节奏编排", "动效预演及参数说明输出"],
    "gongxi-gacha": ["预备—爆发—余韵的获得反馈节奏", "光效与粒子突出稀有度层级",
                     "演出时长控制，高频抽卡不疲劳", "动效预演与参数说明输出"],
    "mhxy-tiandiqiju-xuanchuan": ["活动视觉的动态化呈现", "活泼节奏的动态包装", "剪辑与节奏编排"],
    "yys-yinhun-liandong": ["氛围感动态包装", "字幕与信息层的动态设计", "日式和风风格的动效呈现"],
    "forgotten-sea-main": ["版本节点宣发视频制作", "卖点信息组织与节奏编排", "动态包装与视觉呈现"],
    "peak-speed-map-main": ["版本节点宣发视频制作", "卖点信息组织与节奏编排", "动态包装与视觉呈现"],
    "poorest-official-main": ["创意策划：官号自嘲人设与梗", "快速剪辑与节奏编排", "动态包装与内容呈现"],
    "wolf-barged-in-main": ["创意策划：反差剧情内容", "快速剪辑：闯入感镜头节奏", "动态包装与音效配合"],
}

def mywork_items(case, work):
    """My Work = 原 Focus 有效内容并入后的编号条目（3-5 条，仅用真实 Case Data）。"""
    wid = (work or {}).get("id", "")
    if wid in MY_WORK:
        return MY_WORK[wid][:5]
    # fallback（未收录案例）：从 responsibility / role 提炼，避免信息丢失
    d = (work or {}).get("detail") or {}
    items = [plain(r) for r in (case.get("responsibility") or [])]
    for rp in [x.strip() for x in plain(case.get("role")).split("/") if x.strip()]:
        if rp not in items and len(items) < 5:
            items.append(rp)
    if d.get("role") and len(items) < 5:
        items.append(plain(d["role"]))
    return items[:5]

# ---------- Case Detail (ONE unified template: 01 META / 02 OVERVIEW / 03 MY WORK / QR) ----------
def case_detail(case, work, hero, frame_name, accent, portrait=False, qr_src="", qr_cap="", platform=""):
    d = (work or {}).get("detail") or {}
    title_zh, title_en = disp((work or {}).get("id", ""))
    if not title_zh:
        title_zh = plain((work or {}).get("name") or case.get("name"))
        title_en = en((work or {}).get("name") or case.get("name"))
    prod_cls = accent

    prod_line = meta_line(case)
    tag_html = chips(case.get("tags"), "chip " + ({"p": "p", "b": "b", "o": "o"}.get(accent, "")), 5)

    # 2x2 meta
    role_parts = [x.strip() for x in plain(case.get("role")).split("/") if x.strip()]
    m_platform = platform or prod_line
    m_year = plain((work or {}).get("date")) or plain(case.get("date"))
    m_type = plain(case.get("projectType")) or (role_parts[0] if role_parts else "")
    m_role = plain(case.get("role")) or " / ".join(plain(r) for r in (case.get("responsibility") or [])[:3])
    meta_cells = [
        ("平台", "PLATFORM", m_platform),
        ("年份", "YEAR", m_year),
        ("类型", "TYPE", m_type),
        ("职责", "ROLE", m_role),
    ]
    meta_html = '<div class="case-meta">'
    for k, e, v in meta_cells:
        if not v:
            continue
        meta_html += f'<div class="cm"><div class="k">{esc(k)}<span>{esc(e)}</span></div><div class="v">{esc(v)}</div></div>'
    meta_html += '</div>'

    # my work — 原 Focus 有效内容已并入，编号条目（3-5 条）
    mi = mywork_items(case, work)
    mywork_html = ""
    if mi:
        rows = "".join(
            f'<div class="mw"><span class="no">{i:02d}</span><span class="txt">{esc(t)}</span></div>'
            for i, t in enumerate(mi, 1))
        mywork_html = (f'<div class="case-sec mywork"><div class="bt {accent}"><span class="sno">03</span>我的工作<span class="en">MY WORK</span></div>'
                       f'<div class="mywork-list">{rows}</div></div>')

    # hero (portrait variant keeps external frame identical)
    hbase = hero[:-4] if hero.endswith(".jpg") else hero
    if portrait:
        hero_html = (f'<div class="big portrait">'
                     f'<img class="pv-bg" src="assets-optimized/portrait/{hbase}_bg.jpg" alt="">'
                     f'<div class="pv-dim"></div>'
                     f'<img class="pv-fg" src="assets-optimized/portrait/{hbase}_fg.jpg" alt="{esc(title_zh)}">'
                     f'</div>')
    else:
        hero_html = f'<img class="big" src="assets-optimized/hero/{hbase}.jpg" alt="{esc(title_zh)}">'
    hero_html = ('<div class="bigwrap">' + hero_html +
                 '<i class="cb tl"></i><i class="cb br"></i>'
                 '<span class="fcode">MOTION VIEW · FRAME / ACTIVE</span></div>')

    # view online
    view_html = ""
    if qr_src:
        view_html = (f'<div class="case-view"><img src="assets-optimized/qr/{qr_src}.png" alt="QR">'
                     f'<div class="vv"><b>{esc(qr_cap or "VIEW ONLINE")}</b><br>扫码查看完整动态案例</div></div>')

    return f"""
<div class="case-grid">
  <div class="case-media">
    {hero_html}
    {frame3(frame_name)}
  </div>
  <div class="case-info">
    <div class="case-prod {prod_cls}">{esc(prod_line)}</div>
    <div class="case-name">{esc(title_zh)}<span class="en2">{esc(title_en)}</span></div>
    <div class="meta-row">{tag_html}</div>
    <div class="case-sec first"><div class="bt {accent}"><span class="sno">01</span>项目信息<span class="en">PROJECT META</span></div>{meta_html}</div>
    <div class="case-sec"><div class="bt {accent}"><span class="sno">02</span>项目简介<span class="en">PROJECT OVERVIEW</span></div><p class="case-desc">{case_desc(case, work)}</p></div>
    {mywork_html}
    {view_html}
  </div>
</div>
"""

# ============================================================ P01 COVER ====
cover = f"""
<div class="cover-hud">
  <div class="l">[ <b>PORTFOLIO</b> ] &nbsp;{esc(profile.get('build',''))}</div>
  <div class="r">JAZIM LAU / 2027</div>
</div>
<div class="cover-right">
  <div class="cr-word">MOTION<br>2027</div>
  <div class="cr-ticks"><i></i><i></i><i></i><i></i><i></i><i></i></div>
  <div class="cr-data">GAME MOTION / VIDEO DESIGN</div>
</div>
<div class="cover-title">
  <div class="cover-kicker">GAME MOTION DESIGNER</div>
  <div class="cover-h1-cn">游戏<br><span class="c2">动效设计</span></div>
  <div class="cover-h1-en">{esc(profile.get('taglineEn',''))}</div>
  <div class="cover-name"><b>{esc(profile.get('name',''))}</b> / {esc(profile.get('nameEn',''))}</div>
</div>
<div class="cover-meta">
  <div class="m"><div class="k">ROLE</div><div class="v">游戏动效设计</div></div>
  <div class="m"><div class="k">STATUS</div><div class="v"><b>2027</b> / OPEN</div></div>
  <div class="m"><div class="k">EMAIL</div><div class="v">{esc(profile.get('email',''))}</div></div>
</div>
<div class="cover-disciplines">
  {''.join(f'<span>{esc(d.strip())}</span>' for d in (profile.get('disciplines') or []) if d.strip())}
</div>
<div class="cover-qr"><img src="assets-optimized/qr/qr-home.png" alt="QR"><div class="cap">SCAN TO OPEN<br>ONLINE PORTFOLIO</div></div>
"""

# ============================================================ P02 EXPERIENCE ===
EXP_DUTIES = {
    "leihuo": ["游戏 UI / KV / 页面动效制作", "动画方案、资源处理与技术交付", "UI 动效预演及上线走查"],
    "brand-pr": ["官号社媒及节点宣发视频", "素材重组、剪辑与动态包装", "视频 UI / 信息层设计"],
    "marketing": ["游戏广告素材制作", "剪辑、混剪与视觉包装", "根据投放反馈调整节奏与卖点"],
    "mengying": ["2D 角色微动效", "画面特效与动态漫画", "新媒体动画内容"],
}
EXP_KW = {
    "leihuo": ["UI MOTION", "KV MOTION", "DELIVERY", "AIGC", "3D ASSET"],
    "brand-pr": ["SOCIAL", "PROMO", "MOTION PACKAGE", "CONTENT"],
    "marketing": ["GAME ADS", "BGC / PUGC", "MIXED EDIT", "AD PACING"],
    "mengying": ["2D MOTION", "CHARACTER", "VFX", "MOTION COMIC"],
}
EXP_ORG_EN = {
    "leihuo": "NETEASE LEIHUO",
    "brand-pr": "NETEASE GAMES",
    "marketing": "NETEASE GAMES",
    "mengying": "MENGYING",
}

def exp_card(n, e):
    eid = e.get("id", "")
    duties = EXP_DUTIES.get(eid, [zh(d) for d in (e.get("duties") or [])[:3]])
    kw = EXP_KW.get(eid, [en(k) for k in (e.get("keywords") or [])[:4]])
    status = e.get("status", "")
    st_chip = '<span class="chip on">ACTIVE</span>' if status == "ACTIVE" else '<span class="chip">COMPLETE</span>'
    return f"""
    <div class="exp-card panel"><span class="panel-tag">MISSION {n:02d}</span>
      <div class="top"><div class="period">{esc(e.get('period',''))}</div>{st_chip}</div>
      <div class="org">{esc(plain(e.get('org')))}<span class="en2">{esc(EXP_ORG_EN.get(eid, ''))}</span></div>
      <div class="role">{cn(e.get('role'))}</div>
      <div class="duties"><ul class="list">{"".join(f'<li>{esc(d)}</li>' for d in duties)}</ul></div>
      <div class="kw">{"".join(f'<span class="chip">{esc(k)}</span>' for k in kw)}</div>
    </div>"""

exp_html = "".join(exp_card(n, e) for n, e in enumerate(timeline, 1))

# ============================================================ P03 PROJECT INDEX ===
IDX_DATA = {
    "leihuo-external-motion": (
        "雷火产品动效", "LEIHUO / GAME MOTION SYSTEM",
        "游戏端内及端外动态设计，覆盖 UI、KV、H5 与资源交付。",
        ["UI MOTION", "KV", "H5", "DELIVERY"]),
    "game-ui-motion-studies": (
        "游戏 UI 动效练习", "GAME UI MOTION STUDIES",
        "围绕视觉预演与实时引擎实现进行系统 UI 动效练习。",
        ["AE", "UE5", "UNITY", "UI MOTION"]),
    "game-ad-films": (
        "游戏广告视频", "GAME AD FILMS",
        "覆盖多类型营销视频的剪辑、包装与广告节奏设计。",
        ["BGC", "PUGC", "KOL", "AD VIDEO"]),
    "game-promotion-films": (
        "游戏宣发视频", "GAME PROMOTION FILMS",
        "围绕版本节点完成素材重组、剪辑及动态包装。",
        ["PROMO", "MIXED EDIT", "PACKAGE"]),
    "game-social-videos": (
        "游戏社媒视频", "GAME SOCIAL VIDEOS",
        "围绕官方账号进行创意短视频与动态内容制作。",
        ["SOCIAL", "CREATIVE", "SHORT VIDEO"]),
}
ORDER = [LEIHUO, GAMEUI, AD, PROMO, SOCIAL]

def idx_foot(p):
    cases_n = len((p or {}).get("cases") or [])
    pid = (p or {}).get("id", "")
    if pid == "game-ui-motion-studies":
        items = track_modules(p, 4)
        label = "MODULES"
    else:
        items, more = track_products(p, 4)
        label = "PRODUCTS"
        if more > 0:
            items = items + [f"+ {more} MORE"]
    items_html = " · ".join(esc(x) for x in items)
    return f"""
      <div class="foot">
        <div class="fr"><div class="k">CASES</div><div class="v"><b>{cases_n:02d}</b></div></div>
        <div class="fr"><div class="k">{label}</div><div class="v">{items_html}</div></div>
      </div>"""

def idx_card(p):
    zi, zi_en, zi_desc, zi_tags = IDX_DATA.get((p or {}).get("id", ""), ("", "", "", []))
    return f"""
    <div class="idx-card panel"><span class="panel-tag">TRACK {esc((p or {}).get('index',''))}</span>
      <div class="no">{esc((p or {}).get('index',''))}</div>
      <div class="t">{esc(zi)}</div>
      <div class="t2">{esc(zi_en)}</div>
      <div class="d">{esc(zi_desc)}</div>
      <div class="cats">{"".join(f'<span class="chip">{esc(t)}</span>' for t in zi_tags)}</div>
      {idx_foot(p)}
    </div>"""

# ============================================================ LEVEL-01 pages ===
TRACK_LEVEL1 = [
    dict(pid="leihuo-external-motion", en="LEIHUO GAME MOTION", zh="雷火产品动效", rule="p", accent="p",
         pgname="LEIHUO OVERVIEW",
         metrics=[("14", "参与项目", "PROJECTS"), ("83", "动态需求模块", "MOTION MODULES"),
                  ("65", "动效资源", "MOTION ASSETS"), ("10", "上线项目", "LAUNCHED")]),
    dict(pid="game-ui-motion-studies", en="GAME UI MOTION STUDIES", zh="游戏 UI 动效练习", rule="p", accent="p",
         pgname="GAME UI OVERVIEW",
         metrics=[("3", "实践模块", "MODULES"), ("8", "动效练习", "STUDIES"),
                  ("UI", "核心方向", "MOTION FOCUS"), ("AE", "主要预演工具", "PREVIS")]),
    dict(pid="game-promotion-films", en="GAME PROMOTION FILMS", zh="游戏宣发视频", rule="o", accent="o",
         pgname="PROMOTION OVERVIEW",
         metrics=[("05", "案例", "CASES"), ("25", "参与内容", "CONTENT"),
                  ("2200W+", "累计播放", "VIEWS"), ("212W+", "累计点赞", "LIKES")]),
    dict(pid="game-ad-films", en="GAME AD FILMS", zh="游戏广告视频", rule="b", accent="b",
         pgname="AD OVERVIEW",
         metrics=[("09", "广告项目", "AD FILMS"), ("02", "精选案例", "FEATURED"),
                  ("BGC", "品牌内容", "BRANDED"), ("PUGC", "达人内容", "CREATOR")]),
    dict(pid="game-social-videos", en="GAME SOCIAL VIDEOS", zh="游戏社媒视频", rule="o", accent="o",
         pgname="SOCIAL OVERVIEW",
         metrics=[("17", "精选案例", "SELECTED"), ("30+", "参与内容", "CONTENT"),
                  ("2200W+", "累计播放", "VIEWS"), ("210W+", "累计点赞", "LIKES")]),
]

TRACK_FEATURED = {
    "leihuo-external-motion": [
        ("CASE 01", "wudao.jpg", "hearthstone", "hs-tournament", ""),
        ("CASE 02", "jiuzhou.jpg", "nsh", "nsh-jiuzhou-mijing", "p"),
    ],
    "game-ui-motion-studies": [
        ("CASE 01", "kejifeng.jpg", "ae-previs", "ae-sci-fi-win", ""),
        ("CASE 02", "gongxi.jpg", "ae-previs", "gongxi-gacha", "p"),
    ],
    "game-promotion-films": [
        ("CASE 01", "yiwang.jpg", "forgotten-sea", "forgotten-sea-main", ""),
        ("CASE 02", "dianfeng.jpg", "peak-speed-map", "peak-speed-map-main", "p"),
    ],
    "game-ad-films": [
        ("CASE 01", "tianqi.jpg", "mhxy", "mhxy-tiandiqiju-xuanchuan", ""),
        ("CASE 02", "yinhun.jpg", "yys", "yys-yinhun-liandong", "p"),
    ],
    "game-social-videos": [
        ("CASE 01", "zuican.jpg", "poorest-official", "poorest-official-main", ""),
        ("CASE 02", "wolf.jpg", "wolf-barged-in", "wolf-barged-in-main", "p"),
    ],
}

def ov_feat(no, img, case, work, accent):
    t_zh, t_en = disp((work or {}).get("id", ""))
    if not t_zh:
        t_zh = plain((work or {}).get("name") or case.get("name"))
        t_en = en((work or {}).get("name") or case.get("name"))
    fm = meta_line(case)
    desc = case_desc(case, work)
    fk = ""
    resp = (case.get("responsibility") or [])[:3]
    if resp:
        fk = '<div class="fk">%s</div>' % chips([plain(r) for r in resp], "chip")
    return f"""
  <div class="ov-feat panel"><span class="panel-tag">{esc(no)}</span>
    <div class="fc"><div class="fno">{esc(no.split()[1])}</div></div>
    <img src="assets-optimized/feat/{img}" alt="{esc(t_zh)}">
    <div class="fi">
      <div class="fn">{esc(t_zh)}<span class="en">{esc(t_en)}</span></div>
      <div class="fm">{esc(fm)}</div>
      <div class="fd">{desc}</div>
      {fk}
    </div>
  </div>"""

def level1_page(track_cfg):
    pid = track_cfg["pid"]
    p = project_by_id(pid)
    feats = TRACK_FEATURED.get(pid, [])
    feat_html = '<div class="ft-title">精选案例 <span class="en">FEATURED CASES</span>'
    if pid == "game-social-videos":
        feat_html += f'<span class="plat">平台 <em>PLATFORM</em> · {esc(SOCIAL_PLATFORM)}</span>'
    feat_html += '</div>'
    for no, img, cid, wid, accent in feats:
        c = case_by_id(p, cid)
        w = work_by_id(c, wid)
        feat_html += ov_feat(no, img, c, w, accent)
    inner = page_head(track_cfg["en"], track_cfg["zh"], track_cfg["rule"])
    inner += f"""
<div class="ov-grid">
  <div class="ov-metrics">{metric_cells(track_cfg["metrics"])}</div>
  <div class="ov-main">
    <div class="ov-workflow panel"><span class="panel-tag">工作链路</span>
      <div class="wf-title">工作链路 <span class="en">WORKFLOW</span></div>
      <div class="ov-wf-grid">{workflow_nodes(p)}</div>
    </div>
    <div class="ov-featured">{feat_html}</div>
  </div>
</div>
"""
    return inner, track_cfg["pgname"]

# ============================================================ CASE pages ===
# header_zh / header_en = 页面顶部大标题（产品名 / 一级分类名）；右侧 Case Info 显示项目名（disp 表）
CASE_PAGES = [
    dict(pid="leihuo-external-motion", header_en="HEARTHSTONE", header_zh="炉石传说",
         cid="hearthstone", wid="hs-tournament", hero="wudao.jpg", frame="wudao",
         qr="qr-wudao", qr_cap="VIEW MOTION ONLINE", accent="p", portrait=False, pgname="CASE 01"),
    dict(pid="leihuo-external-motion", header_en="JUSTICE ONLINE", header_zh="逆水寒",
         cid="nsh", wid="nsh-jiuzhou-mijing", hero="jiuzhou.jpg", frame="jiuzhou",
         qr="qr-jiuzhou", qr_cap="VIEW MOTION ONLINE", accent="b", portrait=False, pgname="CASE 02"),
    dict(pid="game-ui-motion-studies", header_en="GAME UI MOTION STUDIES", header_zh="游戏 UI 动效练习",
         cid="ae-previs", wid="ae-sci-fi-win", hero="kejifeng.jpg", frame="kejifeng",
         qr="qr-ae-previs", qr_cap="VIEW MOTION ONLINE", accent="p", portrait=False, pgname="CASE 01"),
    dict(pid="game-ui-motion-studies", header_en="GAME UI MOTION STUDIES", header_zh="游戏 UI 动效练习",
         cid="ae-previs", wid="gongxi-gacha", hero="gongxi.jpg", frame="gongxi",
         qr="qr-ae-previs", qr_cap="VIEW MOTION ONLINE", accent="b", portrait=False, pgname="CASE 02"),
    dict(pid="game-promotion-films", header_en="FORGOTTEN SEA", header_zh="遗忘之海",
         cid="forgotten-sea", wid="forgotten-sea-main", hero="yiwang.jpg", frame="yiwang",
         qr="qr-forgotten", qr_cap="VIEW FILM ONLINE", accent="o", portrait=False, pgname="CASE 01"),
    dict(pid="game-promotion-films", header_en="PEAK SPEED", header_zh="巅峰极速",
         cid="peak-speed-map", wid="peak-speed-map-main", hero="dianfeng.jpg", frame="dianfeng",
         qr="qr-peak", qr_cap="VIEW FILM ONLINE", accent="b", portrait=False, pgname="CASE 02"),
    dict(pid="game-ad-films", header_en="FANTASY WESTWARD JOURNEY", header_zh="梦幻西游",
         cid="mhxy", wid="mhxy-tiandiqiju-xuanchuan", hero="tianqi.jpg", frame="tianqi",
         qr="qr-mhxy", qr_cap="VIEW FILM ONLINE", accent="b", portrait=False, pgname="CASE 01"),
    dict(pid="game-ad-films", header_en="ONMYOJI MOBILE", header_zh="阴阳师手游",
         cid="yys", wid="yys-yinhun-liandong", hero="yinhun.jpg", frame="yinhun",
         qr="qr-yys", qr_cap="VIEW FILM ONLINE", accent="o", portrait=False, pgname="CASE 02"),
    dict(pid="game-social-videos", header_en="GAME SOCIAL VIDEOS", header_zh="游戏社媒视频",
         cid="poorest-official", wid="poorest-official-main", hero="zuican.jpg", frame="zuican",
         qr="qr-poorest", qr_cap="VIEW FILM ONLINE", accent="o", portrait=True, pgname="CASE 01",
         platform=SOCIAL_PLATFORM),
    dict(pid="game-social-videos", header_en="GAME SOCIAL VIDEOS", header_zh="游戏社媒视频",
         cid="wolf-barged-in", wid="wolf-barged-in-main", hero="wolf.jpg", frame="wolf",
         qr="qr-wolf", qr_cap="VIEW FILM ONLINE", accent="p", portrait=True, pgname="CASE 02",
         platform=SOCIAL_PLATFORM),
]

def case_page(cfg):
    p = project_by_id(cfg["pid"])
    c = case_by_id(p, cfg["cid"])
    w = work_by_id(c, cfg["wid"])
    rule = {"p": "p", "b": "b", "o": "o"}.get(cfg["accent"], "")
    inner = page_head(cfg["header_en"], cfg["header_zh"], rule)
    inner += case_detail(c, w, cfg["hero"], cfg["frame"], cfg["accent"],
                         cfg["portrait"], cfg["qr"], cfg["qr_cap"], cfg.get("platform", ""))
    return inner, cfg["pgname"]

# ============================================================ MORE WORKS ===
MORE_GROUPS = [
    ("雷火产品动效", "LEIHUO", [
        ("more-wow", "魔兽世界", "WoW"),
        ("more-naraka", "永劫无间", "Naraka"),
        ("more-qingnv", "倩女幽魂", "Qingnv"),
        ("more-tianyu", "天谕", "Revelation"),
    ]),
    ("游戏 UI 动效", "GAME UI", [
        ("more-ae-7day", "七日签到", "Sign-in"),
        ("more-ae-lobby", "Lobby", "Previs"),
        ("more-ue5", "UE5 图标动效", "UE5 Icon"),
        ("more-unity", "Unity", "Unity"),
    ]),
    ("视频设计", "VIDEO", [
        ("more-diablo3", "暗黑破坏神3", "Diablo 3 · PROMO"),
        ("more-7days", "七日世界", "7 Days · PROMO"),
        ("more-slzh", "率土之滨", "SLZH · AD"),
        ("more-xxyx", "小小英雄", "Little Heroes · AD"),
    ]),
]

def more_works_html():
    html_out = ""
    for gz, gen, items in MORE_GROUPS:
        thumbs = "".join(
            f'<div class="thumb"><div class="thumb-media"><img src="assets-optimized/thumbs/{img}.jpg" alt="{esc(n)}"></div>'
            f'<div class="n">{esc(n)}</div></div>'
            for img, n, en2 in items)
        html_out += (f'<div class="thumb-group-title">{esc(gz)}<span class="en">{esc(gen)}</span></div>'
                     f'<div class="thumb-grid">{thumbs}</div>')
    return html_out

# ============================================================ SKILLS ===
def skills_html():
    sk = ""
    for s in skills:
        st = s.get("state", "")
        st_zh = {"PROFICIENT": "熟练应用", "PRACTICE": "实践中", "LEARNING": "学习中"}.get(st, st)
        name_cn = zh(s.get("nameZh"))
        code = s.get("code", "")
        nodes = (s.get("nodes") or [])[:5]
        node_html = ""
        for n in nodes:
            nst = (n or {}).get("state", "")
            cls = "chip on" if nst == "LEARNING" else "chip"
            node_html += f'<span class="{cls}">{esc(plain(n.get("name")))}</span>'
        sk += f"""
    <div class="skill-card panel"><span class="panel-tag">NODE {esc(s.get('index',''))}</span>
      <div class="sc-cn">{esc(name_cn)}</div>
      <div class="sc-en">{esc(code)}</div>
      <div class="st {esc(st)}"><i class="sdot"></i><b>{esc(st)}</b> · {esc(st_zh)}</div>
      <div class="sn">{node_html}</div>
    </div>"""
    TOOL_STATE_ZH = {"PROFICIENT": "熟练", "WORKING": "使用中", "PRACTICE": "实践中", "LEARNING": "学习中"}
    tools = profile.get("tools") or []
    tool_html = "".join(
        f'<span class="tool"><span class="tname">{esc(t.get("name", ""))}</span>'
        f'<i class="tst {esc(t.get("state", ""))}">{esc(TOOL_STATE_ZH.get(t.get("state", ""), t.get("state", "")))}</i></span>'
        for t in tools
    )
    return f"""
<div class="skill-grid">{sk}</div>
<div class="skills-bottom">
  <div class="sb-mod panel"><span class="panel-tag">TOOLSET</span>
    <div class="sb-title">工具链 <span class="en">TOOLSET</span></div>
    <div class="tool-row">{tool_html}</div>
  </div>
</div>
"""

# ============================================================ CONTACT ===
def contact_html():
    items = [
        ("EMAIL", profile.get('email'), "邮箱"),
        ("PHONE", profile.get('phone'), "手机"),
        ("WECHAT", profile.get('wechat'), "微信"),
        ("SCHOOL", plain(profile.get('school')), "学校"),
    ]
    rows = "".join(
        f'<div class="contact-item"><div class="k">{esc(k)} / {esc(zh_l)}</div><div class="v">{esc(v)}</div></div>'
        for k, v, zh_l in items)
    return f"""
<div class="contact-wrap">
  <div>
    <div class="contact-big">期待与您<span class="acc">合作</span></div>
    <div class="contact-sub">感谢浏览，欢迎岗位沟通与项目交流。</div>
    <div class="contact-list">{rows}</div>
  </div>
  <div class="contact-qr panel"><span class="panel-tag">QR / 在线作品集</span>
    <img src="assets-optimized/qr/qr-home.png" alt="QR">
    <div class="cap">SCAN TO OPEN<br><b>ONLINE PORTFOLIO</b></div>
    <div class="site">jazim-portfolio-theta.vercel.app</div>
  </div>
</div>
"""

# ============================================================ ASSEMBLE ===
page_specs = []
page_specs.append((cover, "PORTFOLIO / 2027", 1, "tiny", True, ""))                      # 01 cover
page_specs.append((page_head("EXPERIENCE", "履历记录", "o") + f'<div class="exp-grid">{exp_html}</div>', "EXPERIENCE", 2, "tiny", False, ""))  # 02
page_specs.append((page_head("PROJECT INDEX", "作品索引", "b") + f'<div class="idx-grid">{"".join(idx_card(p) for p in ORDER if p)}</div>', "PROJECT INDEX", 3, "tiny", False, "idx"))  # 03

# interleave: track level-01 then its two case pages
case_inner_by_track = {}
for cfg in CASE_PAGES:
    inner, pgname = case_page(cfg)
    case_inner_by_track.setdefault(cfg["pid"], []).append((inner, pgname))

final_specs = [page_specs[0], page_specs[1], page_specs[2]]
for tcfg in TRACK_LEVEL1:
    lvl_inner, lvl_pgname = level1_page(tcfg)
    final_specs.append((lvl_inner, lvl_pgname, None, "tiny", False, "lv1"))
    for inner, pgname in case_inner_by_track.get(tcfg["pid"], []):
        final_specs.append((inner, pgname, None, "tiny", False, "case"))

# More Works / Skills / Contact
final_specs.append((page_head("MORE PROJECTS", "更多项目", "o") + f'<div class="more-grid">{more_works_html()}</div>', "MORE PROJECTS", None, "tiny", False, ""))
final_specs.append((page_head("SKILLS / TOOLSET", "能力系统", "p") + skills_html(), "SKILLS / TOOLSET", None, "tiny", False, "skills"))
final_specs.append((page_head("CONTACT", "联系通道", "p") + contact_html(), "CONTACT", None, "tiny", False, "contact"))

TOTAL_PAGES = len(final_specs)
pages = [page(inner, pgname, idx + 1, gcls, no_sys, ptype)
         for idx, (inner, pgname, _no, gcls, no_sys, ptype) in enumerate(final_specs)]

html_doc = f"""<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="utf-8">
<title>Jazim Lau · 游戏动效设计 — Portfolio Deck 1920×1080</title>
<style>{CSS}</style>
</head>
<body>
{''.join(pages)}
</body>
</html>
"""

with open(OUT, "w", encoding="utf-8") as fh:
    fh.write(html_doc)
print("HTML written:", OUT, "pages:", len(pages))
